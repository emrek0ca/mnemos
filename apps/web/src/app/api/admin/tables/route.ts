import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { getAdminSession, isIPAllowed, getClientIP } from '@/lib/admin-auth';

// Tablo bilgileri - Prisma model isimleri
const TABLES = {
    users: { name: 'Kullanıcılar', icon: '👤' },
    api_keys: { name: 'API Anahtarları', icon: '🔑' },
    personas: { name: 'Personalar', icon: '🎭' },
    personality_dna: { name: 'Kişilik DNA', icon: '🧬' },
    mental_state_logs: { name: 'Zihinsel Durum', icon: '🧠' },
    value_nodes: { name: 'Değer Düğümleri', icon: '💎' },
    value_edges: { name: 'Değer Kenarları', icon: '🔗' },
    identity_snapshots: { name: 'Kimlik Anlık Görüntüleri', icon: '📸' },
    memory_entries: { name: 'Hafıza Kayıtları', icon: '💾' },
    memory_clusters: { name: 'Hafıza Kümeleri', icon: '🗂️' },
    proactive_messages: { name: 'Proaktif Mesajlar', icon: '💬' },
    conversations: { name: 'Konuşmalar', icon: '🗣️' },
    messages: { name: 'Mesajlar', icon: '✉️' },
    decisions: { name: 'Kararlar', icon: '⚖️' },
    usage_logs: { name: 'Kullanım Logları', icon: '📊' },
    audit_logs: { name: 'Denetim Logları', icon: '📋' },
    consistency_logs: { name: 'Tutarlılık Logları', icon: '✅' },
    abuse_logs: { name: 'Kötüye Kullanım', icon: '🚨' },
    api_key_events: { name: 'API Anahtar Olayları', icon: '📅' },
    consent_records: { name: 'Onay Kayıtları', icon: '📝' },
    user_encryption_keys: { name: 'Şifreleme Anahtarları', icon: '🔐' },
};

// Prisma model isimlerini tabloya çevir
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

export async function GET(request: NextRequest) {
    // Auth check
    const ip = getClientIP(request.headers);

    if (!isIPAllowed(ip)) {
        return NextResponse.json(
            { success: false, error: 'Erişim reddedildi' },
            { status: 403 }
        );
    }

    const session = await getAdminSession();
    if (!session) {
        return NextResponse.json(
            { success: false, error: 'Oturum gerekli' },
            { status: 401 }
        );
    }

    try {
        const tableStats = await Promise.all(
            Object.entries(TABLES).map(async ([tableName, info]) => {
                const modelName = TABLE_TO_MODEL[tableName];
                // @ts-expect-error - Dynamic model access
                const count = await prisma[modelName].count();
                return {
                    id: tableName,
                    name: info.name,
                    icon: info.icon,
                    count,
                };
            })
        );

        return NextResponse.json({
            success: true,
            tables: tableStats,
            totalTables: tableStats.length,
            totalRecords: tableStats.reduce((acc, t) => acc + t.count, 0),
        });
    } catch (error) {
        console.error('Admin tables error:', error);
        return NextResponse.json(
            { success: false, error: 'Tablolar yüklenemedi' },
            { status: 500 }
        );
    }
}

export { TABLES, TABLE_TO_MODEL };
