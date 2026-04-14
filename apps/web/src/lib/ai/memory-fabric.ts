/**
 * MNEMOS – Dijital Kişilik Motoru
 * Memory Fabric V2 - 3 Katmanlı İnsan Hafızası
 * 
 * Bu sıradan "vector search" değil.
 * 
 * Hafıza 3 katmanlıdır:
 * 1. Episodic - "Şu gün bunu yaşadım"
 * 2. Emotional - "Bu beni utandırmıştı"
 * 3. Identity - "Ben böyle şeylerden hoşlanmam"
 * 
 * RecallScore =
 *   Similarity
 * × EmotionalWeight
 * × IdentityRelevance
 * × (1 - Habituation)
 * 
 * Önemli kurallar:
 * - Aynı şeyi 50 kere anlatırsan önemi düşer
 * - Travma asla unutulmaz
 * - Kimlikle çelişen anılar daha çok hatırlanır
 */

import prisma from '../db';
import { habituationTracker } from './habituation-tracker';
import { valueGraph } from './value-graph';

// ==================== TYPES ====================

export type MemoryLayer = 'episodic' | 'emotional' | 'identity';

export interface EnhancedMemory {
    id: string;
    layer: MemoryLayer;
    content: string;
    timestamp: Date;

    // Core scores
    emotionalWeight: number;
    identityRelevance: number;
    habituationLevel: number;

    // Computed recall score
    recallScore: number;

    // Layer-specific data
    episodicData?: EpisodicData;
    emotionalData?: EmotionalData;
    identityData?: IdentityData;
}

export interface EpisodicData {
    date: Date;
    people: string[];
    location?: string;
    narrative: string;
    timeContext: 'recent' | 'distant' | 'formative';
}

export interface EmotionalData {
    primaryEmotion: string;
    intensity: number;
    isTrauma: boolean;           // Asla unutulmaz
    triggers: string[];          // Tetikleyiciler
    physicalSensation?: string;  // "Midem bulandı"
}

export interface IdentityData {
    relatedValue: string;         // ValueGraph'teki node
    alignment: 'supports' | 'contradicts';
    formative: boolean;           // Kimlik oluşturucu mu?
    selfStatement?: string;       // "Ben böyle biriyim"
}

export interface RecallContext {
    query: string;
    emotion?: string;
    topic?: string;
    valueConflict?: boolean;
}

export interface RecallResult {
    memories: EnhancedMemory[];
    topEmotionalMemory?: EnhancedMemory;
    contradictingMemory?: EnhancedMemory;  // Kimlikle çelişen
    habituationWarning?: string;
}

// ==================== LAYER DETECTION ====================

/**
 * Detect which memory layer content belongs to
 */
function detectMemoryLayer(
    content: string,
    emotion: string | null,
    topic: string | null
): MemoryLayer {
    const text = content.toLowerCase();

    // Identity markers
    const identityMarkers = [
        'ben genelde', 'benim için', 'her zaman', 'asla', 'kesinlikle',
        'hayatım boyunca', 'değerim', 'prensibim', 'inanıyorum',
        'ben böyle', 'benim tarzım', 'bana göre'
    ];

    if (identityMarkers.some(m => text.includes(m))) {
        return 'identity';
    }

    // Emotional markers
    const traumaMarkers = ['travma', 'asla unutamam', 'çok kötüydü', 'en kötü', 'yıkıldım'];
    const strongEmotions = ['utandım', 'çok korktum', 'aşık oldum', 'çok mutluydum', 'öfkelendim'];

    if (traumaMarkers.some(m => text.includes(m))) {
        return 'emotional';
    }

    if (strongEmotions.some(m => text.includes(m)) ||
        (emotion && ['fear', 'trauma', 'shame', 'love'].includes(emotion))) {
        return 'emotional';
    }

    // Default: episodic
    return 'episodic';
}

/**
 * Extract episodic data from content
 */
