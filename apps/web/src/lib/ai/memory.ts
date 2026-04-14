/**
 * MNEMOS – Cognitive Preservation System
 * Psychodynamic Memory Manager
 * 
 * Core Principles:
 * - Nothing is truly deleted, only suppressed
 * - Working memory fades but remains accessible
 * - Episodic memories can be recalled with triggers
 * - Identity memory is immutable, only reinterpreted
 * - Every thought is timestamped for temporal continuity
 */

import prisma from '../db';

// Memory types following psychodynamic model (strings for SQLite compatibility)
export type MemoryType = 'WORKING' | 'EPISODIC' | 'IDENTITY';
export type MemoryState = 'ACTIVE' | 'FADED' | 'SUPPRESSED' | 'RECALLED';

export interface Memory {
    id: string;
    type: MemoryType;
    content: string;
    emotionalWeight: number;
    salience: number;
    state: MemoryState;
    timestamp: Date;
    lastAccessed: Date;
    accessCount: number;
    suppressedAt?: Date;
    recalledAt?: Date;
    triggers?: string[];
    labels?: {
        topic?: string;
        emotion?: string;
    };
}

interface MemoryMetadata {
    emotionalWeight?: number;
    salience?: number;
    state?: MemoryState;
    accessCount?: number;
    lastAccessed?: string;
    suppressedAt?: string;
    recalledAt?: string;
    triggers?: string[];
    // New metadata fields for createMemory type safety
    topic?: string;
    emotion?: string;
    people?: string[];
    location?: string;
}

export async function createMemory(
    content: string,
    type: MemoryType,
    emotionalWeight: number = 0.5,
    metadataOverrides: Partial<MemoryMetadata> = {}
): Promise<Memory> {
    const triggers = extractTriggers(content);

    // Auto-detect topic if not provided (simple heuristic for now)
    // specific topic extraction would happen in perception layer usually

    // Store metadata in JSON as backup/extension but use columns for core logic
    const embeddingData = {
        salience: 1.0,
        state: 'ACTIVE',
        accessCount: 0,
        triggers,
        ...metadataOverrides
    };

    const memory = await prisma.memoryEntry.create({
        data: {
            personaId: await getActivePersonaId(),
            type: type,
            content,
            embedding: JSON.stringify(embeddingData), // Keeping backward compatibility
            importanceScore: emotionalWeight,

            // New Structured Fields
            topic: metadataOverrides.topic || 'general',
            emotion: metadataOverrides.emotion || 'neutral',
            people: metadataOverrides.people ? JSON.stringify(metadataOverrides.people) : undefined,
            location: metadataOverrides.location
        }
    });

    return parseMemory(memory);
}

/**
 * Suppress a memory - hidden but not deleted
 */
export async function suppressMemory(memoryId: string): Promise<void> {
    const memory = await prisma.memoryEntry.findUnique({
        where: { id: memoryId }
    });

    if (!memory) return;

    const metadata = parseMetadata(memory.embedding);
    metadata.state = 'SUPPRESSED';
    metadata.suppressedAt = new Date().toISOString();
    metadata.salience = 0.1;

    await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: { embedding: JSON.stringify(metadata) }
    });
}

/**
 * Calculate decay factor based on time and access patterns
 * Formula: decay = base_rate ^ (days_since_access / access_count_boost)
 */
function calculateDecayFactor(
    lastAccessTime: number,
    accessCount: number,
    emotionalWeight: number
): number {
    const daysSinceAccess = (Date.now() - lastAccessTime) / (1000 * 60 * 60 * 24);

    // Base decay rate: 95% retention per day
    const baseRate = 0.95;

    // Access count slows decay (frequently accessed memories persist)
    const accessBoost = 1 + (accessCount * 0.1); // Each access adds 10% to retention

    // Emotional memories decay slower
    const emotionalBoost = 1 + (emotionalWeight * 0.5); // High emotion = 50% slower decay

    // Calculate decay
    const effectiveDays = daysSinceAccess / (accessBoost * emotionalBoost);
    const decayFactor = Math.pow(baseRate, effectiveDays);

    return Math.max(0.05, decayFactor); // Minimum 5% salience
}

/**
 * Fade working memories over time with enhanced decay algorithm
 */
export async function fadeWorkingMemories(): Promise<number> {
    const workingMemories = await prisma.memoryEntry.findMany({
        where: {
            personaId: await getActivePersonaId(),
            type: 'WORKING'
        }
    });

    let fadedCount = 0;

    for (const memory of workingMemories) {
        const metadata = parseMetadata(memory.embedding);
        const currentSalience = metadata.salience ?? 1.0;

        if (metadata.state === 'ACTIVE' || metadata.state === 'FADED') {
            const lastAccessTime = metadata.lastAccessed
                ? new Date(metadata.lastAccessed).getTime()
                : memory.createdAt.getTime();

            const accessCount = metadata.accessCount ?? 0;
            const emotionalWeight = metadata.emotionalWeight ?? 0.5;

            // Calculate new salience using decay algorithm
            const decayFactor = calculateDecayFactor(lastAccessTime, accessCount, emotionalWeight);
            metadata.salience = currentSalience * decayFactor;

            // State transitions based on salience
            if ((metadata.salience ?? 0) < 0.1) {
                // Very low salience after 90+ days → SUPPRESSED (never deleted!)
                const daysSinceAccess = (Date.now() - lastAccessTime) / (1000 * 60 * 60 * 24);
                if (daysSinceAccess > 90) {
                    metadata.state = 'SUPPRESSED';
                    metadata.suppressedAt = new Date().toISOString();
                }
            } else if ((metadata.salience ?? 0) < 0.3) {
                metadata.state = 'FADED';
            }

            await prisma.memoryEntry.update({
                where: { id: memory.id },
                data: { embedding: JSON.stringify(metadata) }
            });

            fadedCount++;
        }
    }

    return fadedCount;
}

