import { NextResponse } from 'next/server';
import { analyzeDreaming, applyDreaming } from '@/lib/ai/dream-engine';
import prisma from '@/lib/db';
import { isUserPremium } from '@/lib/limits';

export async function POST(req: Request) {
    try {
        const body = await req.json().catch(() => ({}));
        const { action = 'analyze', analysis, changes } = body;

        // In a real app, get user/persona from session
        // For now, get the first active persona
        const persona = await prisma.persona.findFirst();

        if (!persona) {
            return NextResponse.json({ error: 'Persona not found' }, { status: 404 });
        }

        // PREMIUM CHECK: Dreaming is a premium-only feature
        const isPremium = await isUserPremium(persona.userId);
        if (!isPremium) {
            return NextResponse.json({
                error: 'Dreaming is a Premium feature',
                type: 'PREMIUM_REQUIRED'
            }, { status: 403 });
        }

        let result;

        if (action === 'apply') {
            if (!analysis || !changes) {
                return NextResponse.json({ error: 'Missing analysis or changes for apply action' }, { status: 400 });
            }
            result = await applyDreaming(persona.id, analysis, changes);
        } else {
            // Default to analyze
            result = await analyzeDreaming(persona.id);
        }

        return NextResponse.json({
            success: true,
            result
        });

    } catch (error) {
        console.error('Dreaming failed:', error);
        return NextResponse.json(
            { error: 'Internal Server Error', details: String(error) },
            { status: 500 }
        );
    }
}
