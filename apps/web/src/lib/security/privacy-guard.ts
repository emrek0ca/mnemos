/**
 * MNEMOS – Enterprise Security
 * Secure Logging & Model Inversion Prevention
 * 
 * Altın kural: Log'a asla kullanıcı cümlesi yazılmaz!
 * 
 * Sadece:
 * - Hash
 * - Event type
 * - Anonymized metrics
 * 
 * Model Inversion & Prompt Leak Önlemi:
 * - Response sanitization
 * - Memory summarization (ham veri değil)
 * - Embedding abstraction
 */

import crypto from 'crypto';

// ==================== TYPES ====================

export interface SecureLogEntry {
    timestamp: Date;
    level: 'debug' | 'info' | 'warn' | 'error' | 'security';
    eventType: string;
    eventHash: string;          // Hash of event details
    userId?: string;            // HASHED
    personaId?: string;         // HASHED
    metrics?: AnonymizedMetrics;
    error?: string;             // Generic error type, no details
}

export interface AnonymizedMetrics {
    messageLength?: number;     // Character count only
    responseTime?: number;
    tokenCount?: number;
    memoryCount?: number;
    actionType?: string;
}

export interface PrivacyConfig {
    maxContentLength: number;   // Max chars before truncation
    summarizeThreshold: number; // When to summarize instead of store
    redactPatterns: RegExp[];   // Patterns to redact
}

// ==================== CONFIGURATION ====================

const DEFAULT_PRIVACY_CONFIG: PrivacyConfig = {
    maxContentLength: 500,
    summarizeThreshold: 200,
    redactPatterns: [
        /\b\d{10,11}\b/g,                    // Phone numbers
        /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,  // Emails
        /\b\d{11}\b/g,                       // TC Kimlik
        /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,  // Credit cards
        /\b\d{2}[/.-]\d{2}[/.-]\d{4}\b/g,   // Dates
        /(?:şifre|parola|password|pin)[:\s]*\S+/gi  // Passwords
    ]
};

// ==================== SECURE HASHING ====================

/**
 * Create a one-way hash for any content
 * Used for logging - original content is NEVER stored
 */
export function secureHash(content: string, salt?: string): string {
    const actualSalt = salt || process.env.LOG_SALT || 'mnemos-log-salt';
    return crypto.createHmac('sha256', actualSalt)
        .update(content)
        .digest('hex')
        .substring(0, 16);  // Short hash for logs
}

/**
 * Hash user ID for logging
 */
export function hashUserId(userId: string): string {
    return secureHash(userId, 'user-salt');
}

/**
 * Hash persona ID for logging  
 */
export function hashPersonaId(personaId: string): string {
    return secureHash(personaId, 'persona-salt');
}

// ==================== SECURE LOGGING ====================

/**
 * Log without ANY sensitive data
 */
export function secureLog(
    level: SecureLogEntry['level'],
    eventType: string,
    data: {
        userId?: string;
        personaId?: string;
        content?: string;  // Will be hashed
        metrics?: AnonymizedMetrics;
        error?: Error;
    }
): void {
    const entry: SecureLogEntry = {
        timestamp: new Date(),
        level,
        eventType,
        eventHash: data.content ? secureHash(data.content) : 'no-content',
        userId: data.userId ? hashUserId(data.userId) : undefined,
        personaId: data.personaId ? hashPersonaId(data.personaId) : undefined,
        metrics: data.metrics,
        error: data.error ? data.error.name : undefined  // Only error type, no message
    };

    // Log to console (in production: send to secure logging service)
    switch (level) {
        case 'error':
        case 'security':
            console.error(`[${level.toUpperCase()}] ${eventType}`, JSON.stringify(entry));
            break;
        case 'warn':
            console.warn(`[WARN] ${eventType}`);
            break;
        case 'info':
            console.info(`[INFO] ${eventType}`);
            break;
        default:
            // Debug logs only in development
            if (process.env.NODE_ENV === 'development') {
                console.debug(`[DEBUG] ${eventType}`);
            }
    }
}

/**
 * Log API request (no content, only metrics)
 */
export function logApiRequest(
    endpoint: string,
    method: string,
    userId: string,
    metrics: AnonymizedMetrics
): void {
    secureLog('info', `API:${method}:${endpoint}`, {
        userId,
        metrics
    });
}

/**
 * Log security event
 */
export function logSecurityIncident(
    incidentType: string,
    userId: string,
    details: string  // Will be hashed
): void {
    secureLog('security', incidentType, {
        userId,
        content: details
    });
}

// ==================== CONTENT SANITIZATION ====================

/**
 * Redact PII from content before any processing
 */
export function redactPII(
    content: string,
    config: PrivacyConfig = DEFAULT_PRIVACY_CONFIG
): string {
    let redacted = content;

    for (const pattern of config.redactPatterns) {
        redacted = redacted.replace(pattern, '[REDACTED]');
    }

    return redacted;
}

/**
 * Summarize content to prevent storing raw data
 * Model inversion prevention: store abstractions, not raw content
 */
export function summarizeContent(
    content: string,
    maxLength: number = 100
): string {
    if (content.length <= maxLength) {
        return content;
    }

    // Extract key concepts, not actual content
    const words = content.toLowerCase().split(/\s+/);
    const significantWords = words.filter(w => w.length > 4).slice(0, 10);

    return `[Summary: ${significantWords.join(', ')}] (${content.length} chars)`;
}

