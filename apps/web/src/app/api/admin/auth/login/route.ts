import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import {
    isIPAllowed,
    getClientIP,
    checkRateLimit,
    recordLoginAttempt,
    validateAdminSecretKey,
    validateAdminUser,
    generateAdminToken,
    setAdminSession,
    logAdminAction,
} from '@/lib/admin-auth';

export async function POST(request: NextRequest) {
    const ip = getClientIP(request.headers);

    // 1. IP Whitelist Check
    if (!isIPAllowed(ip)) {
        await logAdminAction(null, 'ADMIN_LOGIN_BLOCKED_IP', 'AUTH', null, { ip, reason: 'IP not in whitelist' }, ip);
        return NextResponse.json(
            { success: false, error: 'Erişim reddedildi' },
            { status: 403 }
        );
    }

    // 2. Rate Limit Check
    const rateLimit = checkRateLimit(ip);
    if (!rateLimit.allowed) {
        await logAdminAction(null, 'ADMIN_LOGIN_RATE_LIMITED', 'AUTH', null, { ip, blockedUntil: rateLimit.blockedUntil }, ip);
        return NextResponse.json(
            {
                success: false,
                error: `Çok fazla başarısız deneme. ${Math.ceil((rateLimit.blockedUntil!.getTime() - Date.now()) / 60000)} dakika sonra tekrar deneyin.`
            },
            { status: 429 }
        );
    }

    try {
        const { email, password, secretKey } = await request.json();

        // 3. Validate inputs
        if (!email || !password || !secretKey) {
            recordLoginAttempt(ip, false);
            return NextResponse.json(
                { success: false, error: 'Tüm alanları doldurun' },
                { status: 400 }
            );
        }

        // 4. Validate Admin Secret Key
        if (!validateAdminSecretKey(secretKey)) {
            recordLoginAttempt(ip, false);
            await logAdminAction(null, 'ADMIN_LOGIN_INVALID_SECRET', 'AUTH', null, { ip, email }, ip);
            return NextResponse.json(
                { success: false, error: 'Geçersiz gizli anahtar' },
                { status: 401 }
            );
        }

        // 5. Find Admin User
        const user = await validateAdminUser(email);
        if (!user) {
            recordLoginAttempt(ip, false);
            await logAdminAction(null, 'ADMIN_LOGIN_USER_NOT_FOUND', 'AUTH', null, { ip, email }, ip);
            return NextResponse.json(
                { success: false, error: 'Geçersiz kimlik bilgileri' },
                { status: 401 }
            );
        }

        // 6. Verify Password
        const passwordValid = await bcrypt.compare(password, user.passwordHash);
        if (!passwordValid) {
            recordLoginAttempt(ip, false);
            await logAdminAction(user.id, 'ADMIN_LOGIN_INVALID_PASSWORD', 'AUTH', null, { ip }, ip);
            return NextResponse.json(
                { success: false, error: 'Geçersiz kimlik bilgileri' },
                { status: 401 }
            );
        }

        // 7. Success - Generate Token
        recordLoginAttempt(ip, true);
        const token = generateAdminToken(user);
        await setAdminSession(token);

        // 8. Log successful login
        await logAdminAction(user.id, 'ADMIN_LOGIN_SUCCESS', 'AUTH', null, { ip, email: user.email }, ip);

        return NextResponse.json({
            success: true,
            message: 'Giriş başarılı',
        });
    } catch (error) {
        console.error('Admin login error:', error);
        return NextResponse.json(
            { success: false, error: 'Sunucu hatası' },
            { status: 500 }
        );
    }
}
