import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/db';
import {
    BrainProfile,
    validateBrainProfile,
    brainProfileToIdentityCore
} from '@/lib/ai/identity';

const JWT_SECRET = process.env.JWT_SECRET || 'mnemos-secret-key';

interface TokenPayload {
    userId: string;
    email: string;
}

/**
 * POST /api/brain-profile
 * Save user's brain profile
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        let userId: string;
        try {
            const decoded = verify(token, JWT_SECRET) as TokenPayload;
            userId = decoded.userId;
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        // Parse body
        const profile: BrainProfile = await request.json();

        // Validate
        const validation = validateBrainProfile(profile);
        if (!validation.valid) {
            return NextResponse.json(
                { success: false, message: validation.errors.join(', ') },
                { status: 400 }
            );
        }

        // Get or create persona for user
        let persona = await prisma.persona.findFirst({
            where: { userId }
        });



        const fullProfileJson = JSON.stringify({
            ...profile,
            setupCompletedAt: new Date()
        });

        // Convert to IdentityCore and save
        const identityCore = {
            ...brainProfileToIdentityCore(profile),
            version: 1,
            timestamp: new Date()
        };

        const identityMemoryJson = JSON.stringify(identityCore);

        if (!persona) {
            persona = await prisma.persona.create({
                data: {
                    userId,
                    name: profile.basicInfo.name,
                    // Store full profile in preferences since emotionalMemory doesn't exist
                    preferences: fullProfileJson,
                    identityMemory: identityMemoryJson,
                    // coreBeliefs is not a column, it's inside identityMemory
                }
            });
        } else {
            // Update persona
            await prisma.persona.update({
                where: { id: persona.id },
                data: {
                    name: profile.basicInfo.name,
                    preferences: fullProfileJson,
                    identityMemory: identityMemoryJson
                }
            });
        }

        // Log this as an identity creation event
        await prisma.auditLog.create({
            data: {
                userId,
                action: 'BRAIN_PROFILE_CREATED',
                resourceType: 'IDENTITY',
                resourceId: persona.id,
                newValue: JSON.stringify(identityCore)
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Beyin profili kaydedildi',
            personaId: persona.id
        });

    } catch (error) {
        console.error('Brain profile save error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}

/**
 * GET /api/brain-profile
 * Get user's brain profile
 */
export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            );
        }

        let userId: string;
        try {
            const decoded = verify(token, JWT_SECRET) as TokenPayload;
            userId = decoded.userId;
        } catch {
            return NextResponse.json(
                { success: false, message: 'Invalid token' },
                { status: 401 }
            );
        }

        const persona = await prisma.persona.findFirst({
            where: { userId }
        });

        if (!persona || !persona.preferences) {
            return NextResponse.json({
                success: true,
                hasProfile: false,
                profile: null
            });
        }

        try {
            const profile = JSON.parse(persona.preferences);
            return NextResponse.json({
                success: true,
                hasProfile: true,
                profile
            });
        } catch {
            return NextResponse.json({
                success: true,
                hasProfile: false,
                profile: null
            });
        }

    } catch (error) {
        console.error('Brain profile get error:', error);
        return NextResponse.json(
            { success: false, message: 'Internal server error' },
            { status: 500 }
        );
    }
}
