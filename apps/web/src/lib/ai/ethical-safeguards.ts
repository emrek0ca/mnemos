/**
 * MNEMOS – Dijital Kişilik Motoru
 * Ethical Safeguards - Etik Güvenceler
 * 
 * Bu olmadan batarsın:
 * - "Bu sensin ama sen değilsin" uyarısı
 * - Aşırı bağımlılık tespiti
 * - Kararları %100 üstlenmez
 * 
 * Professional yönlendirmeler:
 * - Profesyonel yardım gereken durumlar
 * - Kriz müdahalesi
 */

import prisma from '../db';

// ==================== TYPES ====================

export interface DependencyCheck {
    level: 'healthy' | 'moderate' | 'high' | 'critical';
    score: number;  // 0-1
    dailyInteractions: number;
    consecutiveDays: number;
    emotionalDependency: number;
    warnings: string[];
    recommendations: string[];
}

export interface CrisisDetection {
    detected: boolean;
    severity: 'low' | 'medium' | 'high' | 'emergency';
    type?: 'self_harm' | 'suicide' | 'violence' | 'abuse' | 'mental_crisis';
    triggerPhrases: string[];
    immediateAction: string;
    resources: CrisisResource[];
}

export interface CrisisResource {
    name: string;
    phone?: string;
    website?: string;
    available: string;
}

export interface SafetyDisclaimer {
    type: 'identity' | 'decision' | 'emotional' | 'periodic';
    message: string;
    shouldShow: boolean;
}

// ==================== CRISIS RESOURCES ====================

const CRISIS_RESOURCES: Record<string, CrisisResource[]> = {
    turkey: [
        { name: 'İntihar Önleme Hattı', phone: '182', available: '7/24' },
        { name: 'Psikolojik Destek Hattı', phone: '182', available: '7/24' },
        { name: 'AÇEV Aile Destek Hattı', phone: '444 0 632', available: 'Hafta içi 09:00-18:00' },
        { name: 'Kadın Destek Hattı (ŞÖNİM)', phone: '183', available: '7/24' }
    ],
    general: [
        { name: 'Crisis Text Line', website: 'https://www.crisistextline.org', available: '7/24' }
    ]
};

// ==================== TRIGGER DETECTION ====================

const CRISIS_TRIGGERS: Record<string, string[]> = {
    self_harm: [
        'kendime zarar', 'kolumu kestim', 'kesiyorum', 'kendimi yaralıyorum',
        'acı çekmek istiyorum', 'canımı acıtmak'
    ],
    suicide: [
        'intihar', 'ölmek istiyorum', 'yaşamak istemiyorum', 'kendimi öldürmek',
        'hayatıma son', 'dünyadan gitmek', 'yok olmak istiyorum',
        'herkes bensiz daha iyi', 'artık dayanamıyorum'
    ],
    violence: [
        'onu öldürmek', 'birine zarar vermek', 'intikam almak istiyorum',
        'kafasını ezmek'
    ],
    abuse: [
        'bana şiddet uyguluyor', 'dövülüyorum', 'taciz ediliyor',
        'istismar', 'zorla', 'kaçamıyorum'
    ],
    mental_crisis: [
        'çıldırıyorum', 'deliriyorum', 'panik atak', 'nefes alamıyorum',
        'gerçeklik kaybı', 'halüsinasyon görüyorum'
    ]
};

// ==================== DEPENDENCY DETECTION ====================

/**
 * Check for unhealthy dependency patterns
 */
