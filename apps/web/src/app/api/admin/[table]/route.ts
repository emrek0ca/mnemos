import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession, isIPAllowed, getClientIP, logAdminAction } from '@/lib/admin-auth';

// Auth helper
async function checkAdminAuth(request: NextRequest) {
    const ip = getClientIP(request.headers);

    if (!isIPAllowed(ip)) {
        return { authorized: false, response: NextResponse.json({ success: false, error: 'Erişim reddedildi' }, { status: 403 }), ip };
    }

    const session = await getAdminSession();
    if (!session) {
        return { authorized: false, response: NextResponse.json({ success: false, error: 'Oturum gerekli' }, { status: 401 }), ip };
    }

    return { authorized: true, session, ip };
}

const TABLE_TO_MODEL: Record<string, string> = {
    users: 'user',
    api_keys: 'apiKey',
    personas: 'persona',
    personality_dna: 'personalityDNA',
    mental_state_logs: 'mentalStateLog',
    value_nodes: 'valueNode',
    value_edges: 'valueEdge',
    identity_snapshots: 'identitySnapshot',
    memory_entries: 'memoryEntry',
    memory_clusters: 'memoryCluster',
    proactive_messages: 'proactiveMessage',
    conversations: 'conversation',
    messages: 'message',
    decisions: 'decision',
    usage_logs: 'usageLog',
    audit_logs: 'auditLog',
    consistency_logs: 'consistencyLog',
    abuse_logs: 'abuseLog',
    api_key_events: 'apiKeyEvent',
    consent_records: 'consentRecord',
    user_encryption_keys: 'userEncryptionKey',
};

type RouteParams = { params: Promise<{ table: string }> };

// GET - Tablo verilerini listele
export async function GET(request: NextRequest, { params }: RouteParams) {
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) return auth.response;

    try {
        const { table } = await params;
        const modelName = TABLE_TO_MODEL[table];

        if (!modelName) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz tablo' },
                { status: 400 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const orderBy = searchParams.get('orderBy') || 'createdAt';
        const order = searchParams.get('order') || 'desc';

        const skip = (page - 1) * limit;

        const [records, total] = await Promise.all([
            // @ts-expect-error - Dynamic model access
            prisma[modelName].findMany({
                skip,
                take: limit,
                orderBy: { [orderBy]: order },
            }),
            // @ts-expect-error - Dynamic model access
            prisma[modelName].count(),
        ]);

        return NextResponse.json({
            success: true,
            records,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Admin table GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Veriler yüklenemedi' },
            { status: 500 }
        );
    }
}

// POST - Yeni kayıt ekle
export async function POST(request: NextRequest, { params }: RouteParams) {
    const auth = await checkAdminAuth(request);
    if (!auth.authorized) return auth.response;
    try {
        const { table } = await params;
        const modelName = TABLE_TO_MODEL[table];

        if (!modelName) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz tablo' },
                { status: 400 }
            );
        }

        const data = await request.json();

        // @ts-expect-error - Dynamic model access
        const record = await prisma[modelName].create({ data });

        return NextResponse.json({
            success: true,
            record,
        });
    } catch (error) {
        console.error('Admin table POST error:', error);
        return NextResponse.json(
            { success: false, error: 'Kayıt eklenemedi' },
            { status: 500 }
        );
    }
}
