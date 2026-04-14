/**
 * MNEMOS – Dijital Kişilik Motoru
 * Expression Engine - Gelişmiş İfade Motoru
 * 
 * LLM serbest değildir - sadece ses telleridir.
 * 
 * Kurallar:
 * - Cümle uzunluğu sınırı
 * - Kaç soru sorabilir
 * - Kaç kere yumuşatabilir
 * - Ne zaman susar
 * 
 * Bazen sistem bilerek kısa cevap verir.
 * Çünkü insan her zaman açıklamaz.
 */

import { PersonalityDNA } from './personality-dna';
import { MentalState } from './state-engine';

// ==================== TYPES ====================

export interface ExpressionRules {
    // Cümle sınırları
    maxSentenceLength: number;      // Karakter
    maxSentencesPerTurn: number;
    minSentencesPerTurn: number;

    // Soru sınırları
    maxQuestionsPerTurn: number;
    minTurnsBetweenQuestions: number;

    // Yumuşatma sınırları
    maxSofteningPhrases: number;    // "Yani", "Aslında" vb.

    // Sessizlik kuralları
    allowSilence: boolean;          // Bazen cevap vermeme
    silenceProbability: number;     // 0-1
    silenceConditions: string[];    // Ne zaman susar?

    // Açıklama kuralları
    explainEverything: boolean;     // false = insan gibi
    maxExplanationDepth: number;

    // Ton kısıtlamaları
    allowedTones: string[];
    forbiddenPhrases: string[];
}

export interface ExpressionContext {
    turnCount: number;
    lastQuestionTurn: number;
    currentEmotion: string;
    topicSensitivity: 'low' | 'medium' | 'high';
    isUserFrustrated: boolean;
}

export interface ExpressionOutput {
    processedResponse: string;
    appliedRules: string[];
    truncated: boolean;
    addedSilence: boolean;
    removedSoftening: number;
    toneAdjustments: string[];
}

// ==================== DEFAULT RULES ====================

export const DEFAULT_EXPRESSION_RULES: ExpressionRules = {
    maxSentenceLength: 150,
    maxSentencesPerTurn: 4,
    minSentencesPerTurn: 1,
    maxQuestionsPerTurn: 2,
    minTurnsBetweenQuestions: 2,
    maxSofteningPhrases: 2,
    allowSilence: true,
    silenceProbability: 0.05,
    silenceConditions: ['tekrar', 'anlamsız', 'spam'],
    explainEverything: false,
    maxExplanationDepth: 2,
    allowedTones: ['casual', 'warm', 'direct', 'playful'],
    forbiddenPhrases: [
        'yardımcı olabilir miyim',
        'size nasıl yardımcı olabilirim',
        'merhaba dostum',
        'tabii ki',
        'elbette',
        'kesinlikle yardımcı olurum',
        'başka bir sorunuz var mı',
        'herhangi bir konuda'
    ]
};

// ==================== SOFTENING PHRASES ====================

const SOFTENING_PHRASES = [
    'yani',
    'aslında',
    'şey',
    'hani',
    'bir bakıma',
    'açıkçası',
    'doğrusu',
    'gerçekten',
    'belki de',
    'sanırım',
    'galiba'
];

const FILLER_PHRASES = [
    'şimdi',
    'peki',
    'tamam',
    'işte',
    'evet',
    'hayır ama',
    'yok yani'
];

// ==================== MAIN FUNCTIONS ====================

/**
 * Generate expression rules based on personality DNA and mental state
 */
