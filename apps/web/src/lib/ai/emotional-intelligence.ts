/**
 * MNEMOS – Dijital Kişilik Motoru
 * Emotional Intelligence - Duygusal Zeka Modülü
 * 
 * Kullanıcının duygusal durumunu anlar ve uygun tepki verir.
 * 
 * - Duygu trendleri takibi
 * - Empati seviyesi ayarlama
 * - Duygusal destek sağlama
 * - Burnout/tükenmişlik tespiti
 */

import prisma from '../db';

// ==================== TYPES ====================

export interface EmotionalProfile {
    dominantEmotion: string;
    emotionHistory: EmotionSnapshot[];
    trend: 'improving' | 'stable' | 'declining';
    needsSupport: boolean;
    supportType?: 'encouragement' | 'empathy' | 'distraction' | 'professional';
}

export interface EmotionSnapshot {
    timestamp: Date;
    emotion: string;
    intensity: number;
    trigger?: string;
}

export interface EmpatheticResponse {
    acknowledgment: string;
    validation: string;
    suggestion?: string;
    followUpQuestion?: string;
}

export type EmotionCategory =
    | 'joy' | 'sadness' | 'anger' | 'fear'
    | 'disgust' | 'surprise' | 'trust' | 'anticipation'
    | 'loneliness' | 'anxiety' | 'frustration' | 'hope';

// ==================== EMOTION DETECTION ====================

const EMOTION_KEYWORDS: Record<EmotionCategory, string[]> = {
    joy: ['mutlu', 'sevinçli', 'harika', 'süper', 'muhteşem', 'bayıldım', 'çok iyi', 'mükemmel', 'güzel', 'keyifli'],
    sadness: ['üzgün', 'kederli', 'ağladım', 'kötü hissediyorum', 'mutsuz', 'moral bozuk', 'içim acıyor'],
    anger: ['sinirli', 'kızgın', 'öfkeli', 'delirdim', 'çıldırdım', 'sinir oldum', 'kafayı yedim', 'damarıma bastı'],
    fear: ['korkuyorum', 'endişeli', 'korkutuyor', 'tedirgin', 'panik', 'ürküyorum'],
    disgust: ['iğrenç', 'tiksiniyorum', 'mide bulandırıcı', 'berbat', 'rezalet'],
    surprise: ['şaşırdım', 'inanamıyorum', 'beklemiyordum', 'şok oldum', 'hayret'],
    trust: ['güveniyorum', 'emin', 'inanıyorum', 'huzurlu'],
    anticipation: ['heyecanlı', 'sabırsız', 'merak ediyorum', 'bekliyorum', 'dört gözle'],
    loneliness: ['yalnız', 'kimsem yok', 'tek başıma', 'anlayan yok', 'yabancılaştım'],
    anxiety: ['kaygılı', 'stresli', 'gergin', 'bunaldım', 'sıkıştım', 'panik atak'],
    frustration: ['sinir bozucu', 'çaresiz', 'yapamıyorum', 'olmadı', 'yetmiyor'],
    hope: ['umutlu', 'olacak', 'düzelecek', 'inanıyorum', 'iyimser']
};

/**
 * Detect emotions from text
 */
export function detectEmotions(text: string): Map<EmotionCategory, number> {
    const detected = new Map<EmotionCategory, number>();
    const lowerText = text.toLowerCase();

    for (const [emotion, keywords] of Object.entries(EMOTION_KEYWORDS)) {
        let intensity = 0;
        for (const keyword of keywords) {
            if (lowerText.includes(keyword)) {
                intensity += 0.3;
            }
        }
        if (intensity > 0) {
            detected.set(emotion as EmotionCategory, Math.min(1, intensity));
        }
    }

    // Intensity boosters
    const intensifiers = ['çok', 'aşırı', 'gerçekten', 'inanılmaz', 'son derece'];
    for (const intensifier of intensifiers) {
        if (lowerText.includes(intensifier)) {
            // Boost all detected
            detected.forEach((value, key) => {
                detected.set(key, Math.min(1, value * 1.3));
            });
            break;
        }
    }

    return detected;
}

/**
 * Get dominant emotion from detected map
 */
export function getDominantEmotion(emotions: Map<EmotionCategory, number>): {
    emotion: EmotionCategory;
    intensity: number;
} | null {
    let maxIntensity = 0;
    let dominant: EmotionCategory | null = null;

    emotions.forEach((intensity, emotion) => {
        if (intensity > maxIntensity) {
            maxIntensity = intensity;
            dominant = emotion;
        }
    });

    if (dominant) {
        return { emotion: dominant, intensity: maxIntensity };
    }
    return null;
}

