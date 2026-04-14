/**
 * MNEMOS – Cognitive Preservation System
 * Layer 1: Perception Layer
 * 
 * Extracts intent, emotion, context, topic, and urgency from raw input.
 * This is how humans "perceive" incoming information before processing.
 */

export interface PerceptionResult {
    intent: 'question' | 'decision_request' | 'emotional_share' | 'information' | 'opinion_request' | 'casual';
    emotion: {
        anger: number;
        fear: number;
        joy: number;
        sadness: number;
        surprise: number;
        confidence: number;
        uncertainty: number;
    };
    topic: string;
    urgency: number;
    complexity: number;
    personalRelevance: number;
}

// Intent classification keywords (enhanced Turkish + English)
const INTENT_PATTERNS = {
    decision_request: [
        'karar', 'ne yapmalı', 'seçmeli', 'hangisi', 'nasıl yapayım',
        'ne dersin', 'tavsiye', 'öneri', 'tercih', 'alternatif',
        'decide', 'should i', 'which one', 'what would you', 'recommend'
    ],
    question: [
        'ne', 'nasıl', 'neden', 'nerede', 'kim', 'ne zaman', 'hangi',
        'what', 'how', 'why', 'where', 'who', 'when', 'which', '?'
    ],
    emotional_share: [
        'hissediyorum', 'üzgün', 'mutlu', 'korkuyorum', 'endişeli',
        'çok yoruldum', 'bunalmış', 'stresli', 'rahatladım', 'sevinçli',
        'feel', 'worried', 'happy', 'sad', 'stressed', 'relieved'
    ],
    opinion_request: [
        'ne düşünüyorsun', 'fikrin', 'görüşün', 'sence', 'sana göre',
        'think', 'opinion', 'view', 'perspective'
    ],
    information: [
        'bilgi', 'açıkla', 'anlat', 'nedir', 'kimdir', 'nasıl çalışır',
        'tell me', 'explain', 'describe', 'what is', 'how does'
    ]
};

// Emotion keywords (enhanced with intensity modifiers)
const EMOTION_WORDS = {
    anger: {
        high: ['öfkeli', 'çıldırıyorum', 'deliriyorum', 'furious', 'enraged'],
        medium: ['kızgın', 'sinirli', 'angry', 'mad', 'frustrated', 'bıktım'],
        low: ['canım sıkıldı', 'rahatsız', 'annoyed', 'irritated']
    },
    fear: {
        high: ['dehşet', 'panik', 'terrified', 'panic', 'çok korkuyorum'],
        medium: ['korku', 'endişe', 'kaygı', 'afraid', 'scared', 'worried'],
        low: ['tedirgin', 'gergin', 'nervous', 'uneasy', 'tehlike', 'risk']
    },
    joy: {
        high: ['muhteşem', 'harika', 'müthiş', 'ecstatic', 'amazing', 'çok mutluyum'],
        medium: ['mutlu', 'sevinç', 'happy', 'joy', 'excited', 'güzel'],
        low: ['iyi', 'fena değil', 'ok', 'fine', 'pleasant']
    },
    sadness: {
        high: ['yıkıldım', 'perişan', 'devastated', 'heartbroken', 'çok üzgün'],
        medium: ['üzgün', 'hüzün', 'kötü', 'sad', 'depressed', 'unhappy'],
        low: ['canım sıkılıyor', 'keyifsiz', 'down', 'blue', 'melancholic']
    },
    surprise: {
        high: ['şok', 'inanamıyorum', 'shocked', 'mind-blown', 'hayret'],
        medium: ['şaşkın', 'surprised', 'unexpected', 'beklemiyordum'],
        low: ['ilginç', 'tuhaf', 'interesting', 'curious']
    },
    confidence: {
        high: ['kesinlikle', 'yüzde yüz', 'absolutely', 'definitely', 'eminim'],
        medium: ['emin', 'sure', 'certain', 'biliyorum'],
        low: ['sanırım', 'galiba', 'think so', 'probably']
    },
    uncertainty: {
        high: ['hiç bilmiyorum', 'tamamen kayıp', 'no idea', 'clueless'],
        medium: ['emin değil', 'maybe', 'perhaps', 'not sure', 'bilmiyorum'],
        low: ['belki', 'olabilir', 'might', 'possibly']
    }
};

// Topic keywords (enhanced)
const TOPIC_KEYWORDS: Record<string, string[]> = {
    money: [
        'para', 'maaş', 'yatırım', 'borç', 'kredi', 'bütçe', 'tasarruf', 'harcama',
        'money', 'salary', 'invest', 'debt', 'loan', 'financial', 'budget', 'savings'
    ],
    career: [
        'iş', 'kariyer', 'terfi', 'istifa', 'mülakat', 'cv', 'özgeçmiş', 'patron',
        'job', 'career', 'promotion', 'resign', 'work', 'interview', 'boss', 'colleague'
    ],
    relationships: [
        'aile', 'sevgili', 'arkadaş', 'eş', 'anne', 'baba', 'kardeş', 'evlilik',
        'family', 'friend', 'relationship', 'love', 'partner', 'marriage', 'dating'
    ],
    health: [
        'sağlık', 'hastalık', 'doktor', 'ilaç', 'spor', 'diyet', 'uyku', 'stres',
        'health', 'sick', 'doctor', 'hospital', 'exercise', 'diet', 'sleep', 'stress'
    ],
    education: [
        'okul', 'eğitim', 'üniversite', 'sınav', 'ders', 'öğretmen', 'ödev',
        'school', 'education', 'university', 'study', 'exam', 'teacher', 'homework'
    ],
    technology: [
        'bilgisayar', 'telefon', 'yazılım', 'uygulama', 'internet', 'kod', 'yapay zeka',
        'computer', 'software', 'app', 'programming', 'AI', 'tech', 'code'
    ],
    personal: [
        'kendim', 'hayat', 'mutluluk', 'anlam', 'gelecek', 'hedef', 'amaç',
        'myself', 'life', 'happiness', 'meaning', 'future', 'goal', 'purpose'
    ],
    philosophy: [
        'felsefe', 'anlam', 'varoluş', 'ahlak', 'etik', 'değer', 'inanç',
        'philosophy', 'meaning', 'existence', 'ethics', 'values', 'belief', 'moral'
    ]
};

