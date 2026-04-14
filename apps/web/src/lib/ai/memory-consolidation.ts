/**
 * MNEMOS – Dijital Kişilik Motoru
 * Memory Consolidation - Hafıza Konsolidasyonu
 * 
 * Gece "rüya" süreci:
 * - Önemsiz anıları zayıflat
 * - Önemli olanları güçlendir
 * - Benzer anıları birleştir
 * - Çelişenleri işaretle
 * 
 * Bu "uyku" süreci olmadan hafıza kaotik olur.
 */

import prisma from '../db';
import { Memory, MemoryType } from './memory';

// ==================== TYPES ====================

export interface ConsolidationResult {
    processedMemories: number;
    strengthened: number;
    weakened: number;
    merged: number;
    flaggedContradictions: number;
    duration: number;
}

export interface MemoryCluster {
    id: string;
    topic: string;
    memories: string[];  // Memory IDs
    coreMemory: string;  // Most important one
    coherenceScore: number;
    contradictionIds?: string[];
}

export interface ConsolidationConfig {
    minAgeHours: number;          // Ne kadar eski olmalı
    decayMultiplier: number;      // Zayıflatma çarpanı
    strengthenThreshold: number;  // Güçlendirme eşiği (emotion/access)
    mergeThreshold: number;       // Birleştirme benzerlik eşiği
}

// ==================== DEFAULT CONFIG ====================

const DEFAULT_CONFIG: ConsolidationConfig = {
    minAgeHours: 8,           // En az 8 saatlik
    decayMultiplier: 0.95,    // %5 düşüş
    strengthenThreshold: 0.7, // Yüksek duygusal = güçlen
    mergeThreshold: 0.75      // %75 benzerlik = birleştir
};

// ==================== SIMILARITY CALCULATION ====================

/**
 * Calculate semantic similarity between two texts
 * Simple word overlap + topic matching
 */
function calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(
        text1.toLowerCase()
            .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
    );

    const words2 = new Set(
        text2.toLowerCase()
            .replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, '')
            .split(/\s+/)
            .filter(w => w.length > 3)
    );

    let overlap = 0;
    words1.forEach(w => {
        if (words2.has(w)) overlap++;
    });

    const total = words1.size + words2.size;
    if (total === 0) return 0;

    return (overlap * 2) / total;  // Jaccard-like
}

/**
 * Check if two memories contradict each other
 */
function detectContradiction(mem1: string, mem2: string): boolean {
    const contradictionPairs = [
        ['sevmem', 'severim'],
        ['istemem', 'isterim'],
        ['yapmam', 'yaparım'],
        ['olmaz', 'olur'],
        ['hayır', 'evet'],
        ['nefret', 'aşık'],
        ['kötü', 'iyi'],
        ['asla', 'her zaman']
    ];

    const text1 = mem1.toLowerCase();
    const text2 = mem2.toLowerCase();

    for (const [neg, pos] of contradictionPairs) {
        if ((text1.includes(neg) && text2.includes(pos)) ||
            (text1.includes(pos) && text2.includes(neg))) {
            // Check if same topic
            const similarity = calculateSimilarity(mem1, mem2);
            if (similarity > 0.3) {
                return true;  // Same topic + opposite stance
            }
        }
    }

    return false;
}

// ==================== CONSOLIDATION FUNCTIONS ====================

/**
 * Run memory consolidation (should be called periodically, like nightly)
 */
