import { NextRequest, NextResponse } from 'next/server';
import { clearAdminSession, getAdminSession, logAdminAction, getClientIP } from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
    const ip = getClientIP(request.headers);

    try {
        const session = await getAdminSession();

        if (session) {
            await logAdminAction(session.userId, 'ADMIN_LOGOUT', 'AUTH', null, { ip }, ip);
        }

        await clearAdminSession();

        return NextResponse.json({
            success: true,
            message: 'Çıkış yapıldı',
        });
    } catch (error) {
        console.error('Admin logout error:', error);
        return NextResponse.json(
            { success: false, error: 'Çıkış yapılamadı' },
            { status: 500 }
        );
    }
}
