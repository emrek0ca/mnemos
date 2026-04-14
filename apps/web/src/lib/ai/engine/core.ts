
import Groq from 'groq-sdk';
import { perceive, PerceptionResult } from '../perception';
import { contextFromPerception } from '../decision-engine-v2';
import { buildPsychodynamicContext } from '../memory';
import { buildIdentityContext, getIdentityCore } from '../identity';
import {
    generatePersonalityConstraints,
    determineRenderContext,
    DEFAULT_PERSONALITY
} from '../personality-renderer';
import {
    checkConsistency,
    addConsistencyMarkers,
    loadPastStatements,
    loadCoreBeliefs
} from '../self-consistency';
import { detectLearningOpportunity, processLearningEvent, applyLearning } from '../learning-loop';
import { buildTriggerContext } from '../memory-triggers';
import { logConsistencyDeviation } from '../consistency-logger';
import { determineCognitiveMode, calculateDynamicParams, buildFullSystemPrompt } from './generation';
import { scrubResponse } from '../post-processing';
import { executeSystem2Loop } from './system2';
import { cognitiveOrchestrator } from '../cognitive-orchestrator';
import {
    analyzeQueryComplexity,
    optimizeRequest,
    tokenUsageTracker
} from '../token-optimizer';

// ==================== DIGITAL PERSONALITY ENGINE ====================
import { stateEngine, MentalState, StateEffect } from '../state-engine';
import { valueGraph, DecisionContext as ValueDecisionContext } from '../value-graph';
import { personalityDNA, ReactionAnalysis } from '../personality-dna';
import { memoryFabric } from '../memory-fabric';
import { ethicalSafeguards } from '../ethical-safeguards';

// Model tiers for cost optimization
const MODELS = {
    SMALL: 'llama-3.1-8b-instant',       // ~$0.05/1M tokens - for simple queries
    INTUITIVE: 'llama-3.1-8b-instant',   // Same as SMALL
    ANALYTICAL: 'llama-3.3-70b-versatile', // ~$0.59/1M tokens - for complex queries
    VISION: 'meta-llama/llama-4-scout-17b-16e-instruct' // Multimodal
};

export interface CognitiveInput {
    message: string;
    personaId: string;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    imageUrl?: string; // Base64 encoded image
}

export interface CognitiveOutput {
    response: string;
    perception: PerceptionResult;
    cognitiveMode: 'INTUITIVE' | 'ANALYTICAL' | 'MIXED';
    processingTrace: {
        perceptionTime: number;
        memoryTime: number;
        generationTime: number;
        totalTime: number;
    };
    learningApplied: boolean;
    reasoningContent?: string;

    // Digital Personality Engine - NEW
    mentalState?: MentalState;
    stateEffects?: StateEffect;
    valueContext?: ValueDecisionContext;
    reactionAnalysis?: ReactionAnalysis;
}

export class CognitiveEngine {
    private groq: Groq;

    constructor() {
        const apiKey = process.env.GROQ_API_KEY;
        this.groq = new Groq({
            apiKey: apiKey || 'dummy_key'
        });
    }