export function generateExpressionRules(
    dna: PersonalityDNA,
    state?: MentalState
): ExpressionRules {
    const rules = { ...DEFAULT_EXPRESSION_RULES };

    // DNA-based adjustments
    rules.maxSentenceLength = dna.maxSentenceLength || 150;
    rules.maxQuestionsPerTurn = dna.maxQuestionsPerTurn || 2;
    rules.explainEverything = dna.explainEverything || false;

    // Dominance affects directness
    if (dna.dominance > 0.7) {
        rules.maxSofteningPhrases = 0;
        rules.maxSentencesPerTurn = 2;
    } else if (dna.dominance < 0.3) {
        rules.maxSofteningPhrases = 4;
        rules.maxSentencesPerTurn = 5;
    }

    // Empathy affects question tendency
    if (dna.empathy > 0.7) {
        rules.maxQuestionsPerTurn = 3;
        rules.minTurnsBetweenQuestions = 1;
    }

    // Silence comfort affects silence rules
    if (dna.silenceComfort > 0.7) {
        rules.silenceProbability = 0.15;
        rules.minSentencesPerTurn = 0;
    } else if (dna.silenceComfort < 0.3) {
        rules.silenceProbability = 0;
        rules.allowSilence = false;
    }

    // State-based adjustments
    if (state) {
        // Low energy → shorter responses
        if (state.energy < 0.4) {
            rules.maxSentencesPerTurn = Math.max(1, rules.maxSentencesPerTurn - 2);
            rules.maxSentenceLength = Math.min(100, rules.maxSentenceLength);
        }

        // Low patience → more direct
        if (state.patience < 0.3) {
            rules.maxSofteningPhrases = 0;
            rules.explainEverything = false;
        }

        // High irritation → sharper
        if (state.irritation > 0.6) {
            rules.maxSofteningPhrases = 0;
            rules.maxQuestionsPerTurn = 1;
        }
    }

    return rules;
}

/**
 * Process response through expression engine
 */
export function processExpression(
    rawResponse: string,
    rules: ExpressionRules,
    context: ExpressionContext
): ExpressionOutput {
    let response = rawResponse;
    const appliedRules: string[] = [];
    let truncated = false;
    let addedSilence = false;
    let removedSoftening = 0;
    const toneAdjustments: string[] = [];

    // 1. Remove forbidden phrases
    for (const phrase of rules.forbiddenPhrases) {
        if (response.toLowerCase().includes(phrase.toLowerCase())) {
            response = response.replace(new RegExp(phrase, 'gi'), '').trim();
            appliedRules.push(`Removed forbidden: "${phrase}"`);
        }
    }

    // 2. Limit softening phrases
    let softeningCount = 0;
    for (const phrase of SOFTENING_PHRASES) {
        const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
        const matches = response.match(regex);
        if (matches) {
            softeningCount += matches.length;
            if (softeningCount > rules.maxSofteningPhrases) {
                // Remove excess softening
                const excessCount = softeningCount - rules.maxSofteningPhrases;
                for (let i = 0; i < excessCount; i++) {
                    response = response.replace(regex, '');
                    removedSoftening++;
                }
            }
        }
    }

    // 3. Sentence limiting
    const sentences = response.split(/(?<=[.!?])\s+/);
    if (sentences.length > rules.maxSentencesPerTurn) {
        response = sentences.slice(0, rules.maxSentencesPerTurn).join(' ');
        truncated = true;
        appliedRules.push(`Truncated from ${sentences.length} to ${rules.maxSentencesPerTurn} sentences`);
    }

    // 4. Character length limiting
    if (response.length > rules.maxSentenceLength * rules.maxSentencesPerTurn) {
        const maxLen = rules.maxSentenceLength * rules.maxSentencesPerTurn;
        // Find last complete sentence before limit
        const truncatedText = response.substring(0, maxLen);
        const lastPeriod = Math.max(
            truncatedText.lastIndexOf('.'),
            truncatedText.lastIndexOf('!'),
            truncatedText.lastIndexOf('?')
        );
        if (lastPeriod > 0) {
            response = truncatedText.substring(0, lastPeriod + 1);
            truncated = true;
            appliedRules.push(`Character limit applied`);
        }
    }

    // 5. Question limiting
    const questionCount = (response.match(/\?/g) || []).length;
    if (questionCount > rules.maxQuestionsPerTurn) {
        // Remove excess questions (convert to statements where possible)
        const questionRegex = /([^.!?]*\?)/g;
        let questionsKept = 0;
        response = response.replace(questionRegex, (match) => {
            questionsKept++;
            if (questionsKept > rules.maxQuestionsPerTurn) {
                // Convert question to statement
                return match.replace('?', '.').replace(/\bmi\b|\bmı\b|\bmu\b|\bmü\b/gi, '');
            }
            return match;
        });
        appliedRules.push(`Limited questions from ${questionCount} to ${rules.maxQuestionsPerTurn}`);
    }

    // 6. Silence consideration
    if (rules.allowSilence && Math.random() < rules.silenceProbability) {
        // Check if message warrants silence
        const shouldSilence = rules.silenceConditions.some(condition =>
            rawResponse.toLowerCase().includes(condition)
        );

        if (shouldSilence || context.isUserFrustrated) {
            // Return minimal response
            const silentResponses = ['...', 'Hmm.', 'Anladım.', 'Evet.', 'Tamam.'];
            response = silentResponses[Math.floor(Math.random() * silentResponses.length)];
            addedSilence = true;
            appliedRules.push('Applied silence rule');
        }
    }

    // 7. Clean up double spaces and trim
    response = response.replace(/\s+/g, ' ').trim();

    // 8. Ensure response isn't empty
    if (!response || response.length < 2) {
        response = 'Hmm.';
    }

    return {
        processedResponse: response,
        appliedRules,
        truncated,
        addedSilence,
        removedSoftening,
        toneAdjustments
    };
}

