/**
 * MNEMOS – Cognitive Preservation System
 * Memory Trigger System
 * 
 * Implements trigger-based memory recall:
 * - Suppressed memories can be recalled by trigger words
 * - Emotional triggers activate related memories
 * - Context-based automatic recall
 */

import prisma from '../db';
import { generateEmbedding, cosineSimilarity } from './memory-recall';

export interface TriggerConfig {
    keywords: string[];
    emotionalState?: string;
    contextPatterns?: string[];
    threshold: number;  // 0-1: How strong the trigger needs to be
}

export interface TriggerResult {
    triggered: boolean;
    memories: RecalledMemory[];
    triggerStrength: number;
    triggerType: 'keyword' | 'emotional' | 'contextual' | 'none';
}

export interface RecalledMemory {
    id: string;
    content: string;
    originalState: string;
    recallReason: string;
    emotionalWeight: number;
}

// Default emotional triggers
const EMOTIONAL_TRIGGERS: Record<string, string[]> = {
    loss: ['kaybettim', 'öldü', 'ayrıldık', 'lost', 'died', 'gone', 'separated'],
    trauma: ['korku', 'acı', 'travma', 'fear', 'pain', 'trauma', 'hurt'],
    joy: ['mutlu', 'harika', 'müthiş', 'happy', 'amazing', 'wonderful', 'great'],
    nostalgia: ['eskiden', 'zamanlar', 'hatırlıyorum', 'remember', 'used to', 'back then'],
    regret: ['keşke', 'pişman', 'hata', 'wish', 'regret', 'mistake', 'should have']
};

/**
 * Check if input triggers any suppressed memories
 */
export async function checkTriggers(
    personaId: string,
    input: string,
    emotionalContext?: string
): Promise<TriggerResult> {
    const text = input.toLowerCase();

    // Check keyword triggers
    const keywordResult = await checkKeywordTriggers(personaId, text);
    if (keywordResult.triggered) {
        return keywordResult;
    }

    // Check emotional triggers
    const emotionalResult = await checkEmotionalTriggers(personaId, text, emotionalContext);
    if (emotionalResult.triggered) {
        return emotionalResult;
    }

    // Check contextual triggers (semantic similarity)
    const contextualResult = await checkContextualTriggers(personaId, text);
    if (contextualResult.triggered) {
        return contextualResult;
    }

    return {
        triggered: false,
        memories: [],
        triggerStrength: 0,
        triggerType: 'none'
    };
}

/**
 * Check for keyword-based triggers
 */
async function checkKeywordTriggers(
    personaId: string,
    text: string
): Promise<TriggerResult> {
    // Get suppressed memories
    const suppressedMemories = await prisma.memoryEntry.findMany({
        where: {
            personaId,
            // In a real implementation, we'd have a 'state' field
            // For now, check for low importance as proxy
            importanceScore: { lt: 0.3 }
        },
        take: 50
    });

    const triggered: RecalledMemory[] = [];

    for (const memory of suppressedMemories) {
        // Extract keywords from memory
        const memoryWords = memory.content.toLowerCase().split(/\s+/);
        const inputWords = text.split(/\s+/);

        // Check for matching words
        const matches = memoryWords.filter(w =>
            w.length > 3 && inputWords.includes(w)
        );

        if (matches.length >= 2) {
            triggered.push({
                id: memory.id,
                content: memory.content,
                originalState: 'suppressed',
                recallReason: `Keyword match: ${matches.slice(0, 3).join(', ')}`,
                emotionalWeight: 0.6
            });
        }
    }

    return {
        triggered: triggered.length > 0,
        memories: triggered,
        triggerStrength: Math.min(1, triggered.length * 0.3),
        triggerType: 'keyword'
    };
}

/**
 * Check for emotional triggers
 */
