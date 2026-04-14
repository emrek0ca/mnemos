import { NextRequest, NextResponse } from 'next/server';
import { refreshAccessToken, getTokensFromRequest, setAuthCookies } from '@/lib/session';
import { rateLimitResponse } from '@/lib/rate-limiter';

export async function POST(request: NextRequest) {
    // Rate limiting
    const rateLimited = rateLimitResponse(request, 'auth');
    if (rateLimited) return rateLimited;

    try {
        const { refreshToken } = getTokensFromRequest(request);

        if (!refreshToken) {
            return NextResponse.json(
                { error: 'Refresh token required' },
                { status: 401 }
            );
        }

        const result = await refreshAccessToken(refreshToken);

        if (!result.success || !result.accessToken) {
            return NextResponse.json(
                { error: result.error || 'Failed to refresh token' },
                { status: 401 }
            );
        }

        // Create response with new access token
        const response = NextResponse.json({
            message: 'Token refreshed successfully',
            expiresIn: 15 * 60 // 15 minutes in seconds
        });

        // Set new access token cookie
        response.cookies.set('auth-token', result.accessToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 15 * 60
        });

        return response;

    } catch (error) {
        console.error('Token refresh error:', error);
        return NextResponse.json(
            { error: 'An error occurred during token refresh' },
            { status: 500 }
        );
    }
}
