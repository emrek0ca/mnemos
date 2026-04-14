/**
 * MNEMOS – Memory Optimization Service
 * 
 * Handles:
 * - Memory decay (importance decreases over time)
 * - Consolidation (merge similar memories)
 * - Cleanup (remove old, low-importance memories)
 * - Access tracking updates
 */

import prisma from '@/lib/db';
import { Groq } from 'groq-sdk';

const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY
});

// Constants
const DECAY_RATE = 0.95;  // 5% decay per day
const CONSOLIDATION_THRESHOLD = 0.8;  // 80% similarity to merge
const ARCHIVE_AGE_DAYS = 30;
const DELETE_AGE_DAYS = 90;
const DAILY_MONOLOGUE_LIMIT = 20;

export interface OptimizationResult {
    decayed: number;
    consolidated: number;
    archived: number;
    deleted: number;
}

/**
 * Apply memory decay based on time since last access
 */
export async function applyMemoryDecay(personaId: string): Promise<number> {
    const now = new Date();

    // Get all memories that haven't been accessed recently
    const memories = await prisma.memoryEntry.findMany({
        where: { personaId },
        select: {
            id: true,
            importanceScore: true,
            lastAccessed: true,
            createdAt: true
        }
    });

    let decayedCount = 0;

    for (const memory of memories) {
        const lastAccess = memory.lastAccessed || memory.createdAt;
        const daysSinceAccess = Math.floor(
            (now.getTime() - new Date(lastAccess).getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysSinceAccess > 0) {
            // Apply exponential decay
            const decayFactor = Math.pow(DECAY_RATE, daysSinceAccess);
            const newImportance = Math.max(0.05, memory.importanceScore * decayFactor);

            if (newImportance !== memory.importanceScore) {
                await prisma.memoryEntry.update({
                    where: { id: memory.id },
                    data: { importanceScore: newImportance }
                });
                decayedCount++;
            }
        }
    }

    return decayedCount;
}

/**
 * Consolidate similar internal monologues from the same day
 */
export async function consolidateMonologues(personaId: string): Promise<number> {
    // Get internal monologues grouped by date
    const monologues = await prisma.memoryEntry.findMany({
        where: {
            personaId,
            type: 'INTERNAL_MONOLOGUE'
        },
        orderBy: { createdAt: 'asc' }
    });

    if (monologues.length < 10) return 0;

    // Group by date
    const byDate = new Map<string, typeof monologues>();
    for (const m of monologues) {
        const dateKey = new Date(m.createdAt).toISOString().split('T')[0];
        if (!byDate.has(dateKey)) byDate.set(dateKey, []);
        byDate.get(dateKey)!.push(m);
    }

    let consolidatedCount = 0;

    for (const [date, dayMonologues] of byDate) {
        // Keep only if more than 5 monologues that day
        if (dayMonologues.length <= 5) continue;

        // Use LLM to summarize
        const contents = dayMonologues.map(m => m.content).join('\n- ');

        try {
            const completion = await groq.chat.completions.create({
                messages: [{
                    role: 'system',
                    content: `Summarize these internal thoughts from ${date} into a single, concise reflection (1-2 sentences in Turkish):
                    
${contents}

Return ONLY the summary, nothing else.`
                }],
                model: 'llama-3.1-8b-instant', // Cost effective
                temperature: 0.3,
                max_tokens: 150
            });

            const summary = completion.choices[0].message.content?.trim();

            if (summary) {
                // Calculate average importance
                const avgImportance = dayMonologues.reduce((sum, m) => sum + m.importanceScore, 0) / dayMonologues.length;

                // Create consolidated memory
                await prisma.memoryEntry.create({
                    data: {
                        personaId,
                        type: 'CONSOLIDATED',
                        content: `[${date}] ${summary}`,
                        importanceScore: Math.min(1, avgImportance * 1.2), // Slight boost
                    }
                });

                // Delete original monologues (keep the last 3)
                const toDelete = dayMonologues.slice(0, -3);
                await prisma.memoryEntry.deleteMany({
                    where: {
                        id: { in: toDelete.map(m => m.id) }
                    }
                });

                consolidatedCount += toDelete.length;
            }
        } catch (error) {
            console.error(`Consolidation failed for ${date}:`, error);
        }
    }

    return consolidatedCount;
}

/**
 * Clean up old, low-importance memories
 */
export async function cleanupMemories(personaId: string): Promise<{ archived: number; deleted: number }> {
    const now = new Date();
    const archiveThreshold = new Date(now.getTime() - ARCHIVE_AGE_DAYS * 24 * 60 * 60 * 1000);
    const deleteThreshold = new Date(now.getTime() - DELETE_AGE_DAYS * 24 * 60 * 60 * 1000);

    // Archive: old + low importance (mark as archived by setting very low importance)
    const archived = await prisma.memoryEntry.updateMany({
        where: {
            personaId,
            createdAt: { lt: archiveThreshold },
            importanceScore: { lt: 0.2 },
            type: { not: 'IDENTITY' } // Never archive identity memories
        },
        data: {
            importanceScore: 0.01 // Effectively archived
        }
    });

    // Delete: very old + very low importance
    const deleted = await prisma.memoryEntry.deleteMany({
        where: {
            personaId,
            createdAt: { lt: deleteThreshold },
            importanceScore: { lt: 0.1 },
            type: { notIn: ['IDENTITY', 'CONSOLIDATED'] } // Never delete identity or consolidated
        }
    });

    return {
        archived: archived.count,
        deleted: deleted.count
    };
}

/**
 * Check if we've exceeded daily monologue limit
 */
export async function canAddMonologue(personaId: string): Promise<boolean> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const count = await prisma.memoryEntry.count({
        where: {
            personaId,
            type: 'INTERNAL_MONOLOGUE',
            createdAt: { gte: today }
        }
    });

    return count < DAILY_MONOLOGUE_LIMIT;
}

/**
 * Update access count and recalculate importance
 */
export async function trackMemoryAccess(memoryIds: string[]): Promise<void> {
    for (const id of memoryIds) {
        await prisma.memoryEntry.update({
            where: { id },
            data: {
                accessCount: { increment: 1 },
                lastAccessed: new Date(),
                // Boost importance slightly on access (max 1.0)
                importanceScore: {
                    increment: 0.02
                }
            }
        });

        // Ensure importance doesn't exceed 1.0
        await prisma.memoryEntry.updateMany({
            where: { id, importanceScore: { gt: 1.0 } },
            data: { importanceScore: 1.0 }
        });
    }
}

/**
 * Run full optimization cycle
 */
export async function runFullOptimization(personaId: string): Promise<OptimizationResult> {
    console.log(`[MemoryOptimizer] Starting optimization for persona: ${personaId}`);

    const decayed = await applyMemoryDecay(personaId);
    console.log(`[MemoryOptimizer] Decayed ${decayed} memories`);

    const consolidated = await consolidateMonologues(personaId);
    console.log(`[MemoryOptimizer] Consolidated ${consolidated} monologues`);

    const { archived, deleted } = await cleanupMemories(personaId);
    console.log(`[MemoryOptimizer] Archived ${archived}, Deleted ${deleted}`);

    return { decayed, consolidated, archived, deleted };
}

export const memoryOptimizer = {
    applyMemoryDecay,
    consolidateMonologues,
    cleanupMemories,
    canAddMonologue,
    trackMemoryAccess,
    runFullOptimization
};
