/**
 * MNEMOS – Token Cost Optimizer
 * 
 * Strategies:
 * 1. Smart Model Selection - Use small model for simple queries
 * 2. Prompt Compression - Remove redundant context
 * 3. Conversation Pruning - Keep only relevant history
 * 4. Image Optimization - Resize large images
 * 5. Response Caching - Cache similar queries
 */

// Approximate token counts (rough estimates)
const CHAR_TO_TOKEN_RATIO = 4; // ~4 chars per token on average

export interface TokenEstimate {
    promptTokens: number;
    estimatedResponseTokens: number;
    totalEstimate: number;
    modelCost: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface OptimizationResult {
    optimizedPrompt: string;
    optimizedHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
    savings: {
        originalTokens: number;
        optimizedTokens: number;
        savedTokens: number;
        savingsPercent: number;
    };
}

// ==================== TOKEN ESTIMATION ====================

/**
 * Estimate token count for a string
 */
export function estimateTokens(text: string): number {
    if (!text) return 0;
    // Rough estimate: ~4 characters per token for English/Turkish
    return Math.ceil(text.length / CHAR_TO_TOKEN_RATIO);
}

/**
 * Estimate total token usage for a request
 */
export function estimateRequestTokens(
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
    userMessage: string
): TokenEstimate {
    const systemTokens = estimateTokens(systemPrompt);
    const historyTokens = conversationHistory.reduce(
        (sum, msg) => sum + estimateTokens(msg.content),
        0
    );
    const messageTokens = estimateTokens(userMessage);

    const promptTokens = systemTokens + historyTokens + messageTokens;

    // Estimate response based on typical patterns
    const estimatedResponseTokens = Math.min(1024, Math.max(100, promptTokens * 0.3));

    // Determine cost tier
    let modelCost: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    if (promptTokens > 4000) modelCost = 'HIGH';
    else if (promptTokens > 1500) modelCost = 'MEDIUM';

    return {
        promptTokens,
        estimatedResponseTokens,
        totalEstimate: promptTokens + estimatedResponseTokens,
        modelCost
    };
}

// ==================== SMART MODEL SELECTION ====================

export interface QueryComplexity {
    level: 'SIMPLE' | 'MEDIUM' | 'COMPLEX';
    reason: string;
    recommendedModel: 'SMALL' | 'MEDIUM' | 'LARGE';
}

/**
 * Analyze query complexity to choose appropriate model
 */
export function analyzeQueryComplexity(
    message: string,
    emotionIntensity: number,
    topic: string
): QueryComplexity {
    const messageLength = message.length;
    const hasQuestion = message.includes('?');
    const hasMultipleSentences = (message.match(/[.!?]/g) || []).length > 2;

    // Complex topics that need larger model
    const complexTopics = ['philosophy', 'ethics', 'psychology', 'finance', 'legal', 'medical'];
    const isComplexTopic = complexTopics.some(t => topic.toLowerCase().includes(t));

    // Simple greetings and short responses
    const simplePatterns = [
        /^(merhaba|selam|hey|hi|hello)/i,
        /^(evet|hayır|tamam|ok|olur)/i,
        /^(teşekkür|sağol|eyvallah)/i,
        /^(günaydın|iyi geceler|iyi akşamlar)/i
    ];
    const isSimpleGreeting = simplePatterns.some(p => p.test(message.trim()));

    // Determine complexity
    if (isSimpleGreeting && messageLength < 50) {
        return {
            level: 'SIMPLE',
            reason: 'Simple greeting or response',
            recommendedModel: 'SMALL'
        };
    }

    if (isComplexTopic || emotionIntensity > 0.7 || (hasMultipleSentences && messageLength > 200)) {
        return {
            level: 'COMPLEX',
            reason: isComplexTopic ? 'Complex topic' : 'High emotion or detailed query',
            recommendedModel: 'LARGE'
        };
    }

    return {
        level: 'MEDIUM',
        reason: 'Standard conversation',
        recommendedModel: 'MEDIUM'
    };
}

// ==================== PROMPT COMPRESSION ====================

/**
 * Compress system prompt by removing redundant sections
 */
export function compressSystemPrompt(prompt: string, maxTokens: number = 2000): string {
    const currentTokens = estimateTokens(prompt);

    if (currentTokens <= maxTokens) {
        return prompt;
    }

    // Priority sections to keep
    const keepSections = [
        /personality/i,
        /identity/i,
        /core values/i,
        /beliefs/i
    ];

    // Sections that can be trimmed
    const trimSections = [
        /example responses?/i,
        /formatting guidelines?/i,
        /detailed instructions?/i
    ];

    let compressed = prompt;

    // Remove trim sections if still over limit
    for (const pattern of trimSections) {
        if (estimateTokens(compressed) > maxTokens) {
            const sectionRegex = new RegExp(`${pattern.source}[\\s\\S]*?(?=\\n#|\\n##|$)`, 'gi');
            compressed = compressed.replace(sectionRegex, '');
        }
    }

    // If still over limit, truncate
    if (estimateTokens(compressed) > maxTokens) {
        const targetLength = maxTokens * CHAR_TO_TOKEN_RATIO;
        compressed = compressed.substring(0, targetLength) + '\n[Prompt truncated for optimization]';
    }

    return compressed.trim();
}

// ==================== CONVERSATION PRUNING ====================

/**
 * Prune conversation history to keep only relevant messages
 */
export function pruneConversationHistory(
    history: Array<{ role: 'user' | 'assistant'; content: string }>,
    maxMessages: number = 10,
    maxTokens: number = 2000
): Array<{ role: 'user' | 'assistant'; content: string }> {
    if (history.length === 0) return [];

    // Always keep the most recent pairs
    const recent = history.slice(-maxMessages);

    // Calculate tokens
    let totalTokens = 0;
    const pruned: typeof history = [];

    // Start from most recent, work backwards
    for (let i = recent.length - 1; i >= 0; i--) {
        const msg = recent[i];
        const msgTokens = estimateTokens(msg.content);

        if (totalTokens + msgTokens <= maxTokens) {
            pruned.unshift(msg);
            totalTokens += msgTokens;
        } else {
            // Truncate long messages instead of dropping
            const remainingTokens = maxTokens - totalTokens;
            if (remainingTokens > 50) {
                const truncatedContent = msg.content.substring(0, remainingTokens * CHAR_TO_TOKEN_RATIO);
                pruned.unshift({ ...msg, content: truncatedContent + '...' });
            }
            break;
        }
    }

    return pruned;
}

// ==================== IMAGE OPTIMIZATION ====================

/**
 * Resize image to reduce tokens (base64 size affects cost)
 */
export function shouldResizeImage(base64Image: string, maxSizeKB: number = 500): boolean {
    // Estimate size from base64 length
    const estimatedSizeKB = (base64Image.length * 0.75) / 1024;
    return estimatedSizeKB > maxSizeKB;
}

/**
 * Get image resize recommendation
 */
export function getImageResizeRecommendation(base64Image: string): {
    currentSizeKB: number;
    recommendedMaxDimension: number;
    shouldResize: boolean;
} {
    const currentSizeKB = Math.round((base64Image.length * 0.75) / 1024);

    // Recommend based on size
    let recommendedMaxDimension = 1024;
    if (currentSizeKB > 2000) recommendedMaxDimension = 512;
    else if (currentSizeKB > 1000) recommendedMaxDimension = 768;

    return {
        currentSizeKB,
        recommendedMaxDimension,
        shouldResize: currentSizeKB > 500
    };
}

// ==================== RESPONSE CACHE ====================

interface CacheEntry {
    query: string;
    response: string;
    timestamp: number;
    hits: number;
}

class ResponseCache {
    private cache: Map<string, CacheEntry> = new Map();
    private maxEntries: number = 100;
    private ttlMs: number = 30 * 60 * 1000; // 30 minutes

