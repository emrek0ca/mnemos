import prisma from '@/lib/db';

export const CONTINUITY_LIMIT = 15; // Daily message limit for Free users

export const STOP_PHRASES = [
    "Burada durmamız gerekiyor.",
    "Devam edebilirim… ama bu, yüzeyde kalmak olur.",
    "Seni anlamaya yeni başlamıştım.",
    "Beni birkaç dakika tanıdın. Ama ben seni hatırlamaya yeni başlıyorum.",
    "Bu temasın devam etmesi için süreklilik gerekiyor."
];

export interface LimitResult {
    allowed: boolean;
    reason?: 'SHORT_CONTACT_LIMIT';
    message?: string;
}

/**
 * Checks if the user has reached the "Short Contact" limit.
 * Invisible limit: 15 messages in the last 24 hours.
 */
/**
 * Checks if the user has Premium status.
 * Currently hardcoded to false (Free Tier).
 */
export async function isUserPremium(userId: string): Promise<boolean> {
    // TODO: Connect to subscription table/service
    return false;
}

export async function checkContinuityLimit(userId: string): Promise<LimitResult> {
    const isPremium = await isUserPremium(userId);

    if (isPremium) {
        return { allowed: true };
    }

    // 2. Count messages in the last 24 hours
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // We need to query the Message table across all conversations for this user
    // Since Message is linked to Conversation, and Conversation to User (via ApiKey or directly if we adjust schema)
    // Let's rely on finding conversations for this user first.

    // Note: Schema has `Conversation` linked to `Persona`, and `Persona` to `User`.
    // So we find all persona IDs for this user, then messages in conversations of those personas.

    const userPersonas = await prisma.persona.findMany({
        where: { userId: userId },
        select: { id: true }
    });

    const personaIds = userPersonas.map(p => p.id);

    const messageCount = await prisma.message.count({
        where: {
            role: 'USER', // Only count user messages to be fair? Or both? "15-20 message chat". Usually turns.
            // User request said: "15–20 mesajlık doğal sohbet" (natural chat of 15-20 messages).
            // Let's count USER messages as "turns". 15 turns = ~30 messages total.
            createdAt: {
                gte: oneDayAgo
            },
            conversation: {
                personaId: {
                    in: personaIds
                }
            }
        }
    });

    if (messageCount >= CONTINUITY_LIMIT) {
        // Select a random stop phrase
        const randomPhrase = STOP_PHRASES[Math.floor(Math.random() * STOP_PHRASES.length)];
        return {
            allowed: false,
            reason: 'SHORT_CONTACT_LIMIT',
            message: randomPhrase
        };
    }

    return { allowed: true };
}