    async process(input: CognitiveInput): Promise<CognitiveOutput> {
        const startTime = Date.now();
        const traces: Record<string, number> = {};
        let reasoningContent: string | undefined;

        // ============ LAYER 0: STATE ENGINE (Ruh Hali) ============
        // Mevcut mental state hesapla - bu tüm işlemeyi etkiler
        const currentState = await stateEngine.calculateCurrentState(input.personaId, {
            timeOfDay: stateEngine.getTimeOfDay(),
            conversationLength: input.conversationHistory?.length || 0
        });
        const stateEffects = stateEngine.calculateStateEffects(currentState);
        console.log(`[Core] Mental State - Energy: ${currentState.energy.toFixed(2)}, Patience: ${currentState.patience.toFixed(2)}`);

        // ============ LAYER 1: PERCEPTION ============
        const perceptionStart = Date.now();
        const perception = perceive(input.message);
        traces.perceptionTime = Date.now() - perceptionStart;

        // ============ LAYER 1.5: VALUE GRAPH ANALYSIS ============
        // Hangi değerler tetikleniyor, iç çatışma var mı?
        const valueContext = await valueGraph.analyzeDecision(input.personaId, input.message);
        if (valueContext.internalConflict > 0.3) {
            console.log(`[Core] Value Conflict - ${valueContext.tensions.map(t => `${t.value1}↔${t.value2}`).join(', ')}`);
        }

        // ============ LAYER 1.7: PERSONALITY DNA ============
        // Değişmez kişilik özellikleri ve tepki profili
        const dna = await personalityDNA.loadPersonalityDNA(input.personaId);
        const messageType = personalityDNA.detectMessageType(input.message);
        const reactionAnalysis = personalityDNA.analyzeReaction(dna, messageType);
        const dnaConstraints = personalityDNA.generateExpressionConstraints(dna);

        // ============ LAYER 2: DECISION ENGINE (Mode Selection) ============
        const decisionContext = contextFromPerception(perception);
        const identity = await getIdentityCore();

        // Determine cognitive mode based on perception and profile
        const cognitiveMode = determineCognitiveMode(perception, decisionContext, identity?.cognitiveStyle);

        // ============ LAYER 3: MEMORY RECALL ============
        const memoryStart = Date.now();
        const [memoryContext, identityContext, pastStatements, coreBeliefs, triggerContext] = await Promise.all([
            // Pass emotion intensity for dynamic context window
            buildPsychodynamicContext(
                input.message,
                this.getDominantEmotion(perception.emotion),
                Math.max(perception.emotion.fear, perception.emotion.joy, perception.emotion.sadness, perception.emotion.anger || 0)
            ),
            buildIdentityContext(),
            loadPastStatements(input.personaId),
            loadCoreBeliefs(input.personaId),
            buildTriggerContext(input.personaId, input.message, perception.emotion.fear > 0.5 ? 'fear' : undefined)
        ]);
        const fullMemoryContext = triggerContext ? `${memoryContext}\n\n${triggerContext}` : memoryContext;
        traces.memoryTime = Date.now() - memoryStart;

        // ============ LAYER 4: PERSONALITY RENDERER ============
        const personality = this.buildPersonalityFromIdentity(identity);
        const renderContext = determineRenderContext(
            perception.intent,
            Math.max(perception.emotion.fear, perception.emotion.joy, perception.emotion.sadness),
            perception.topic
        );
        const personalityConstraints = generatePersonalityConstraints(personality, renderContext);

        // Merge with DNA constraints
        const fullPersonalityConstraints = `${personalityConstraints}\n\n### KİŞİLİK DNA KISITLAMALARI:\n${dnaConstraints}`;

        // ============ GENERATE RESPONSE ============
        const generationStart = Date.now();

        // DYNAMIC EMOTIONAL MODULATION
        const { temperature, topP } = calculateDynamicParams(perception, cognitiveMode);

        // Select last 3-5 distinct statements for style matching
        const styleExamples = pastStatements
            .slice(0, 5) // Take recent 5
            .map(p => p.stance)
            .filter(s => s.length > 10 && s.length < 200); // Filter out too short/long

        // Build enhanced system prompt with Digital Personality Engine context
        let enhancedContext = '';

        // Add value conflict context if any
        if (valueContext.internalConflict > 0.3) {
            enhancedContext += `\n\n### İÇ ÇATIŞMA DURUMU:\n`;
            enhancedContext += `Şu an ${valueContext.triggeredValues.join(', ')} değerleri tetiklendi.\n`;
            if (valueContext.tensions.length > 0) {
                enhancedContext += `Gerilim: ${valueContext.tensions[0].explanation}\n`;
                enhancedContext += `Bu yüzden biraz kararsız olabilirsin - "${valueContext.recommendation}"\n`;
            }
        }

        // Add state effects context
        if (stateEffects.description) {
            enhancedContext += `\n\n### RUH HALİ:\n${stateEffects.description}`;
            if (stateEffects.modifiers.responseLength === 'shorter') {
                enhancedContext += 'Kısa cevaplar ver, yorgunsun.\n';
            }
            if (stateEffects.modifiers.toneSharpness > 0.6) {
                enhancedContext += 'Biraz daha keskin olabilirsin.\n';
            }
        }

        // Add reaction analysis context
        enhancedContext += `\n\n### TEPKİ PROFİLİ:\nTon: ${reactionAnalysis.tone}, Kesinlik: ${(reactionAnalysis.assertiveness * 100).toFixed(0)}%\n`;
        if (reactionAnalysis.explanation) {
            enhancedContext += reactionAnalysis.explanation + '\n';
        }

        const systemPrompt = buildFullSystemPrompt({
            identityContext: identityContext + enhancedContext,
            memoryContext: fullMemoryContext,
            coreBeliefs,
            personalityConstraints: fullPersonalityConstraints,
            perception,
            cognitiveMode,
            pastExamples: styleExamples
        });

        // ============ TOKEN OPTIMIZATION ============
        // Analyze query complexity to choose best model
        const emotionIntensity = Math.max(perception.emotion.fear, perception.emotion.joy, perception.emotion.sadness);
        const queryComplexity = analyzeQueryComplexity(input.message, emotionIntensity, perception.topic);

        // Optimize conversation history to reduce tokens
        const optimized = optimizeRequest(
            systemPrompt,
            input.conversationHistory || [],
            input.message,
            {
                maxPromptTokens: 2500,
                maxHistoryTokens: 1500,
                maxHistoryMessages: 8
            }
        );

        // Log optimization savings
        if (optimized.savings.savingsPercent > 5) {
            console.log(`[Core] Token optimization saved ${optimized.savings.savedTokens} tokens (${optimized.savings.savingsPercent}%)`);
        }

        const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
            { role: 'system', content: optimized.optimizedPrompt }
        ];

