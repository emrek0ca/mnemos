/**
 * MNEMOS – Cognitive Preservation System
 * Decision Gate - Psychological Threshold
 * 
 * NOT a technical router for performance.
 * This is a psychological threshold model that reflects
 * when a person shifts between intuitive and analytical thinking.
 * 
 * Same stimulus → Different individuals → Different cognitive responses
 * These thresholds are derived from observed behavioral patterns, not configured manually.
 */

import { IdentityCore, getIdentityCore } from './identity';

export interface PsychologicalFactors {
    perceivedRisk: number;        // 0-1: How risky does this feel?
    personalImportance: number;   // 0-1: How much does this matter personally?
    emotionalIntensity: number;   // 0-1: How emotionally charged is this?
    uncertaintyLevel: number;     // 0-1: How unclear is the situation?
}

export interface CognitiveDecision {
    mode: 'INTUITIVE' | 'ANALYTICAL' | 'MIXED';
    confidence: number;
    reasoning: string;
    factors: PsychologicalFactors;
    characterInfluence: string;
}

/**
 * Analyze input and determine cognitive processing mode
 * based on psychological thresholds unique to this individual
 */
export async function evaluateCognitiveThreshold(
    input: string,
    context?: string
): Promise<CognitiveDecision> {
    const identity = await getIdentityCore();
    const factors = analyzeFactors(input, context);

    // Default cognitive style if no identity yet
    const cognitiveStyle = identity?.cognitiveStyle || {
        system1Tendency: 0.5,
        riskTolerance: 0.5,
        emotionalIntensity: 0.5,
        uncertaintyTolerance: 0.5
    };

    // Calculate threshold based on individual's cognitive style
    const threshold = calculateThreshold(factors, cognitiveStyle);

    let mode: 'INTUITIVE' | 'ANALYTICAL' | 'MIXED';
    let characterInfluence: string;

    if (threshold < 0.35) {
        mode = 'INTUITIVE';
        characterInfluence = buildIntuitiveExplanation(factors, cognitiveStyle);
    } else if (threshold > 0.65) {
        mode = 'ANALYTICAL';
        characterInfluence = buildAnalyticalExplanation(factors, cognitiveStyle);
    } else {
        mode = 'MIXED';
        characterInfluence = buildMixedExplanation(factors, cognitiveStyle);
    }

    return {
        mode,
        confidence: Math.abs(threshold - 0.5) * 2,
        reasoning: buildReasoning(input, mode, factors),
        factors,
        characterInfluence
    };
}

/**
 * Analyze psychological factors from input
 */
function analyzeFactors(input: string, context?: string): PsychologicalFactors {
    const text = (input + (context || '')).toLowerCase();

    // Risk perception markers
    const riskWords = ['tehlike', 'risk', 'kayıp', 'zarar', 'ölüm', 'kaza', 'danger', 'loss', 'harm', 'fail'];
    const riskScore = riskWords.reduce((score, word) =>
        text.includes(word) ? score + 0.15 : score, 0);

    // Personal importance markers
    const importanceWords = ['önemli', 'hayat', 'aile', 'gelecek', 'karar', 'important', 'life', 'family', 'future', 'decide'];
    const importanceScore = importanceWords.reduce((score, word) =>
        text.includes(word) ? score + 0.12 : score, 0);

    // Emotional intensity markers
    const emotionWords = ['sevgi', 'nefret', 'korku', 'mutluluk', 'üzgün', 'kızgın', 'love', 'hate', 'fear', 'happy', 'sad', 'angry'];
    const emotionScore = emotionWords.reduce((score, word) =>
        text.includes(word) ? score + 0.15 : score, 0);

    // Uncertainty markers
    const uncertaintyWords = ['belki', 'acaba', 'emin değil', 'bilmiyorum', 'kararsız', 'maybe', 'perhaps', 'unsure', 'uncertain', 'confused'];
    const uncertaintyScore = uncertaintyWords.reduce((score, word) =>
        text.includes(word) ? score + 0.15 : score, 0);

    // Question complexity
    const hasComplexQuestion = text.includes('?') && text.length > 100;
    const complexityBonus = hasComplexQuestion ? 0.2 : 0;

    return {
        perceivedRisk: Math.min(1, riskScore),
        personalImportance: Math.min(1, importanceScore + complexityBonus),
        emotionalIntensity: Math.min(1, emotionScore),
        uncertaintyLevel: Math.min(1, uncertaintyScore + complexityBonus)
    };
}

