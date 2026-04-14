/**
 * MNEMOS – Cognitive Preservation System
 * Layer 3: Memory Recall Engine (Enhanced)
 * 
 * Memory recall using:
 * - Semantic similarity (via embeddings)
 * - Emotional resonance
 * - Recency decay
 * - Importance weighting
 * - Identity alignment
 * 
 * Formula: recall_score = similarity (35%) + importance (20%) + recency (15%) + emotion (15%) + identity (15%)
 */


import { memoryOptimizer } from './memory-optimizer';
import { getIdentityCore } from './identity';
import prisma from '@/lib/db';


export interface MemoryEntry {
    id: string;
    content: string;
    type: string; // episodic, semantic, emotional, WORKING, EPISODIC, INTERNAL_MONOLOGUE etc.
    embedding?: number[] | string | null;
    metadata?: {
        emotion?: string;
        importance?: number;
        people?: string[];
        topic?: string;
        timestamp?: Date;
    } | string | null;
    importanceScore?: number;
    createdAt?: Date;
}

export interface RecallResult {
    memory: MemoryEntry;
    score: number;
    relevanceFactors: {
        similarity: number;
        importance: number;
        recency: number;
        emotionalResonance: number;
    };
}

/**
 * Generate embedding for text using Groq
 * Falls back to simple hash-based pseudo-embedding if API fails
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        // Use a simple approach: extract key features from text
        // In production, use an actual embedding model
        const features = extractFeatures(text);
        return features;
    } catch (error) {
        console.error('Embedding generation failed:', error);
        return simpleHash(text);
    }
}

/**
 * Extract semantic features from text
 * Simple feature extraction based on keywords and patterns
 */
function extractFeatures(text: string): number[] {
    const normalizedText = text.toLowerCase();
    const features: number[] = [];

    // Emotion features (10 dimensions)
    const emotionWords: Record<string, string[]> = {
        joy: ['mutlu', 'sevgi', 'harika', 'güzel', 'happy', 'love', 'great', 'wonderful'],
        sadness: ['üzgün', 'kötü', 'mutsuz', 'sad', 'unhappy', 'terrible', 'awful'],
        anger: ['kızgın', 'sinirli', 'öfke', 'angry', 'furious', 'rage'],
        fear: ['korku', 'endişe', 'kaygı', 'afraid', 'scared', 'worried', 'anxious'],
        surprise: ['şaşkın', 'inanamıyorum', 'surprised', 'shocked', 'unexpected'],
        trust: ['güven', 'inan', 'trust', 'believe', 'reliable'],
        anticipation: ['umut', 'beklemek', 'hope', 'expect', 'looking forward'],
        disgust: ['iğrenç', 'tiksinmek', 'disgusting', 'gross', 'horrible']
    };

    for (const words of Object.values(emotionWords)) {
        const score = words.reduce((acc, word) =>
            normalizedText.includes(word) ? acc + 0.2 : acc, 0);
        features.push(Math.min(1, score));
    }

    // Topic features (10 dimensions)
    const topicWords: Record<string, string[]> = {
        money: ['para', 'maaş', 'yatırım', 'borç', 'money', 'salary', 'invest', 'debt'],
        career: ['iş', 'kariyer', 'terfi', 'job', 'career', 'work', 'promotion'],
        relationships: ['aile', 'sevgili', 'arkadaş', 'family', 'friend', 'love', 'partner'],
        health: ['sağlık', 'hastalık', 'doktor', 'health', 'sick', 'doctor', 'hospital'],
        education: ['okul', 'eğitim', 'üniversite', 'school', 'education', 'study', 'learn'],
        travel: ['seyahat', 'gezi', 'tatil', 'travel', 'trip', 'vacation', 'journey'],
        technology: ['bilgisayar', 'telefon', 'yazılım', 'computer', 'software', 'tech', 'code'],
        food: ['yemek', 'aç', 'restoran', 'food', 'eat', 'restaurant', 'hungry'],
        hobby: ['hobi', 'spor', 'müzik', 'hobby', 'sport', 'music', 'art'],
        philosophy: ['anlam', 'hayat', 'düşünce', 'meaning', 'life', 'think', 'philosophy']
    };

    for (const words of Object.values(topicWords)) {
        const score = words.reduce((acc, word) =>
            normalizedText.includes(word) ? acc + 0.15 : acc, 0);
        features.push(Math.min(1, score));
    }

    // Linguistic features (5 dimensions)
    const wordCount = text.split(/\s+/).length;
    features.push(Math.min(1, wordCount / 50)); // Length
    features.push((text.match(/\?/g) || []).length / 5); // Questions
    features.push((text.match(/!/g) || []).length / 5); // Exclamations
    features.push(normalizedText.includes('ben') || normalizedText.includes('i ') ? 0.8 : 0.2); // First person
    features.push(normalizedText.includes('sen') || normalizedText.includes('you') ? 0.8 : 0.2); // Second person

    // Pad to 32 dimensions
    while (features.length < 32) {
        features.push(0);
    }

    return features.slice(0, 32);
}