        if (optimized.optimizedHistory.length > 0) {
            messages.push(...optimized.optimizedHistory);
        }
        messages.push({ role: 'user', content: input.message });

        // Smart model selection: use SMALL for simple queries to save costs
        let model: string;
        if (queryComplexity.recommendedModel === 'SMALL' && cognitiveMode !== 'ANALYTICAL') {
            model = MODELS.SMALL;
        } else if (cognitiveMode === 'ANALYTICAL' || queryComplexity.recommendedModel === 'LARGE') {
            model = MODELS.ANALYTICAL;
        } else {
            model = MODELS.INTUITIVE;
        }

        // VISION OVERRIDE: If image is present, use vision model
        if (input.imageUrl) {
            model = MODELS.VISION;
        }

        let apiResponse;

        // WRAPPED VISION CALL WITH FALLBACK
        if (model === MODELS.VISION && input.imageUrl) {
            try {
                // Validate base64 image format
                if (!input.imageUrl.startsWith('data:image/')) {
                    throw new Error('Invalid image format - must be base64 data URL');
                }

                // Check image size (rough estimate: base64 is ~33% larger than binary)
                const base64Size = input.imageUrl.length * 0.75;
                const maxSize = 10 * 1024 * 1024; // 10MB limit
                if (base64Size > maxSize) {
                    throw new Error(`Image too large: ${Math.round(base64Size / 1024 / 1024)}MB (max 4MB)`);
                }

                // Deep clone messages to safely mutate for this request only
                const visionMessages = JSON.parse(JSON.stringify(messages));
                const visionLastMsg = visionMessages[visionMessages.length - 1];

                visionLastMsg.content = [
                    { type: "text", text: input.message || "Bu görseli analiz et." },
                    {
                        type: "image_url",
                        image_url: { url: input.imageUrl }
                    }
                ];

                console.log('[Core] Attempting Vision Model:', model);
                console.log('[Core] Image format:', input.imageUrl.substring(0, 50) + '...');

                apiResponse = await this.groq.chat.completions.create({
                    messages: visionMessages,
                    model: model,
                    temperature: 0.7,
                    max_tokens: 1024,
                    top_p: 1
                });

                const visionContent = apiResponse.choices[0]?.message?.content;
                if (!visionContent || visionContent.trim().length === 0) {
                    throw new Error("Vision model returned empty response");
                }
                console.log('[Core] Vision Successfully processed image. Content length:', visionContent.length);
            } catch (visionError: unknown) {
                const errorMessage = visionError instanceof Error ? visionError.message : String(visionError);
                console.error('[Core] Vision Model Failed:', errorMessage);

                // Fallback to text model with informative message
                console.log('[Core] Falling back to Intuitive Text Model');
                model = MODELS.INTUITIVE;
                apiResponse = undefined;

                // Add context about the failed image to the message
                const originalMessage = messages[messages.length - 1];
                (originalMessage as { content: string }).content = input.message +
                    `\n\n[Sistem Notu: Kullanıcı bir görsel yükledi ancak işlenemedi. Hata: ${errorMessage}. Lütfen kullanıcıya görseli açıklamasını veya daha küçük bir görsel yüklemesini önerin.]`;
            }
        }

