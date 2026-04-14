import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';

export interface AuthUser {
    id: string;
    email: string;
    role: string;
}

/**
 * Verify JWT token and return user data
 */
export async function verifyAuth(request: NextRequest): Promise<AuthUser | null> {
    try {
        const token = request.cookies.get('auth-token')?.value;

        if (!token) {
            return null;
        }

        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Get authenticated user from database
 */
export async function getAuthUser(request: NextRequest) {
    const tokenData = await verifyAuth(request);

    if (!tokenData) {
        return null;
    }

    const user = await prisma.user.findUnique({
        where: { id: tokenData.id },
        select: {
            id: true,
            email: true,
            name: true,
            role: true,
            isActive: true,
            createdAt: true
        }
    });

    if (!user || !user.isActive) {
        return null;
    }

    return user;
}

/**
 * Middleware helper to require authentication
 */
export function requireAuth(user: AuthUser | null): NextResponse | null {
    if (!user) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }
    return null;
}

/**
 * Middleware helper to require admin role
 */
export function requireAdmin(user: AuthUser | null): NextResponse | null {
    if (!user) {
        return NextResponse.json(
            { error: 'Authentication required' },
            { status: 401 }
        );
    }
    if (user.role !== 'ADMIN') {
        return NextResponse.json(
            { error: 'Admin access required' },
            { status: 403 }
        );
    }
    return null;
}
