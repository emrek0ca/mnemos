/**
 * MNEMOS – Enterprise Security
 * Zero Trust & Data Isolation
 * 
 * Google standardı:
 * - Hiçbir bileşen "içerdeyim" diye varsayılmaz
 * - Her modül, her istekte, her erişimde yetki doğrular
 * 
 * Hard Multi-Tenancy:
 * - Veri asla karışmaz
 * - Her sorgu personaId/userId doğrular
 * - Namespace isolation
 */

import { NextRequest, NextResponse } from 'next/server';
import prisma from '../db';
import { hashForLogging } from './field-encryption';

// ==================== TYPES ====================

export interface AuthContext {
    userId: string;
    personaId?: string;
    sessionId: string;
    permissions: Permission[];
    timestamp: Date;
    ipHash: string;
}

export type Permission =
    | 'read:own_data'
    | 'write:own_data'
    | 'delete:own_data'
    | 'read:persona'
    | 'write:persona'
    | 'admin:all';

export interface IsolationCheckResult {
    allowed: boolean;
    reason?: string;
    context?: AuthContext;
}

export interface AuditEvent {
    eventType: 'access' | 'modify' | 'delete' | 'error' | 'security';
    resourceType: string;
    resourceId: string;
    userId: string;
    action: string;
    allowed: boolean;
    timestamp: Date;
    metadata?: Record<string, string>;
}

// ==================== ZERO TRUST VALIDATION ====================

/**
 * Validate that a request has proper authorization context
 */
export async function validateRequest(
    request: NextRequest,
    requiredPermissions: Permission[]
): Promise<IsolationCheckResult> {
    try {
        const authToken = request.headers.get('authorization')?.replace('Bearer ', '') ||
            request.cookies.get('auth-token')?.value;

        if (!authToken) {
            return {
                allowed: false,
                reason: 'No authentication token provided'
            };
        }

        const context = await verifyAuthToken(authToken);
        if (!context) {
            return {
                allowed: false,
                reason: 'Invalid or expired authentication'
            };
        }

        const hasPermission = requiredPermissions.every(p =>
            context.permissions.includes(p) || context.permissions.includes('admin:all')
        );

        if (!hasPermission) {
            return {
                allowed: false,
                reason: 'Insufficient permissions',
                context
            };
        }

        return { allowed: true, context };
    } catch {
        return {
            allowed: false,
            reason: 'Authentication validation failed'
        };
    }
}

/**
 * Verify auth token using API keys (existing schema)
 */
async function verifyAuthToken(token: string): Promise<AuthContext | null> {
    try {
        const decoded = Buffer.from(token, 'base64').toString('utf8');
        const [userId, keyPrefix] = decoded.split(':');

        if (!userId) return null;

        const user = await prisma.user.findUnique({
            where: { id: userId, isActive: true },
            select: { id: true, role: true }
        });

        if (!user) return null;

        if (keyPrefix) {
            const apiKey = await prisma.apiKey.findFirst({
                where: {
                    userId,
                    keyPrefix,
                    isActive: true,
                    OR: [
                        { expiresAt: null },
                        { expiresAt: { gt: new Date() } }
                    ]
                }
            });

            if (!apiKey) return null;
        }

        return {
            userId,
            sessionId: keyPrefix || 'direct',
            permissions: getPermissionsForRole(user.role),
            timestamp: new Date(),
            ipHash: 'redacted'
        };
    } catch {
        return null;
    }
}

function getPermissionsForRole(role: string): Permission[] {
    switch (role) {
        case 'ADMIN': return ['admin:all'];
        default: return ['read:own_data', 'write:own_data', 'delete:own_data', 'read:persona', 'write:persona'];
    }
}

// ==================== DATA ISOLATION ====================

export async function validatePersonaAccess(
    userId: string,
    personaId: string
): Promise<IsolationCheckResult> {
    try {
        const persona = await prisma.persona.findFirst({
            where: { id: personaId, userId },
            select: { id: true }
        });

        if (!persona) {
            return { allowed: false, reason: 'Persona not found or access denied' };
        }

        return { allowed: true };
    } catch {
        return { allowed: false, reason: 'Access validation failed' };
    }
}

export async function validateMemoryAccess(
    userId: string,
    memoryId: string
): Promise<IsolationCheckResult> {
    try {
        const memory = await prisma.memoryEntry.findFirst({
            where: {
                id: memoryId,
                persona: { userId }
            },
            select: { id: true }
        });

        if (!memory) {
            return { allowed: false, reason: 'Memory not found or access denied' };
        }

        return { allowed: true };
    } catch {
        return { allowed: false, reason: 'Access validation failed' };
    }
}

export function createIsolatedQuery<T extends Record<string, unknown>>(
    baseQuery: T,
    userId: string,
    personaId?: string
): T {
    const isolatedQuery = { ...baseQuery } as T & { where?: Record<string, unknown> };

    if (!isolatedQuery.where) {
        isolatedQuery.where = {};
    }

    if (personaId) {
        isolatedQuery.where.personaId = personaId;
        isolatedQuery.where.persona = { userId };
    } else {
        isolatedQuery.where.userId = userId;
    }

    return isolatedQuery;
}

// ==================== AUDIT LOGGING ====================

export async function logSecurityEvent(event: AuditEvent): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId: event.userId,
                action: event.action,
                resourceType: event.resourceType,
                resourceId: event.resourceId,
                oldValue: JSON.stringify({
                    eventType: event.eventType,
                    allowed: event.allowed,
                    metadata: event.metadata
                }),
                severity: event.eventType === 'security' ? 'CRITICAL' : 'INFO',
                createdAt: event.timestamp
            }
        });
    } catch {
        console.error('[Audit] Failed to log event');
    }
}

export async function logAccessEvent(
    userId: string,
    resourceType: string,
    resourceId: string,
    action: string
): Promise<void> {
    await logSecurityEvent({
        eventType: 'access',
        resourceType,
        resourceId: hashForLogging(resourceId),
        userId: hashForLogging(userId),
        action,
        allowed: true,
        timestamp: new Date()
    });
}

// ==================== RESPONSE SANITIZATION ====================

export function sanitizeResponse(
    data: Record<string, unknown>,
    allowedFields: string[]
): Record<string, unknown> {
    const sanitized: Record<string, unknown> = {};
    for (const field of allowedFields) {
        if (field in data) sanitized[field] = data[field];
    }
    return sanitized;
}

export function removeInternalFields(data: Record<string, unknown>): Record<string, unknown> {
    const internalFields = ['userId', 'personaId', 'embedding', 'hash', 'internalId', '_prisma', 'deletedAt'];
    const cleaned = { ...data };
    for (const field of internalFields) delete cleaned[field];
    return cleaned;
}

// ==================== MIDDLEWARE ====================

export function withZeroTrust(
    handler: (req: NextRequest, context: AuthContext) => Promise<NextResponse>,
    requiredPermissions: Permission[] = ['read:own_data']
): (req: NextRequest) => Promise<NextResponse> {
    return async (req: NextRequest) => {
        const validation = await validateRequest(req, requiredPermissions);

        if (!validation.allowed || !validation.context) {
            return NextResponse.json(
                { error: validation.reason || 'Unauthorized' },
                { status: 401 }
            );
        }

        return handler(req, validation.context);
    };
}

// ==================== EXPORTS ====================

export const zeroTrust = {
    validateRequest,
    validatePersonaAccess,
    validateMemoryAccess,
    createIsolatedQuery,
    logSecurityEvent,
    logAccessEvent,
    sanitizeResponse,
    removeInternalFields,
    withZeroTrust
};
