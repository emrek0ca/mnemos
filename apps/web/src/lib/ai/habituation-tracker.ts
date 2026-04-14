/**
 * MNEMOS – Dijital Kişilik Motoru
 * Habituation Tracker - Alışkanlık Takibi
 * 
 * Aynı şeyi 50 kere anlatırsan önemi düşer.
 * Tekrarlanan içerikler habituation'a uğrar.
 * 
 * RecallScore = Similarity × EmotionalWeight × IdentityRelevance × (1 - Habituation)
 */

import prisma from '../db';
import { getActivePersonaId } from './memory-utils';

// ==================== TYPES ====================

export interface HabituationEntry {
    contentHash: string;
    occurrences: number;
    lastOccurrence: Date;
    habituationLevel: number;  // 0-1: Yüksek = çok tekrar edilmiş
    topics: string[];
}

export interface HabituationResult {
    habituationLevel: number;
    isHabituated: boolean;  // > 0.7 ise true
    occurrenceCount: number;
    suggestion?: string;
}

// ==================== SIMILARITY HELPERS ====================

/**
 * Simple content hashing for similarity detection
 * Uses lowercase normalized words
 */
function hashContent(content: string): string {
    const words = content
        .toLowerCase()
        .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 3)
        .sort()
        .slice(0, 20);

    return words.join('_');
}

/**
 * Extract key phrases for comparison
 */
function extractKeyPhrases(content: string): string[] {
    const text = content.toLowerCase();
    const phrases: string[] = [];

    // Extract noun phrases and key concepts
    const words = text.split(/\s+/);
    for (let i = 0; i < words.length - 1; i++) {
        if (words[i].length > 3 && words[i + 1].length > 3) {
            phrases.push(`${words[i]} ${words[i + 1]}`);
        }
    }

    // Single significant words
    words.filter(w => w.length > 5).forEach(w => phrases.push(w));

    return phrases.slice(0, 10);
}

/**
 * Calculate similarity between two texts (0-1)
 */
function calculateSimilarity(text1: string, text2: string): number {
    const phrases1 = new Set(extractKeyPhrases(text1));
    const phrases2 = new Set(extractKeyPhrases(text2));

    if (phrases1.size === 0 || phrases2.size === 0) return 0;

    let matches = 0;
    phrases1.forEach(p => {
        if (phrases2.has(p)) matches++;
    });

    return matches / Math.max(phrases1.size, phrases2.size);
}

// ==================== HABITUATION CALCULATION ====================

/**
 * Calculate habituation level for a piece of content
 * Checks similar past memories and counts occurrences
 */
export async function calculateHabituation(
    personaId: string,
    content: string,
    topic?: string
): Promise<HabituationResult> {
    try {
        // Get recent memories (last 100)
        const recentMemories = await prisma.memoryEntry.findMany({
            where: { personaId },
            orderBy: { createdAt: 'desc' },
            take: 100,
            select: {
                id: true,
                content: true,
                topic: true,
                createdAt: true,
                accessCount: true
            }
        });

        const contentHash = hashContent(content);
        let occurrenceCount = 0;
        let totalSimilarity = 0;
        const matchedTopics: string[] = [];

        // Check each memory for similarity
        for (const memory of recentMemories) {
            const similarity = calculateSimilarity(content, memory.content);

            // If similar enough (> 0.4), count as occurrence
            if (similarity > 0.4) {
                occurrenceCount++;
                totalSimilarity += similarity;

                if (memory.topic && !matchedTopics.includes(memory.topic)) {
                    matchedTopics.push(memory.topic);
                }
            }

            // Exact match (same hash)
            if (hashContent(memory.content) === contentHash) {
                occurrenceCount += 2; // Exact matches count double
            }
        }

        // Calculate habituation level
        // Formula: log-based so first few repetitions have more impact
        // After 10+ occurrences, approaches 1.0
        let habituationLevel = 0;
        if (occurrenceCount > 0) {
            habituationLevel = Math.min(0.95, Math.log10(occurrenceCount + 1) / 1.5);
        }

        // Topic repetition boosts habituation
        if (topic && matchedTopics.includes(topic)) {
            habituationLevel = Math.min(0.95, habituationLevel + 0.1);
        }

        const isHabituated = habituationLevel > 0.7;

        let suggestion: string | undefined;
        if (isHabituated) {
            suggestion = 'Bu konu çok tekrar edilmiş, yeni bir açıdan yaklaşmayı dene.';
        } else if (habituationLevel > 0.5) {
            suggestion = 'Bu konuyu daha önce konuştuk, ana fikirlere odaklan.';
        }

        return {
            habituationLevel,
            isHabituated,
            occurrenceCount,
            suggestion
        };
    } catch (error) {
        console.error('[HabituationTracker] Failed to calculate:', error);
        return {
            habituationLevel: 0,
            isHabituated: false,
            occurrenceCount: 0
        };
    }
}

/**
 * Get habituation score for recall formula
 * Used in: RecallScore = Similarity × EmotionalWeight × IdentityRelevance × (1 - Habituation)
 */
export async function getHabituationFactor(
    personaId: string,
    memoryContent: string
): Promise<number> {
    const result = await calculateHabituation(personaId, memoryContent);

    // Return inverse: low habituation = high factor (good for recall)
    // High habituation = low factor (reduces recall priority)
    return 1 - result.habituationLevel;
}

/**
 * Mark content as accessed (increases habituation over time)
 */
export async function markContentAccessed(
    personaId: string,
    content: string,
    topic: string
): Promise<void> {
    // This is tracked through memory access counts
    // Just log for now - the calculateHabituation will pick it up
    console.log(`[HabituationTracker] Content accessed: ${topic}`);
}

/**
 * Get topics that are over-discussed
 */
export async function getOverDiscussedTopics(personaId: string): Promise<string[]> {
    try {
        const memories = await prisma.memoryEntry.findMany({
            where: { personaId },
            select: { topic: true },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        // Count topic occurrences
        const topicCounts = new Map<string, number>();
        memories.forEach(m => {
            if (m.topic) {
                topicCounts.set(m.topic, (topicCounts.get(m.topic) || 0) + 1);
            }
        });

        // Return topics with > 10 occurrences
        const overDiscussed: string[] = [];
        topicCounts.forEach((count, topic) => {
            if (count > 10 && topic !== 'general' && topic !== 'casual_chat') {
                overDiscussed.push(topic);
            }
        });

        return overDiscussed;
    } catch (error) {
        console.error('[HabituationTracker] Failed to get over-discussed topics:', error);
        return [];
    }
}

// ==================== EXPORTS ====================

export const habituationTracker = {
    calculateHabituation,
    getHabituationFactor,
    markContentAccessed,
    getOverDiscussedTopics
};
