/**
 * MNEMOS – Input Validators
 * Zod schemas for API input validation
 */

import { z } from 'zod';

// ==================== Common Schemas ====================

export const UUIDSchema = z.string().uuid('Invalid UUID format');

export const PaginationSchema = z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
});

// ==================== Auth Schemas ====================

export const LoginSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email too long'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password too long'),
});

export const RegisterSchema = z.object({
    email: z.string()
        .email('Invalid email format')
        .max(255, 'Email too long'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(128, 'Password too long')
        .regex(
            /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
            'Password must contain at least one lowercase, one uppercase, and one number'
        ),
    name: z.string()
        .min(2, 'Name must be at least 2 characters')
        .max(100, 'Name too long')
        .optional(),
});

// ==================== Chat Schemas ====================

export const ChatMessageSchema = z.object({
    personaId: z.string().min(1, 'Persona ID is required'),
    message: z.string()
        .min(1, 'Message cannot be empty')
        .max(10000, 'Message too long'),
    conversationId: z.string().min(1).nullish(), // Accept null, undefined, or string
});

// ==================== Persona Schemas ====================

export const CreatePersonaSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name too long'),
    identityMemory: z.string().optional(), // JSON string
    preferences: z.string().optional(), // JSON string
});

export const UpdatePersonaSchema = z.object({
    name: z.string()
        .min(1, 'Name is required')
        .max(100, 'Name too long')
        .optional(),
    identityMemory: z.string().optional(),
    preferences: z.string().optional(),
    system1Weight: z.number().min(0).max(1).optional(),
    system2Weight: z.number().min(0).max(1).optional(),
    decisionThreshold: z.number().min(0).max(1).optional(),
});

// ==================== Identity Schemas ====================

export const IdentityCoreSchema = z.object({
    values: z.array(z.string().max(200)).max(20).optional(),
    moralBoundaries: z.array(z.string().max(200)).max(20).optional(),
    characterTraits: z.array(z.string().max(100)).max(20).optional(),
    signaturePhrases: z.array(z.string().max(200)).max(10).optional(),
    voiceSettings: z.object({
        pitch: z.number().min(0.5).max(2).optional(),
        rate: z.number().min(0.5).max(2).optional(),
    }).optional(),
    cognitiveStyle: z.object({
        system1Tendency: z.number().min(0).max(1).optional(),
        riskTolerance: z.number().min(0).max(1).optional(),
        emotionalIntensity: z.number().min(0).max(1).optional(),
        uncertaintyTolerance: z.number().min(0).max(1).optional(),
    }).optional(),
    personalityStyle: z.object({
        formality: z.number().min(0).max(1).optional(),
        directness: z.number().min(0).max(1).optional(),
        warmth: z.number().min(0).max(1).optional(),
        humor: z.number().min(0).max(1).optional(),
        confidence: z.number().min(0).max(1).optional(),
    }).optional(),
});

// ==================== Memory Schemas ====================

export const CreateMemorySchema = z.object({
    type: z.enum(['WORKING', 'EPISODIC', 'IDENTITY', 'INTERNAL_MONOLOGUE']),
    content: z.string()
        .min(1, 'Content is required')
        .max(5000, 'Content too long'),
    importanceScore: z.number().min(0).max(1).optional(),
});

export const UpdateMemorySchema = z.object({
    content: z.string()
        .min(1, 'Content is required')
        .max(5000, 'Content too long')
        .optional(),
    importanceScore: z.number().min(0).max(1).optional(),
});

// ==================== Search Schema ====================

export const SearchSchema = z.object({
    query: z.string()
        .min(2, 'Search query too short')
        .max(200, 'Search query too long'),
    type: z.enum(['memories', 'messages', 'all']).default('all'),
});

// ==================== Validation Helper ====================

export type ValidationResult<T> =
    | { success: true; data: T }
    | { success: false; error: string; details?: z.ZodIssue[] };

/**
 * Validate input data against a Zod schema
 */
export function validateInput<T>(
    schema: z.ZodType<T>,
    data: unknown
): ValidationResult<T> {
    const result = schema.safeParse(data);

    if (result.success) {
        return { success: true, data: result.data };
    }

    // Format error message - use issues (correct Zod API)
    const errorMessages = result.error.issues
        .map((issue: z.ZodIssue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');

    return {
        success: false,
        error: errorMessages,
        details: result.error.issues
    };
}

/**
 * Sanitize string input (remove potential XSS)
 */
export function sanitizeString(input: string): string {
    return input
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * Sanitize object recursively
 */
export function sanitizeObject<T extends Record<string, unknown>>(obj: T): T {
    const sanitized: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === 'string') {
            sanitized[key] = sanitizeString(value);
        } else if (Array.isArray(value)) {
            sanitized[key] = value.map(item =>
                typeof item === 'string' ? sanitizeString(item) : item
            );
        } else if (typeof value === 'object' && value !== null) {
            sanitized[key] = sanitizeObject(value as Record<string, unknown>);
        } else {
            sanitized[key] = value;
        }
    }

    return sanitized as T;
}
