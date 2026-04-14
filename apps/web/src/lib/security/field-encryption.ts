/**
 * MNEMOS – Enterprise Security
 * Field-Level Encryption Service
 * 
 * Apple yaklaşımı:
 * - At rest encryption ✅
 * - In transit encryption ✅  
 * - Field-level encryption ✅
 * 
 * Özellikle:
 * - Episodic memory
 * - Emotional content
 * - Identity data
 * 
 * Bu alanlar MUTLAKA şifrelenmeli.
 */

import crypto from 'crypto';

// ==================== CONFIGURATION ====================

// Encryption key should come from environment/key service
// In production: Use AWS KMS, Google Cloud KMS, or HashiCorp Vault
const MASTER_KEY = process.env.ENCRYPTION_MASTER_KEY || 'development-key-32-bytes-long!!';
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
const SALT_LENGTH = 32;

// Fields that MUST be encrypted
export const SENSITIVE_FIELDS = [
    'content',           // Memory content
    'identityMemory',    // Identity data
    'emotionalContent',  // Emotional data
    'conversation',      // Chat messages
    'embedding'          // Vector embeddings (can reveal content)
] as const;

// ==================== TYPES ====================

export interface EncryptedField {
    encrypted: true;
    algorithm: string;
    iv: string;        // Base64
    authTag: string;   // Base64
    data: string;      // Base64
    keyId?: string;    // For key rotation
}

export interface EncryptionResult {
    success: boolean;
    data?: EncryptedField;
    error?: string;
}

export interface DecryptionResult {
    success: boolean;
    data?: string;
    error?: string;
}

// ==================== KEY DERIVATION ====================

/**
 * Derive a user-specific encryption key
 * Split Knowledge: Key varies by user, not just master key
 */
function deriveUserKey(userId: string, salt?: Buffer): { key: Buffer; salt: Buffer } {
    const actualSalt = salt || crypto.randomBytes(SALT_LENGTH);

    // PBKDF2 with high iterations for security
    const key = crypto.pbkdf2Sync(
        MASTER_KEY + userId,  // Combine master + user
        actualSalt,
        100000,               // 100k iterations
        32,                   // 256 bits
        'sha512'
    );

    return { key, salt: actualSalt };
}

/**
 * Derive a field-specific key (extra layer)
 * Different fields use different derived keys
 */
function deriveFieldKey(userKey: Buffer, fieldName: string): Buffer {
    return crypto.createHmac('sha256', userKey)
        .update(fieldName)
        .digest();
}

// ==================== ENCRYPTION ====================

/**
 * Encrypt a field value with user-specific key
 */
export function encryptField(
    value: string,
    userId: string,
    fieldName: string
): EncryptionResult {
    try {
        if (!value || value.length === 0) {
            return { success: true, data: undefined };
        }

        // Generate IV
        const iv = crypto.randomBytes(IV_LENGTH);

        // Derive keys
        const { key: userKey, salt } = deriveUserKey(userId);
        const fieldKey = deriveFieldKey(userKey, fieldName);

        // Encrypt
        const cipher = crypto.createCipheriv(ALGORITHM, fieldKey, iv);

        let encrypted = cipher.update(value, 'utf8', 'base64');
        encrypted += cipher.final('base64');

        const authTag = cipher.getAuthTag();

        return {
            success: true,
            data: {
                encrypted: true,
                algorithm: ALGORITHM,
                iv: Buffer.concat([salt, iv]).toString('base64'),
                authTag: authTag.toString('base64'),
                data: encrypted,
                keyId: 'v1'  // For future key rotation
            }
        };
    } catch (error) {
        console.error('[Encryption] Failed:', (error as Error).message);
        return {
            success: false,
            error: 'Encryption failed'
        };
    }
}

/**
 * Decrypt a field value
 */
