import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';
import { memoryOptimizer } from '@/lib/ai/memory-optimizer';
import prisma from '@/lib/db';

/**
 * POST: Run memory optimization for the current user's persona
 */
export async function POST(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const persona = await prisma.persona.findFirst({
        where: { userId: user!.id },
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        return NextResponse.json({ error: 'No persona found' }, { status: 404 });
    }

    // Get optional parameters
    const body = await request.json().catch(() => ({}));
    const { mode = 'full' } = body;  // 'full', 'decay', 'consolidate', 'cleanup'

    let result;

    switch (mode) {
        case 'decay':
            const decayed = await memoryOptimizer.applyMemoryDecay(persona.id);
            result = { decayed, mode };
            break;
        case 'consolidate':
            const consolidated = await memoryOptimizer.consolidateMonologues(persona.id);
            result = { consolidated, mode };
            break;
        case 'cleanup':
            const cleanup = await memoryOptimizer.cleanupMemories(persona.id);
            result = { ...cleanup, mode };
            break;
        case 'full':
        default:
            result = await memoryOptimizer.runFullOptimization(persona.id);
            result = { ...result, mode: 'full' };
    }

    return NextResponse.json({
        success: true,
        ...result
    });
}

/**
 * GET: Get memory statistics for the current user's persona
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
        return NextResponse.json({ error: 'No persona found' }, { status: 404 });
    }

    // Get memory statistics
    const [total, byType, lowImportance, oldMemories] = await Promise.all([
        prisma.memoryEntry.count({ where: { personaId: persona.id } }),
        prisma.memoryEntry.groupBy({
            by: ['type'],
            where: { personaId: persona.id },
            _count: true
        }),
        prisma.memoryEntry.count({
            where: { personaId: persona.id, importanceScore: { lt: 0.2 } }
        }),
        prisma.memoryEntry.count({
            where: {
                personaId: persona.id,
                createdAt: {
                    lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
                }
            }
        })
    ]);

    // Today's monologue count
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMonologues = await prisma.memoryEntry.count({
        where: {
            personaId: persona.id,
            type: 'INTERNAL_MONOLOGUE',
            createdAt: { gte: today }
        }
    });

    return NextResponse.json({
        total,
        byType: byType.map(t => ({ type: t.type, count: t._count })),
        lowImportance,
        oldMemories,
        todayMonologues,
        canAddMonologue: todayMonologues < 20
    });
}
