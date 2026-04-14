/**
 * MNEMOS – Cognitive Preservation System
 * Enhanced Perception Layer
 * 
 * More sophisticated analysis of:
 * - Intent (with confidence scores)
 * - Emotions (multi-dimensional with intensity)
 * - Cognitive load estimation
 * - Personal significance markers
 */

export interface EnhancedPerception {
    // Intent analysis
    intent: {
        primary: IntentType;
        confidence: number;
        secondary?: IntentType;
    };

    // Multi-dimensional emotion
    emotion: {
        valence: number;        // -1 (negative) to 1 (positive)
        arousal: number;        // 0 (calm) to 1 (excited)
        dominance: number;      // 0 (submissive) to 1 (dominant)
        specific: EmotionType;
        intensity: number;
    };

    // Cognitive analysis
    cognitive: {
        complexity: number;     // How complex is this to process
        abstractness: number;   // Concrete vs abstract thinking needed
        temporalFocus: 'past' | 'present' | 'future';
        certaintyLevel: number; // How certain/uncertain the topic is
    };

    // Personal significance
    personal: {
        selfReference: number;  // How much about self
        socialReference: number; // How much about others
        importance: number;     // Overall personal importance
        triggers: string[];     // Potential emotional triggers
    };

    // Context
    topic: string;
    urgency: number;
}

type IntentType =
    | 'question'
    | 'decision_request'
    | 'emotional_share'
    | 'opinion_request'
    | 'information_request'
    | 'confirmation'
    | 'complaint'
    | 'expression'
    | 'command'
    | 'casual';

type EmotionType =
    | 'joy'
    | 'sadness'
    | 'anger'
    | 'fear'
    | 'surprise'
    | 'disgust'
    | 'trust'
    | 'anticipation'
    | 'neutral';

// Enhanced keyword dictionaries
const INTENT_PATTERNS: Record<IntentType, { keywords: string[]; weight: number }> = {
    decision_request: {
        keywords: ['karar', 'ne yapmalı', 'seçmeli', 'hangisi', 'nasıl yapayım', 'decide', 'should i', 'which', 'choose'],
        weight: 1.2
    },
    question: {
        keywords: ['ne', 'nasıl', 'neden', 'nerede', 'kim', 'what', 'how', 'why', 'where', 'who'],
        weight: 1.0
    },
    emotional_share: {
        keywords: ['hissediyorum', 'üzgün', 'mutlu', 'korkuyorum', 'endişeli', 'feel', 'feeling', 'worried'],
        weight: 1.3
    },
    opinion_request: {
        keywords: ['ne düşünüyorsun', 'fikrin', 'görüşün', 'think', 'opinion', 'view'],
        weight: 1.1
    },
    information_request: {
        keywords: ['bilgi', 'açıkla', 'anlat', 'nedir', 'tell me', 'explain', 'describe', 'what is'],
        weight: 0.9
    },
    confirmation: {
        keywords: ['doğru mu', 'emin misin', 'değil mi', 'right', 'correct', 'sure', 'confirm'],
        weight: 1.0
    },
    complaint: {
        keywords: ['şikayet', 'problem', 'sorun', 'can sıkıcı', 'annoying', 'frustrated', 'issue'],
        weight: 1.2
    },
    expression: {
        keywords: ['düşünüyorum', 'sanırım', 'bence', 'i think', 'i believe', 'in my opinion'],
        weight: 0.8
    },
    command: {
        keywords: ['yap', 'söyle', 'göster', 'do', 'tell', 'show', 'make', 'create'],
        weight: 1.0
    },
    casual: {
        keywords: ['merhaba', 'selam', 'nasılsın', 'hi', 'hello', 'hey', 'sup'],
        weight: 0.5
    }
};

// Emotion patterns with valence, arousal, dominance weights
const EMOTION_PATTERNS: Record<EmotionType, {
    keywords: string[];
    valence: number;
    arousal: number;
    dominance: number;
}> = {
    joy: {
        keywords: ['mutlu', 'sevgi', 'harika', 'güzel', 'happy', 'love', 'great', 'wonderful', 'amazing', 'excited'],
        valence: 1, arousal: 0.7, dominance: 0.6
    },
    sadness: {
        keywords: ['üzgün', 'kötü', 'mutsuz', 'sad', 'unhappy', 'depressed', 'miserable', 'down'],
        valence: -0.8, arousal: 0.3, dominance: 0.2
    },
    anger: {
        keywords: ['kızgın', 'sinirli', 'öfke', 'angry', 'furious', 'rage', 'mad', 'frustrated'],
        valence: -0.7, arousal: 0.9, dominance: 0.8
    },
    fear: {
        keywords: ['korku', 'endişe', 'kaygı', 'afraid', 'scared', 'worried', 'anxious', 'terrified'],
        valence: -0.6, arousal: 0.7, dominance: 0.2
    },
    surprise: {
        keywords: ['şaşkın', 'inanamıyorum', 'surprised', 'shocked', 'unexpected', 'wow', 'unbelievable'],
        valence: 0.3, arousal: 0.8, dominance: 0.5
    },
    disgust: {
        keywords: ['iğrenç', 'tiksinmek', 'disgusting', 'gross', 'horrible', 'nasty'],
        valence: -0.8, arousal: 0.5, dominance: 0.6
    },
    trust: {
        keywords: ['güven', 'inan', 'trust', 'believe', 'reliable', 'safe', 'secure'],
        valence: 0.7, arousal: 0.3, dominance: 0.5
    },
    anticipation: {
        keywords: ['umut', 'beklemek', 'hope', 'expect', 'looking forward', 'waiting', 'will'],
        valence: 0.5, arousal: 0.5, dominance: 0.5
    },
    neutral: {
        keywords: [],
        valence: 0, arousal: 0.3, dominance: 0.5
    }
};

