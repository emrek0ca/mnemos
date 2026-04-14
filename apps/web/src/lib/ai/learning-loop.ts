/**
 * MNEMOS – Cognitive Preservation System
 * Layer 6: Learning Loop
 * 
 * Updates personality weights based on outcomes.
 * A static clone dies - a changing clone lives.
 * 
 * - Correct decision → reinforce
 * - Regret → penalize
 * - Emotional reaction → shift weights
 */

import prisma from '../db';
import { DecisionProfile } from './decision-engine-v2';

export interface LearningEvent {
    type: 'feedback' | 'outcome' | 'reflection';
    decision: string;
    outcome: 'positive' | 'negative' | 'neutral';
    emotionalResponse?: string;
    intensity: number;  // 0-1
    reason?: string;
}

export interface LearningResult {
    updatedProfile: Partial<DecisionProfile>;
    explanation: string;
    significantChange: boolean;
}

// Learning rates
const LEARNING_RATES = {
    positive: 0.05,    // Reinforce successful decisions
    negative: 0.08,    // Penalize regretted decisions (higher - we learn more from mistakes)
    neutral: 0.01      // Minor reinforcement
};

/**
 * Process a learning event and return weight updates
 */
export function processLearningEvent(
    event: LearningEvent,
    currentProfile: DecisionProfile,
    context: { topic: string; wasRisky: boolean; wasEmotional: boolean }
): LearningResult {
    const updates: Partial<DecisionProfile> = {};
    const explanations: string[] = [];
    let significantChange = false;

    const learningRate = LEARNING_RATES[event.outcome];

    // Risk-related learning
    if (context.wasRisky) {
        if (event.outcome === 'positive') {
            // Risk paid off - slightly increase tolerance
            updates.riskTolerance = Math.min(1, currentProfile.riskTolerance + learningRate);
            explanations.push('Risk aldım ve işe yaradı - risk toleransım biraz arttı');
        } else if (event.outcome === 'negative') {
            // Risk backfired - decrease tolerance
            updates.riskTolerance = Math.max(0, currentProfile.riskTolerance - learningRate * 1.5);
            significantChange = true;
            explanations.push('Risk aldım ve kötü sonuçlandı - artık daha temkinli olacağım');
        }
    }

    // Emotional adjustment
    if (context.wasEmotional) {
        if (event.outcome === 'positive') {
            // Emotional decision worked out
            updates.emotionalWeight = Math.min(1, currentProfile.emotionalWeight + learningRate * 0.5);
            explanations.push('Duygularımla hareket ettim ve doğru çıktı');
        } else if (event.outcome === 'negative') {
            // Emotional decision backfired
            updates.analyticalWeight = Math.min(1, currentProfile.analyticalWeight + learningRate);
            updates.emotionalWeight = Math.max(0, currentProfile.emotionalWeight - learningRate * 0.5);
            explanations.push('Duygusal kararım yanlıştı - daha mantıklı düşünmeliyim');
        }
    }

    // Topic-specific learning
    if (context.topic === 'money') {
        if (event.outcome === 'positive') {
            updates.moneyBias = Math.min(1, currentProfile.moneyBias + learningRate * 0.5);
        }
    }

    // Social pressure learning
    if (event.emotionalResponse?.includes('baskı') || event.emotionalResponse?.includes('pressure')) {
        if (event.outcome === 'negative') {
            updates.socialPressure = Math.max(0, currentProfile.socialPressure - learningRate);
            explanations.push('Başkalarının etkisinde kaldım ve pişman oldum');
        }
    }

    // Regret intensity affects learning
    if (event.intensity > 0.7 && event.outcome === 'negative') {
        significantChange = true;
        // Increase caution after strong regret
        updates.cautionLevel = Math.min(1, currentProfile.cautionLevel + learningRate);
    }

    return {
        updatedProfile: updates,
        explanation: explanations.join('. ') || 'Deneyimden öğrendim',
        significantChange
    };
}

/**
 * Apply learned updates to profile in database
 */