export async function runConsolidation(
    personaId: string,
    config: ConsolidationConfig = DEFAULT_CONFIG
): Promise<ConsolidationResult> {
    const startTime = Date.now();
    let strengthened = 0;
    let weakened = 0;
    let merged = 0;
    let flaggedContradictions = 0;

    try {
        // Get memories older than minAgeHours
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - config.minAgeHours);

        const memories = await prisma.memoryEntry.findMany({
            where: {
                personaId,
                createdAt: { lte: cutoffTime }
            },
            orderBy: { createdAt: 'desc' }
        });

        // 1. DECAY: Weaken low-importance memories
        for (const mem of memories) {
            const embedding = parseEmbedding(mem.embedding);
            const accessCount = embedding.accessCount || 0;
            const emotionalWeight = mem.importanceScore;

            // Low access + low emotion = decay
            if (accessCount < 2 && emotionalWeight < 0.4) {
                const newImportance = mem.importanceScore * config.decayMultiplier;

                await prisma.memoryEntry.update({
                    where: { id: mem.id },
                    data: {
                        importanceScore: newImportance,
                        embedding: JSON.stringify({
                            ...embedding,
                            consolidated: true,
                            lastConsolidation: new Date().toISOString()
                        })
                    }
                });
                weakened++;
            }
        }

        // 2. STRENGTHEN: Boost important memories
        for (const mem of memories) {
            const embedding = parseEmbedding(mem.embedding);
            const accessCount = embedding.accessCount || 0;
            const emotionalWeight = mem.importanceScore;

            // High access OR high emotion = strengthen
            if (accessCount >= 5 || emotionalWeight >= config.strengthenThreshold) {
                const boost = Math.min(1.0, mem.importanceScore * 1.1);

                await prisma.memoryEntry.update({
                    where: { id: mem.id },
                    data: {
                        importanceScore: boost,
                        embedding: JSON.stringify({
                            ...embedding,
                            consolidated: true,
                            strengthened: true,
                            lastConsolidation: new Date().toISOString()
                        })
                    }
                });
                strengthened++;
            }
        }

        // 3. MERGE: Combine similar memories
        const processed = new Set<string>();
        for (let i = 0; i < memories.length; i++) {
            if (processed.has(memories[i].id)) continue;

            for (let j = i + 1; j < memories.length; j++) {
                if (processed.has(memories[j].id)) continue;

                const similarity = calculateSimilarity(
                    memories[i].content,
                    memories[j].content
                );

                if (similarity >= config.mergeThreshold) {
                    // Keep the one with higher importance
                    const keep = memories[i].importanceScore >= memories[j].importanceScore
                        ? memories[i] : memories[j];
                    const merge = keep === memories[i] ? memories[j] : memories[i];

                    // Boost kept memory, suppress merged
                    await prisma.memoryEntry.update({
                        where: { id: keep.id },
                        data: {
                            importanceScore: Math.min(1.0, keep.importanceScore + 0.1),
                            content: keep.content + ` [Merged: ${merge.content.substring(0, 50)}...]`
                        }
                    });

                    // Mark merged as suppressed instead of deleting
                    const mergeEmbedding = parseEmbedding(merge.embedding);
                    await prisma.memoryEntry.update({
                        where: { id: merge.id },
                        data: {
                            embedding: JSON.stringify({
                                ...mergeEmbedding,
                                state: 'SUPPRESSED',
                                mergedInto: keep.id,
                                suppressedAt: new Date().toISOString()
                            })
                        }
                    });

                    processed.add(merge.id);
                    merged++;
                }
            }
        }

        // 4. CONTRADICTIONS: Flag memories that contradict each other
        for (let i = 0; i < memories.length; i++) {
            for (let j = i + 1; j < memories.length; j++) {
                if (detectContradiction(memories[i].content, memories[j].content)) {
                    // Flag both
                    for (const mem of [memories[i], memories[j]]) {
                        const embedding = parseEmbedding(mem.embedding);
                        if (!embedding.contradicts) {
                            await prisma.memoryEntry.update({
                                where: { id: mem.id },
                                data: {
                                    embedding: JSON.stringify({
                                        ...embedding,
                                        contradicts: mem === memories[i]
                                            ? memories[j].id
                                            : memories[i].id,
                                        contradictionDetectedAt: new Date().toISOString()
                                    })
                                }
                            });
                        }
                    }
                    flaggedContradictions++;
                }
            }
        }

        return {
            processedMemories: memories.length,
            strengthened,
            weakened,
            merged,
            flaggedContradictions,
            duration: Date.now() - startTime
        };
    } catch (error) {
        console.error('[MemoryConsolidation] Failed:', error);
        return {
            processedMemories: 0,
            strengthened,
            weakened,
            merged,
            flaggedContradictions,
            duration: Date.now() - startTime
        };
    }
}

