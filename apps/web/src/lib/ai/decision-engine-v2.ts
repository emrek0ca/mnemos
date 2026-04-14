/**
 * MNEMOS – Cognitive Preservation System
 * Layer 2: Decision Engine
 * 
 * The core of human-like decision making.
 * Uses weighted scoring based on personality profile.
 */

import { PerceptionResult } from './perception';

export interface DecisionProfile {
    // Core decision weights (-1 to 1)
    riskTolerance: number;      // How much risk they accept
    moneyBias: number;          // How much money influences decisions
    ethicsWeight: number;       // How important ethics are
    socialPressure: number;     // How much others' opinions matter
    authorityResponse: number;  // Respect for authority (-1 = rebel, 1 = compliant)
    emotionalWeight: number;    // How much emotions drive decisions
    analyticalWeight: number;   // Preference for logical analysis

    // Secondary factors
    shortTermBias: number;      // Short vs long term thinking
    noveltyPreference: number;  // Preference for new vs familiar
    cautionLevel: number;       // Overall caution in decisions
}

export interface DecisionContext {
    stakes: 'low' | 'medium' | 'high';
    reversibility: number;      // 0-1: How reversible is this decision
    timeConstraint: number;     // 0-1: How much time pressure
    peerPressure: number;       // 0-1: Social pressure level
    emotionalCharge: number;    // 0-1: How emotional the situation is
}

export interface DecisionOption {
    id: string;
    description: string;
    riskLevel: number;
    expectedGain: number;
    ethicalScore: number;
    socialApproval: number;
    emotionalAppeal: number;
    novelty: number;
}

export interface DecisionResult {
    selectedOption: string;
    confidence: number;
    reasoning: string;
    scores: Record<string, number>;
    dominantFactors: string[];
}

// Default balanced profile
export const DEFAULT_PROFILE: DecisionProfile = {
    riskTolerance: 0.5,
    moneyBias: 0.5,
    ethicsWeight: 0.6,
    socialPressure: 0.4,
    authorityResponse: 0.3,
    emotionalWeight: 0.5,
    analyticalWeight: 0.5,
    shortTermBias: 0.4,
    noveltyPreference: 0.5,
    cautionLevel: 0.5
};

/**
 * Calculate decision score for an option
 */
export function scoreOption(
    option: DecisionOption,
    profile: DecisionProfile,
    context: DecisionContext
): number {
    // Base score from option characteristics
    let score = 0;

    // Risk component
    const riskScore = profile.riskTolerance * option.riskLevel -
        (1 - profile.riskTolerance) * option.riskLevel * (1 - context.reversibility);
    score += riskScore * 0.2;

    // Money/gain component
    score += profile.moneyBias * option.expectedGain * 0.25;

    // Ethics component
    score += profile.ethicsWeight * option.ethicalScore * 0.2;

    // Social component
    const socialScore = profile.socialPressure * context.peerPressure * option.socialApproval;
    score += socialScore * 0.15;

    // Emotional component
    const emotionalScore = profile.emotionalWeight * context.emotionalCharge * option.emotionalAppeal;
    score += emotionalScore * 0.1;

    // Novelty component
    score += profile.noveltyPreference * option.novelty * 0.05;

    // Caution penalty for high-stakes
    if (context.stakes === 'high') {
        score -= profile.cautionLevel * option.riskLevel * 0.1;
    }

    // Time pressure effects
    if (context.timeConstraint > 0.7) {
        // Under pressure, lean toward emotional
        score += profile.emotionalWeight * 0.1;
        score -= profile.analyticalWeight * 0.05;
    }

    return Math.max(0, Math.min(1, (score + 0.5))); // Normalize to 0-1
}

/**
 * Make a decision between options
 */
export function makeDecision(
    options: DecisionOption[],
    profile: DecisionProfile,
    context: DecisionContext
): DecisionResult {
    const scores: Record<string, number> = {};

    // Score all options
    for (const option of options) {
        scores[option.id] = scoreOption(option, profile, context);
    }

    // Find best option
    let bestOption = options[0];
    let bestScore = scores[options[0].id];

    for (const option of options) {
        if (scores[option.id] > bestScore) {
            bestScore = scores[option.id];
            bestOption = option;
        }
    }

    // Identify dominant factors
    const dominantFactors = identifyDominantFactors(bestOption, profile, context);

    // Calculate confidence
    const allScores = Object.values(scores);
    const secondBest = allScores.sort((a, b) => b - a)[1] || 0;
    const confidence = bestScore - secondBest;

    // Generate reasoning
    const reasoning = generateReasoning(bestOption, dominantFactors, profile);

    return {
        selectedOption: bestOption.id,
        confidence,
        reasoning,
        scores,
        dominantFactors
    };
}

function identifyDominantFactors(
    option: DecisionOption,
    profile: DecisionProfile,
    context: DecisionContext
): string[] {
    const factors: { name: string; weight: number }[] = [];

    if (profile.riskTolerance > 0.6 && option.riskLevel > 0.5) {
        factors.push({ name: 'risk_tolerance', weight: profile.riskTolerance });
    }
    if (profile.moneyBias > 0.6 && option.expectedGain > 0.5) {
        factors.push({ name: 'financial_gain', weight: profile.moneyBias });
    }
    if (profile.ethicsWeight > 0.6 && option.ethicalScore > 0.5) {
        factors.push({ name: 'ethics', weight: profile.ethicsWeight });
    }
    if (profile.socialPressure > 0.5 && context.peerPressure > 0.5) {
        factors.push({ name: 'social_pressure', weight: profile.socialPressure });
    }
    if (profile.emotionalWeight > 0.5 && context.emotionalCharge > 0.5) {
        factors.push({ name: 'emotional', weight: profile.emotionalWeight });
    }

    return factors
        .sort((a, b) => b.weight - a.weight)
        .slice(0, 3)
        .map(f => f.name);
}

function generateReasoning(
    option: DecisionOption,
    dominantFactors: string[],
    profile: DecisionProfile
): string {
    const factorExplanations: Record<string, string> = {
        risk_tolerance: 'Risk almaktan kaçınmama eğilimim bunu destekliyor',
        financial_gain: 'Finansal kazanç potansiyeli bu seçeneği öne çıkarıyor',
        ethics: 'Ahlaki değerlerim bu yönde karar vermemi sağlıyor',
        social_pressure: 'Çevremdeki insanların görüşleri etkili oldu',
        emotional: 'Duygusal olarak bu seçenek daha doğru hissettiriyor'
    };

    const explanations = dominantFactors
        .map(f => factorExplanations[f])
        .filter(Boolean)
        .join('. ');

    return explanations || 'Genel bir değerlendirme sonucu bu seçeneği tercih ediyorum';
}

/**
 * Extract decision context from perception
 */
export function contextFromPerception(perception: PerceptionResult): DecisionContext {
    return {
        stakes: perception.complexity > 0.7 ? 'high' : perception.complexity > 0.4 ? 'medium' : 'low',
        reversibility: 1 - perception.complexity,
        timeConstraint: perception.urgency,
        peerPressure: perception.topic === 'relationships' ? 0.7 : 0.3,
        emotionalCharge: Math.max(
            perception.emotion.fear,
            perception.emotion.anger,
            perception.emotion.joy,
            perception.emotion.sadness
        )
    };
}
