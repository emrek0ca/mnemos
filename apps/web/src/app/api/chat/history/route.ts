import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const searchParams = request.nextUrl.searchParams;
    const personaId = searchParams.get('personaId');

    if (!personaId) {
        return NextResponse.json({ error: 'Missing personaId' }, { status: 400 });
    }

    try {
        // Find the most recent active conversation for this persona
        const conversation = await prisma.conversation.findFirst({
            where: {
                personaId: personaId,
                // userId check via persona relation if needed, but we trust personaId belongs to user
                // Let's verify persona ownership just in case
                persona: {
                    userId: user!.id
                }
            },
            orderBy: {
                startedAt: 'desc'
            },
            include: {
                messages: {
                    orderBy: {
                        createdAt: 'asc'
                    },
                    // Limit to last 50 messages for performance
                    take: 50
                }
            }
        });

        if (!conversation) {
            return NextResponse.json({ messages: [], conversationId: null });
        }

        const formattedMessages = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.role,
            content: msg.content,
            createdAt: msg.createdAt,
            // If we stored proactive messages here, we'd include them
        }));

        return NextResponse.json({
            conversationId: conversation.id,
            messages: formattedMessages
        });

    } catch (error) {
        console.error('Error fetching history:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