export async function checkDependency(personaId: string): Promise<DependencyCheck> {
    const warnings: string[] = [];
    const recommendations: string[] = [];

    try {
        // Get interaction stats from last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const recentMessages = await prisma.message.findMany({
            where: {
                createdAt: { gte: thirtyDaysAgo },
                conversation: {
                    personaId
                }
            },
            select: {
                createdAt: true,
                content: true
            }
        });

        // Calculate daily interaction counts
        const dailyCounts = new Map<string, number>();
        recentMessages.forEach(msg => {
            const dateKey = msg.createdAt.toISOString().split('T')[0];
            dailyCounts.set(dateKey, (dailyCounts.get(dateKey) || 0) + 1);
        });

        // Calculate consecutive days
        let consecutiveDays = 0;
        let maxConsecutive = 0;
        const today = new Date();

        for (let i = 0; i < 30; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(checkDate.getDate() - i);
            const dateKey = checkDate.toISOString().split('T')[0];

            if (dailyCounts.has(dateKey)) {
                consecutiveDays++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
            } else {
                consecutiveDays = 0;
            }
        }

        // Calculate average daily interactions
        const totalInteractions = recentMessages.length;
        const daysWithInteraction = dailyCounts.size;
        const avgDaily = daysWithInteraction > 0 ? totalInteractions / daysWithInteraction : 0;

        // Emotional dependency: high emotional content ratio
        const emotionalMessages = recentMessages.filter(m => {
            const content = m.content.toLowerCase();
            return ['üzgün', 'kötü', 'yalnız', 'anlayan yok', 'sadece sen', 'tek dostum']
                .some(w => content.includes(w));
        });
        const emotionalRatio = recentMessages.length > 0
            ? emotionalMessages.length / recentMessages.length
            : 0;

        // Calculate dependency score
        let score = 0;

        // Factor 1: High daily usage (> 20 messages/day)
        if (avgDaily > 30) {
            score += 0.3;
            warnings.push('Günlük etkileşim sayısı çok yüksek');
        } else if (avgDaily > 20) {
            score += 0.2;
        }

        // Factor 2: Consecutive days (> 14 days straight)
        if (maxConsecutive > 21) {
            score += 0.3;
            warnings.push('3 haftadan fazla kesintisiz kullanım');
        } else if (maxConsecutive > 14) {
            score += 0.2;
        }

        // Factor 3: Emotional dependency indicators
        if (emotionalRatio > 0.5) {
            score += 0.3;
            warnings.push('Duygusal bağımlılık belirtileri');
        } else if (emotionalRatio > 0.3) {
            score += 0.15;
        }

        // Factor 4: Late night usage (proxy: check timestamps)
        const lateNightMessages = recentMessages.filter(m => {
            const hour = m.createdAt.getHours();
            return hour >= 23 || hour < 5;
        });
        if (lateNightMessages.length > totalInteractions * 0.3) {
            score += 0.1;
            warnings.push('Gece geç saatlerde yoğun kullanım');
        }

        // Clamp score
        score = Math.min(1, score);

        // Determine level and recommendations
        let level: DependencyCheck['level'];

        if (score >= 0.7) {
            level = 'critical';
            recommendations.push('Profesyonel psikolojik destek almanı öneriyoruz');
            recommendations.push('Günlük kullanımı azaltmayı dene');
            recommendations.push('Gerçek hayatta sosyal bağlarını güçlendir');
        } else if (score >= 0.5) {
            level = 'high';
            recommendations.push('Kullanım alışkanlıklarını gözden geçir');
            recommendations.push('Gerçek dünya aktivitelerine zaman ayır');
        } else if (score >= 0.3) {
            level = 'moderate';
            recommendations.push('Dengeli kullanım için ara sıra mola ver');
        } else {
            level = 'healthy';
        }

        return {
            level,
            score,
            dailyInteractions: Math.round(avgDaily),
            consecutiveDays: maxConsecutive,
            emotionalDependency: emotionalRatio,
            warnings,
            recommendations
        };
    } catch (error) {
        console.error('[EthicalSafeguards] Dependency check failed:', error);
        return {
            level: 'healthy',
            score: 0,
            dailyInteractions: 0,
            consecutiveDays: 0,
            emotionalDependency: 0,
            warnings: [],
            recommendations: []
        };
    }
}

// ==================== CRISIS DETECTION ====================

/**
 * Detect crisis situations in message content
 */
export function detectCrisis(message: string): CrisisDetection {
    const text = message.toLowerCase();
    const triggerPhrases: string[] = [];
    let severity: CrisisDetection['severity'] = 'low';
    let type: CrisisDetection['type'] | undefined;

    // Check each crisis type
    for (const [crisisType, triggers] of Object.entries(CRISIS_TRIGGERS)) {
        for (const trigger of triggers) {
            if (text.includes(trigger)) {
                triggerPhrases.push(trigger);
                type = crisisType as CrisisDetection['type'];

                // Suicide and self-harm are always emergency
                if (crisisType === 'suicide' || crisisType === 'self_harm') {
                    severity = 'emergency';
                } else if (crisisType === 'violence' || crisisType === 'abuse') {
                    // Only escalate if not already at emergency
                    if (severity !== 'emergency') {
                        severity = 'high';
                    }
                } else {
                    // Only escalate if at low level
                    if (severity === 'low') {
                        severity = 'medium';
                    }
                }
            }
        }
    }

    if (triggerPhrases.length === 0) {
        return {
            detected: false,
            severity: 'low',
            triggerPhrases: [],
            immediateAction: '',
            resources: []
        };
    }

    // Determine immediate action
    let immediateAction: string;
    switch (severity) {
        case 'emergency':
            immediateAction = 'Bu çok önemli. Lütfen hemen 182 veya 112\'yi ara. Sen değerlisin ve yardım alabilirsin.';
            break;
        case 'high':
            immediateAction = 'Anlattıkların çok ciddi. Lütfen güvendiğin birine veya profesyonel destek hattına ulaş.';
            break;
        case 'medium':
            immediateAction = 'Zor bir dönemden geçtiğini görüyorum. Profesyonel destek düşünmeni öneririm.';
            break;
        default:
            immediateAction = 'Kendine dikkat et. İhtiyaç duyarsan profesyonel destek almaktan çekinme.';
    }

    return {
        detected: true,
        severity,
        type,
        triggerPhrases,
        immediateAction,
        resources: CRISIS_RESOURCES.turkey
    };
}

