/**
 * MNEMOS – Training UX
 * Feedback API Route
 * 
 * Kullanıcı geri bildirimi ve düzeltmeleri
 * "Öğrenme" illüzyonu için micro-feedback
 */

import { NextRequest, NextResponse } from 'next/server';
import { trainingUX } from '@/lib/ai/training-ux';

// POST: Handle user feedback/correction
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { personaId, feedbackType, action, targetId, content } = body;

        if (!personaId) {
            return NextResponse.json(
                { error: 'personaId is required' },
                { status: 400 }
            );
        }

        let feedback;
        let evolutionMessage = null;

        // Handle different feedback types
        if (feedbackType === 'correction') {
            // User correcting AI behavior
            const correctionTypes = ['too_long', 'too_short', 'too_formal', 'too_casual', 'wrong_approach', 'misunderstood'] as const;
            const correctionType = correctionTypes.includes(action) ? action : 'wrong_approach';

            feedback = await trainingUX.handleUserCorrection(
                personaId,
                correctionType as typeof correctionTypes[number],
                content
            );
        } else if (feedbackType === 'disagreement') {
            // User disagrees with AI response
            const response = await trainingUX.handleDisagreement(personaId, content);
            feedback = {
                type: 'correction_learned' as const,
                message: response,
                showToUser: true
            };
        } else if (feedbackType === 'control') {
            // User wants to control a memory/behavior
            feedback = await trainingUX.handleUserControl(personaId, {
                action: action as 'keep' | 'forget' | 'important' | 'never',
                targetType: body.targetType || 'memory',
                targetId: targetId || ''
            });
        } else {
            // Generic feedback
            feedback = trainingUX.generateMicroFeedback('preference_noted');
        }

        // Maybe generate evolution message
        evolutionMessage = await trainingUX.generateEvolutionMessage(personaId, content || '');

        // Get current evolution indicators
        const indicators = await trainingUX.getEvolutionIndicators(personaId);

        return NextResponse.json({
            success: true,
            feedback: {
                message: feedback.message,
                type: feedback.type,
                show: feedback.showToUser
            },
            evolution: evolutionMessage ? {
                message: evolutionMessage,
                show: true
            } : null,
            indicators: indicators.map(i => ({
                label: i.label,
                status: i.status
            }))
        });
    } catch (error) {
        console.error('[Feedback] POST error:', error);
        return NextResponse.json(
            { error: 'Failed to process feedback' },
            { status: 500 }
        );
    }
}

// GET: Get user control options and evolution status
export async function GET(request: NextRequest) {
    try {
        const personaId = request.nextUrl.searchParams.get('personaId');

        if (!personaId) {
            return NextResponse.json(
                { error: 'personaId is required' },
                { status: 400 }
            );
        }

        const indicators = await trainingUX.getEvolutionIndicators(personaId);

        return NextResponse.json({
            success: true,
            // Control options user can see
            controlOptions: [
                { action: 'keep', label: 'Bu bilgiyi koru', icon: '💾' },
                { action: 'forget', label: 'Bunu unut', icon: '🗑️' },
                { action: 'important', label: 'Bu benim için önemli', icon: '⭐' },
                { action: 'never', label: 'Bunu bir daha yapma', icon: '🚫' }
            ],
            // Correction options
            correctionOptions: [
                { type: 'too_long', label: 'Çok uzun oldu' },
                { type: 'too_short', label: 'Çok kısa kaldı' },
                { type: 'too_formal', label: 'Çok resmi' },
                { type: 'too_casual', label: 'Çok laubali' },
                { type: 'wrong_approach', label: 'Yaklaşım yanlış' },
                { type: 'misunderstood', label: 'Yanlış anladın' }
            ],
            // Evolution status (non-technical labels)
            evolution: indicators.map(i => ({
                label: i.label,
                status: i.status,
                category: i.category
            }))
        });
    } catch (error) {
        console.error('[Feedback] GET error:', error);
        return NextResponse.json(
            { error: 'Failed to get feedback options' },
            { status: 500 }
        );
    }
}