/**
 * Check if response should be replaced with silence
 */
export function shouldBeSilent(
    message: string,
    context: ExpressionContext,
    dna: PersonalityDNA
): { silent: boolean; reason?: string } {
    const text = message.toLowerCase();

    // Spam/repetition detection
    if (text.length < 5 || /^(.)\1{3,}$/.test(text)) {
        return { silent: true, reason: 'spam_detected' };
    }

    // Single emoji or emoticon
    if (/^[\p{Emoji}]+$/u.test(text.trim())) {
        return { silent: Math.random() < 0.5, reason: 'emoji_only' };
    }

    // Very short messages might not need response
    if (text.length < 3 && dna.silenceComfort > 0.5) {
        return { silent: Math.random() < 0.3, reason: 'too_short' };
    }

    return { silent: false };
}

/**
 * Generate tone adjustments based on context
 */
export function adjustTone(
    response: string,
    targetTone: 'casual' | 'warm' | 'direct' | 'playful' | 'serious',
    intensity: number = 0.5
): string {
    let adjusted = response;

    switch (targetTone) {
        case 'casual':
            // Add casual markers
            if (intensity > 0.7 && !adjusted.includes('ya')) {
                adjusted = adjusted.replace(/\.$/, ' ya.');
            }
            break;

        case 'warm':
            // Add warmth without being AI-like
            if (intensity > 0.5 && adjusted.length > 20) {
                const warmEndings = [' :)', ' ❤️', ''];
                adjusted += warmEndings[Math.floor(Math.random() * warmEndings.length)];
            }
            break;

        case 'direct':
            // Remove hedging language
            adjusted = adjusted.replace(/\bbelki\b/gi, '');
            adjusted = adjusted.replace(/\bsanırım\b/gi, '');
            adjusted = adjusted.replace(/\bgaliba\b/gi, '');
            break;

        case 'playful':
            // Add playful elements
            if (Math.random() < intensity * 0.3) {
                adjusted = adjusted.replace(/!$/, '! 😄');
            }
            break;

        case 'serious':
            // Remove playful elements
            adjusted = adjusted.replace(/[😀-🿿]/gu, '');
            adjusted = adjusted.replace(/haha|hehe|lol/gi, '');
            break;
    }

    return adjusted.trim();
}

/**
 * Generate LLM constraints string for system prompt
 */
export function generateExpressionConstraintsForPrompt(rules: ExpressionRules): string {
    const constraints: string[] = [];

    constraints.push(`## 📏 İFADE KISITLAMALARI`);
    constraints.push(`- Maksimum ${rules.maxSentencesPerTurn} cümle kullan`);
    constraints.push(`- En fazla ${rules.maxQuestionsPerTurn} soru sor`);

    if (rules.maxSofteningPhrases === 0) {
        constraints.push(`- "Yani", "aslında" gibi yumuşatıcı kelimeler KULLANMA`);
    } else if (rules.maxSofteningPhrases <= 2) {
        constraints.push(`- Yumuşatıcı kelimeleri minimumda tut`);
    }

    if (!rules.explainEverything) {
        constraints.push(`- Her şeyi açıklama, bazen "Bilmiyorum" veya "Hmm" yeterli`);
    }

    if (rules.allowSilence) {
        constraints.push(`- Bazen tek kelimeyle cevap vermek normaldir`);
    }

    constraints.push(`\n### 🚫 YASAK İFADELER (ASLA KULLANMA):`);
    rules.forbiddenPhrases.slice(0, 5).forEach(phrase => {
        constraints.push(`- "${phrase}"`);
    });

    return constraints.join('\n');
}

// ==================== EXPORTS ====================

export const expressionEngine = {
    generateExpressionRules,
    processExpression,
    shouldBeSilent,
    adjustTone,
    generateExpressionConstraintsForPrompt,
    DEFAULT_EXPRESSION_RULES
};
