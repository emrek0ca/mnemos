/**
 * MNEMOS – Cognitive Preservation System
 * Layer 5: Self-Consistency Layer
 * 
 * The critical layer that creates the "illusion of self".
 * - References previous responses
 * - Detects conflicts and explains them
 * - Uses meta-statements like "I usually..."
 * 
 * This single layer destroys the "this is a machine" perception.
 */

import prisma from '../db';

export interface ConsistencyContext {
    previousStatements: PreviousStatement[];
    coreBeliefs: string[];
    pastDecisions: PastDecision[];
}

export interface PreviousStatement {
    topic: string;
    stance: string;
    timestamp: Date;
    context: string;
}

export interface PastDecision {
    situation: string;
    decision: string;
    reasoning: string;
    timestamp: Date;
}

export interface ConsistencyCheck {
    isConsistent: boolean;
    conflictingStatement?: PreviousStatement;
    suggestedAdjustment?: string;
    selfReflection?: string;
}

/**
 * Check if a potential response conflicts with past statements
 * Uses semantic similarity for more accurate detection
 */
export async function checkConsistency(
    proposedResponse: string,
    topic: string,
    previousStatements: PreviousStatement[]
): Promise<ConsistencyCheck> {
    // Find relevant past statements on same topic
    const relevantPast = previousStatements.filter(
        s => s.topic.toLowerCase() === topic.toLowerCase() ||
            s.topic.toLowerCase().includes(topic.toLowerCase()) ||
            topic.toLowerCase().includes(s.topic.toLowerCase())
    );

    if (relevantPast.length === 0) {
        return { isConsistent: true };
    }

    // Import embedding functions dynamically to avoid circular dependencies
    const { generateEmbedding, cosineSimilarity } = await import('./memory-recall');

    // Generate embedding for proposed response
    const proposedEmbedding = await generateEmbedding(proposedResponse);

    for (const past of relevantPast) {
        const pastEmbedding = await generateEmbedding(past.stance);
        const similarity = cosineSimilarity(proposedEmbedding, pastEmbedding);

        // Very low similarity on same topic indicates potential contradiction
        // Very high similarity is fine (consistent response)
        // Medium similarity needs keyword-based refinement
        if (similarity < 0.25) {
            // Check for explicit contradictions using keywords
            const proposedLower = proposedResponse.toLowerCase();
            const pastLower = past.stance.toLowerCase();

            // Check for direct contradictions
            const hasContradiction =
                (proposedLower.includes('evet') && pastLower.includes('hayır')) ||
                (proposedLower.includes('hayır') && pastLower.includes('evet')) ||
                (proposedLower.includes('katılıyorum') && pastLower.includes('katılmıyorum')) ||
                (proposedLower.includes('katılmıyorum') && pastLower.includes('katılıyorum')) ||
                (proposedLower.includes('yes') && pastLower.includes('no')) ||
                (proposedLower.includes('no') && pastLower.includes('yes')) ||
                (proposedLower.includes('agree') && pastLower.includes('disagree')) ||
                (proposedLower.includes('disagree') && pastLower.includes('agree'));

            if (hasContradiction || similarity < 0.15) {
                return {
                    isConsistent: false,
                    conflictingStatement: past,
                    suggestedAdjustment: generateExplanation(past),
                    selfReflection: generateSelfReflection(past, topic)
                };
            }
        }
    }

    return { isConsistent: true };
}

/**
 * Generate explanation for changed stance
 */
function generateExplanation(pastStatement: PreviousStatement): string {
    const daysSince = Math.floor(
        (Date.now() - new Date(pastStatement.timestamp).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince > 30) {
        return `Daha önce bu konuda farklı düşünüyordum ama zamanla görüşlerim değişti.`;
    } else if (daysSince > 7) {
        return `Birkaç hafta önce farklı bir bakış açım vardı, ama yeni bilgilerle görüşümü güncelledim.`;
    } else {
        return `Kısa süre önce bu konuda farklı konuşmuştum. Durumu daha iyi değerlendirince...`;
    }
}

/**
 * Generate self-reflection statement
 */
function generateSelfReflection(
    pastStatement: PreviousStatement,
    currentTopic: string
): string {
    const reflections = [
        `Normalde ${currentTopic} konusunda tutarlı biriyim ama bu durum biraz farklı.`,
        `Ben genellikle fikirlerimi kolay değiştirmem, ama burada yeni bir perspektif gördüm.`,
        `Farkındayım ki daha önce farklı söylemiştim - bunu açıklamam gerekiyor.`,
        `Beni tanıyanlar bilir, ${currentTopic} konusunda genelde net olurum. Ama bu sefer...`,
    ];

    return reflections[Math.floor(Math.random() * reflections.length)];
}

/**
 * Add self-consistency markers to response
 */
export function addConsistencyMarkers(
    response: string,
    consistencyCheck: ConsistencyCheck
): string {
    if (consistencyCheck.isConsistent) {
        // Occasionally add reinforcing statements
        if (Math.random() > 0.8) {
            const reinforcements = [
                'Her zaman söylediğim gibi, ',
                'Bu konuda tutarlı düşüncem şu: ',
                'Beni bilenler bilir, ',
            ];
            const prefix = reinforcements[Math.floor(Math.random() * reinforcements.length)];
            return prefix + response.charAt(0).toLowerCase() + response.slice(1);
        }
        return response;
    }

    // Add explanation for inconsistency
    let adjustedResponse = response;

    if (consistencyCheck.selfReflection) {
        adjustedResponse = consistencyCheck.selfReflection + ' ' + adjustedResponse;
    }

    if (consistencyCheck.suggestedAdjustment) {
        adjustedResponse = adjustedResponse + ' ' + consistencyCheck.suggestedAdjustment;
    }

    return adjustedResponse;
}

/**
 * Load past statements from database
 */
export async function loadPastStatements(personaId: string): Promise<PreviousStatement[]> {
    try {
        // Get messages from past conversations
        const messages = await prisma.message.findMany({
            where: {
                conversation: { personaId },
                role: 'ASSISTANT'
            },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                content: true,
                createdAt: true,
                reasoningTrace: true
            }
        });

        return messages.map(m => ({
            topic: 'general', // Would be extracted in production
            stance: m.content.substring(0, 200),
            timestamp: m.createdAt,
            context: m.reasoningTrace || ''
        }));
    } catch {
        return [];
    }
}

/**
 * Load core beliefs from identity memory
 */
export async function loadCoreBeliefs(personaId: string): Promise<string[]> {
    try {
        const persona = await prisma.persona.findUnique({
            where: { id: personaId },
            select: { identityMemory: true }
        });

        if (persona?.identityMemory) {
            const identity = JSON.parse(persona.identityMemory);
            return identity.values || [];
        }
        return [];
    } catch {
        return [];
    }
}