    /**
     * Generate cache key from query
     */
    private generateKey(query: string, context?: string): string {
        const normalized = query.toLowerCase().trim().replace(/\s+/g, ' ');
        return context ? `${context}:${normalized}` : normalized;
    }

    /**
     * Check if similar query exists in cache
     */
    get(query: string, context?: string): string | null {
        const key = this.generateKey(query, context);
        const entry = this.cache.get(key);

        if (!entry) return null;

        // Check TTL
        if (Date.now() - entry.timestamp > this.ttlMs) {
            this.cache.delete(key);
            return null;
        }

        entry.hits++;
        return entry.response;
    }

    /**
     * Store response in cache
     */
    set(query: string, response: string, context?: string): void {
        const key = this.generateKey(query, context);

        // Evict old entries if at limit
        if (this.cache.size >= this.maxEntries) {
            this.evictOldest();
        }

        this.cache.set(key, {
            query,
            response,
            timestamp: Date.now(),
            hits: 0
        });
    }

    /**
     * Evict oldest entry
     */
    private evictOldest(): void {
        let oldest: string | null = null;
        let oldestTime = Infinity;

        for (const [key, entry] of this.cache) {
            if (entry.timestamp < oldestTime) {
                oldestTime = entry.timestamp;
                oldest = key;
            }
        }

        if (oldest) this.cache.delete(oldest);
    }