/**
 * Calculate threshold based on individual's cognitive style
 * Returns 0-1 where lower = more intuitive, higher = more analytical
 */
function calculateThreshold(
    factors: PsychologicalFactors,
    style: IdentityCore['cognitiveStyle']
): number {
    // Base threshold from the situation
    const situationalDemand =
        (factors.perceivedRisk * 0.35) +
        (factors.personalImportance * 0.25) +
        (factors.emotionalIntensity * 0.15) +
        (factors.uncertaintyLevel * 0.25);

    // Adjust based on individual's tendencies
    const styleAdjustment =
        // High system1Tendency → Lower threshold (stays intuitive longer)
        ((1 - style.system1Tendency) * 0.3) +
        // Low riskTolerance → Higher threshold (switches to analytical sooner on risk)
        ((1 - style.riskTolerance) * factors.perceivedRisk * 0.2) +
        // High uncertaintyTolerance → Lower threshold (comfortable with intuitive uncertainty)
        ((1 - style.uncertaintyTolerance) * factors.uncertaintyLevel * 0.2);

    return Math.max(0, Math.min(1, situationalDemand + styleAdjustment - 0.15));
}

/**
 * Build explanations that reflect character
 */
function buildIntuitiveExplanation(
    factors: PsychologicalFactors,
    style: IdentityCore['cognitiveStyle']
): string {
    if (style.system1Tendency > 0.7) {
        return 'Bu kişi doğası gereği sezgisel düşünür. Bu durum için derinlemesine analiz gerektiren bir tetikleyici algılamadı.';
    }
    return 'Durum yeterince basit ve tanıdık görünüyor. Otomatik bilişsel işleme yeterli.';
}

function buildAnalyticalExplanation(
    factors: PsychologicalFactors,
    style: IdentityCore['cognitiveStyle']
): string {
    if (factors.perceivedRisk > 0.6 && style.riskTolerance < 0.4) {
        return 'Risk algısı yüksek ve bu kişi doğası gereği temkinli. Analitik düşünmeye geçiş yapıldı.';
    }
    if (factors.personalImportance > 0.6) {
        return 'Konu kişisel olarak önemli. Bu kişi önemli konularda dikkatli düşünme eğiliminde.';
    }
    return 'Durum karmaşık veya belirsiz. Bilinçli analiz gerektiriyor.';
}

function buildMixedExplanation(
    factors: PsychologicalFactors,
    style: IdentityCore['cognitiveStyle']
): string {
    return 'Durum hem sezgisel hem analitik işleme gerektiriyor. Karma bilişsel mod aktif.';
}

function buildReasoning(
    input: string,
    mode: string,
    factors: PsychologicalFactors
): string {
    const factorList: string[] = [];

    if (factors.perceivedRisk > 0.3) factorList.push('risk algısı');
    if (factors.personalImportance > 0.3) factorList.push('kişisel önem');
    if (factors.emotionalIntensity > 0.3) factorList.push('duygusal yoğunluk');
    if (factors.uncertaintyLevel > 0.3) factorList.push('belirsizlik');

    if (factorList.length === 0) {
        return `${mode} mod: Rutin durum, belirgin tetikleyici yok.`;
    }

    return `${mode} mod: ${factorList.join(', ')} faktörleri etkili.`;
}

// Export types
export type { IdentityCore };