        // Standard Text Execution (if Vision wasn't used or failed)
        if (!apiResponse) {
            if (cognitiveMode === 'ANALYTICAL' && !input.imageUrl) { // Skip System 2 for vision for now
                // === SYSTEM 2++: ITERATIVE REASONING LOOP ===
                const result = await executeSystem2Loop(
                    this.groq,
                    model,
                    messages as any[],
                    temperature,
                    topP,
                    identity?.name || 'Kişilik' as any
                );
                apiResponse = {
                    choices: [{ message: { content: result.response } }]
                };
                reasoningContent = result.reasoningContent;
            } else {
                // === SYSTEM 1: INTUITIVE (Fast) ===
                try {
                    apiResponse = await this.groq.chat.completions.create({
                        model,
                        messages: messages as any[],
                        max_tokens: 1024,
                        temperature: temperature,
                        top_p: topP
                    });
                } catch (error: any) {
                    console.error('[Core] Groq API Error:', error);
                    return {
                        response: `[System Error] Unable to generate response. Details: ${error?.message || 'Unknown Groq API Error'}`,
                        perception,
                        cognitiveMode,
                        processingTrace: {
                            perceptionTime: traces.perceptionTime,
                            memoryTime: traces.memoryTime,
                            generationTime: Date.now() - generationStart,
                            totalTime: Date.now() - startTime
                        },
                        learningApplied: false
                    };
                }
            }
        }

        const responseEnd = Date.now();
        let response = apiResponse.choices[0]?.message?.content || "";
        console.log(`[Core] Final Response generated. Length: ${response.length}, Model: ${model}`);
        if (!response) console.warn('[Core] Warning: Empty response generated!');

        // Track token usage for cost monitoring
        const usage = apiResponse.usage;
        if (usage) {
            tokenUsageTracker.record({
                model,
                promptTokens: usage.prompt_tokens || 0,
                completionTokens: usage.completion_tokens || 0,
                totalTokens: usage.total_tokens || 0
            });
        }

        traces.generationTime = Date.now() - generationStart;

        // ============ LAYER 5: SELF-CONSISTENCY & SCRUBBING ============
        // 0. SCRUBBING (Anti-Artificial Filter)
        response = scrubResponse(response);

        const consistencyCheck = await checkConsistency(response, perception.topic, pastStatements);
        response = addConsistencyMarkers(response, consistencyCheck);

        if (!consistencyCheck.isConsistent && consistencyCheck.conflictingStatement) {
            logConsistencyDeviation({
                personaId: input.personaId,
                deviationScore: 1.0,
                detectedIssue: 'CONTRADICTION',
                context: {
                    currentStatement: response,
                    pastStatement: consistencyCheck.conflictingStatement.stance,
                    topic: perception.topic
                }
            }).catch(console.error);
        }

        // ============ LAYER 6: LEARNING LOOP ============
        let learningApplied = false;
        const learningEvent = detectLearningOpportunity(input.message);