// Temporal markers
const TEMPORAL_PATTERNS = {
    past: ['dün', 'geçen', 'eskiden', 'yesterday', 'last', 'ago', 'used to', 'before', 'was', 'were'],
    present: ['şimdi', 'bugün', 'şu an', 'now', 'today', 'currently', 'am', 'is', 'are'],
    future: ['yarın', 'gelecek', 'sonra', 'tomorrow', 'next', 'will', 'going to', 'plan']
};

/**
 * Enhanced perception analysis
 */
export function perceiveEnhanced(input: string): EnhancedPerception {
    const text = input.toLowerCase();

    // Analyze intent
    const intentResult = analyzeIntent(text);

    // Analyze emotion
    const emotionResult = analyzeEmotion(text);

    // Analyze cognitive aspects
    const cognitiveResult = analyzeCognitive(text);

    // Analyze personal significance
    const personalResult = analyzePersonal(text);

    // Extract topic
    const topic = extractTopic(text);

    // Calculate urgency
    const urgency = calculateUrgency(text);

    return {
        intent: intentResult,
        emotion: emotionResult,
        cognitive: cognitiveResult,
        personal: personalResult,
        topic,
        urgency
    };
}

function analyzeIntent(text: string): EnhancedPerception['intent'] {
    const scores: Record<IntentType, number> = {} as Record<IntentType, number>;

    for (const [intent, { keywords, weight }] of Object.entries(INTENT_PATTERNS)) {
        const matchCount = keywords.reduce((acc, kw) =>
            text.includes(kw) ? acc + 1 : acc, 0);
        scores[intent as IntentType] = matchCount * weight;
    }

    // Question mark is strong indicator
    if (text.includes('?')) {
        scores.question = (scores.question || 0) + 2;
    }

    // Sort and get top results
    const sorted = Object.entries(scores).sort(([, a], [, b]) => b - a);
    const [primary, primaryScore] = sorted[0];
    const [secondary, secondaryScore] = sorted[1] || [undefined, 0];

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0) || 1;

    return {
        primary: (primaryScore > 0 ? primary : 'casual') as IntentType,
        confidence: Math.min(1, primaryScore / Math.max(totalScore, 1)),
        secondary: secondaryScore > 0 ? secondary as IntentType : undefined
    };
}

function analyzeEmotion(text: string): EnhancedPerception['emotion'] {
    let maxScore = 0;
    let detectedEmotion: EmotionType = 'neutral';
    let totalValence = 0;
    let totalArousal = 0;
    let totalDominance = 0;
    let totalWeight = 0;

    for (const [emotion, { keywords, valence, arousal, dominance }] of Object.entries(EMOTION_PATTERNS)) {
        const matchCount = keywords.reduce((acc, kw) =>
            text.includes(kw) ? acc + 1 : acc, 0);

        if (matchCount > 0) {
            const weight = matchCount;
            totalValence += valence * weight;
            totalArousal += arousal * weight;
            totalDominance += dominance * weight;
            totalWeight += weight;

            if (matchCount > maxScore) {
                maxScore = matchCount;
                detectedEmotion = emotion as EmotionType;
            }
        }
    }

    // Normalize
    if (totalWeight > 0) {
        totalValence /= totalWeight;
        totalArousal /= totalWeight;
        totalDominance /= totalWeight;
    } else {
        totalArousal = 0.3;
        totalDominance = 0.5;
    }

    // Intensity from arousal and keyword count
    const intensity = Math.min(1, (maxScore * 0.3) + totalArousal * 0.4);

    return {
        valence: totalValence,
        arousal: totalArousal,
        dominance: totalDominance,
        specific: detectedEmotion,
        intensity
    };
}

