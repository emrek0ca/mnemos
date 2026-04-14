import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';

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

type RouteParams = { params: Promise<{ table: string; id: string }> };

// GET - Tek kayıt getir
export async function GET(request: NextRequest, { params }: RouteParams) {
    try {
        const { table, id } = await params;
        const modelName = TABLE_TO_MODEL[table];

        if (!modelName) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz tablo' },
                { status: 400 }
            );
        }

        // @ts-expect-error - Dynamic model access
        const record = await prisma[modelName].findUnique({
            where: { id },
        });

        if (!record) {
            return NextResponse.json(
                { success: false, error: 'Kayıt bulunamadı' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            record,
        });
    } catch (error) {
        console.error('Admin record GET error:', error);
        return NextResponse.json(
            { success: false, error: 'Kayıt yüklenemedi' },
            { status: 500 }
        );
    }
}

// PUT - Kayıt güncelle
export async function PUT(request: NextRequest, { params }: RouteParams) {
    try {
        const { table, id } = await params;
        const modelName = TABLE_TO_MODEL[table];

        if (!modelName) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz tablo' },
                { status: 400 }
            );
        }

        const data = await request.json();

        // Remove id from update data
        delete data.id;
        delete data.createdAt;
        delete data.updatedAt;

        // @ts-expect-error - Dynamic model access
        const record = await prisma[modelName].update({
            where: { id },
            data,
        });

        return NextResponse.json({
            success: true,
            record,
        });
    } catch (error) {
        console.error('Admin record PUT error:', error);
        return NextResponse.json(
            { success: false, error: 'Kayıt güncellenemedi' },
            { status: 500 }
        );
    }
}

// DELETE - Kayıt sil
export async function DELETE(request: NextRequest, { params }: RouteParams) {
    try {
        const { table, id } = await params;
        const modelName = TABLE_TO_MODEL[table];

        if (!modelName) {
            return NextResponse.json(
                { success: false, error: 'Geçersiz tablo' },
                { status: 400 }
            );
        }

        // @ts-expect-error - Dynamic model access
        await prisma[modelName].delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: 'Kayıt silindi',
        });
    } catch (error) {
        console.error('Admin record DELETE error:', error);
        return NextResponse.json(
            { success: false, error: 'Kayıt silinemedi' },
            { status: 500 }
        );
    }
}