function extractEpisodicData(content: string, createdAt: Date): EpisodicData {
    // Extract people names (simple heuristic)
    const people: string[] = [];
    const namePattern = /([A-ZĞÜŞİÖÇ][a-zğüşıöç]+ ?)(?:ile|ve|['']?[nıiuü]n)/g;
    let match;
    while ((match = namePattern.exec(content)) !== null) {
        people.push(match[1].trim());
    }

    // Determine time context
    const now = new Date();
    const daysDiff = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
    let timeContext: EpisodicData['timeContext'];

    if (daysDiff < 7) timeContext = 'recent';
    else if (daysDiff > 365) timeContext = 'formative';
    else timeContext = 'distant';

    return {
        date: createdAt,
        people,
        narrative: content.slice(0, 200),
        timeContext
    };
}

/**
 * Extract emotional data from content
 */
function extractEmotionalData(content: string, emotion: string | null): EmotionalData {
    const text = content.toLowerCase();

    // Trauma detection
    const traumaMarkers = ['travma', 'asla unutamam', 'en kötü anım', 'yıkıldım', 'kabus'];
    const isTrauma = traumaMarkers.some(m => text.includes(m));

    // Extract triggers
    const triggers: string[] = [];
    const triggerPatterns = [
        /(?:her|ne zaman|görünce|duyunca) ([^,.]+)/g,
        /([^,.]+) (?:görünce|duyunca|olunca)/g
    ];

    triggerPatterns.forEach(pattern => {
        let match;
        while ((match = pattern.exec(text)) !== null) {
            if (match[1].length < 50) triggers.push(match[1].trim());
        }
    });

    // Intensity based on emotion and markers
    let intensity = 0.5;
    const intensityMarkers = ['çok', 'aşırı', 'inanılmaz', 'delice', 'son derece'];
    if (intensityMarkers.some(m => text.includes(m))) intensity = 0.8;
    if (isTrauma) intensity = 1.0;

    return {
        primaryEmotion: emotion || 'mixed',
        intensity,
        isTrauma,
        triggers: triggers.slice(0, 5)
    };
}

/**
 * Extract identity data from content
 */
async function extractIdentityData(
    personaId: string,
    content: string,
    topic: string | null
): Promise<IdentityData> {
    const text = content.toLowerCase();

    // Check against value graph
    const triggeredValues = valueGraph.detectTriggeredValues(content);
    let relatedValue = 'general';
    let alignment: IdentityData['alignment'] = 'supports';

    if (triggeredValues.size > 0) {
        const [topValue] = Array.from(triggeredValues.entries())
            .sort((a, b) => b[1] - a[1])[0];
        relatedValue = topValue;
    }

    // Contradiction detection
    const contradictionMarkers = ['normalde yapmam', 'beni şaşırttı', 'beklemezdim', 'hiç düşünmezdim'];
    if (contradictionMarkers.some(m => text.includes(m))) {
        alignment = 'contradicts';
    }

    // Formative detection
    const formativeMarkers = ['hayatımı değiştirdi', 'o günden beri', 'beni ben yapan', 'dönüm noktası'];
    const formative = formativeMarkers.some(m => text.includes(m));

    // Extract self-statement if present
    let selfStatement: string | undefined;
    const selfPatterns = [
        /ben ([^,.]{10,50})/,
        /benim için ([^,.]{10,50})/
    ];
    for (const pattern of selfPatterns) {
        const match = text.match(pattern);
        if (match) {
            selfStatement = match[1];
            break;
        }
    }

    return {
        relatedValue,
        alignment,
        formative,
        selfStatement
    };
}

// ==================== RECALL ALGORITHM ====================

/**
 * Calculate enhanced recall score
 * RecallScore = Similarity × EmotionalWeight × IdentityRelevance × (1 - Habituation)
 */
