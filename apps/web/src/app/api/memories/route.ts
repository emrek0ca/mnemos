import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';

interface JWTPayload {
    id?: string;       // New session.ts uses 'id'
    userId?: string;   // Legacy tokens use 'userId'
    email: string;
}

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Use verifyAuth from middleware if available, or try/catch the verification locally
        let payload: JWTPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }

        // Support both 'id' (new session.ts) and 'userId' (legacy)
        const userId = payload.id || payload.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Invalid token payload' }, { status: 401 });
        }

        // Get user's first persona
        const persona = await prisma.persona.findFirst({
            where: { userId }
        });

        if (!persona) {
            return NextResponse.json({ memories: [] });
        }

        // Get all memories
        const memories = await prisma.memoryEntry.findMany({
            where: { personaId: persona.id },
            orderBy: { createdAt: 'desc' },
            take: 100
        });

        return NextResponse.json({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            memories: memories.map((m: any) => ({
                id: m.id,
                content: m.content,
                type: m.type,
                importanceScore: m.importanceScore,
                accessCount: m.accessCount || 0,
                lastAccessed: m.lastAccessed?.toISOString() || null,
                metadata: m.metadata ? JSON.parse(m.metadata) : null,
                createdAt: m.createdAt.toISOString()
            }))
        });
    } catch (error) {
        console.error('Memories API error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let payload: JWTPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const { content, type, importance } = await request.json();

        // Support both 'id' (new session.ts) and 'userId' (legacy)
        const userId = payload.id || payload.userId;

        // Get user's first persona
        const persona = await prisma.persona.findFirst({
            where: { userId }
        });

        if (!persona) {
            return NextResponse.json({ error: 'No persona found' }, { status: 400 });
        }

        const memory = await prisma.memoryEntry.create({
            data: {
                personaId: persona.id,
                content,
                type: type || 'EPISODIC',
                importanceScore: importance || 0.5
            }
        });

        return NextResponse.json({
            memory: {
                id: memory.id,
                content: memory.content,
                type: memory.type,
                importanceScore: memory.importanceScore
            }
        });
    } catch (error) {
        console.error('Create memory error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
// Update a memory
export async function PUT(request: Request) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth-token')?.value;

        if (!token) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let payload: JWTPayload;
        try {
            payload = jwt.verify(token, JWT_SECRET) as JWTPayload;
        } catch {
            return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
        }
        const { id, content, importance } = await request.json();

        // Verify ownership via persona
        const memory = await prisma.memoryEntry.findUnique({
            where: { id },
            include: { persona: true }
        });

        const userId = payload.id || payload.userId;
        if (!memory || memory.persona.userId !== userId) {
            return NextResponse.json({ error: 'Memory not found or unauthorized' }, { status: 404 });
        }

        const updatedMemory = await prisma.memoryEntry.update({
            where: { id },
            data: {
                content: content !== undefined ? content : memory.content,
                importanceScore: importance !== undefined ? importance : memory.importanceScore
            }
        });

        return NextResponse.json({
            memory: {
                id: updatedMemory.id,
                content: updatedMemory.content,
                type: updatedMemory.type,
                importanceScore: updatedMemory.importanceScore
            }
        });
    } catch (error) {
        console.error('Update memory error:', error);
        return NextResponse.json({ error: 'An error occurred' }, { status: 500 });
    }
}
