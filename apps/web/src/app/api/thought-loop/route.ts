
import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';
import { thoughtEngine } from '@/lib/ai/thought-engine';
import prisma from '@/lib/db';

export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    // Get active persona
    const persona = await prisma.persona.findFirst({
        where: { userId: user!.id },
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        return NextResponse.json({ error: 'No persona found' }, { status: 404 });
    }

    // Trigger Rumination
    const thought = await thoughtEngine.ruminate(persona.id);

    if (thought) {
        // Save it (this also saves proactive messages if urgency > 0.7)
        await thoughtEngine.saveThought(persona.id, thought);

        // Check for any undelivered proactive messages
        const proactiveMessages = await prisma.proactiveMessage.findMany({
            where: {
                personaId: persona.id,
                isDelivered: false
            },
            orderBy: { createdAt: 'desc' },
            take: 3
        });

        return NextResponse.json({
            success: true,
            thought,
            proactiveMessages: proactiveMessages.map(m => ({
                id: m.id,
                content: m.content,
                urgency: m.urgency,
                topic: m.topic,
                mood: m.mood
            }))
        });
    }

    return NextResponse.json({ success: false, message: "No thought generated" });
}
