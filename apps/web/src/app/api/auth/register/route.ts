import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import prisma from '@/lib/db';

const CONSENT_VERSION = 'v1.0';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, email, password, consents } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json(
                { error: 'E-posta ve şifre gereklidir' },
                { status: 400 }
            );
        }

        if (password.length < 8) {
            return NextResponse.json(
                { error: 'Şifre en az 8 karakter olmalıdır' },
                { status: 400 }
            );
        }

        // Validate required consents
        const requiredScopes = ['DATA_COLLECTION', 'MEMORY_STORAGE', 'AI_PROCESSING'];
        const grantedConsents = consents || [];
        const hasRequiredConsents = requiredScopes.every(scope =>
            grantedConsents.includes(scope)
        );

        if (!hasRequiredConsents) {
            return NextResponse.json(
                { error: 'Zorunlu onayları kabul etmeniz gerekmektedir' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        });

        if (existingUser) {
            return NextResponse.json(
                { error: 'Bu e-posta adresiyle zaten bir hesap var' },
                { status: 409 }
            );
        }

        // Get IP address for consent records
        const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0] ||
            request.headers.get('x-real-ip') ||
            'unknown';
        const userAgent = request.headers.get('user-agent') || undefined;

        // Hash password
        const passwordHash = await bcrypt.hash(password, 12);

        // Create user with consents in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Create user
            const user = await tx.user.create({
                data: {
                    name: name || null,
                    email,
                    passwordHash,
                    role: 'USER'
                },
                select: {
                    id: true,
                    email: true,
                    name: true,
                    role: true,
                    createdAt: true
                }
            });

            // Create consent records
            const consentRecords = grantedConsents.map((scope: string) => ({
                userId: user.id,
                scope,
                version: CONSENT_VERSION,
                ipAddress,
                userAgent
            }));

            await tx.consentRecord.createMany({
                data: consentRecords
            });

            // Create default persona
            const persona = await tx.persona.create({
                data: {
                    userId: user.id,
                    name: name || 'Varsayılan Persona',
                    identityMemory: JSON.stringify({
                        traits: [],
                        values: [],
                        description: ''
                    }),
                    preferences: JSON.stringify({}),
                    system1Weight: 0.5,
                    system2Weight: 0.5,
                    decisionThreshold: 0.7
                }
            });

            return { user, persona };
        });

        return NextResponse.json({
            message: 'Hesap başarıyla oluşturuldu',
            user: result.user
        }, { status: 201 });

    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json(
            { error: 'Kayıt sırasında bir hata oluştu' },
            { status: 500 }
        );
    }
}
