import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const conversations = await prisma.conversation.findMany({
        where: { persona: { userId: user!.id } },
        include: {
            persona: { select: { name: true } },
            _count: { select: { messages: true } }
        },
        orderBy: { startedAt: 'desc' },
        take: 50
    });

    return NextResponse.json({ conversations });
}
