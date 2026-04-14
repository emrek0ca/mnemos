import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

// ==================== CONFIGURATION ====================

const ADMIN_JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'default-admin-jwt-secret-change-me';
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || '';
const ADMIN_ALLOWED_IPS = (process.env.ADMIN_ALLOWED_IPS || '127.0.0.1,::1,localhost').split(',').map(ip => ip.trim());

// Rate limiting storage (in-memory, will reset on server restart)
const loginAttempts = new Map<string, { count: number; lastAttempt: number; blockedUntil?: number }>();

const MAX_ATTEMPTS = 5;
const ATTEMPT_WINDOW = 5 * 60 * 1000; // 5 minutes
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes

// ==================== IP VALIDATION ====================

export function isIPAllowed(ip: string): boolean {
    // Development mode - allow all
    if (process.env.NODE_ENV === 'development' && ADMIN_ALLOWED_IPS.includes('*')) {
        return true;
    }

    // Check if IP is in whitelist
    const normalizedIP = ip === '::1' ? '127.0.0.1' : ip;
    return ADMIN_ALLOWED_IPS.some(allowedIP => {
        if (allowedIP === '*') return true;
        if (allowedIP === normalizedIP) return true;
        // Handle x-forwarded-for which might have multiple IPs
        if (normalizedIP.includes(allowedIP)) return true;
        return false;
    });
}

export function getClientIP(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    return headers.get('x-real-ip') || '127.0.0.1';
}

// ==================== RATE LIMITING ====================

export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts?: number; blockedUntil?: Date } {
    const now = Date.now();
    const record = loginAttempts.get(ip);

    // If blocked, check if block has expired
    if (record?.blockedUntil) {
        if (now < record.blockedUntil) {
            return {
                allowed: false,
                blockedUntil: new Date(record.blockedUntil)
            };
        }
        // Block expired, reset
        loginAttempts.delete(ip);
    }

    // No record or window expired
    if (!record || now - record.lastAttempt > ATTEMPT_WINDOW) {
        return { allowed: true, remainingAttempts: MAX_ATTEMPTS };
    }

    // Check attempts
    if (record.count >= MAX_ATTEMPTS) {
        // Block the IP
        record.blockedUntil = now + BLOCK_DURATION;
        loginAttempts.set(ip, record);
        return {
            allowed: false,
            blockedUntil: new Date(record.blockedUntil)
        };
    }

    return { allowed: true, remainingAttempts: MAX_ATTEMPTS - record.count };
}

export function recordLoginAttempt(ip: string, success: boolean): void {
    if (success) {
        // Clear attempts on successful login
        loginAttempts.delete(ip);
        return;
    }

    const now = Date.now();
    const record = loginAttempts.get(ip);

    if (!record || now - record.lastAttempt > ATTEMPT_WINDOW) {
        loginAttempts.set(ip, { count: 1, lastAttempt: now });
    } else {
        record.count++;
        record.lastAttempt = now;
        loginAttempts.set(ip, record);
    }
}

// ==================== SECRET KEY VALIDATION ====================

export function validateAdminSecretKey(providedKey: string): boolean {
    if (!ADMIN_SECRET_KEY) {
        console.warn('⚠️ ADMIN_SECRET_KEY is not set!');
        return false;
    }
    return providedKey === ADMIN_SECRET_KEY;
}

// ==================== JWT TOKEN MANAGEMENT ====================

interface AdminTokenPayload {
    userId: string;
    email: string;
    role: string;
    isAdmin: true;
}

export function generateAdminToken(user: { id: string; email: string; role: string }): string {
    const payload: AdminTokenPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        isAdmin: true,
    };

    return jwt.sign(payload, ADMIN_JWT_SECRET, { expiresIn: '1h' });
}

export function verifyAdminToken(token: string): AdminTokenPayload | null {
    try {
        const decoded = jwt.verify(token, ADMIN_JWT_SECRET) as AdminTokenPayload;
        if (!decoded.isAdmin) return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function getAdminSession(): Promise<AdminTokenPayload | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) return null;

    return verifyAdminToken(token);
}

export async function setAdminSession(token: string): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60, // 1 hour
        path: '/',
    });
}

export async function clearAdminSession(): Promise<void> {
    const cookieStore = await cookies();
    cookieStore.delete('admin_token');
}

// ==================== AUDIT LOGGING ====================

export async function logAdminAction(
    userId: string | null,
    action: string,
    resourceType: string,
    resourceId: string | null,
    details: Record<string, unknown>,
    ip: string
): Promise<void> {
    try {
        await prisma.auditLog.create({
            data: {
                userId,
                action,
                resourceType,
                resourceId,
                newValue: JSON.stringify(details),
                ipAddress: ip,
                severity: 'INFO',
            },
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

// ==================== ADMIN VALIDATION ====================

export async function validateAdminUser(email: string): Promise<{ id: string; email: string; role: string; passwordHash: string } | null> {
    const user = await prisma.user.findUnique({
        where: { email },
        select: {
            id: true,
            email: true,
            role: true,
            passwordHash: true,
            isActive: true,
        },
    });

    if (!user || !user.isActive) return null;
    if (user.role !== 'ADMIN') return null;

    return user;
}