async function calculateRecallScore(
    personaId: string,
    memory: {
        content: string;
        emotionalWeight: number;
        layer: MemoryLayer;
        isTrauma?: boolean;
        contradictsIdentity?: boolean;
    },
    query: string
): Promise<{
    recallScore: number;
    habituationLevel: number;
    identityRelevance: number;
}> {
    // 1. Similarity (simple keyword overlap for now)
    const queryWords = new Set(query.toLowerCase().split(/\s+/).filter(w => w.length > 3));
    const memoryWords = new Set(memory.content.toLowerCase().split(/\s+/).filter(w => w.length > 3));

    let similarity = 0;
    queryWords.forEach(w => {
        if (memoryWords.has(w)) similarity += 0.2;
    });
    similarity = Math.min(1, similarity);

    // 2. Emotional Weight (already provided)
    const emotionalWeight = memory.emotionalWeight;

    // 3. Identity Relevance
    let identityRelevance = 0.5; // Base
    if (memory.layer === 'identity') identityRelevance = 1.0;
    if (memory.contradictsIdentity) identityRelevance = 0.9; // Contradictions are memorable

    // 4. Habituation (from tracker)
    const habituationResult = await habituationTracker.calculateHabituation(
        personaId,
        memory.content
    );
    const habituationFactor = 1 - habituationResult.habituationLevel;

    // EXCEPTION: Trauma never habituates
    const effectiveHabituationFactor = memory.isTrauma ? 1.0 : habituationFactor;

    // Final score
    const recallScore =
        similarity *
        emotionalWeight *
        identityRelevance *
        effectiveHabituationFactor;

    return {
        recallScore,
        habituationLevel: habituationResult.habituationLevel,
        identityRelevance
    };
}

// ==================== MAIN FUNCTIONS ====================

/**
 * Enhanced memory recall with 3-layer system
 */
