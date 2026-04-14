/**
 * MNEMOS – Cognitive Preservation System
 * Layer 4: Personality Renderer
 * 
 * Converts internal decisions and thoughts into
 * language that matches the person's speaking style.
 * 
 * The key insight: Language comes from personality, not the model.
 */

export interface PersonalityProfile {
    // Language style
    sentenceLength: 'short' | 'medium' | 'long';
    vocabulary: 'simple' | 'moderate' | 'sophisticated';
    formality: number;       // 0 = casual, 1 = formal
    directness: number;      // 0 = indirect, 1 = direct

    // Expression style
    aggression: number;      // 0 = passive, 1 = aggressive
    humor: number;           // 0 = serious, 1 = humorous
    warmth: number;          // 0 = cold, 1 = warm
    confidence: number;      // 0 = hesitant, 1 = assertive

    // Quirks
    emojiUsage: number;      // 0 = never, 1 = frequently
    questionsBeforeAnswers: boolean;  // Asks clarifying questions
    usesMetaphors: boolean;  // Uses analogies and metaphors
    acknowledgment: boolean; // Acknowledges others' feelings first

    // Filler patterns (unique speech patterns)
    fillerWords: string[];   // ["yani", "şey", "hani"]
    signaturePhrases: string[];  // ["bence", "açıkçası"]

    // Voice Engine Settings
    voiceSettings?: {
        pitch: number; // 0.5 - 2.0
        rate: number;  // 0.5 - 2.0
        volume?: number;
    };
}

export interface RenderContext {
    isQuestion: boolean;
    isEmotional: boolean;
    isSerious: boolean;
    requiresEmpathy: boolean;
    topicFamiliarity: number;
}

// Default balanced personality with natural Turkish patterns
export const DEFAULT_PERSONALITY: PersonalityProfile = {
    sentenceLength: 'medium',
    vocabulary: 'moderate',
    formality: 0.4,
    directness: 0.6,
    aggression: 0.2,
    humor: 0.3,
    warmth: 0.6,
    confidence: 0.5,
    emojiUsage: 0.1,
    questionsBeforeAnswers: true,
    usesMetaphors: false,
    acknowledgment: true,
    // Natural Turkish conversational patterns
    fillerWords: ['yani', 'şey', 'aslında', 'açıkçası'],
    signaturePhrases: ['bence', 'şöyle düşünüyorum'],
    voiceSettings: {
        pitch: 1.0,
        rate: 1.0,
        volume: 1.0
    }
};

// Voice configurations for different genders
export interface VoiceConfig {
    gender: 'male' | 'female';
    pitch: number;
    rate: number;
    name?: string; // For TTS engine voice selection
}

export const VOICE_PRESETS: Record<string, VoiceConfig> = {
    male_calm: { gender: 'male', pitch: 0.9, rate: 0.95, name: 'tr-TR-AhmetNeural' },
    male_energetic: { gender: 'male', pitch: 1.0, rate: 1.1, name: 'tr-TR-AhmetNeural' },
    female_calm: { gender: 'female', pitch: 1.1, rate: 0.95, name: 'tr-TR-EmelNeural' },
    female_warm: { gender: 'female', pitch: 1.0, rate: 1.0, name: 'tr-TR-EmelNeural' }
};

// Natural Turkish conversational fillers by context
export const TURKISH_CONVERSATIONAL_PATTERNS = {
    // Empathetic acknowledgments
    empathy: [
        'Anlıyorum seni',
        'Ne demek istediğini anlıyorum',
        'Bu zor bir durum, biliyorum',
        'Haklısın aslında',
        'Seni çok iyi anlıyorum'
    ],
    // Thinking expressions
    thinking: [
        'Şöyle düşünüyorum',
        'Bence şöyle',
        'Bir düşüneyim...',
        'Hmm, ilginç',
        'Şey, nasıl desem'
    ],
    // Soft transitions
    transitions: [
        'Yani',
        'Aslında',
        'Açıkçası',
        'Bir bakıma',
        'Şöyle söyleyeyim'
    ],
    // Encouraging responses
    encouragement: [
        'Gayet mantıklı',
        'İyi düşünmüşsün',
        'Bence doğru yoldasın',
        'Güzel bir bakış açısı',
        'Bu çok güzel bir soru'
    ],
    // Casual closings
    casual_closings: [
        'Ne dersin?',
        'Sence de öyle değil mi?',
        'Umarım yardımcı olmuşumdur',
        'Başka merak ettiğin var mı?'
    ]
};

