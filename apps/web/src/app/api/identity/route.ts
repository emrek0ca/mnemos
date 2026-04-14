import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

interface IdentityCore {
    values: string[];
    moralBoundaries: string[];
    characterTraits: string[];
    signaturePhrases?: string[];
    voiceSettings?: {
        pitch: number;
        rate: number;
    };
    cognitiveStyle: {
        system1Tendency: number;
        riskTolerance: number;
        emotionalIntensity: number;
        uncertaintyTolerance: number;
    };
    personalityStyle?: {
        formality: number;
        directness: number;
        warmth: number;
        humor: number;
        confidence: number;
    };
    version: number;
    timestamp: string;
}

// GET - Retrieve identity
export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const persona = await prisma.persona.findFirst({
        where: { userId: user!.id },
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        return NextResponse.json({ error: 'No persona found' }, { status: 404 });
    }

    let identity = null;
    try {
        identity = persona.identityMemory ? JSON.parse(persona.identityMemory) : null;
    } catch (e) {
        console.error('Failed to parse identity memory', e);
    }

    return NextResponse.json({
        identity,
        personaName: persona.name
    });
}

// POST - Save/update identity
export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    const {
        values,
        moralBoundaries,
        characterTraits,
        cognitiveStyle,
        personalityStyle,
        voiceSettings,
        signaturePhrases
    } = body;

    const persona = await prisma.persona.findFirst({
        where: { userId: user!.id },
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        return NextResponse.json({ error: 'No persona found' }, { status: 404 });
    }

    // Get current version
    let currentVersion = 0;
    try {
        const currentIdentity = persona.identityMemory
            ? JSON.parse(persona.identityMemory)
            : null;
        currentVersion = currentIdentity?.version || 0;
    } catch {
        // Ignore
    }

    const newIdentity: IdentityCore = {
        values: values || [],
        moralBoundaries: moralBoundaries || [],
        characterTraits: characterTraits || [],
        signaturePhrases: signaturePhrases || [],
        voiceSettings: voiceSettings || { pitch: 1.0, rate: 1.0 },
        cognitiveStyle: cognitiveStyle || {
            system1Tendency: 0.5,
            riskTolerance: 0.5,
            emotionalIntensity: 0.5,
            uncertaintyTolerance: 0.5
        },
        personalityStyle: personalityStyle || {
            formality: 0.4,
            directness: 0.6,
            warmth: 0.6,
            humor: 0.3,
            confidence: 0.5
        },
        version: currentVersion + 1,
        timestamp: new Date().toISOString()
    };

    // Update persona
    await prisma.persona.update({
        where: { id: persona.id },
        data: {
            identityMemory: JSON.stringify(newIdentity),
            // Also update persona cognitive weights
            system1Weight: cognitiveStyle?.system1Tendency || 0.5,
            system2Weight: 1 - (cognitiveStyle?.system1Tendency || 0.5),
            decisionThreshold: 1 - (cognitiveStyle?.riskTolerance || 0.5)
        }
    });

    // Log the change
    await prisma.auditLog.create({
        data: {
            userId: user!.id,
            action: 'IDENTITY_UPDATE',
            resourceType: 'IDENTITY',
            resourceId: persona.id,
            oldValue: persona.identityMemory || null,
            newValue: JSON.stringify(newIdentity)
        }
    });

    return NextResponse.json({ identity: newIdentity });
}