function analyzeCognitive(text: string): EnhancedPerception['cognitive'] {
    // Complexity: word count, sentence length, question marks
    const words = text.split(/\s+/).length;
    const sentences = (text.match(/[.!?]/g) || []).length || 1;
    const avgWordsPerSentence = words / sentences;
    const complexity = Math.min(1, (avgWordsPerSentence / 20) + (words / 100) * 0.5);

    // Abstractness: philosophical/abstract words vs concrete words
    const abstractWords = ['anlam', 'hayat', 'düşünce', 'fikir', 'kavram',
        'meaning', 'life', 'think', 'concept', 'idea', 'philosophy', 'truth'];
    const concreteWords = ['para', 'ev', 'araba', 'iş', 'money', 'house', 'car', 'job', 'food'];

    const abstractCount = abstractWords.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const concreteCount = concreteWords.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const abstractness = abstractCount > concreteCount ? 0.7 : 0.3;

    // Temporal focus
    let temporalFocus: 'past' | 'present' | 'future' = 'present';
    const pastCount = TEMPORAL_PATTERNS.past.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const futureCount = TEMPORAL_PATTERNS.future.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);

    if (pastCount > futureCount && pastCount > 0) temporalFocus = 'past';
    else if (futureCount > pastCount && futureCount > 0) temporalFocus = 'future';

    // Certainty level
    const uncertainWords = ['belki', 'sanırım', 'galiba', 'maybe', 'perhaps', 'might', 'probably'];
    const certainWords = ['kesin', 'emin', 'mutlaka', 'definitely', 'certainly', 'sure', 'absolutely'];
    const uncertainCount = uncertainWords.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const certainCount = certainWords.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const certaintyLevel = certainCount > uncertainCount ? 0.8 : uncertainCount > 0 ? 0.3 : 0.5;

    return { complexity, abstractness, temporalFocus, certaintyLevel };
}

function analyzePersonal(text: string): EnhancedPerception['personal'] {
    // Self reference
    const selfWords = ['ben', 'benim', 'bana', 'bende', 'kendim', 'i', 'my', 'me', 'mine', 'myself'];
    const selfCount = selfWords.reduce((acc, w) => {
        const regex = new RegExp(`\\b${w}\\b`, 'gi');
        return acc + (text.match(regex) || []).length;
    }, 0);
    const selfReference = Math.min(1, selfCount * 0.15);

    // Social reference
    const socialWords = ['sen', 'senin', 'sana', 'o', 'onlar', 'aile', 'arkadaş',
        'you', 'your', 'they', 'them', 'family', 'friend', 'people'];
    const socialCount = socialWords.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const socialReference = Math.min(1, socialCount * 0.15);

    // Importance indicators
    const importanceWords = ['önemli', 'kritik', 'acil', 'ciddi', 'hayat',
        'important', 'critical', 'urgent', 'serious', 'life-changing'];
    const importanceCount = importanceWords.reduce((acc, w) => text.includes(w) ? acc + 1 : acc, 0);
    const importance = Math.min(1, importanceCount * 0.25 + selfReference * 0.5);

    // Potential triggers (sensitive topics)
    const triggers: string[] = [];
    const triggerPatterns = [
        { pattern: ['ölüm', 'kaybet', 'death', 'loss', 'died', 'lost'], trigger: 'loss' },
        { pattern: ['hastalık', 'kanser', 'illness', 'cancer', 'disease'], trigger: 'health' },
        { pattern: ['ayrılık', 'boşanma', 'breakup', 'divorce', 'separation'], trigger: 'relationship_end' },
        { pattern: ['travma', 'taciz', 'trauma', 'abuse', 'assault'], trigger: 'trauma' },
        { pattern: ['para sorunu', 'iflas', 'financial', 'bankrupt', 'debt'], trigger: 'financial_stress' }
    ];

    for (const { pattern, trigger } of triggerPatterns) {
        if (pattern.some(p => text.includes(p))) {
            triggers.push(trigger);
        }
    }

    return { selfReference, socialReference, importance, triggers };
}

function extractTopic(text: string): string {
    const topicKeywords: Record<string, string[]> = {
        money: ['para', 'maaş', 'yatırım', 'borç', 'kredi', 'money', 'salary', 'invest'],
        career: ['iş', 'kariyer', 'terfi', 'istifa', 'job', 'career', 'promotion'],
        relationships: ['aile', 'sevgili', 'arkadaş', 'evlilik', 'family', 'friend', 'relationship'],
        health: ['sağlık', 'hastalık', 'doktor', 'health', 'sick', 'doctor'],
        education: ['okul', 'eğitim', 'üniversite', 'school', 'education', 'university'],
        personal: ['kendim', 'hayat', 'mutluluk', 'myself', 'life', 'happiness'],
        technology: ['bilgisayar', 'yazılım', 'computer', 'software', 'tech', 'app'],
        philosophy: ['anlam', 'gerçek', 'meaning', 'truth', 'existence', 'purpose']
    };

    let maxScore = 0;
    let maxTopic = 'general';

    for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const score = keywords.reduce((acc, kw) => text.includes(kw) ? acc + 1 : acc, 0);
        if (score > maxScore) {
            maxScore = score;
            maxTopic = topic;
        }
    }

    return maxTopic;
}

function calculateUrgency(text: string): number {
    const urgencyWords = ['acil', 'hemen', 'şimdi', 'bugün', 'urgent', 'now', 'immediately', 'asap', 'quickly'];
    const count = urgencyWords.reduce((acc, w) => text.includes(w) ? acc + 0.2 : acc, 0);
    const exclamations = (text.match(/!/g) || []).length * 0.1;
    return Math.min(1, count + exclamations);
}
