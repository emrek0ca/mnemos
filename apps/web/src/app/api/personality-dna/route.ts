import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

/**
 * POST /api/personality-dna
 * Create or update PersonalityDNA for a persona (upsert)
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        const body = await request.json();
        const {
            personaId,
            // Big Five (OCEAN)
            openness = 0.5,
            conscientiousness = 0.5,
            extraversion = 0.5,
            agreeableness = 0.5,
            neuroticism = 0.5,
            // Cognitive Style
            decisionSpeed = 0.5,
            abstractThinking = 0.5,
            pastVsFuture = 0.5,
            detailOrientation = 0.5,
            // Core Personality Axes
            dominance = 0.5,
            empathy = 0.5,
            logicVsEmotion = 0.5,
            selfFocus = 0.5,
            conflictStyle = 'diplomatic',
            // Reaction Profile
            angerThreshold = 0.5,
            praiseResponse = 0.5,
            criticismResponse = 0.5,
            silenceComfort = 0.5,
            stressResponse = 0.5,
            // Expression Constraints
            maxSentenceLength = 150,
            maxQuestionsPerTurn = 2,
            explainEverything = false,
            // Setup Status
            setupCompleted = false,
            setupStep = 0
        } = body;

        if (!personaId) {
            return NextResponse.json(
                { error: 'personaId is required' },
                { status: 400 }
            );
        }

        // Verify persona ownership
        const persona = await prisma.persona.findFirst({
            where: { id: personaId, userId: user!.id }
        });

        if (!persona) {
            return NextResponse.json(
                { error: 'Persona not found or unauthorized' },
                { status: 404 }
            );
        }

        // Upsert PersonalityDNA
        const personalityDNA = await prisma.personalityDNA.upsert({
            where: { personaId },
            create: {
                personaId,
                // Big Five
                openness,
                conscientiousness,
                extraversion,
                agreeableness,
                neuroticism,
                // Cognitive Style
                decisionSpeed,
                abstractThinking,
                pastVsFuture,
                detailOrientation,
                // Core Personality
                dominance,
                empathy,
                logicVsEmotion,
                selfFocus,
                conflictStyle,
                // Reaction Profile
                angerThreshold,
                praiseResponse,
                criticismResponse,
                silenceComfort,
                stressResponse,
                // Expression Constraints
                maxSentenceLength,
                maxQuestionsPerTurn,
                explainEverything,
                // Setup Status
                setupCompleted,
                setupStep,
                // Meta
                createdBy: 'USER'
            },
            update: {
                // Big Five
                openness,
                conscientiousness,
                extraversion,
                agreeableness,
                neuroticism,
                // Cognitive Style
                decisionSpeed,
                abstractThinking,
                pastVsFuture,
                detailOrientation,
                // Core Personality
                dominance,
                empathy,
                logicVsEmotion,
                selfFocus,
                conflictStyle,
                // Reaction Profile
                angerThreshold,
                praiseResponse,
                criticismResponse,
                silenceComfort,
                stressResponse,
                // Expression Constraints
                maxSentenceLength,
                maxQuestionsPerTurn,
                explainEverything,
                // Setup Status
                setupCompleted,
                setupStep
            }
        });

        // Log the change
        await prisma.auditLog.create({
            data: {
                userId: user!.id,
                action: 'PERSONALITY_DNA_UPDATE',
                resourceType: 'PERSONALITY_DNA',
                resourceId: personalityDNA.id,
                newValue: JSON.stringify(personalityDNA)
            }
        });

        return NextResponse.json({
            success: true,
            personalityDNA
        });

    } catch (error) {
        console.error('PersonalityDNA save error:', error);
        return NextResponse.json(
            { error: 'Failed to save personality DNA' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/personality-dna?personaId=xxx
 * Retrieve PersonalityDNA for a persona
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        const { searchParams } = new URL(request.url);
        const personaId = searchParams.get('personaId');

        if (!personaId) {
            return NextResponse.json(
                { error: 'personaId is required' },
                { status: 400 }
            );
        }

        // Verify persona ownership
        const persona = await prisma.persona.findFirst({
            where: { id: personaId, userId: user!.id },
            include: { personalityDNA: true }
        });

        if (!persona) {
            return NextResponse.json(
                { error: 'Persona not found or unauthorized' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            personalityDNA: persona.personalityDNA
        });

    } catch (error) {
        console.error('PersonalityDNA get error:', error);
        return NextResponse.json(
            { error: 'Failed to get personality DNA' },
            { status: 500 }
        );
    }
}