    /**
     * Get cache stats
     */
    getStats(): { entries: number; totalHits: number } {
        let totalHits = 0;
        for (const entry of this.cache.values()) {
            totalHits += entry.hits;
        }
        return { entries: this.cache.size, totalHits };
    }

    /**
     * Clear cache
     */
    clear(): void {
        this.cache.clear();
    }
}

// Export singleton cache instance
export const responseCache = new ResponseCache();

// ==================== FULL OPTIMIZATION PIPELINE ====================

/**
 * Optimize request to reduce token usage
 */
export function optimizeRequest(
    systemPrompt: string,
    conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>,
    userMessage: string,
    options: {
        maxPromptTokens?: number;
        maxHistoryTokens?: number;
        maxHistoryMessages?: number;
    } = {}
): OptimizationResult {
    const {
        maxPromptTokens = 2000,
        maxHistoryTokens = 1500,
        maxHistoryMessages = 10
    } = options;

    // Original token count
    const originalTokens = estimateRequestTokens(systemPrompt, conversationHistory, userMessage);

    // Optimize system prompt
    const optimizedPrompt = compressSystemPrompt(systemPrompt, maxPromptTokens);

    // Prune history
    const optimizedHistory = pruneConversationHistory(
        conversationHistory,
        maxHistoryMessages,
        maxHistoryTokens
    );

    // Calculate savings
    const optimizedTokens = estimateRequestTokens(optimizedPrompt, optimizedHistory, userMessage);
    const savedTokens = originalTokens.promptTokens - optimizedTokens.promptTokens;

    return {
        optimizedPrompt,
        optimizedHistory,
        savings: {
            originalTokens: originalTokens.promptTokens,
            optimizedTokens: optimizedTokens.promptTokens,
            savedTokens,
            savingsPercent: Math.round((savedTokens / originalTokens.promptTokens) * 100)
        }
    };
}

// ==================== USAGE TRACKING ====================

interface UsageRecord {
    timestamp: Date;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
}

class TokenUsageTracker {
    private records: UsageRecord[] = [];
    private maxRecords: number = 1000;

    /**
     * Record token usage
     */
    record(usage: Omit<UsageRecord, 'timestamp'>): void {
        if (this.records.length >= this.maxRecords) {
            this.records.shift();
        }
        this.records.push({ ...usage, timestamp: new Date() });
    }

    /**
     * Get usage summary for time period
     */
    getSummary(hoursBack: number = 24): {
        totalTokens: number;
        promptTokens: number;
        completionTokens: number;
        requestCount: number;
        avgTokensPerRequest: number;
    } {
        const cutoff = Date.now() - (hoursBack * 60 * 60 * 1000);
        const relevantRecords = this.records.filter(r => r.timestamp.getTime() > cutoff);

        const totals = relevantRecords.reduce(
            (acc, r) => ({
                totalTokens: acc.totalTokens + r.totalTokens,
                promptTokens: acc.promptTokens + r.promptTokens,
                completionTokens: acc.completionTokens + r.completionTokens
            }),
            { totalTokens: 0, promptTokens: 0, completionTokens: 0 }
        );

        return {
            ...totals,
            requestCount: relevantRecords.length,
            avgTokensPerRequest: relevantRecords.length > 0
                ? Math.round(totals.totalTokens / relevantRecords.length)
                : 0
        };
    }

    /**
     * Get all records (for export/analysis)
     */
    getRecords(): UsageRecord[] {
        return [...this.records];
    }
}

export const tokenUsageTracker = new TokenUsageTracker();
