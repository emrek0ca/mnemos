import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import prisma from '@/lib/db';
import { analyzeConversation, getAggregateInsights, createMemoriesFromConversation } from '@/lib/ai/conversation-analyzer';
import { calculateFidelityMetrics, getFidelityHistory } from '@/lib/ai/fidelity-metrics';
import { cognitiveOrchestrator } from '@/lib/ai/cognitive-orchestrator';

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-change-me';

interface JWTPayload {
    userId: string;
    email: string;
}

export async function GET(request: Request) {
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

        const { searchParams } = new URL(request.url);
        const conversationId = searchParams.get('conversationId');
        const action = searchParams.get('action') || 'aggregate';

        // Get persona
        const persona = await prisma.persona.findFirst({
            where: { userId: payload.userId }
        });

        if (!persona) {
            return NextResponse.json({ error: 'No persona found' }, { status: 404 });
        }

        if (action === 'single' && conversationId) {
            // Analyze single conversation
            const insights = await analyzeConversation(conversationId);
            return NextResponse.json({ insights });
        }

        if (action === 'fidelity') {
            // Get fidelity metrics
            const metrics = await calculateFidelityMetrics(persona.id);
            const history = await getFidelityHistory(persona.id, 30);
            return NextResponse.json({
                metrics,
                history,
                recommendations: generateRecommendations(metrics)
            });
        }

        // Aggregate insights (default)
        const aggregateInsights = await getAggregateInsights(persona.id);
        const fidelityMetrics = await cognitiveOrchestrator.getFidelityMetrics(persona.id);

        return NextResponse.json({
            insights: aggregateInsights,
            fidelity: fidelityMetrics
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Analytics failed' }, { status: 500 });
    }
}

function generateRecommendations(metrics: {
    consistency: number;
    personalityAlignment: number;
    memoryIntegrity: number;
    temporalStability: number;
}): string[] {
    const recommendations: string[] = [];

    if (metrics.consistency < 0.6) {
        recommendations.push('Tutarlılık düşük. Daha analitik yanıtlar için ayarları güncelleyin.');
    }
    if (metrics.personalityAlignment < 0.5) {
        recommendations.push('Kişilik uyumu zayıf. Kimlik çekirdeğini gözden geçirin.');
    }
    if (metrics.memoryIntegrity < 0.7) {
        recommendations.push('Hafıza bütünlüğü geliştirilebilir. Daha fazla etkileşim önerilir.');
    }
    if (metrics.temporalStability < 0.6) {
        recommendations.push('Zamansal kararlılık düşük. Düzenli kullanım önerilir.');
    }

    if (recommendations.length === 0) {
        recommendations.push('Sistem optimal durumda çalışıyor.');
    }

    return recommendations;
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
        const { conversationId, action } = await request.json();

        // Get persona
        const persona = await prisma.persona.findFirst({
            where: { userId: payload.userId }
        });

        if (!persona) {
            return NextResponse.json({ error: 'No persona found' }, { status: 404 });
        }

        if (action === 'extract_memories' && conversationId) {
            // Extract memories from conversation
            const count = await createMemoriesFromConversation(conversationId, persona.id);
            return NextResponse.json({
                success: true,
                memoriesCreated: count
            });
        }

        if (action === 'apply_learning') {
            // Apply analytics-driven learning to identity
            const result = await cognitiveOrchestrator.applyAnalyticsLearning(persona.id);
            return NextResponse.json({
                success: true,
                learningApplied: result,
                message: result ? 'Öğrenme kimliğe uygulandı' : 'Güncelleme gerekli değil'
            });
        }

        if (action === 'run_maintenance') {
            // Run maintenance tasks
            const result = await cognitiveOrchestrator.runMaintenance(persona.id);
            return NextResponse.json({
                success: true,
                ...result
            });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

    } catch (error) {
        console.error('Analytics POST error:', error);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}