/**
 * Create memory clusters for a persona
 */
export async function createMemoryClusters(personaId: string): Promise<MemoryCluster[]> {
    const memories = await prisma.memoryEntry.findMany({
        where: { personaId },
        orderBy: { importanceScore: 'desc' }
    });

    const clusters: MemoryCluster[] = [];
    const clustered = new Set<string>();

    for (const mem of memories) {
        if (clustered.has(mem.id)) continue;

        const cluster: MemoryCluster = {
            id: `cluster_${mem.id.substring(0, 8)}`,
            topic: mem.topic || 'general',
            memories: [mem.id],
            coreMemory: mem.id,
            coherenceScore: 1.0
        };

        // Find related memories
        for (const other of memories) {
            if (other.id === mem.id || clustered.has(other.id)) continue;

            const similarity = calculateSimilarity(mem.content, other.content);
            if (similarity > 0.4) {
                cluster.memories.push(other.id);
                cluster.coherenceScore = Math.min(cluster.coherenceScore, similarity);
                clustered.add(other.id);

                // Check for contradictions
                if (detectContradiction(mem.content, other.content)) {
                    if (!cluster.contradictionIds) cluster.contradictionIds = [];
                    cluster.contradictionIds.push(other.id);
                }
            }
        }

        clustered.add(mem.id);
        clusters.push(cluster);
    }

    return clusters;
}

/**
 * Get consolidation stats for a persona
 */
export async function getConsolidationStats(personaId: string): Promise<{
    totalMemories: number;
    activeMemories: number;
    suppressedMemories: number;
    averageImportance: number;
    contradictionPairs: number;
    lastConsolidation?: Date;
}> {
    const memories = await prisma.memoryEntry.findMany({
        where: { personaId },
        select: {
            id: true,
            importanceScore: true,
            embedding: true
        }
    });

    let suppressedCount = 0;
    let contradictionPairs = 0;
    let lastConsolidation: Date | undefined;

    for (const mem of memories) {
        const embedding = parseEmbedding(mem.embedding);
        if (embedding.state === 'SUPPRESSED') suppressedCount++;
        if (embedding.contradicts) contradictionPairs++;
        if (embedding.lastConsolidation) {
            const date = new Date(embedding.lastConsolidation);
            if (!lastConsolidation || date > lastConsolidation) {
                lastConsolidation = date;
            }
        }
    }

    const avgImportance = memories.length > 0
        ? memories.reduce((sum, m) => sum + m.importanceScore, 0) / memories.length
        : 0;

    return {
        totalMemories: memories.length,
        activeMemories: memories.length - suppressedCount,
        suppressedMemories: suppressedCount,
        averageImportance: avgImportance,
        contradictionPairs: Math.floor(contradictionPairs / 2),  // Counted twice
        lastConsolidation
    };
}

// ==================== HELPERS ====================

interface EmbeddingData {
    accessCount?: number;
    state?: string;
    consolidated?: boolean;
    strengthened?: boolean;
    lastConsolidation?: string;
    contradicts?: string;
    contradictionDetectedAt?: string;
    mergedInto?: string;
    suppressedAt?: string;
}

function parseEmbedding(embedding: string | null): EmbeddingData {
    if (!embedding) return {};
    try {
        return JSON.parse(embedding);
    } catch {
        return {};
    }
}

// ==================== EXPORTS ====================

export const memoryConsolidation = {
    runConsolidation,
    createMemoryClusters,
    getConsolidationStats,
    calculateSimilarity,
    detectContradiction
};
