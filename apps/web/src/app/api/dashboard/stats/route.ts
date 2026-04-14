import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    // Get counts
    const [personaCount, apiKeyCount, conversationCount, memoryCount] = await Promise.all([
        prisma.persona.count({ where: { userId: user!.id } }),
        prisma.apiKey.count({ where: { userId: user!.id, isActive: true } }),
        prisma.conversation.count({
            where: { persona: { userId: user!.id } }
        }),
        prisma.memoryEntry.count({
            where: { persona: { userId: user!.id } }
        })
    ]);

    // Get recent activity
    const recentConversations = await prisma.conversation.findMany({
        where: { persona: { userId: user!.id } },
        orderBy: { startedAt: 'desc' },
        take: 5,
        include: {
            persona: { select: { name: true } }
        }
    });

    const recentActivity = recentConversations.map((conv: { id: string; startedAt: Date; persona: { name: string } }) => ({
        id: conv.id,
        type: 'conversation' as const,
        description: `Conversation with ${conv.persona.name}`,
        timestamp: new Date(conv.startedAt).toLocaleString()
    }));

    return NextResponse.json({
        stats: {
            personaCount,
            apiKeyCount,
            conversationCount,
            memoryCount
        },
        recentActivity
    });
}
