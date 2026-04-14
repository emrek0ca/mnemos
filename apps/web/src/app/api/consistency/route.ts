import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';

interface JWTPayload {
    userId: string;
    email: string;
}

export async function GET() {
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

        // Get user's first persona
        const persona = await prisma.persona.findFirst({
            where: { userId: payload.userId }
        });

        if (!persona) {
            return NextResponse.json({ logs: [] });
        }

        // Get recent consistency logs
        const logs = await prisma.consistencyLog.findMany({
            where: { personaId: persona.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
            include: {
                message: {
                    select: {
                        content: true
                    }
                }
            }
        });

        return NextResponse.json({
            logs: logs.map(log => {
                let context = {};
                try {
                    context = JSON.parse(log.context);
                } catch (e) {
                    console.error(`Error parsing context for log ${log.id}:`, e);
                }

                return {
                    id: log.id,
                    deviationScore: log.deviationScore,
                    detectedIssue: log.detectedIssue,
                    context,
                    messageContent: log.message?.content || null,
                    createdAt: log.createdAt.toISOString()
                };
            })
        });
    } catch (error) {
        console.error('Consistency Logs API error:', error);
        // Safely handle unknown error objects
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: 'An error occurred', details: errorMessage }, { status: 500 });
    }
}