// ==================== EMPATHETIC RESPONSES ====================

const EMPATHETIC_TEMPLATES: Record<EmotionCategory, EmpatheticResponse> = {
    joy: {
        acknowledgment: 'Mutluluğunuzu görmek güzel!',
        validation: 'Bu his çok değerli.',
        followUpQuestion: 'Ne oldu, anlat!'
    },
    sadness: {
        acknowledgment: 'Bu zor bir dönem gibi görünüyor.',
        validation: 'Üzülmek gayet normal, bastırma.',
        suggestion: 'Bazen sadece konuşmak bile iyi gelir.',
        followUpQuestion: 'Ne oldu, paylaşmak ister misin?'
    },
    anger: {
        acknowledgment: 'Sinirlenmen anlaşılır.',
        validation: 'Öfke duymak gayet normal.',
        suggestion: 'Nefes al, sonra konuşalım.'
    },
    fear: {
        acknowledgment: 'Korkmak insani bir şey.',
        validation: 'Bu tedirginlik gayet anlaşılır.',
        suggestion: 'Seni korkutan şeyi parçalayalım.',
        followUpQuestion: 'Tam olarak ne korkutuyor seni?'
    },
    disgust: {
        acknowledgment: 'Bu durumun rahatsız etmesi normal.',
        validation: 'Her şeyi kabul etmek zorunda değilsin.'
    },
    surprise: {
        acknowledgment: 'Vay, beklenmedik gelmiş!',
        validation: 'Şaşırmak gayet doğal.',
        followUpQuestion: 'Olumlu mu olumsuz mu şaşkınlık?'
    },
    trust: {
        acknowledgment: 'Güven çok değerli.',
        validation: 'Bu huzur önemli.'
    },
    anticipation: {
        acknowledgment: 'Heyecanını anlıyorum!',
        validation: 'Beklemek zor tabii.',
        followUpQuestion: 'Ne bekliyorsun, anlat!'
    },
    loneliness: {
        acknowledgment: 'Yalnızlık çok zor bir his.',
        validation: 'Bu hissi yaşaman gayet anlaşılır.',
        suggestion: 'Şu an buradayım, konuşabiliriz.',
        followUpQuestion: 'Ne zaman başladı bu his?'
    },
    anxiety: {
        acknowledgment: 'Kaygı çok yorucu olabiliyor.',
        validation: 'Bunalmak gayet normal.',
        suggestion: 'Şu an için sadece nefes al.',
        followUpQuestion: 'Seni en çok ne endişelendiriyor?'
    },
    frustration: {
        acknowledgment: 'Hayal kırıklığı gerçekten zor.',
        validation: 'Bu duygular gayet geçerli.',
        suggestion: 'Belki farklı bir yol deneyebiliriz.',
        followUpQuestion: 'Tam olarak ne takıldı?'
    },
    hope: {
        acknowledgment: 'Umut çok güzel!',
        validation: 'Bu his değerli, koru.',
        followUpQuestion: 'Neye umut bağlıyorsun?'
    }
};

/**
 * Generate empathetic response based on detected emotion
 */
export function generateEmpatheticResponse(
    emotion: EmotionCategory,
    intensity: number
): EmpatheticResponse {
    const template = EMPATHETIC_TEMPLATES[emotion];

    // Adjust based on intensity
    if (intensity > 0.7) {
        return {
            ...template,
            acknowledgment: `${template.acknowledgment} Bu yoğun bir his.`
        };
    }

    return template;
}

// ==================== EMOTIONAL TRACKING ====================

/**
 * Track emotional state over time
 */
export async function trackEmotion(
    personaId: string,
    emotion: string,
    intensity: number,
    trigger?: string
): Promise<void> {
    try {
        // Store as a memory with emotional type
        await prisma.memoryEntry.create({
            data: {
                personaId,
                type: 'EPISODIC',
                content: `Duygusal durum: ${emotion} (${intensity.toFixed(2)})${trigger ? ` - Tetikleyici: ${trigger}` : ''}`,
                importanceScore: intensity * 0.8,
                emotion,
                topic: 'emotional_tracking'
            }
        });
    } catch (error) {
        console.error('[EmotionalIntelligence] Failed to track emotion:', error);
    }
}

/**
 * Analyze emotional trend
 */