async function checkEmotionalTriggers(
    personaId: string,
    text: string,
    emotionalContext?: string
): Promise<TriggerResult> {
    // Detect emotional keywords in input
    let detectedEmotion: string | null = null;
    let emotionStrength = 0;

    for (const [emotion, triggers] of Object.entries(EMOTIONAL_TRIGGERS)) {
        const matchCount = triggers.filter(t => text.includes(t)).length;
        if (matchCount > emotionStrength) {
            emotionStrength = matchCount;
            detectedEmotion = emotion;
        }
    }

    if (!detectedEmotion && !emotionalContext) {
        return { triggered: false, memories: [], triggerStrength: 0, triggerType: 'emotional' };
    }

    const targetEmotion = emotionalContext || detectedEmotion;

    // Find memories with matching emotional weight
    const memories = await prisma.memoryEntry.findMany({
        where: { personaId },
        orderBy: { importanceScore: 'desc' },
        take: 20
    });

    const emotionalMemories: RecalledMemory[] = [];

    for (const memory of memories) {
        const content = memory.content.toLowerCase();

        // Check if memory content matches the emotional context
        const emotionTriggers = EMOTIONAL_TRIGGERS[targetEmotion || ''] || [];
        const matches = emotionTriggers.filter(t => content.includes(t)).length;

        if (matches > 0) {
            emotionalMemories.push({
                id: memory.id,
                content: memory.content,
                originalState: 'active',
                recallReason: `Emotional resonance: ${targetEmotion}`,
                emotionalWeight: memory.importanceScore
            });
        }
    }

    return {
        triggered: emotionalMemories.length > 0,
        memories: emotionalMemories.slice(0, 3),
        triggerStrength: Math.min(1, emotionStrength * 0.25),
        triggerType: 'emotional'
    };
}

/**
 * Check for contextual (semantic) triggers
 */
async function checkContextualTriggers(
    personaId: string,
    text: string
): Promise<TriggerResult> {
    // Generate embedding for input
    const inputEmbedding = await generateEmbedding(text);

    // Get memories with embeddings
    const memories = await prisma.memoryEntry.findMany({
        where: {
            personaId,
            embedding: { not: null }
        },
        take: 30
    });

    const contextualMemories: RecalledMemory[] = [];

    for (const memory of memories) {
        if (!memory.embedding) continue;

        let memoryEmbedding: number[];
        try {
            memoryEmbedding = JSON.parse(memory.embedding);
        } catch {
            continue;
        }

        const similarity = cosineSimilarity(inputEmbedding, memoryEmbedding);

        // High similarity = strong contextual trigger
        if (similarity > 0.7) {
            contextualMemories.push({
                id: memory.id,
                content: memory.content,
                originalState: 'faded',
                recallReason: `Contextual similarity: ${Math.round(similarity * 100)}%`,
                emotionalWeight: similarity
            });
        }
    }

    return {
        triggered: contextualMemories.length > 0,
        memories: contextualMemories.slice(0, 3),
        triggerStrength: contextualMemories.length > 0 ? contextualMemories[0].emotionalWeight : 0,
        triggerType: 'contextual'
    };
}

/**
 * Mark memory as recalled (unsuppress)
 */
export async function recallMemory(memoryId: string): Promise<void> {
    await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
            importanceScore: 0.7 // Boost importance when recalled
        }
    });
}

/**
 * Mark memory as suppressed
 */
export async function suppressMemory(memoryId: string): Promise<void> {
    await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: {
            importanceScore: 0.1 // Lower importance
        }
    });
}

/**
 * Build trigger context for cognitive processing
 */
export async function buildTriggerContext(
    personaId: string,
    input: string,
    emotionalContext?: string
): Promise<string> {
    const triggerResult = await checkTriggers(personaId, input, emotionalContext);

    if (!triggerResult.triggered) {
        return '';
    }

    const sections: string[] = [
        `## Tetiklenen Anılar (${triggerResult.triggerType})`
    ];

    for (const memory of triggerResult.memories) {
        sections.push(`
### Anı (${memory.recallReason})
${memory.content}
Duygusal ağırlık: ${Math.round(memory.emotionalWeight * 100)}%
`);
    }

    return sections.join('\n');
}
