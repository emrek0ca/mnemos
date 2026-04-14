import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        // Fetch snapshots for user's personas
        // We limit to the first active persona for now as per current single-persona UI design
        const persona = await prisma.persona.findFirst({
            where: { userId: user!.id },
            orderBy: { createdAt: 'asc' }
        });

        if (!persona) {
            return NextResponse.json({ snapshots: [] });
        }

        const snapshots = await prisma.identitySnapshot.findMany({
            where: {
                personaId: persona.id
            },
            orderBy: { version: 'asc' }
        });

        const formattedData = snapshots.map(s => {
            let state;
            try {
                state = JSON.parse(s.identityState);
            } catch {
                state = {};
            }

            return {
                version: s.version,
                timestamp: s.createdAt,
                cognitive: state.cognitiveStyle || {},
                personality: state.personalityStyle || {},
                reason: s.reasonForChange
            };
        });

        return NextResponse.json({ snapshots: formattedData });
    } catch (error) {
        console.error('Error fetching drift data:', error);
        return NextResponse.json({ error: 'Failed to fetch drift data' }, { status: 500 });
    }
}
