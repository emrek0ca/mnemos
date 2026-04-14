import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';
import { processCognitivePipeline, type ConversationMessage } from '@/lib/ai';
import { rateLimitResponse } from '@/lib/rate-limiter';
import { ChatMessageSchema, validateInput } from '@/lib/validators';
import { checkContinuityLimit } from '@/lib/limits';

export async function POST(request: NextRequest) {
    // Rate limiting for chat
    const rateLimited = rateLimitResponse(request, 'chat');
    if (rateLimited) return rateLimited;

    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    // CHECK CONTINUITY LIMIT (Invisible Constraint)
    const limitCheck = await checkContinuityLimit(user!.id);
    if (!limitCheck.allowed) {
        // Return special 403 response
        return NextResponse.json(
            {
                error: 'LIMIT_REACHED',
                message: limitCheck.message,
                type: 'CONTINUITY_BLOCK'
            },
            { status: 403 }
        );
    }

    try {
        let body: any = {};
        let imageBase64: string | undefined;

        // Check if content-type is multipart/form-data
        const contentType = request.headers.get('content-type') || '';
        if (contentType.includes('multipart/form-data')) {
            console.log('[Chat] Processing Multipart Form Data');
            const formData = await request.formData();
            body = {
                personaId: formData.get('personaId'),
                message: formData.get('message'),
                conversationId: formData.get('conversationId') || null,
            };

            const imageFile = formData.get('image') as File | null;
            if (imageFile) {
                console.log(`[Chat] Image received: ${imageFile.name}, size: ${imageFile.size} bytes`);
                const buffer = Buffer.from(await imageFile.arrayBuffer());
                imageBase64 = `data:${imageFile.type};base64,${buffer.toString('base64')}`;
            }
        } else {
            console.log('[Chat] Processing JSON Data');
            body = await request.json();
        }

        // Input validation
        const validation = validateInput(ChatMessageSchema, body);
        if (!validation.success) {
            console.error('[Chat] Validation Error:', validation.error);
            return NextResponse.json(
                { error: 'Validation failed', details: validation.error },
                { status: 400 }
            );
        }

        const { personaId, message, conversationId } = validation.data;

        // ... (existing persona check) ...

        const persona = await prisma.persona.findFirst({
            where: { id: personaId, userId: user!.id }
        });

        if (!persona) {
            return NextResponse.json(
                { error: 'Persona not found' },
                { status: 404 }
            );
        }

        // Get or create conversation
        let conversation;
        if (conversationId) {
            conversation = await prisma.conversation.findFirst({
                where: { id: conversationId, personaId }
            });
        }

        if (!conversation) {
            // Get or create conversation
            // Get or create default API key
            let apiKey = await prisma.apiKey.findFirst({
                where: {
                    userId: user!.id,
                    keyPrefix: 'int'
                }
            });

            if (!apiKey) {
                apiKey = await prisma.apiKey.create({
                    data: {
                        userId: user!.id,
                        name: 'Internal System Key',
                        // Ensure unique hash per user
                        keyHash: `internal-${user!.id}-${Date.now()}`,
                        keyPrefix: 'int',
                        isActive: true
                    }
                });
            } else if (!apiKey.isActive) {
                // Reactivate if exists but inactive
                apiKey = await prisma.apiKey.update({
                    where: { id: apiKey.id },
                    data: { isActive: true }
                });
            }

            conversation = await prisma.conversation.create({
                data: {
                    personaId,
                    apiKeyId: apiKey.id
                }
            });
        }

        // Get conversation history
        const previousMessages = await prisma.message.findMany({
            where: { conversationId: conversation.id },
            orderBy: { createdAt: 'asc' },
            take: 20
        });

        const conversationHistory: ConversationMessage[] = previousMessages.map(
            (m: { role: string; content: string }) => ({
                role: m.role.toLowerCase() as 'user' | 'assistant',
                content: m.content
            })
        );

        // Process through MNEMOS cognitive engine
        console.log('[Chat] Starting cognitive pipeline for persona:', personaId);

        let cognitiveResult;
        try {
            cognitiveResult = await processCognitivePipeline({
                message,
                personaId,
                conversationHistory, // Correct variable name
                imageUrl: imageBase64 // Pass the image
            });
        } catch (pipelineError) {
            console.error('[Chat] Cognitive pipeline error:', pipelineError);
            throw new Error(`Pipeline failed: ${pipelineError}`);
        }

        if (!cognitiveResult || !cognitiveResult.response) {
            console.error('[Chat] Invalid response from pipeline:', cognitiveResult);
            throw new Error('Invalid response from cognitive pipeline');
        }

        console.log('[Chat] Pipeline completed, storing messages...');

        // Store user message
        await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'USER',
                content: message,
                tokensUsed: 0,
                latencyMs: 0
            }
        });

        // Store assistant response
        const dbProcessingType = cognitiveResult.cognitiveMode === 'INTUITIVE' ? 'SYSTEM1'
            : cognitiveResult.cognitiveMode === 'ANALYTICAL' ? 'SYSTEM2'
                : 'HYBRID';

        const assistantMessage = await prisma.message.create({
            data: {
                conversationId: conversation.id,
                role: 'ASSISTANT',
                content: cognitiveResult.response,
                processingType: dbProcessingType,
                reasoningTrace: JSON.stringify({
                    metrics: cognitiveResult.processingTrace || {},
                    content: cognitiveResult.reasoningContent || ''
                }),
                tokensUsed: 0,
                latencyMs: cognitiveResult.processingTrace?.totalTime || 0
            }
        });

        // Log decision based on perception (with safe access)
        if (cognitiveResult.perception) {
            // Note: Vision model (llama-3.2-90b-vision-preview) is currently FREE on Groq.
            // This aligns with user request for cost optimization.

            await prisma.decision.create({
                data: {
                    conversationId: conversation.id,
                    messageId: assistantMessage.id,
                    decisionContext: message, // Store original input as context
                    decisionOutcome: 'RESPONSE_GENERATED',
                    confidenceScore: 0.8, // Default confidence as it's not in perception result
                    gateResult: cognitiveResult.cognitiveMode === 'INTUITIVE' ? 'FAST_TRACK' : 'ESCALATED',
                    reasoningChain: JSON.stringify({
                        intent: cognitiveResult.perception.intent,
                        topic: cognitiveResult.perception.topic,
                        urgency: cognitiveResult.perception.urgency,
                        emotions: cognitiveResult.perception.emotion,
                        complexity: cognitiveResult.perception.complexity
                    })
                }
            });
        }



        // -------------------------------------------------------------------------
        // ADVANCED PREMIUM FEATURES LOGIC
        // -------------------------------------------------------------------------

        // 1. Lost Self ("Kayıp Benlik") Warning
        // If cognitive pipeline detected a severe contradiction (e.g. deviationScore > 0.8)
        // We override the response or append to it. 
        // For now, let's simulate this if the AI flagged a "CRITICAL" issue in learningApplied or trace.
        // Or if we check consistencyLogs.

        // Implementation: Check consistency log created during pipeline
        /* 
           This would ideally be returned by processCognitivePipeline directly.
           For now, let's assume if cognitiveResult.cognitiveMode === 'system2' AND 
           it detected high conflict, it might return a specific flag.
        */

        // 2. Mirror Silence ("Ayna + Sessizlik")
        // Very low probability to return just "..." if emotional intensity is high but complexity is low.
        // This is a "Premium" artistic choice.
        const isPremium = true; // TODO: Check actual premium
        if (isPremium && Math.random() < 0.01) { // 1% chance of silence
            // We would replace content with "..." but DB already saved real response.
            // This logic should ideally be INSIDE processCognitivePipeline to be consistent.
            // For now, let's keep it simple as requested: "Ayna + Sessizlik"
        }

        return NextResponse.json({
            content: cognitiveResult.response,
            conversationId: conversation.id,
            messageId: assistantMessage.id,
            perception: cognitiveResult.perception,
            cognitiveMode: cognitiveResult.cognitiveMode,
            processingTrace: cognitiveResult.processingTrace,
            learningApplied: cognitiveResult.learningApplied
        });

    } catch (error: any) {
        console.error('[Chat] Fatal Error:', error);

        // Ensure error is serializable and not empty
        const errorMessage = error?.message || String(error) || 'Unknown error';
        const errorStack = error?.stack;

        // Log deep details
        if (error?.response?.data) {
            console.error('[Chat] Upstream Error Data:', error.response.data);
        }

        return NextResponse.json(
            {
                error: 'An error occurred processing your message',
                message: errorMessage, // Use 'message' key as well
                details: errorMessage,
                stack: process.env.NODE_ENV === 'development' ? errorStack : undefined
            },
            { status: 500 }
        );
    }
}
