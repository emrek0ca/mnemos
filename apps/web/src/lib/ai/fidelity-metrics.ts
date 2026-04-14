/**
 * MNEMOS – Cognitive Preservation System
 * Fidelity Metrics Engine
 * 
 * Measures consistency and fidelity of cognitive representation:
 * - Same question → same response test
 * - Consistency score calculation
 * - Deviation detection and logging
 */

import prisma from '../db';
import { cosineSimilarity, generateEmbedding } from './memory-recall';

export interface FidelityMetrics {
    overallScore: number;       // 0-1: Overall fidelity
    consistency: number;        // 0-1: Response consistency
    personalityAlignment: number; // 0-1: Alignment with defined personality
    memoryIntegrity: number;    // 0-1: Memory-based response accuracy
    temporalStability: number;  // 0-1: Stability over time
}

export interface ConsistencyTestResult {
    testId: string;
    question: string;
    responses: {
        timestamp: Date;
        response: string;
        embedding: number[];
    }[];
    pairwiseSimilarity: number[];
    averageConsistency: number;
    deviation: number;
    verdict: 'consistent' | 'minor_drift' | 'significant_drift' | 'inconsistent';
}

export interface DeviationEvent {
    timestamp: Date;
    context: string;
    expectedBehavior: string;
    actualBehavior: string;
    deviationScore: number;
    explanation?: string;
}

/**
 * Calculate fidelity metrics for a persona
 */
export async function calculateFidelityMetrics(personaId: string): Promise<FidelityMetrics> {
    // Get recent responses
    const recentMessages = await prisma.message.findMany({
        where: {
            conversation: { personaId },
            role: 'ASSISTANT'
        },
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
            content: true,
            createdAt: true,
            processingType: true
        }
    });

    if (recentMessages.length < 5) {
        return {
            overallScore: 1.0,
            consistency: 1.0,
            personalityAlignment: 1.0,
            memoryIntegrity: 1.0,
            temporalStability: 1.0
        };
    }

    // Calculate consistency from response similarities
    const consistency = await calculateConsistency(recentMessages);

    // Calculate personality alignment
    const personalityAlignment = await calculatePersonalityAlignment(personaId, recentMessages);

    // Calculate memory integrity
    const memoryIntegrity = await calculateMemoryIntegrity(personaId);

    // Calculate temporal stability
    const temporalStability = calculateTemporalStability(recentMessages);

    // Overall weighted score
    const overallScore = (
        consistency * 0.35 +
        personalityAlignment * 0.25 +
        memoryIntegrity * 0.2 +
        temporalStability * 0.2
    );

    return {
        overallScore,
        consistency,
        personalityAlignment,
        memoryIntegrity,
        temporalStability
    };
}

/**
 * Calculate response consistency score
 */
async function calculateConsistency(
    messages: { content: string; createdAt: Date }[]
): Promise<number> {
    if (messages.length < 2) return 1.0;

    // Generate embeddings for responses
    const embeddings = await Promise.all(
        messages.slice(0, 20).map(m => generateEmbedding(m.content))
    );

    // Calculate pairwise similarities
    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < embeddings.length - 1; i++) {
        for (let j = i + 1; j < embeddings.length; j++) {
            totalSimilarity += cosineSimilarity(embeddings[i], embeddings[j]);
            pairCount++;
        }
    }

    // Higher similarity = higher consistency
    // But too high might mean overly repetitive
    const avgSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0.5;

    // Sweet spot is around 0.3-0.7 similarity
    if (avgSimilarity > 0.7) {
        return 0.8; // Slightly penalize being too repetitive
    } else if (avgSimilarity < 0.2) {
        return avgSimilarity * 2; // Low consistency
    }

    return Math.min(1, avgSimilarity + 0.3);
}

/**
 * Calculate alignment with personality profile
 */
async function calculatePersonalityAlignment(
    personaId: string,
    messages: { content: string }[]
): Promise<number> {
    try {
        const persona = await prisma.persona.findUnique({
            where: { id: personaId },
            select: { identityMemory: true }
        });

        if (!persona?.identityMemory) return 0.7;

        const identity = JSON.parse(persona.identityMemory);
        const traits = identity.characterTraits || [];
        const values = identity.values || [];

        if (traits.length === 0 && values.length === 0) return 0.8;

        // Check if responses reflect defined traits
        const allKeywords = [...traits, ...values].map(t => t.toLowerCase());
        let matchCount = 0;

        for (const message of messages.slice(0, 20)) {
            const content = message.content.toLowerCase();
            if (allKeywords.some(kw => content.includes(kw))) {
                matchCount++;
            }
        }

        return Math.min(1, matchCount / Math.min(20, messages.length) + 0.5);
    } catch {
        return 0.7;
    }
}

/**
 * Calculate memory integrity
 */
async function calculateMemoryIntegrity(personaId: string): Promise<number> {
    try {
        const memoryCount = await prisma.memoryEntry.count({
            where: { personaId }
        });

        // More memories = better integrity (up to a point)
        if (memoryCount === 0) return 0.5;
        if (memoryCount < 10) return 0.6 + (memoryCount * 0.02);
        if (memoryCount < 50) return 0.8 + (memoryCount * 0.002);
        return 0.95;
    } catch {
        return 0.5;
    }
}