/**
 * Simple hash-based fallback embedding
 */
function simpleHash(text: string): number[] {
    const hash: number[] = [];
    for (let i = 0; i < 32; i++) {
        let h = 0;
        for (let j = i; j < text.length; j += 32) {
            h = ((h << 5) - h + text.charCodeAt(j)) | 0;
        }
        hash.push((h % 1000) / 1000);
    }
    return hash;
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) return 0;

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
        dotProduct += a[i] * b[i];
        normA += a[i] * a[i];
        normB += b[i] * b[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Calculate recency score (exponential decay)
 */
export function recencyScore(timestamp: Date, halfLifeDays: number = 30): number {
    const now = Date.now();
    const then = timestamp.getTime();
    const daysAgo = (now - then) / (1000 * 60 * 60 * 24);

    // Exponential decay with half-life
    return Math.pow(0.5, daysAgo / halfLifeDays);
}

/**
 * Calculate emotional resonance between query and memory
 */
export function emotionalResonance(
    queryEmotion: string | undefined,
    memoryEmotion: string | undefined
): number {
    if (!queryEmotion || !memoryEmotion) return 0.5;

    // Same emotion = high resonance
    if (queryEmotion === memoryEmotion) return 1.0;

    // Emotion similarity groups
    const emotionGroups = [
        ['joy', 'happiness', 'excitement', 'mutlu', 'sevinç'],
        ['sadness', 'grief', 'melancholy', 'üzgün', 'hüzün'],
        ['anger', 'frustration', 'irritation', 'kızgın', 'sinirli'],
        ['fear', 'anxiety', 'worry', 'korku', 'endişe'],
        ['love', 'affection', 'warmth', 'sevgi', 'aşk']
    ];

    for (const group of emotionGroups) {
        const qInGroup = group.includes(queryEmotion.toLowerCase());
        const mInGroup = group.includes(memoryEmotion.toLowerCase());
        if (qInGroup && mInGroup) return 0.8;
    }

    return 0.3;
}

/**
 * Recall memories based on query
 */
export async function recallMemories(
    personaId: string,
    query: string,
    queryEmotion?: string,
    limit: number = 5
): Promise<RecallResult[]> {
    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query);

    // Get all memories for persona (in production this would use vector DB query)
    const memories = await prisma.memoryEntry.findMany({
        where: { personaId },
        orderBy: { createdAt: 'desc' },
        take: 200 // Increased from 100 for better coverage
    });

    // Get identity values for alignment scoring
    const identity = await getIdentityCore();
    const identityValues = identity?.values || [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const calculateScore = (mem: any, qEmbed: number[], qEmotion?: string) => {
        let memEmbed: number[];
        if (mem.embedding && typeof mem.embedding === 'string') {
            try { memEmbed = JSON.parse(mem.embedding); } catch { memEmbed = []; }
        } else if (Array.isArray(mem.embedding)) {
            memEmbed = mem.embedding;
        } else { memEmbed = []; }

        if (memEmbed.length === 0) return {
            score: 0,
            factors: { similarity: 0, importance: 0, recency: 0, emotionalResonance: 0, identityAlignment: 0 }
        };

        const similarity = cosineSimilarity(qEmbed, memEmbed);
        const importance = mem.importanceScore ?? 0.5;
        const recency = recencyScore(mem.createdAt || new Date());

        // Enhanced emotional resonance - extract emotion from memory metadata
        let memoryEmotion: string | undefined;
        if (mem.metadata && typeof mem.metadata === 'string') {
            try {
                const parsed = JSON.parse(mem.metadata);
                memoryEmotion = parsed.emotion;
            } catch { /* ignore */ }
        }
        const emotional = emotionalResonance(qEmotion, memoryEmotion);

        // NEW: Identity alignment - does memory content align with core values?
        let identityAlignment = 0.5; // neutral default
        if (identityValues.length > 0) {
            const memContentLower = mem.content.toLowerCase();
            for (const value of identityValues) {
                // Simple keyword matching - in production use embedding similarity
                if (memContentLower.includes(value.toLowerCase())) {
                    identityAlignment = Math.min(1.0, identityAlignment + 0.15);
                }
            }
        }

        // Enhanced formula: similarity (35%) + importance (20%) + recency (15%) + emotion (15%) + identity (15%)
        const score = (similarity * 0.35) + (importance * 0.20) + (recency * 0.15) + (emotional * 0.15) + (identityAlignment * 0.15);
        return {
            score,
            factors: { similarity, importance, recency, emotionalResonance: emotional, identityAlignment },
            memEmbed
        };
    };

    // First Hop: Direct Similarity
    const firstHopResults: RecallResult[] = [];
    for (const mem of memories) {
        const { score, factors } = calculateScore(mem, queryEmbedding, queryEmotion);
        if (score > 0.4) { // relevancy threshold
            firstHopResults.push({
                memory: {
                    id: mem.id,
                    content: mem.content,
                    type: mem.type.toLowerCase() as any,
                    embedding: [], // Don't return embedding to save bandwidth
                    metadata: { importance: mem.importanceScore, timestamp: mem.createdAt }
                },
                score,
                relevanceFactors: factors
            });
        }
    }

    // Sort and take top results
    let results = firstHopResults.sort((a, b) => b.score - a.score).slice(0, limit);

    // Second Hop: Associative Expansion (Multi-hop)
    // If we have high-confidence results, look for related concepts
    if (results.length > 0 && results[0].score > 0.6) {
        // Use top 1 or 2 results as "association seeds"
        const seeds = results.slice(0, 2);
        const secondHopResults: RecallResult[] = [];
        const seenIds = new Set(results.map(r => r.memory.id));

        for (const seed of seeds) {
            // Generate embedding for the seed memory to find related memories
            // Note: Ideally we store embeddings so we don't regenerate. Here we assume we might need to regenerate if not stored.
            // In our simple mock, we regenerate to simulate the "thought vector".
            const associationEmbedding = await generateEmbedding(seed.memory.content);

            for (const mem of memories) {
                // Skip if already in results or processed
                if (seenIds.has(mem.id)) continue;

                const { score, factors } = calculateScore(mem, associationEmbedding, queryEmotion);

                // For second hop, we value similarity to the *memory* (association) more
                // But we apply a small penalty because it's indirect
                const associationScore = score * 0.85;

                if (associationScore > 0.55) { // Slightly higher threshold for indirect
                    seenIds.add(mem.id); // Prevent adding same memory twice from different seeds
                    secondHopResults.push({
                        memory: {
                            id: mem.id,
                            content: mem.content,
                            type: mem.type.toLowerCase() as any,
                            embedding: [],
                            metadata: { importance: mem.importanceScore, timestamp: mem.createdAt }
                        },
                        score: associationScore,
                        relevanceFactors: { ...factors, similarity: factors.similarity * 0.9 } // Mark as indirect
                    });
                }
            }
        }

        // Merge, re-sort, and slice
        // We prioritize Direct Hits (Hop 1) over Associative (Hop 2) usually, 
        // Second hop results might be duplicates or lower score, merge carefully
        results = [...results, ...secondHopResults]
            .filter((memo, index, self) =>
                index === self.findIndex((m) => m.memory.id === memo.memory.id)
            )
            .sort((a, b) => b.score - a.score)
            .slice(0, limit);
    }

    // Track access for recalled memories (async, don't await)
    const recalledIds = results.map(r => r.memory.id);
    if (recalledIds.length > 0) {
        memoryOptimizer.trackMemoryAccess(recalledIds).catch(err =>
            console.error('Failed to track memory access:', err)
        );
    }

    return results;
}

/**
 * Store new memory with embedding
 */
export async function storeMemory(
    personaId: string,
    content: string,
    type: 'episodic' | 'semantic' | 'emotional',
    metadata: {
        emotion?: string;
        importance: number;
        people?: string[];
        topic?: string;
    }
): Promise<string> {
    const embedding = await generateEmbedding(content);

    const memory = await prisma.memoryEntry.create({
        data: {
            personaId,
            content,
            type: type.toUpperCase() as 'EPISODIC' | 'WORKING' | 'IDENTITY',
            embedding: JSON.stringify(embedding),
            importanceScore: metadata.importance
        }
    });

    return memory.id;
}

/**
 * Build memory context for cognitive processing
 */
export async function buildRecallContext(
    personaId: string,
    query: string,
    queryEmotion?: string,
    emotionIntensity: number = 0.5 // 0-1
): Promise<string> {
    // Dynamic Context Window
    // High emotional intensity (stress/fear) -> Narrow focus (fewer items)
    // Low intensity / Positive -> Broad focus (more associations)
    let limit = 5;
    if (queryEmotion === 'fear' || queryEmotion === 'anger') {
        limit = Math.max(3, Math.round(5 - (emotionIntensity * 2))); // 3-5 items
    } else if (queryEmotion === 'joy' || queryEmotion === 'curiosity') {
        limit = Math.min(8, Math.round(5 + (emotionIntensity * 3))); // 5-8 items
    }

    const recalls = await recallMemories(personaId, query, queryEmotion, limit);

    if (recalls.length === 0) {
        return '';
    }

    const sections: string[] = ['## İlgili Anılar'];

    for (const recall of recalls) {
        const factors = recall.relevanceFactors;
        // Infer direct vs associative: Direct usually has higher Similarity to query. 
        // Associative was penalized (similarity * 0.9). but that's hard to detect.
        // Let's just output the factors and let the LLM decide relevance.
        // Or better: Use "Bağlantılı Anı" for lower scores that are still included.
        const label = recall.score > 0.7 ? "Doğrudan Alaka" : "Dolaylı/Çağrışımsal Bağlantı";

        sections.push(`
### Anı (${label} - Skor: ${(recall.score * 100).toFixed(0)}%)
${recall.memory.content}
- Benzerlik: ${(factors.similarity * 100).toFixed(0)}%
- Duygusal Rezonans: ${(factors.emotionalResonance * 100).toFixed(0)}%
`);
    }

    return sections.join('\n');
}
