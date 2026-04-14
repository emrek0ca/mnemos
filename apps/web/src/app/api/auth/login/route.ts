import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';
import { rateLimitResponse, getClientIP } from '@/lib/rate-limiter';
import { LoginSchema, validateInput } from '@/lib/validators';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';

export async function POST(request: NextRequest) {
    // Rate limiting - auth endpoints are strictly limited
    const rateLimited = rateLimitResponse(request, 'auth');
    if (rateLimited) return rateLimited;

    try {
        const body = await request.json();

        // Input validation using Zod
        const validation = validateInput(LoginSchema, body);
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const { email, password } = validation.data;

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        if (!user.isActive) {
            return NextResponse.json(
                { error: 'Account is disabled' },
                { status: 403 }
            );
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.passwordHash);

        if (!isValidPassword) {
            // Log failed attempt for security monitoring
            const ip = getClientIP(request);
            console.warn(`Failed login attempt for ${email} from ${ip}`);

            return NextResponse.json(
                { error: 'Invalid email or password' },
                { status: 401 }
            );
        }

        // Generate JWT token with expiry
        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                iat: Math.floor(Date.now() / 1000)
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        // Create response with cookie
        const response = NextResponse.json({
            message: 'Login successful',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });

        // Set HTTP-only cookie
        response.cookies.set('auth-token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7 // 7 days
        });

        return response;

    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json(
            { error: 'An error occurred during login' },
            { status: 500 }
        );
    }
}
