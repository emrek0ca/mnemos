/**
 * MNEMOS – Training UX
 * Onboarding API Route
 * 
 * Kullanıcı farkında olmadan personality-dna yazıyor.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
    trainingUX,
    ONBOARDING_QUESTIONS
} from '@/lib/ai/training-ux';

// GET: Get onboarding progress and next question
export async function GET(request: NextRequest) {
    try {
        const personaId = request.nextUrl.searchParams.get('personaId');

        if (!personaId) {
            return NextResponse.json(
                { error: 'personaId is required' },
                { status: 400 }
            );
        }

        const progress = await trainingUX.getOnboardingProgress(personaId);
        const indicators = await trainingUX.getEvolutionIndicators(personaId);

        return NextResponse.json({
            success: true,
            progress: {
                completed: progress.completed,
                total: progress.total,
                percentage: Math.round((progress.completed / progress.total) * 100)
            },
            nextQuestion: progress.nextQuestion,
            allQuestions: ONBOARDING_QUESTIONS,
            evolution: indicators,
            // User-facing messages (non-technical)
            statusMessage: progress.completed === progress.total
                ? 'Tercihler belirlendi'
                : `${progress.completed}/${progress.total} tercih tamamlandı`
        });
    } catch (error) {
        console.error('[Onboarding] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to get onboarding status' },
            { status: 500 }
        );
    }
}

// POST: Submit an onboarding answer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { personaId, questionId, selectedOptionId } = body;

        if (!personaId || !questionId || !selectedOptionId) {
            return NextResponse.json(
                { error: 'personaId, questionId, and selectedOptionId are required' },
                { status: 400 }
            );
        }

        // Process the answer
        const feedback = await trainingUX.processOnboardingAnswer(
            personaId,
            questionId,
            selectedOptionId
        );

        // Get updated progress
        const progress = await trainingUX.getOnboardingProgress(personaId);

        return NextResponse.json({
            success: true,
            feedback: {
                message: feedback.message,
                show: feedback.showToUser
            },
            progress: {
                completed: progress.completed,
                total: progress.total
            },
            nextQuestion: progress.nextQuestion,
            // Encouraging message
            encouragement: progress.completed === progress.total
                ? 'Tercihlerini tamamladın! Sistem sana göre şekillenecek.'
                : 'Bu tercihi sistem davranışına ekliyoruz.'
        });
    } catch (error) {
        console.error('[Onboarding] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to process answer' },
            { status: 500 }
        );
    }
}