        if (learningEvent && identity) {
            // simplified profile mapping
            const decisionProfile = {
                riskTolerance: identity.cognitiveStyle.riskTolerance,
                emotionalWeight: identity.cognitiveStyle.emotionalIntensity,
                analyticalWeight: 1 - identity.cognitiveStyle.system1Tendency
            };

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const learningResult = processLearningEvent(learningEvent, decisionProfile as any, {
                topic: perception.topic,
                wasRisky: perception.emotion.fear > 0.5,
                wasEmotional: perception.emotion.joy > 0.5 || perception.emotion.sadness > 0.5
            });

            if (learningResult.significantChange) {
                await applyLearning(input.personaId, learningResult.updatedProfile);
                learningApplied = true;

                // Update value weights based on learning
                if (valueContext.dominantValue && valueContext.dominantValue !== 'neutral') {
                    const delta = learningEvent.outcome === 'positive' ? 0.02 : -0.01;
                    await valueGraph.updateValueWeight(input.personaId, valueContext.dominantValue, delta);
                }
            }
        }

        // ============ LAYER 7: COGNITIVE EVENT LOGGING ============
        // Log this interaction for timeline and analytics
        await cognitiveOrchestrator.logEvent({
            type: 'cognitive_processing',
            timestamp: new Date(),
            personaId: input.personaId,
            details: {
                cognitiveMode,
                topic: perception.topic,
                dominantEmotion: this.getDominantEmotion(perception.emotion),
                emotionIntensity: Math.max(perception.emotion.fear, perception.emotion.joy, perception.emotion.sadness),
                responseLength: response.length,
                learningApplied,
                consistencyMaintained: consistencyCheck.isConsistent,
                processingTime: Date.now() - startTime
            }
        });

        // ============ LAYER 8: STATE UPDATE ============
        // Etkileşim sonrası state güncelle
        const updatedState = stateEngine.updateStateFromInteraction(currentState, {
            wasPositive: perception.emotion.joy > 0.5,
            wasEmotional: Math.max(perception.emotion.joy, perception.emotion.sadness, perception.emotion.fear) > 0.6,
            userFrustrationDetected: perception.emotion.anger !== undefined && perception.emotion.anger > 0.5,
            topicWasHeavy: perception.complexity > 0.7,
            turnNumber: input.conversationHistory?.length || 0
        });
        await stateEngine.logState(input.personaId, updatedState, {
            conversationLength: input.conversationHistory?.length || 0,
            topicHeaviness: perception.complexity
        });

        return {
            response,
            perception,
            cognitiveMode,
            processingTrace: {
                perceptionTime: traces.perceptionTime,
                memoryTime: traces.memoryTime,
                generationTime: traces.generationTime,
                totalTime: Date.now() - startTime
            },
            learningApplied,
            reasoningContent,

            // Digital Personality Engine outputs
            mentalState: currentState,
            stateEffects,
            valueContext,
            reactionAnalysis
        };
    }

    private getDominantEmotion(emotion: Record<string, number>): string | undefined {
        let max = 0;
        let dominant: string | undefined = undefined;
        for (const [key, value] of Object.entries(emotion)) {
            if (value > max) {
                max = value;
                dominant = key;
            }
        }
        return dominant;
    }

    private buildPersonalityFromIdentity(identity: any) {
        if (!identity) return DEFAULT_PERSONALITY;
        const traits = identity.characterTraits || [];
        return {
            ...DEFAULT_PERSONALITY,
            formality: traits.some((t: string) => t.toLowerCase().includes('resmi')) ? 0.7 : 0.3,
            directness: traits.some((t: string) => t.toLowerCase().includes('direkt')) ? 0.8 : 0.5,
            warmth: traits.some((t: string) => t.toLowerCase().includes('sıcak')) ? 0.8 : 0.5,
            confidence: identity.cognitiveStyle?.riskTolerance ?? 0.5
        };
    }
}

// Singleton export
export const cognitiveEngine = new CognitiveEngine();