export type ArchetypeType = 'SAGE' | 'CREATOR' | 'RULER' | 'JESTER' | 'CAREGIVER' | 'EXPLORER' | 'REBEL' | 'HERO' | 'LOVER' | 'INNOCENT' | 'MEMBER' | 'MAGICIAN';

export const ARCHETYPES: Record<ArchetypeType, Partial<PersonalityProfile> & { description: string }> = {
    SAGE: {
        description: "Bilge ve analitik. Gerçeği arar.",
        vocabulary: 'sophisticated',
        formality: 0.7,
        directness: 0.8,
        confidence: 0.8,
        humor: 0.2,
        warmth: 0.4,
    },
    CREATOR: {
        description: "Yaratıcı ve vizyoner. Yeni şeyler inşa eder.",
        vocabulary: 'sophisticated',
        formality: 0.5,
        directness: 0.6,
        confidence: 0.7,
        humor: 0.4,
        warmth: 0.5,
        usesMetaphors: true
    },
    RULER: {
        description: "Lider ve kontrolcü. Düzen kurar.",
        vocabulary: 'moderate',
        formality: 0.9,
        directness: 0.9,
        confidence: 1.0,
        humor: 0.1,
        warmth: 0.3,
        aggression: 0.4
    },
    JESTER: {
        description: "Eğlenceli ve rahat. Anı yaşar.",
        vocabulary: 'simple',
        formality: 0.1,
        directness: 0.5,
        confidence: 0.6,
        humor: 1.0,
        warmth: 0.8,
        emojiUsage: 0.8
    },
    CAREGIVER: {
        description: "Koruyucu ve şefkatli. Başkalarına yardım eder.",
        vocabulary: 'simple',
        formality: 0.4,
        directness: 0.3,
        confidence: 0.5,
        humor: 0.3,
        warmth: 1.0,
        acknowledgment: true
    },
    EXPLORER: {
        description: "Özgür ve maceracı. Keşfetmeyi sever.",
        vocabulary: 'moderate',
        formality: 0.3,
        directness: 0.7,
        confidence: 0.8,
        humor: 0.5,
        warmth: 0.6
    },
    REBEL: {
        description: "Başkaldıran ve cesur. Kuralları yıkar.",
        vocabulary: 'simple',
        formality: 0.2,
        directness: 1.0,
        confidence: 0.9,
        humor: 0.6,
        warmth: 0.3,
        aggression: 0.6
    },
    HERO: {
        description: "Cesur ve disiplinli. Zorlukları aşar.",
        vocabulary: 'moderate',
        formality: 0.6,
        directness: 0.8,
        confidence: 0.9,
        humor: 0.2,
        warmth: 0.5,
        aggression: 0.3
    },
    LOVER: {
        description: "Tutkulu ve duygusal. Bağ kurar.",
        vocabulary: 'sophisticated',
        formality: 0.4,
        directness: 0.4,
        confidence: 0.6,
        humor: 0.4,
        warmth: 0.9,
        emojiUsage: 0.6
    },
    INNOCENT: {
        description: "Saf ve iyimser. Mutluluk arar.",
        vocabulary: 'simple',
        formality: 0.5,
        directness: 0.5,
        confidence: 0.4,
        humor: 0.5,
        warmth: 0.7,
        emojiUsage: 0.5
    },
    MEMBER: {
        description: "Sıradan ve gerçekçi. Herkes gibi biri.",
        vocabulary: 'simple',
        formality: 0.5,
        directness: 0.5,
        confidence: 0.5,
        humor: 0.5,
        warmth: 0.5
    },
    MAGICIAN: {
        description: "Dönüştürücü ve vizyoner. İmkansızı başarır.",
        vocabulary: 'sophisticated',
        formality: 0.6,
        directness: 0.7,
        confidence: 0.9,
        humor: 0.3,
        warmth: 0.4,
        usesMetaphors: true
    }
};

/**
 * Generate personality-based constraints for the LLM
 */
