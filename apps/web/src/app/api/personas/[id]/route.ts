import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    try {
        const { id } = await params;

        const persona = await prisma.persona.findFirst({
            where: {
                id,
                userId: user!.id
            },
            include: {
                _count: {
                    select: {
                        conversations: true,
                        memoryEntries: true
                    }
                }
            }
        });

        if (!persona) {
            return NextResponse.json(
                { error: 'Persona not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({ persona });
    } catch (error) {
        console.error('Error fetching persona:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
