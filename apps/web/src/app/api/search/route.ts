import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';
import { SearchSchema, validateInput } from '@/lib/validators';

interface SearchResult {
    type: 'memory' | 'message';
    id: string;
    content: string;
    relevance: number;
    metadata: {
        personaName?: string;
        memoryType?: string;
        messageRole?: string;
        createdAt: string;
    };
}

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        const searchParams = request.nextUrl.searchParams;
        const query = searchParams.get('query') || '';
        const type = searchParams.get('type') || 'all';

        // Validate input
        const validation = validateInput(SearchSchema, { query, type });
        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error },
                { status: 400 }
            );
        }

        const searchTerm = validation.data.query.toLowerCase();
        const searchType = validation.data.type;

        const results: SearchResult[] = [];

        // Get user's personas first
        const personas = await prisma.persona.findMany({
            where: { userId: user!.id },
            select: { id: true, name: true }
        });

        const personaIds = personas.map(p => p.id);
        const personaMap = new Map(personas.map(p => [p.id, p.name]));

        // Search memories
        if (searchType === 'all' || searchType === 'memories') {
            const memories = await prisma.memoryEntry.findMany({
                where: {
                    personaId: { in: personaIds },
                    content: { contains: searchTerm }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            for (const memory of memories) {
                // Calculate simple relevance score
                const content = memory.content.toLowerCase();
                const occurrences = (content.match(new RegExp(searchTerm, 'g')) || []).length;
                const relevance = Math.min(1, occurrences * 0.2 + (memory.importanceScore || 0.5) * 0.5);

                results.push({
                    type: 'memory',
                    id: memory.id,
                    content: memory.content,
                    relevance,
                    metadata: {
                        personaName: personaMap.get(memory.personaId),
                        memoryType: memory.type,
                        createdAt: memory.createdAt.toISOString()
                    }
                });
            }
        }

        // Search messages
        if (searchType === 'all' || searchType === 'messages') {
            // Get conversations for user's personas
            const conversations = await prisma.conversation.findMany({
                where: { personaId: { in: personaIds } },
                select: { id: true, personaId: true }
            });

            const conversationIds = conversations.map(c => c.id);
            const conversationToPersona = new Map(conversations.map(c => [c.id, c.personaId]));

            const messages = await prisma.message.findMany({
                where: {
                    conversationId: { in: conversationIds },
                    content: { contains: searchTerm }
                },
                orderBy: { createdAt: 'desc' },
                take: 20
            });

            for (const message of messages) {
                const content = message.content.toLowerCase();
                const occurrences = (content.match(new RegExp(searchTerm, 'g')) || []).length;
                const relevance = Math.min(1, occurrences * 0.2);

                const personaId = conversationToPersona.get(message.conversationId);

                results.push({
                    type: 'message',
                    id: message.id,
                    content: message.content.slice(0, 500), // Truncate for response
                    relevance,
                    metadata: {
                        personaName: personaId ? personaMap.get(personaId) : undefined,
                        messageRole: message.role,
                        createdAt: message.createdAt.toISOString()
                    }
                });
            }
        }

        // Sort by relevance
        results.sort((a, b) => b.relevance - a.relevance);

        return NextResponse.json({
            query: validation.data.query,
            type: searchType,
            count: results.length,
            results: results.slice(0, 30) // Limit total results
        });

    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json(
            { error: 'Search failed' },
            { status: 500 }
        );
    }
}