export async function applyLearning(
    personaId: string,
    updates: Partial<DecisionProfile>
): Promise<void> {
    if (Object.keys(updates).length === 0) return;

    try {
        const persona = await prisma.persona.findUnique({
            where: { id: personaId },
            select: { identityMemory: true, id: true }
        });

        if (!persona) return;

        // Parse current identity
        const identity = persona.identityMemory
            ? JSON.parse(persona.identityMemory)
            : {};

        // Update cognitive style with learned values
        identity.cognitiveStyle = {
            ...identity.cognitiveStyle,
            system1Tendency: updates.emotionalWeight ?? identity.cognitiveStyle?.system1Tendency ?? 0.5,
            riskTolerance: updates.riskTolerance ?? identity.cognitiveStyle?.riskTolerance ?? 0.5
        };

        // Increment version
        identity.version = (identity.version || 0) + 1;
        identity.timestamp = new Date().toISOString();

        // Save to database
        await prisma.persona.update({
            where: { id: personaId },
            data: {
                identityMemory: JSON.stringify(identity),
                system1Weight: updates.emotionalWeight ?? undefined,
                decisionThreshold: updates.cautionLevel ?? undefined
            }
        });

        // Log the learning event
        await prisma.auditLog.create({
            data: {
                action: 'LEARNING_UPDATE',
                resourceType: 'IDENTITY',
                resourceId: personaId,
                oldValue: JSON.stringify(identity.cognitiveStyle),
                newValue: JSON.stringify(updates)
            }
        });

        // If this was a significant negative event (correction), store a "Lesson Learned" memory
        // We need to import createMemory from memory.ts but circular deps might be an issue.
        // For now, we'll direct prisma insert or use a dynamic import/dependency injection in real app.
        // Assuming we can use prisma directly here to store a semantic memory.

        // Check if we have risk/caution updates which imply a lesson
        if (updates.riskTolerance !== undefined && updates.riskTolerance < (identity.cognitiveStyle?.riskTolerance || 0.5)) {
            await prisma.memoryEntry.create({
                data: {
                    personaId,
                    type: 'SEMANTIC', // Lesson learned
                    content: `DERS ÇIKARILDI: Riskli kararlar kötü sonuçlanabilir. Daha temkinli olmalıyım. (Otomatik Bilişsel Güncelleme)`,
                    embedding: JSON.stringify({ importance: 0.8, topic: 'learning' }),
                    importanceScore: 0.8
                }
            });
        }

    } catch (error) {
        console.error('Failed to apply learning:', error);
    }
}

/**
 * Detect learning opportunity from user feedback
 */
export function detectLearningOpportunity(
    userMessage: string
): LearningEvent | null {
    const text = userMessage.toLowerCase();

    // Correction patterns (Explicit correction)
    const correctionPatterns = [
        'hayır öyle değil', 'yanlış biliyorsun', 'aslında', 'düzeltiyorum',
        'öyle değil', 'saçmalama', 'no that\'s wrong', 'actually', 'incorrect'
    ];

    for (const pattern of correctionPatterns) {
        if (text.includes(pattern)) {
            return {
                type: 'feedback', // Could distinguish later as 'correction'
                decision: 'previous',
                outcome: 'negative',
                intensity: 0.8, // High intensity for direct corrections
                reason: 'Direct user correction',
                emotionalResponse: 'regret'
            };
        }
    }

    // Positive feedback patterns
    const positivePatterns = [
        'haklıydın', 'doğru', 'iyi oldu', 'güzel', 'teşekkür',
        'you were right', 'correct', 'good call', 'thanks', 'aferin'
    ];

    // Negative feedback patterns (Regret/General negative)
    const negativePatterns = [
        'yanlış', 'pişman', 'keşke', 'hata', 'kötü oldu',
        'wrong', 'regret', 'mistake', 'bad decision', 'shouldn\'t have'
    ];

    for (const pattern of positivePatterns) {
        if (text.includes(pattern)) {
            return {
                type: 'feedback',
                decision: 'previous',
                outcome: 'positive',
                intensity: 0.5,
                reason: pattern
            };
        }
    }

    for (const pattern of negativePatterns) {
        if (text.includes(pattern)) {
            return {
                type: 'feedback',
                decision: 'previous',
                outcome: 'negative',
                intensity: text.includes('çok') || text.includes('really') ? 0.8 : 0.5,
                reason: pattern
            };
        }
    }

    return null;
}
