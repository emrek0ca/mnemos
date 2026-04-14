import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

// GET - List user's personas
export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const personas = await prisma.persona.findMany({
        where: { userId: user!.id },
        include: {
            _count: {
                select: {
                    conversations: true,
                    memoryEntries: true
                }
            },
            personalityDNA: {
                select: {
                    setupCompleted: true,
                    setupStep: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({ personas });
}

// POST - Create new persona
export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    const {
        name,
        identityMemory,
        preferences,
        system1Weight = 0.5,
        system2Weight = 0.5,
        decisionThreshold = 0.7
    } = body;

    if (!name) {
        return NextResponse.json(
            { error: 'Persona name is required' },
            { status: 400 }
        );
    }

    const persona = await prisma.persona.create({
        data: {
            userId: user!.id,
            name,
            identityMemory: identityMemory || { traits: [], values: [], description: '' },
            preferences: preferences || {},
            system1Weight,
            system2Weight,
            decisionThreshold
        }
    });

    return NextResponse.json({ persona }, { status: 201 });
}

// PUT - Update persona
export async function PUT(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const body = await request.json();
    const {
        id,
        name,
        identityMemory,
        preferences,
        system1Weight,
        system2Weight,
        decisionThreshold
    } = body;

    if (!id) {
        return NextResponse.json(
            { error: 'Persona ID is required' },
            { status: 400 }
        );
    }

    // Verify ownership
    const existingPersona = await prisma.persona.findFirst({
        where: { id, userId: user!.id }
    });

    if (!existingPersona) {
        return NextResponse.json(
            { error: 'Persona not found' },
            { status: 404 }
        );
    }

    const persona = await prisma.persona.update({
        where: { id },
        data: {
            name: name ?? existingPersona.name,
            identityMemory: identityMemory ?? existingPersona.identityMemory,
            preferences: preferences ?? existingPersona.preferences,
            system1Weight: system1Weight ?? existingPersona.system1Weight,
            system2Weight: system2Weight ?? existingPersona.system2Weight,
            decisionThreshold: decisionThreshold ?? existingPersona.decisionThreshold
        }
    });

    return NextResponse.json({ persona });
}

// DELETE - Delete persona
export async function DELETE(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const personaId = searchParams.get('id');

    if (!personaId) {
        return NextResponse.json(
            { error: 'Persona ID is required' },
            { status: 400 }
        );
    }

    // Verify ownership
    const existingPersona = await prisma.persona.findFirst({
        where: { id: personaId, userId: user!.id }
    });

    if (!existingPersona) {
        return NextResponse.json(
            { error: 'Persona not found' },
            { status: 404 }
        );
    }

    await prisma.persona.delete({
        where: { id: personaId }
    });

    return NextResponse.json({ message: 'Persona deleted successfully' });
}