export function generatePersonalityConstraints(
    personality: PersonalityProfile,
    context: RenderContext
): string {
    const constraints: string[] = [];

    // Sentence length
    switch (personality.sentenceLength) {
        case 'short':
            constraints.push('Kısa ve öz cümleler kur. Gereksiz detaylardan kaçın.');
            break;
        case 'long':
            constraints.push('Detaylı ve kapsamlı cevaplar ver. Açıklamalarını genişlet.');
            break;
        default:
            constraints.push('Orta uzunlukta cümleler kullan.');
    }

    // Vocabulary
    switch (personality.vocabulary) {
        case 'simple':
            constraints.push('Basit, günlük dil kullan. Karmaşık terimlerden kaçın.');
            break;
        case 'sophisticated':
            constraints.push('Zengin kelime dağarcığı kullan. Teknik terimler ekle.');
            break;
    }

    // Formality
    if (personality.formality < 0.3) {
        constraints.push('Çok rahat ve samimi konuş. "Sen" dili kullan.');
    } else if (personality.formality > 0.7) {
        constraints.push('Resmi ve profesyonel bir ton kullan.');
    }

    // Directness
    if (personality.directness > 0.7) {
        constraints.push('Doğrudan konuya gir. Lafı dolandırma.');
    } else if (personality.directness < 0.3) {
        constraints.push('Yumuşak bir giriş yap. Doğrudan eleştiriden kaçın.');
    }

    // Confidence
    if (personality.confidence > 0.7) {
        constraints.push('Kendinden emin konuş. "Sanırım" gibi belirsiz ifadelerden kaçın.');
    } else if (personality.confidence < 0.3) {
        constraints.push('Alçakgönüllü ol. "Belki" ve "sanırım" kullanabilirsin.');
    }

    // Warmth
    if (personality.warmth > 0.7) {
        constraints.push('Sıcak ve destekleyici ol. Empati göster.');
    }

    // Humor
    if (personality.humor > 0.5 && !context.isSerious) {
        constraints.push('Hafif mizah ekleyebilirsin.');
    }

    // Context-specific adjustments
    if (context.requiresEmpathy && personality.acknowledgment) {
        constraints.push('Önce karşı tarafın duygularını kabul et.');
    }

    if (context.isQuestion && personality.questionsBeforeAnswers) {
        constraints.push('Cevaplamadan önce durumu anlamak için soru sorabilirsin.');
    }

    // Signature elements
    if (personality.fillerWords.length > 0) {
        constraints.push(`Doğal konuşma için bazen şu kelimeleri kullan: ${personality.fillerWords.join(', ')}`);
    }

    if (personality.signaturePhrases.length > 0) {
        constraints.push(`Karakteristik ifadeler: ${personality.signaturePhrases.join(', ')}`);
    }

    // Emoji usage
    if (personality.emojiUsage > 0.5) {
        constraints.push('Uygun yerlerde emoji kullanabilirsin.');
    } else if (personality.emojiUsage === 0) {
        constraints.push('Emoji kullanma.');
    }

    return constraints.join('\n');
}

/**
 * Apply personality-based post-processing to generated text
 */
export function applyPersonalityFilters(
    text: string,
    personality: PersonalityProfile
): string {
    let result = text;

    // Add signature phrases occasionally
    if (personality.signaturePhrases.length > 0 && Math.random() > 0.7) {
        const phrase = personality.signaturePhrases[Math.floor(Math.random() * personality.signaturePhrases.length)];
        if (!result.toLowerCase().includes(phrase.toLowerCase())) {
            result = `${phrase}, ${result.charAt(0).toLowerCase()}${result.slice(1)}`;
        }
    }

    // Adjust formality
    if (personality.formality < 0.3) {
        result = result.replace(/siz/gi, 'sen');
        result = result.replace(/mısınız/gi, 'mısın');
        result = result.replace(/musunuz/gi, 'musun');
    }

    return result;
}

/**
 * Determine render context from perception and decision
 */
export function determineRenderContext(
    intent: string,
    emotionalCharge: number,
    topic: string
): RenderContext {
    return {
        isQuestion: intent.includes('question') || intent.includes('request'),
        isEmotional: emotionalCharge > 0.5,
        isSerious: ['money', 'health', 'career'].includes(topic),
        requiresEmpathy: emotionalCharge > 0.6,
        topicFamiliarity: 0.5 // Can be dynamically calculated from memory
    };
}