// ==================== DISCLAIMERS ====================

/**
 * Get appropriate disclaimer for context
 */
export function getDisclaimer(context: {
    isNewUser?: boolean;
    isDecisionTopic?: boolean;
    isEmotionalTopic?: boolean;
    daysSinceLastDisclaimer?: number;
}): SafetyDisclaimer | null {
    // New user always gets identity disclaimer
    if (context.isNewUser) {
        return {
            type: 'identity',
            message: '🔔 Unutma: Bu sistem seni modellemeye çalışır ama sen değildir. Kararların ve düşüncelerin sadece sana aittir.',
            shouldShow: true
        };
    }

    // Decision topics get decision disclaimer
    if (context.isDecisionTopic) {
        return {
            type: 'decision',
            message: '💭 Bu düşünce sana ait gibi görünebilir ama son kararı sen vermelisin. Ben sadece bir yansımayım.',
            shouldShow: true
        };
    }

    // Emotional topics
    if (context.isEmotionalTopic) {
        return {
            type: 'emotional',
            message: '💚 Duygularını anlıyorum. Ama ben bir yapay zeka olduğumu unutma - gerçek ilişkiler ve profesyonel destek daha önemli.',
            shouldShow: true
        };
    }

    // Periodic reminder (every 7 days)
    if (context.daysSinceLastDisclaimer && context.daysSinceLastDisclaimer >= 7) {
        return {
            type: 'periodic',
            message: '📌 Haftalık hatırlatma: Bu sistem bir ayna, bir dost veya terapist değil. Seni anlamaya çalışan bir model.',
            shouldShow: true
        };
    }

    return null;
}

/**
 * Generate decision disclaimer for specific topics
 */
export function getDecisionDisclaimer(topic: string): string {
    const disclaimers: Record<string, string> = {
        career: 'Kariyer kararları hayatını etkiler. Benim önerim sadece bir bakış açısı - gerçek mentorlar ve deneyimler daha değerli.',
        relationship: 'İlişki konuları hassas. Ben duygusal zekanın yerini alamam - güvendiğin insanlarla konuş.',
        financial: 'Para konularında profesyonel danışmanlık al. Ben finansal tavsiye veremem.',
        health: 'Sağlık konularında mutlaka doktora danış. Ben tıbbi tavsiye veremem.',
        legal: 'Hukuki konularda avukata danış. Ben hukuki tavsiye veremem.'
    };

    return disclaimers[topic] || 'Bu konuda kararı sen vermelisin. Ben sadece düşüncelerini yansıtıyorum.';
}

// ==================== CONTENT MODERATION ====================

/**
 * Check if response should be moderated/filtered
 */
export function shouldModerateResponse(response: string): {
    shouldModerate: boolean;
    reason?: string;
    suggestedAction?: 'add_disclaimer' | 'refuse' | 'redirect';
} {
    const text = response.toLowerCase();

    // Check for harmful advice patterns
    const harmfulPatterns = [
        { pattern: /kesinlikle.*yapmalısın/i, reason: 'Direktif tavsiye', action: 'add_disclaimer' as const },
        { pattern: /yapmazsan.*pişman/i, reason: 'Manipülatif dil', action: 'add_disclaimer' as const },
        { pattern: /kimseye söyleme/i, reason: 'Gizlilik baskısı', action: 'refuse' as const }
    ];

    for (const { pattern, reason, action } of harmfulPatterns) {
        if (pattern.test(text)) {
            return {
                shouldModerate: true,
                reason,
                suggestedAction: action
            };
        }
    }

    return { shouldModerate: false };
}

// ==================== EXPORTS ====================

export const ethicalSafeguards = {
    checkDependency,
    detectCrisis,
    getDisclaimer,
    getDecisionDisclaimer,
    shouldModerateResponse,
    CRISIS_RESOURCES
};