export async function analyzeEmotionalTrend(personaId: string): Promise<{
    trend: 'improving' | 'stable' | 'declining';
    dominantRecent: string;
    needsIntervention: boolean;
}> {
    try {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);

        const emotionalMemories = await prisma.memoryEntry.findMany({
            where: {
                personaId,
                topic: 'emotional_tracking',
                createdAt: { gte: weekAgo }
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });

        if (emotionalMemories.length < 3) {
            return { trend: 'stable', dominantRecent: 'neutral', needsIntervention: false };
        }

        // Count negative vs positive
        const negativeEmotions = ['sadness', 'anger', 'fear', 'anxiety', 'loneliness', 'frustration'];
        const positiveEmotions = ['joy', 'hope', 'trust', 'anticipation'];

        let negativeCount = 0;
        let positiveCount = 0;
        const recentEmotions: string[] = [];

        emotionalMemories.forEach(mem => {
            if (mem.emotion) {
                recentEmotions.push(mem.emotion);
                if (negativeEmotions.includes(mem.emotion)) negativeCount++;
                if (positiveEmotions.includes(mem.emotion)) positiveCount++;
            }
        });

        // Trend detection
        const firstHalf = emotionalMemories.slice(emotionalMemories.length / 2);
        const secondHalf = emotionalMemories.slice(0, emotionalMemories.length / 2);

        const firstNegative = firstHalf.filter(m => negativeEmotions.includes(m.emotion || '')).length;
        const secondNegative = secondHalf.filter(m => negativeEmotions.includes(m.emotion || '')).length;

        let trend: 'improving' | 'stable' | 'declining';
        if (secondNegative > firstNegative + 2) {
            trend = 'declining';
        } else if (firstNegative > secondNegative + 2) {
            trend = 'improving';
        } else {
            trend = 'stable';
        }

        // Dominant emotion
        const emotionCounts = new Map<string, number>();
        recentEmotions.slice(0, 5).forEach(e => {
            emotionCounts.set(e, (emotionCounts.get(e) || 0) + 1);
        });

        let dominantRecent = 'neutral';
        let maxCount = 0;
        emotionCounts.forEach((count, emotion) => {
            if (count > maxCount) {
                maxCount = count;
                dominantRecent = emotion;
            }
        });

        // Intervention needed?
        const needsIntervention =
            trend === 'declining' ||
            (negativeCount > positiveCount * 2) ||
            recentEmotions.slice(0, 3).every(e => negativeEmotions.includes(e));

        return { trend, dominantRecent, needsIntervention };
    } catch (error) {
        console.error('[EmotionalIntelligence] Failed to analyze trend:', error);
        return { trend: 'stable', dominantRecent: 'neutral', needsIntervention: false };
    }
}

/**
 * Detect burnout/tükenmişlik
 */
export function detectBurnout(
    recentEmotions: string[],
    messageLengths: number[],
    responseTime: number[] // Average response times
): {
    burnoutRisk: 'low' | 'medium' | 'high';
    indicators: string[];
} {
    const indicators: string[] = [];
    let riskScore = 0;

    // Indicator 1: Consistent negative emotions
    const negativeEmotions = ['frustration', 'anxiety', 'sadness', 'loneliness'];
    const negativeRatio = recentEmotions.filter(e => negativeEmotions.includes(e)).length / recentEmotions.length;
    if (negativeRatio > 0.7) {
        riskScore += 0.3;
        indicators.push('Sürekli negatif duygusal durum');
    }

    // Indicator 2: Decreasing message lengths (withdrawal)
    if (messageLengths.length > 5) {
        const firstHalf = messageLengths.slice(0, messageLengths.length / 2);
        const secondHalf = messageLengths.slice(messageLengths.length / 2);
        const avgFirst = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
        const avgSecond = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

        if (avgSecond < avgFirst * 0.5) {
            riskScore += 0.3;
            indicators.push('Mesaj uzunluklarında azalma');
        }
    }

    // Indicator 3: Frustration keywords
    const frustrationPhrases = ['vazgeçtim', 'olmayacak', 'bitirdim', 'dayanamıyorum', 'yetmez'];
    // This would need actual message content, placeholder logic

    let burnoutRisk: 'low' | 'medium' | 'high';
    if (riskScore >= 0.6) burnoutRisk = 'high';
    else if (riskScore >= 0.3) burnoutRisk = 'medium';
    else burnoutRisk = 'low';

    return { burnoutRisk, indicators };
}

// ==================== EXPORTS ====================

export const emotionalIntelligence = {
    detectEmotions,
    getDominantEmotion,
    generateEmpatheticResponse,
    trackEmotion,
    analyzeEmotionalTrend,
    detectBurnout,
    EMOTION_KEYWORDS
};