/**
 * Fade ALL memory types (not just WORKING) - for maintenance
 */
export async function fadeAllMemories(): Promise<{ working: number; episodic: number }> {
    const workingFaded = await fadeWorkingMemories();

    // Episodic memories fade slower
    const episodicMemories = await prisma.memoryEntry.findMany({
        where: {
            personaId: await getActivePersonaId(),
            type: 'EPISODIC'
        }
    });

    let episodicFaded = 0;

    for (const memory of episodicMemories) {
        const metadata = parseMetadata(memory.embedding);
        const currentSalience = metadata.salience ?? 1.0;

        if (metadata.state === 'ACTIVE' && currentSalience > 0.3) {
            const lastAccessTime = metadata.lastAccessed
                ? new Date(metadata.lastAccessed).getTime()
                : memory.createdAt.getTime();

            // Episodic memories decay 3x slower than working
            const accessCount = (metadata.accessCount ?? 0) * 3;
            const emotionalWeight = (metadata.emotionalWeight ?? 0.5) * 1.5;

            const decayFactor = calculateDecayFactor(lastAccessTime, accessCount, emotionalWeight);
            metadata.salience = currentSalience * decayFactor;

            if ((metadata.salience ?? 0) < 0.3) {
                metadata.state = 'FADED';
                episodicFaded++;
            }

            await prisma.memoryEntry.update({
                where: { id: memory.id },
                data: { embedding: JSON.stringify(metadata) }
            });
        }
    }

    return { working: workingFaded, episodic: episodicFaded };
}

/**
 * Recall suppressed memories with trigger
 */
export async function recallWithTrigger(trigger: string): Promise<Memory[]> {
    const allMemories = await prisma.memoryEntry.findMany({
        where: { personaId: await getActivePersonaId() }
    });

    const recalled: Memory[] = [];
    const triggerLower = trigger.toLowerCase();

    for (const memory of allMemories) {
        const metadata = parseMetadata(memory.embedding);
        const triggers = metadata.triggers || [];
        const contentMatch = memory.content.toLowerCase().includes(triggerLower);
        const triggerMatch = triggers.some(t => triggerLower.includes(t.toLowerCase()));

        if ((contentMatch || triggerMatch) &&
            (metadata.state === 'SUPPRESSED' || metadata.state === 'FADED')) {
            metadata.state = 'RECALLED';
            metadata.recalledAt = new Date().toISOString();
            metadata.salience = Math.min(1.0, (metadata.salience ?? 0) + 0.5);
            metadata.accessCount = (metadata.accessCount ?? 0) + 1;
            metadata.lastAccessed = new Date().toISOString();

            await prisma.memoryEntry.update({
                where: { id: memory.id },
                data: { embedding: JSON.stringify(metadata) }
            });

            recalled.push(parseMemory({ ...memory, embedding: JSON.stringify(metadata) }));
        }
    }

    return recalled;
}

/**
 * Access a memory - increases salience
 */
export async function accessMemory(memoryId: string): Promise<Memory | null> {
    const memory = await prisma.memoryEntry.findUnique({
        where: { id: memoryId }
    });

    if (!memory) return null;

    const metadata = parseMetadata(memory.embedding);
    metadata.accessCount = (metadata.accessCount ?? 0) + 1;
    metadata.lastAccessed = new Date().toISOString();
    metadata.salience = Math.min(1.0, (metadata.salience ?? 0) + 0.1);

    if (metadata.state === 'FADED' || metadata.state === 'SUPPRESSED') {
        metadata.state = 'RECALLED';
        metadata.recalledAt = new Date().toISOString();
    }

    await prisma.memoryEntry.update({
        where: { id: memoryId },
        data: { embedding: JSON.stringify(metadata) }
    });

    return parseMemory({ ...memory, embedding: JSON.stringify(metadata) });
}

/**
 * Get accessible memories for context
 */
export async function getAccessibleMemories(
    type?: MemoryType,
    minSalience: number = 0.3
): Promise<Memory[]> {
    const personaId = await getActivePersonaId();

    const memories = await prisma.memoryEntry.findMany({
        where: type
            ? { personaId, type }
            : { personaId },
        orderBy: [
            { importanceScore: 'desc' },
            { createdAt: 'desc' }
        ]
    });

    return memories
        .map((m: { id: string; type: string; content: string; embedding: string | null; importanceScore: number; createdAt: Date }) => parseMemory(m))
        .filter((m: Memory) => m.salience >= minSalience && m.state !== 'SUPPRESSED')
        .sort((a: Memory, b: Memory) => (b.salience * b.emotionalWeight) - (a.salience * a.emotionalWeight));
}