// Urgency keywords (enhanced)
const URGENCY_WORDS = {
    high: ['acil', 'hemen', 'şimdi', 'derhal', 'urgent', 'immediately', 'asap', 'emergency'],
    medium: ['bugün', 'yarın', 'bu hafta', 'today', 'tomorrow', 'soon', 'shortly'],
    low: ['bir ara', 'fırsat buldukça', 'eventually', 'sometime', 'when possible']
};

/**
 * Analyze input and extract perception signals
 */
export function perceive(input: string): PerceptionResult {
    const text = input.toLowerCase();

    return {
        intent: classifyIntent(text),
        emotion: analyzeEmotions(text),
        topic: extractTopic(text),
        urgency: calculateUrgency(text),
        complexity: calculateComplexity(text),
        personalRelevance: calculatePersonalRelevance(text)
    };
}

function classifyIntent(text: string): PerceptionResult['intent'] {
    let maxScore = 0;
    let maxIntent: PerceptionResult['intent'] = 'casual';

    for (const [intent, patterns] of Object.entries(INTENT_PATTERNS)) {
        const score = patterns.reduce((acc, pattern) =>
            text.includes(pattern) ? acc + 1 : acc, 0);

        if (score > maxScore) {
            maxScore = score;
            maxIntent = intent as PerceptionResult['intent'];
        }
    }

    return maxIntent;
}

function analyzeEmotions(text: string): PerceptionResult['emotion'] {
    const emotions: PerceptionResult['emotion'] = {
        anger: 0,
        fear: 0,
        joy: 0,
        sadness: 0,
        surprise: 0,
        confidence: 0,
        uncertainty: 0
    };

    // Intensity weights
    const INTENSITY_WEIGHTS = { high: 0.8, medium: 0.5, low: 0.2 };

    for (const [emotion, intensityGroups] of Object.entries(EMOTION_WORDS)) {
        let score = 0;

        // Check each intensity level
        for (const [intensity, words] of Object.entries(intensityGroups)) {
            const weight = INTENSITY_WEIGHTS[intensity as keyof typeof INTENSITY_WEIGHTS];
            for (const word of words) {
                if (text.includes(word)) {
                    score = Math.max(score, weight); // Take highest intensity match
                }
            }
        }

        emotions[emotion as keyof typeof emotions] = score;
    }

    // Normalize if total > 1
    const total = Object.values(emotions).reduce((a, b) => a + b, 0) || 1;
    if (total > 1) {
        for (const key of Object.keys(emotions)) {
            emotions[key as keyof typeof emotions] /= total;
        }
    }

    return emotions;
}

function extractTopic(text: string): string {
    let maxScore = 0;
    let maxTopic = 'general';

    for (const [topic, keywords] of Object.entries(TOPIC_KEYWORDS)) {
        const score = keywords.reduce((acc: number, keyword: string) =>
            text.includes(keyword) ? acc + 1 : acc, 0);

        if (score > maxScore) {
            maxScore = score;
            maxTopic = topic;
        }
    }

    return maxTopic;
}

function calculateUrgency(text: string): number {
    // Intensity weights for urgency
    const URGENCY_WEIGHTS = { high: 0.7, medium: 0.4, low: 0.15 };

    let urgencyScore = 0;

    for (const [intensity, words] of Object.entries(URGENCY_WORDS)) {
        const weight = URGENCY_WEIGHTS[intensity as keyof typeof URGENCY_WEIGHTS];
        for (const word of words) {
            if (text.includes(word)) {
                urgencyScore = Math.max(urgencyScore, weight);
            }
        }
    }

    // Exclamation marks add urgency
    const exclamations = (text.match(/!/g) || []).length * 0.1;

    // Multiple question marks indicate urgency
    const questionMarks = (text.match(/\?{2,}/g) || []).length * 0.15;

    return Math.min(1, urgencyScore + exclamations + questionMarks);
}

function calculateComplexity(text: string): number {
    // Word count
    const wordCount = text.split(/\s+/).length;

    // Sentence count
    const sentenceCount = (text.match(/[.!?]/g) || []).length || 1;

    // Average words per sentence
    const avgWords = wordCount / sentenceCount;

    // Complexity based on length and structure
    return Math.min(1, (avgWords / 20) + (wordCount / 100));
}

function calculatePersonalRelevance(text: string): number {
    const personalWords = ['ben', 'benim', 'bana', 'bende', 'i', 'my', 'me', 'mine'];
    const personalCount = personalWords.reduce((acc, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        return acc + (text.match(regex) || []).length * 0.15;
    }, 0);

    return Math.min(1, personalCount);
}