/**
 * Create abstract representation of memory for storage
 * Prevents direct content exposure
 */
export function abstractMemory(
    content: string,
    emotion?: string,
    topic?: string
): {
    abstract: string;
    contentHash: string;
    metrics: {
        length: number;
        wordCount: number;
        hasNames: boolean;
    };
} {
    const redacted = redactPII(content);

    return {
        abstract: summarizeContent(redacted, 150),
        contentHash: secureHash(content),
        metrics: {
            length: content.length,
            wordCount: content.split(/\s+/).length,
            hasNames: /[A-ZĞÜŞİÖÇ][a-zğüşıöç]+/.test(content)
        }
    };
}

// ==================== RESPONSE SANITIZATION ====================

/**
 * Sanitize LLM response to prevent prompt/memory leakage
 */
export function sanitizeLLMResponse(response: string): string {
    let sanitized = response;

    // Remove any system prompt leakage patterns
    const leakagePatterns = [
        /\[SYSTEM\][\s\S]*?\[\/SYSTEM\]/gi,
        /\[MEMORY\][\s\S]*?\[\/MEMORY\]/gi,
        /\[CONTEXT\][\s\S]*?\[\/CONTEXT\]/gi,
        /<system>[\s\S]*?<\/system>/gi,
        /#{1,3}\s*(MNEMOS|SISTEM|KURAL|HAFIZA)/gi,
        /⚠️.*?:(.*?)(?=\n|$)/gi  // Warning headers from prompts
    ];

    for (const pattern of leakagePatterns) {
        sanitized = sanitized.replace(pattern, '');
    }

    // Remove potential memory references that shouldn't be exposed
    sanitized = sanitized.replace(/\[Memory:.*?\]/gi, '');
    sanitized = sanitized.replace(/\[Anı:.*?\]/gi, '');

    return sanitized.trim();
}

/**
 * Check if response contains leaked system information
 */
export function detectPromptLeak(response: string): boolean {
    const leakIndicators = [
        'sistem prompt',
        'system prompt',
        'kullanıcı hafızası',
        'memory entry',
        'personaId',
        'userId',
        'MNEMOS –',
        'DİJİTAL KİŞİLİK MOTORU'
    ];

    const lowerResponse = response.toLowerCase();
    return leakIndicators.some(indicator =>
        lowerResponse.includes(indicator.toLowerCase())
    );
}

// ==================== EMBEDDING PROTECTION ====================

/**
 * Add noise to embeddings to prevent reconstruction
 * Differential privacy approach
 */
export function protectEmbedding(
    embedding: number[],
    epsilon: number = 0.1  // Privacy budget
): number[] {
    const noiseScale = 1 / epsilon;

    return embedding.map(value => {
        // Add Laplacian noise
        const u = Math.random() - 0.5;
        const noise = -noiseScale * Math.sign(u) * Math.log(1 - 2 * Math.abs(u));
        return value + noise * 0.01;  // Small noise
    });
}

/**
 * Normalize embedding to prevent magnitude-based attacks
 */
export function normalizeEmbedding(embedding: number[]): number[] {
    const magnitude = Math.sqrt(embedding.reduce((sum, v) => sum + v * v, 0));
    if (magnitude === 0) return embedding;
    return embedding.map(v => v / magnitude);
}

// ==================== CROSS-USER LEAK PREVENTION ====================

/**
 * Validate that response doesn't contain other users' data
 */
export function validateResponseIsolation(
    response: string,
    currentUserId: string,
    knownUserPatterns: string[] = []
): {
    safe: boolean;
    issues: string[];
} {
    const issues: string[] = [];

    // Check for other user patterns
    for (const pattern of knownUserPatterns) {
        if (!pattern.includes(currentUserId) && response.includes(pattern)) {
            issues.push('Potential cross-user data detected');
        }
    }

    // Check for database IDs that might leak
    const uuidPattern = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
    const uuids = response.match(uuidPattern);
    if (uuids && uuids.length > 0) {
        issues.push('Internal IDs detected in response');
    }

    return {
        safe: issues.length === 0,
        issues
    };
}

// ==================== DEBUG MODE PROTECTION ====================

/**
 * Get sanitized data for debugging (never use real data)
 */
export function getFakeDebugData(): {
    userId: string;
    personaId: string;
    memory: string;
    conversation: string;
} {
    return {
        userId: 'debug-user-12345',
        personaId: 'debug-persona-67890',
        memory: 'Bu bir test hafıza kaydıdır. Gerçek veri değildir.',
        conversation: 'Debug: Test konuşması'
    };
}

/**
 * Check if we're in a safe debug environment
 */
export function isDebugEnvironment(): boolean {
    return process.env.NODE_ENV === 'development' &&
        process.env.DEBUG_MODE === 'true' &&
        process.env.USE_FAKE_DATA === 'true';
}

// ==================== EXPORTS ====================

export const secureLogging = {
    secureLog,
    logApiRequest,
    logSecurityIncident,
    secureHash,
    hashUserId,
    hashPersonaId
};

export const privacyGuard = {
    redactPII,
    summarizeContent,
    abstractMemory,
    sanitizeLLMResponse,
    detectPromptLeak,
    protectEmbedding,
    normalizeEmbedding,
    validateResponseIsolation,
    getFakeDebugData,
    isDebugEnvironment,
    DEFAULT_PRIVACY_CONFIG
};