/**
 * Build memory context for cognitive processing
 */
import { buildRecallContext } from './memory-recall';

/**
 * Build memory context for cognitive processing
 * Combines Psychodynamic (Salience/Time) + Associative (Vector/Emotion)
 */
export async function buildMemoryContext(
    query?: string,
    queryEmotion?: string,
    emotionIntensity?: number
): Promise<string> {
    const sections: string[] = [];

    // 1. Psychodynamic Context (Salience & Identity)
    const identityMemories = await getAccessibleMemories('IDENTITY', 0.1);
    const workingMemories = await getAccessibleMemories('WORKING', 0.5);

    if (identityMemories.length > 0) {
        sections.push('## EVRİMSEL KİMLİK ÇEKİRDEĞİ (BUNLAR SENİN TEMEL TAŞLARIN)\n' +
            identityMemories.map(m => `- ${m.content}`).join('\n'));
    }

    if (workingMemories.length > 0) {
        sections.push('## ANLIK BAĞLAM\n' +
            workingMemories.slice(0, 5).map(m => `- ${m.content}`).join('\n'));
    }

    // 2. Associative Context (Vector Search & Multi-hop)
    // Only if we have a query
    if (query) {
        const personaId = await getActivePersonaId();
        const associativeContext = await buildRecallContext(
            personaId,
            query,
            queryEmotion,
            emotionIntensity // Dynamic Context Window size
        );
        if (associativeContext) {
            sections.push(associativeContext);
        }
    } else {
        // Fallback to recent episodic if no query (e.g. initial greeting)
        const episodicMemories = await getAccessibleMemories('EPISODIC', 0.3);
        if (episodicMemories.length > 0) {
            sections.push('## Son Anılar\n' +
                episodicMemories.slice(0, 5).map(m =>
                    `- [${formatDate(m.timestamp)}] ${m.content}`
                ).join('\n'));
        }
    }

    return sections.join('\n\n');
}

/**
 * Store interaction as memory
 */
export async function storeInteractionMemory(
    userMessage: string,
    response: string,
    emotionalWeight: number
): Promise<Memory | null> {
    if (emotionalWeight < 0.3) {
        return createMemory(
            `Konuşma: "${userMessage.substring(0, 100)}..."`,
            'WORKING',
            emotionalWeight,
            { topic: 'casual_chat' }
        );
    }

    const summary = `Konuşma: "${userMessage.substring(0, 100)}..." → "${response.substring(0, 100)}..."`;
    return createMemory(summary, 'EPISODIC', emotionalWeight, { topic: 'conversation' });
}

// ============ Helpers ============

async function getActivePersonaId(): Promise<string> {
    const persona = await prisma.persona.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        throw new Error('No persona found');
    }

    return persona.id;
}

function parseMetadata(embedding: string | null): MemoryMetadata {
    if (!embedding) return {};
    try {
        return JSON.parse(embedding) as MemoryMetadata;
    } catch {
        return {};
    }
}

function parseMemory(dbMemory: {
    id: string;
    type: string;
    content: string;
    embedding: string | null;
    importanceScore: number;
    createdAt: Date;
    // New optional fields from DB
    topic?: string | null;
    emotion?: string | null;
}): Memory {
    const metadata = parseMetadata(dbMemory.embedding);

    return {
        id: dbMemory.id,
        type: dbMemory.type as MemoryType,
        content: dbMemory.content,
        emotionalWeight: dbMemory.importanceScore,
        salience: metadata.salience ?? 1.0,
        state: metadata.state ?? 'ACTIVE',
        timestamp: dbMemory.createdAt,
        lastAccessed: metadata.lastAccessed ? new Date(metadata.lastAccessed) : dbMemory.createdAt,
        accessCount: metadata.accessCount ?? 0,
        suppressedAt: metadata.suppressedAt ? new Date(metadata.suppressedAt) : undefined,
        recalledAt: metadata.recalledAt ? new Date(metadata.recalledAt) : undefined,
        triggers: metadata.triggers ?? [],
        // Hydrate from columns if available -> fallback to metadata
        labels: {
            // @ts-ignore
            topic: dbMemory.topic || undefined,
            // @ts-ignore
            emotion: dbMemory.emotion || undefined
        }
    };
}

function extractTriggers(content: string): string[] {
    const words = content.toLowerCase().split(/\s+/);
    const stopwords = new Set(['bir', 've', 'ile', 'için', 'bu', 'şu', 'o', 'da', 'de', 'ki', 'the', 'a', 'an', 'is', 'are', 'be']);

    return words
        .filter(w => w.length > 4 && !stopwords.has(w))
        .slice(0, 5);
}

function formatDate(date: Date): string {
    return date.toLocaleDateString('tr-TR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// Alias export
export { buildMemoryContext as buildPsychodynamicContext };