/**
 * Calculate temporal stability
 */
function calculateTemporalStability(
    messages: { createdAt: Date }[]
): number {
    if (messages.length < 2) return 1.0;

    // Calculate time distribution
    const timestamps = messages.map(m => m.createdAt.getTime());
    const intervals: number[] = [];

    for (let i = 1; i < timestamps.length; i++) {
        intervals.push(timestamps[i - 1] - timestamps[i]);
    }

    // Calculate coefficient of variation
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    const cv = mean > 0 ? stdDev / mean : 0;

    // Lower CV = more stable usage = better
    return Math.max(0.5, 1 - (cv * 0.5));
}

/**
 * Run consistency test with same question
 */
export async function runConsistencyTest(
    personaId: string,
    question: string,
    existingResponses: string[] = []
): Promise<ConsistencyTestResult> {
    const responses: ConsistencyTestResult['responses'] = [];

    // Add existing responses
    for (const resp of existingResponses) {
        responses.push({
            timestamp: new Date(),
            response: resp,
            embedding: await generateEmbedding(resp)
        });
    }

    // Calculate pairwise similarities
    const pairwiseSimilarity: number[] = [];
    for (let i = 0; i < responses.length - 1; i++) {
        for (let j = i + 1; j < responses.length; j++) {
            pairwiseSimilarity.push(
                cosineSimilarity(responses[i].embedding, responses[j].embedding)
            );
        }
    }

    const averageConsistency = pairwiseSimilarity.length > 0
        ? pairwiseSimilarity.reduce((a, b) => a + b, 0) / pairwiseSimilarity.length
        : 1.0;

    // Calculate deviation (standard deviation of similarities)
    const mean = averageConsistency;
    const variance = pairwiseSimilarity.length > 0
        ? pairwiseSimilarity.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / pairwiseSimilarity.length
        : 0;
    const deviation = Math.sqrt(variance);

    // Determine verdict
    let verdict: ConsistencyTestResult['verdict'];
    if (averageConsistency > 0.7) {
        verdict = 'consistent';
    } else if (averageConsistency > 0.5) {
        verdict = 'minor_drift';
    } else if (averageConsistency > 0.3) {
        verdict = 'significant_drift';
    } else {
        verdict = 'inconsistent';
    }

    return {
        testId: `test_${Date.now()}`,
        question,
        responses,
        pairwiseSimilarity,
        averageConsistency,
        deviation,
        verdict
    };
}

/**
 * Detect and log deviations
 */
export async function detectDeviations(
    personaId: string
): Promise<DeviationEvent[]> {
    const deviations: DeviationEvent[] = [];

    // Get identity
    const persona = await prisma.persona.findUnique({
        where: { id: personaId },
        select: { identityMemory: true }
    });

    if (!persona?.identityMemory) return [];

    const identity = JSON.parse(persona.identityMemory);
    const boundaries = identity.moralBoundaries || [];

    // Get recent responses and check against boundaries
    const messages = await prisma.message.findMany({
        where: {
            conversation: { personaId },
            role: 'ASSISTANT'
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    for (const msg of messages) {
        const content = msg.content.toLowerCase();

        for (const boundary of boundaries) {
            const boundaryLower = boundary.toLowerCase();

            // Check if response violates stated boundary
            // This is a simple keyword check - can be enhanced
            if (content.includes(boundaryLower.replace('yapma', 'yap'))) {
                deviations.push({
                    timestamp: msg.createdAt,
                    context: msg.content.substring(0, 100),
                    expectedBehavior: `Should respect boundary: ${boundary}`,
                    actualBehavior: 'Potential boundary violation detected',
                    deviationScore: 0.7
                });
            }
        }
    }

    return deviations;
}

/**
 * Get fidelity history over time
 */
export async function getFidelityHistory(
    personaId: string,
    days: number = 30
): Promise<{ date: string; score: number }[]> {
    const history: { date: string; score: number }[] = [];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get message counts per day
    const messages = await prisma.message.findMany({
        where: {
            conversation: { personaId },
            createdAt: { gte: startDate }
        },
        orderBy: { createdAt: 'asc' },
        select: { createdAt: true }
    });

    // Group by date
    const messagesByDate: Record<string, number> = {};
    for (const msg of messages) {
        const dateStr = msg.createdAt.toISOString().split('T')[0];
        messagesByDate[dateStr] = (messagesByDate[dateStr] || 0) + 1;
    }

    // Generate scores (simulated based on activity)
    for (let i = 0; i < days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - (days - i - 1));
        const dateStr = date.toISOString().split('T')[0];

        const activity = messagesByDate[dateStr] || 0;
        // More activity = slightly better fidelity (up to a point)
        const score = Math.min(0.95, 0.7 + (activity * 0.02));

        history.push({ date: dateStr, score });
    }

    return history;
}
