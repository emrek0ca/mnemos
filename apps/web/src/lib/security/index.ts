/**
 * MNEMOS – Enterprise Security
 * Unified Security Module
 * 
 * Dünya devleri standardı:
 * - OpenAI: Context hijyeni
 * - Google: Zero Trust + Hard Multi-tenancy  
 * - Apple: Split Knowledge + On-device encryption
 * 
 * Bu sistem üçünün kesişiminde durur.
 */

// Field-Level Encryption (Apple yaklaşımı)
export {
    fieldEncryption,
    encryptField,
    decryptField,
    encryptObject,
    decryptObject,
    hashForLogging,
    createSearchableHash,
    SENSITIVE_FIELDS
} from './field-encryption';

// Zero Trust & Data Isolation (Google standardı)
export {
    zeroTrust,
    validateRequest,
    validatePersonaAccess,
    validateMemoryAccess,
    createIsolatedQuery,
    logSecurityEvent,
    logAccessEvent,
    sanitizeResponse,
    removeInternalFields,
    withZeroTrust
} from './zero-trust';

// Secure Logging & Privacy Guard
export {
    secureLogging,
    privacyGuard,
    secureLog,
    logApiRequest,
    logSecurityIncident,
    secureHash,
    hashUserId,
    hashPersonaId,
    redactPII,
    summarizeContent,
    abstractMemory,
    sanitizeLLMResponse,
    detectPromptLeak,
    protectEmbedding,
    validateResponseIsolation
} from './privacy-guard';

// Types
export type {
    EncryptedField,
    EncryptionResult,
    DecryptionResult
} from './field-encryption';

export type {
    AuthContext,
    Permission,
    IsolationCheckResult,
    AuditEvent
} from './zero-trust';

export type {
    SecureLogEntry,
    AnonymizedMetrics,
    PrivacyConfig
} from './privacy-guard';