export async function recallMemories(
    personaId: string,
    context: RecallContext
): Promise<RecallResult> {
    try {
        // Fetch recent memories
        const dbMemories = await prisma.memoryEntry.findMany({
            where: { personaId },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        const enhancedMemories: EnhancedMemory[] = [];

        for (const mem of dbMemories) {
            const layer = detectMemoryLayer(mem.content, mem.emotion, mem.topic);

            // Extract layer-specific data
            let episodicData: EpisodicData | undefined;
            let emotionalData: EmotionalData | undefined;
            let identityData: IdentityData | undefined;

            switch (layer) {
                case 'episodic':
                    episodicData = extractEpisodicData(mem.content, mem.createdAt);
                    break;
                case 'emotional':
                    emotionalData = extractEmotionalData(mem.content, mem.emotion);
                    break;
                case 'identity':
                    identityData = await extractIdentityData(personaId, mem.content, mem.topic);
                    break;
            }

            // Calculate recall score
            const { recallScore, habituationLevel, identityRelevance } =
                await calculateRecallScore(
                    personaId,
                    {
                        content: mem.content,
                        emotionalWeight: mem.importanceScore,
                        layer,
                        isTrauma: emotionalData?.isTrauma,
                        contradictsIdentity: identityData?.alignment === 'contradicts'
                    },
                    context.query
                );

            enhancedMemories.push({
                id: mem.id,
                layer,
                content: mem.content,
                timestamp: mem.createdAt,
                emotionalWeight: mem.importanceScore,
                identityRelevance,
                habituationLevel,
                recallScore,
                episodicData,
                emotionalData,
                identityData
            });
        }

        // Sort by recall score
        enhancedMemories.sort((a, b) => b.recallScore - a.recallScore);

        // Find special memories
        const topEmotionalMemory = enhancedMemories
            .filter(m => m.layer === 'emotional')
            .sort((a, b) => b.emotionalWeight - a.emotionalWeight)[0];

        const contradictingMemory = enhancedMemories
            .find(m => m.identityData?.alignment === 'contradicts');

        // Habituation warning
        const overDiscussed = await habituationTracker.getOverDiscussedTopics(personaId);
        const habituationWarning = overDiscussed.length > 0
            ? `Bu konular çok tekrar edilmiş: ${overDiscussed.join(', ')}`
            : undefined;

        return {
            memories: enhancedMemories.slice(0, 10),
            topEmotionalMemory,
            contradictingMemory,
            habituationWarning
        };
    } catch (error) {
        console.error('[MemoryFabric] Recall failed:', error);
        return { memories: [] };
    }
}

/**
 * Build context for LLM from recalled memories
 */
export async function buildMemoryFabricContext(
    personaId: string,
    query: string,
    emotion?: string
): Promise<string> {
    const result = await recallMemories(personaId, { query, emotion });

    const sections: string[] = [];

    // Identity memories first
    const identityMems = result.memories.filter(m => m.layer === 'identity');
    if (identityMems.length > 0) {
        sections.push('## KİMLİK HAFIZASI (Bu seni sen yapan şeyler)\n' +
            identityMems.slice(0, 3).map(m =>
                `- ${m.content}${m.identityData?.selfStatement ? ` → "${m.identityData.selfStatement}"` : ''}`
            ).join('\n'));
    }

    // Emotional memories
    const emotionalMems = result.memories.filter(m => m.layer === 'emotional');
    if (emotionalMems.length > 0) {
        sections.push('## DUYGUSAL HAFIZA (Bu anılar güçlü izler bıraktı)\n' +
            emotionalMems.slice(0, 3).map(m => {
                const trauma = m.emotionalData?.isTrauma ? '⚠️ ' : '';
                return `- ${trauma}${m.content} [${m.emotionalData?.primaryEmotion || 'mixed'}]`;
            }).join('\n'));
    }

    // Recent episodic
    const episodicMems = result.memories.filter(m => m.layer === 'episodic');
    if (episodicMems.length > 0) {
        sections.push('## EPİZODİK HAFIZA (Yaşananlar)\n' +
            episodicMems.slice(0, 5).map(m => {
                const timeLabel = m.episodicData?.timeContext === 'recent' ? '(yakın)' :
                    m.episodicData?.timeContext === 'formative' ? '(oluşturucu)' : '';
                return `- ${m.content} ${timeLabel}`;
            }).join('\n'));
    }

    // Warnings
    if (result.habituationWarning) {
        sections.push(`\n📌 Not: ${result.habituationWarning}`);
    }

    if (result.contradictingMemory) {
        sections.push(`\n⚡ Çelişki: "${result.contradictingMemory.content}" - normalde böyle düşünmezsin`);
    }

    return sections.join('\n\n');
}

/**
 * Store a memory with automatic layer detection
 */
export async function storeEnhancedMemory(
    personaId: string,
    content: string,
    metadata: {
        emotion?: string;
        topic?: string;
        emotionalWeight?: number;
        people?: string[];
        location?: string;
    }
): Promise<EnhancedMemory> {
    const layer = detectMemoryLayer(content, metadata.emotion || null, metadata.topic || null);

    const memory = await prisma.memoryEntry.create({
        data: {
            personaId,
            type: layer.toUpperCase() as 'EPISODIC' | 'IDENTITY',
            content,
            importanceScore: metadata.emotionalWeight || 0.5,
            topic: metadata.topic || 'general',
            emotion: metadata.emotion,
            people: metadata.people ? JSON.stringify(metadata.people) : undefined,
            location: metadata.location
        }
    });

    // Calculate initial recall score
    const { recallScore, habituationLevel, identityRelevance } =
        await calculateRecallScore(
            personaId,
            {
                content,
                emotionalWeight: metadata.emotionalWeight || 0.5,
                layer
            },
            content
        );

    return {
        id: memory.id,
        layer,
        content,
        timestamp: memory.createdAt,
        emotionalWeight: memory.importanceScore,
        identityRelevance,
        habituationLevel,
        recallScore
    };
}

// ==================== EXPORTS ====================

export const memoryFabric = {
    recallMemories,
    buildMemoryFabricContext,
    storeEnhancedMemory,
    detectMemoryLayer
};
