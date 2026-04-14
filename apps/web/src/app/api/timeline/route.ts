import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { verifyAuth, requireAuth } from '@/lib/auth-middleware';

interface TimelineEvent {
    id: string;
    type: 'identity_change' | 'conversation' | 'memory' | 'consistency' | 'cognitive_event';
    title: string;
    description: string;
    timestamp: Date;
    metadata?: {
        previousVersion?: number;
        newVersion?: number;
        field?: string;
        severity?: string;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        [key: string]: any; // Allow flexible metadata
    };
}

export async function GET(request: NextRequest) {
    const user = await verifyAuth(request);
    const authError = requireAuth(user);
    if (authError) return authError;

    const { searchParams } = new URL(request.url);
    const eventType = searchParams.get('type'); // Optional filter
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const events: TimelineEvent[] = [];

    // 1. Fetch identity changes
    const identityLogs = await prisma.auditLog.findMany({
        where: {
            userId: user!.id,
            resourceType: 'IDENTITY'
        },
        orderBy: { createdAt: 'desc' },
        take: Math.floor(limit / 3)
    });

    for (const log of identityLogs) {
        let title = 'Kimlik değişikliği';
        let description = log.action;
        let previousVersion = 0;
        let newVersion = 0;

        try {
            if (log.oldValue) {
                const oldData = JSON.parse(log.oldValue);
                previousVersion = oldData.version || 0;
            }
            if (log.newValue) {
                const newData = JSON.parse(log.newValue);
                newVersion = newData.version || 0;
            }
        } catch {
            // Ignore parsing errors
        }

        if (log.action === 'IDENTITY_UPDATE' || log.action.includes('cognitiveStyle')) {
            title = 'Bilişsel stil güncellendi';
            description = `Versiyon ${previousVersion} → ${newVersion}`;
        } else if (log.action === 'INITIALIZATION') {
            title = 'Kimlik oluşturuldu';
            description = 'İlk kimlik yapılandırması';
        }

        events.push({
            id: log.id,
            type: 'identity_change',
            title,
            description,
            timestamp: log.createdAt,
            metadata: {
                previousVersion,
                newVersion,
                field: log.action
            }
        });
    }

    // 2. Fetch cognitive events (from orchestrator)
    const cognitiveEvents = await prisma.auditLog.findMany({
        where: {
            resourceType: 'COGNITIVE_EVENT'
        },
        orderBy: { createdAt: 'desc' },
        take: Math.floor(limit / 3)
    });

    for (const log of cognitiveEvents) {
        let title = 'Bilişsel olay';
        let description = '';
        let details: Record<string, unknown> = {};

        try {
            details = log.newValue ? JSON.parse(log.newValue) : {};
        } catch {
            // Ignore
        }

        switch (log.action) {
            case 'memory_created':
                title = details.action === 'promoted' ? 'Anı terfi etti' : 'Yeni anı oluşturuldu';
                description = `${details.from || 'Çalışma'} → ${details.to || 'Epizodik'}`;
                break;
            case 'learning_applied':
                title = 'Öğrenme uygulandı';
                description = String(details.reason || 'Analitiklerden adaptasyon');
                break;
            case 'consistency_violation':
                title = 'Tutarlılık uyarısı';
                description = 'Geçmiş ifadeyle potansiyel çelişki tespit edildi';
                break;
            case 'cognitive_shift':
                title = 'Bilişsel mod değişimi';
                description = String(details.reason || 'Bağlam bazlı adaptasyon');
                break;
            case 'cognitive_processing':
                title = 'Bilişsel Süreç';
                description = details.topic ? `Konu: ${details.topic}` : 'Bilişsel aktivite';
                // Add specific cognitive details to description for fallback
                if (details.cognitiveMode) {
                    description += ` • ${details.cognitiveMode}`;
                }
                break;
            default:
                title = log.action.replace(/_/g, ' ');
                description = 'Detaylar metadata içinde';
        }

        events.push({
            id: log.id,
            type: 'cognitive_event',
            title,
            description,
            timestamp: log.createdAt,
            metadata: {
                severity: log.severity,
                field: log.action,
                details: details // Pass full details object
            }
        });
    }

    // 3. Fetch consistency logs
    const persona = await prisma.persona.findFirst({
        where: { userId: user!.id }
    });

    if (persona) {
        const consistencyLogs = await prisma.consistencyLog.findMany({
            where: { personaId: persona.id },
            orderBy: { createdAt: 'desc' },
            take: Math.floor(limit / 3)
        });

        for (const log of consistencyLogs) {
            let context: Record<string, unknown> = {};
            try {
                context = JSON.parse(log.context);
            } catch {
                // Ignore
            }

            events.push({
                id: log.id,
                type: 'consistency',
                title: `Tutarlılık kaydı: ${log.detectedIssue}`,
                description: String(context.topic || 'Genel konu'),
                timestamp: log.createdAt,
                metadata: {
                    field: log.detectedIssue
                }
            });
        }
    }

    // Sort all events by timestamp (newest first)
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Filter by type if requested
    const filteredEvents = eventType
        ? events.filter(e => e.type === eventType)
        : events;

    return NextResponse.json({
        events: filteredEvents.slice(0, limit),
        totalCount: filteredEvents.length
    });
}

