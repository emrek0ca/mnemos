/**
 * MNEMOS – Session Security
 * Enhanced JWT handling with refresh tokens
 */

import jwt, { JwtPayload } from 'jsonwebtoken';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';
const ACCESS_TOKEN_EXPIRY = '15m';  // Short-lived access token
const REFRESH_TOKEN_EXPIRY = '7d';  // Long-lived refresh token

export interface TokenPayload extends JwtPayload {
    id: string;
    email: string;
    role: string;
    type: 'access' | 'refresh';
}

/**
 * Generate access token (short-lived)
 */
export function generateAccessToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            type: 'access'
        },
        JWT_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRY }
    );
}

/**
 * Generate refresh token (long-lived)
 */
export function generateRefreshToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            type: 'refresh'
        },
        JWT_SECRET,
        { expiresIn: REFRESH_TOKEN_EXPIRY }
    );
}

/**
 * Generate both tokens
 */
export function generateTokenPair(user: { id: string; email: string; role: string }) {
    return {
        accessToken: generateAccessToken(user),
        refreshToken: generateRefreshToken(user)
    };
}

/**
 * Verify and decode token
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
        return decoded;
    } catch {
        return null;
    }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
    try {
        const decoded = jwt.decode(token) as JwtPayload;
        if (!decoded || !decoded.exp) return true;
        return Date.now() >= decoded.exp * 1000;
    } catch {
        return true;
    }
}

/**
 * Get time until token expires (in seconds)
 */
export function getTokenExpiryTime(token: string): number {
    try {
        const decoded = jwt.decode(token) as JwtPayload;
        if (!decoded || !decoded.exp) return 0;
        return Math.max(0, decoded.exp - Math.floor(Date.now() / 1000));
    } catch {
        return 0;
    }
}

/**
 * Refresh access token using refresh token
 */
export async function refreshAccessToken(refreshToken: string): Promise<{
    success: boolean;
    accessToken?: string;
    error?: string;
}> {
    const payload = verifyToken(refreshToken);

    if (!payload) {
        return { success: false, error: 'Invalid refresh token' };
    }

    if (payload.type !== 'refresh') {
        return { success: false, error: 'Token is not a refresh token' };
    }

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { id: true, email: true, role: true, isActive: true }
    });

    if (!user || !user.isActive) {
        return { success: false, error: 'User not found or inactive' };
    }

    // Generate new access token
    const accessToken = generateAccessToken({
        id: user.id,
        email: user.email,
        role: user.role
    });

    return { success: true, accessToken };
}

/**
 * Set auth cookies on response
 */
export function setAuthCookies(
    response: NextResponse,
    accessToken: string,
    refreshToken: string
): NextResponse {
    const isProduction = process.env.NODE_ENV === 'production';

    // Access token cookie (short-lived)
    response.cookies.set('auth-token', accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'lax',
        maxAge: 15 * 60 // 15 minutes
    });

    // Refresh token cookie (long-lived, more restricted)
    response.cookies.set('refresh-token', refreshToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/api/auth', // Only sent to auth endpoints
        maxAge: 7 * 24 * 60 * 60 // 7 days
    });

    return response;
}

/**
 * Clear auth cookies (logout)
 */
export function clearAuthCookies(response: NextResponse): NextResponse {
    response.cookies.delete('auth-token');
    response.cookies.delete('refresh-token');
    return response;
}

/**
 * Extract tokens from request
 */
export function getTokensFromRequest(request: NextRequest): {
    accessToken: string | null;
    refreshToken: string | null;
} {
    return {
        accessToken: request.cookies.get('auth-token')?.value || null,
        refreshToken: request.cookies.get('refresh-token')?.value || null
    };
}
