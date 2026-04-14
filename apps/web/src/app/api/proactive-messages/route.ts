import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';
import prisma from '@/lib/db';

/**
 * GET: Fetch undelivered proactive messages for current user's persona
 */
export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const persona = await prisma.persona.findFirst({
        where: { userId: user!.id },
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        return NextResponse.json({ messages: [] });
    }

    // Get undelivered proactive messages
    const messages = await prisma.proactiveMessage.findMany({
        where: {
            personaId: persona.id,
            isDelivered: false
        },
        orderBy: { createdAt: 'desc' },
        take: 5
    });

    return NextResponse.json({ messages });
}

/**
 * POST: Mark a proactive message as delivered
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { messageId } = await request.json();

    if (!messageId) {
        return NextResponse.json({ error: 'Message ID required' }, { status: 400 });
    }

    // Verify ownership through persona
    const message = await prisma.proactiveMessage.findUnique({
        where: { id: messageId },
        include: { persona: true }
    });

    if (!message || message.persona.userId !== user!.id) {
        return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    // Mark as delivered
    await prisma.proactiveMessage.update({
        where: { id: messageId },
        data: {
            isDelivered: true,
            deliveredAt: new Date()
        }
    });

    return NextResponse.json({ success: true });
}
