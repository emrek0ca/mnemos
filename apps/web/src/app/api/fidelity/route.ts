import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import {
    calculateFidelityMetrics,
    getFidelityHistory,
    detectDeviations
} from '@/lib/ai/fidelity-metrics';
import prisma from '@/lib/db';

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

        const payload = jwt.verify(token, JWT_SECRET) as JWTPayload;

        // Get personaId from query params or use first persona
        const { searchParams } = new URL(request.url);
        let personaId = searchParams.get('personaId');
        const action = searchParams.get('action') || 'metrics';

        if (!personaId) {
            const persona = await prisma.persona.findFirst({
                where: { userId: payload.userId }
            });
            personaId = persona?.id || null;
        }

        if (!personaId) {
            return NextResponse.json({
                metrics: {
                    overallScore: 0,
                    consistency: 0,
                    personalityAlignment: 0,
                    memoryIntegrity: 0,
                    temporalStability: 0
                },
                message: 'No persona found'
            });
        }

        switch (action) {
            case 'metrics':
                const metrics = await calculateFidelityMetrics(personaId);
                return NextResponse.json({ metrics });

            case 'history':
                const days = parseInt(searchParams.get('days') || '30');
                const history = await getFidelityHistory(personaId, days);
                return NextResponse.json({ history });

            case 'deviations':
                const deviations = await detectDeviations(personaId);
                return NextResponse.json({ deviations });

            default:
                const allMetrics = await calculateFidelityMetrics(personaId);
                const recentHistory = await getFidelityHistory(personaId, 7);
                const recentDeviations = await detectDeviations(personaId);

                return NextResponse.json({
                    metrics: allMetrics,
                    history: recentHistory,
                    deviations: recentDeviations.slice(0, 5)
                });
        }
    } catch (error) {
        console.error('Fidelity API error:', error);
        return NextResponse.json(
            { error: 'An error occurred' },
            { status: 500 }
        );
    }
}
