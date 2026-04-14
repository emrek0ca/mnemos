/**
 * WIQO Cognitive Engine - Noise Injection
 * 
 * Adds natural variation to responses to prevent robotic patterns
 * and increase perceived authenticity.
 */

export interface NoiseConfig {
    enabled: boolean;
    variance: number;           // 0.0 - 0.3 recommended
    domains: NoiseConfigDomain[];
}

export type NoiseConfigDomain = 'personality' | 'certainty' | 'formality' | 'verbosity';

// Variation patterns for different domains
const CERTAINTY_VARIATIONS = [
    { from: "I'm certain", to: ["I believe", "I'm fairly confident", "I think"] },
    { from: "definitely", to: ["likely", "probably", "most likely"] },
    { from: "always", to: ["usually", "often", "typically"] },
    { from: "never", to: ["rarely", "seldom", "almost never"] },
];

const FORMALITY_VARIATIONS = [
    { from: "therefore", to: ["so", "which means", "thus"] },
    { from: "however", to: ["but", "though", "still"] },
    { from: "additionally", to: ["also", "plus", "and"] },
];

const VERBOSITY_FILLERS = [
    "you know",
    "I mean",
    "to be honest",
    "actually",
    "in a way",
];

/**
 * Apply random variation with given probability
 */
function shouldApply(probability: number): boolean {
    return Math.random() < probability;
}

/**
 * Pick random item from array
 */
function pickRandom<T>(arr: T[]): T {
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Apply certainty variations to reduce absolutism
 */
function applyCertaintyNoise(content: string, variance: number): string {
    let result = content;

    for (const pattern of CERTAINTY_VARIATIONS) {
        if (shouldApply(variance) && result.includes(pattern.from)) {
            const replacement = pickRandom(pattern.to);
            result = result.replace(pattern.from, replacement);
        }
    }

    return result;
}

/**
 * Apply formality variations
 */
function applyFormalityNoise(content: string, variance: number): string {
    let result = content;

    for (const pattern of FORMALITY_VARIATIONS) {
        if (shouldApply(variance) && result.includes(pattern.from)) {
            const replacement = pickRandom(pattern.to);
            result = result.replace(pattern.from, replacement);
        }
    }

    return result;
}

/**
 * Occasionally add conversational fillers
 */
function applyVerbosityNoise(content: string, variance: number): string {
    if (!shouldApply(variance * 0.3)) return content;

    const sentences = content.split('. ');
    if (sentences.length < 2) return content;

    const insertIndex = Math.floor(Math.random() * (sentences.length - 1)) + 1;
    const filler = pickRandom(VERBOSITY_FILLERS);

    sentences[insertIndex] = filler.charAt(0).toUpperCase() + filler.slice(1) + ', ' +
        sentences[insertIndex].charAt(0).toLowerCase() + sentences[insertIndex].slice(1);

    return sentences.join('. ');
}

/**
 * Main noise injection function
 */
export function applyNoiseInjection(content: string, config: NoiseConfig): string {
    if (!config.enabled || config.variance === 0) {
        return content;
    }

    let result = content;

    for (const domain of config.domains) {
        switch (domain) {
            case 'certainty':
                result = applyCertaintyNoise(result, config.variance);
                break;
            case 'formality':
                result = applyFormalityNoise(result, config.variance);
                break;
            case 'verbosity':
                result = applyVerbosityNoise(result, config.variance);
                break;
            case 'personality':
                // Personality noise is more subtle and context-dependent
                // Could add things like humor, empathy expressions, etc.
                break;
        }
    }

    return result;
}

/**
 * Default noise configuration
 */
export const DEFAULT_NOISE_CONFIG: NoiseConfig = {
    enabled: true,
    variance: 0.15,
    domains: ['certainty', 'formality']
};