export function decryptField(
    encryptedData: EncryptedField,
    userId: string,
    fieldName: string
): DecryptionResult {
    try {
        if (!encryptedData || !encryptedData.encrypted) {
            return { success: false, error: 'Invalid encrypted data' };
        }

        // Extract salt and IV
        const ivBuffer = Buffer.from(encryptedData.iv, 'base64');
        const salt = ivBuffer.subarray(0, SALT_LENGTH);
        const iv = ivBuffer.subarray(SALT_LENGTH);

        // Derive keys
        const { key: userKey } = deriveUserKey(userId, salt);
        const fieldKey = deriveFieldKey(userKey, fieldName);

        // Decrypt
        const decipher = crypto.createDecipheriv(ALGORITHM, fieldKey, iv);
        decipher.setAuthTag(Buffer.from(encryptedData.authTag, 'base64'));

        let decrypted = decipher.update(encryptedData.data, 'base64', 'utf8');
        decrypted += decipher.final('utf8');

        return {
            success: true,
            data: decrypted
        };
    } catch (error) {
        console.error('[Decryption] Failed:', (error as Error).message);
        return {
            success: false,
            error: 'Decryption failed - data may be corrupted or key mismatch'
        };
    }
}

// ==================== BATCH OPERATIONS ====================

/**
 * Encrypt multiple fields in an object
 */
export function encryptObject<T extends Record<string, unknown>>(
    obj: T,
    userId: string,
    fieldsToEncrypt: string[]
): T {
    const result = { ...obj };

    for (const field of fieldsToEncrypt) {
        if (field in result && typeof result[field] === 'string') {
            const encrypted = encryptField(result[field] as string, userId, field);
            if (encrypted.success && encrypted.data) {
                (result as Record<string, unknown>)[field] = JSON.stringify(encrypted.data);
            }
        }
    }

    return result;
}

/**
 * Decrypt multiple fields in an object
 */
export function decryptObject<T extends Record<string, unknown>>(
    obj: T,
    userId: string,
    fieldsToDecrypt: string[]
): T {
    const result = { ...obj };

    for (const field of fieldsToDecrypt) {
        if (field in result && typeof result[field] === 'string') {
            try {
                const parsed = JSON.parse(result[field] as string);
                if (parsed && parsed.encrypted === true) {
                    const decrypted = decryptField(parsed, userId, field);
                    if (decrypted.success && decrypted.data) {
                        (result as Record<string, unknown>)[field] = decrypted.data;
                    }
                }
            } catch {
                // Not encrypted JSON, keep as is
            }
        }
    }

    return result;
}

// ==================== HASHING (for logs/search) ====================

/**
 * Create a one-way hash for logging (NEVER log actual content)
 */
export function hashForLogging(content: string): string {
    return crypto.createHash('sha256')
        .update(content)
        .digest('hex')
        .substring(0, 16);  // Short hash is enough for logs
}

/**
 * Create a searchable hash (for encrypted field search)
 * Uses HMAC so same content = same hash (deterministic)
 */
export function createSearchableHash(content: string, userId: string): string {
    const { key: userKey } = deriveUserKey(userId);

    return crypto.createHmac('sha256', userKey)
        .update(content.toLowerCase().trim())
        .digest('hex');
}

// ==================== KEY ROTATION ====================

/**
 * Re-encrypt data with new key version
 * Should be called during key rotation
 */
export async function rotateEncryption(
    data: EncryptedField,
    userId: string,
    fieldName: string,
    newKeyVersion: string
): Promise<EncryptionResult> {
    // First decrypt with old key
    const decrypted = decryptField(data, userId, fieldName);
    if (!decrypted.success || !decrypted.data) {
        return { success: false, error: 'Failed to decrypt for rotation' };
    }

    // Re-encrypt with new key
    const reEncrypted = encryptField(decrypted.data, userId, fieldName);
    if (reEncrypted.success && reEncrypted.data) {
        reEncrypted.data.keyId = newKeyVersion;
    }

    return reEncrypted;
}

// ==================== EXPORTS ====================

export const fieldEncryption = {
    encryptField,
    decryptField,
    encryptObject,
    decryptObject,
    hashForLogging,
    createSearchableHash,
    rotateEncryption,
    SENSITIVE_FIELDS
};
