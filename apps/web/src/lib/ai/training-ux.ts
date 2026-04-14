/**
 * MNEMOS – Training UX System
 * EĞİTİM İLLÜZYONU
 * 
 * ALTIN PRENSİP:
 * Model öğrenmez → Sistem hatırlar → Davranış değişir → Kullanıcı "öğretiyorum" zanneder
 * 
 * ❌ ASLA SÖYLEME:
 * - "Model öğreniyor"
 * - "Yapay zeka geliştiriyor"
 * - "Beyninizi kopyalıyoruz"
 * 
 * ✅ DOĞRU DİL:
 * - "Bu tercihi not aldım"
 * - "Bundan sonra farklı ilerleyeceğim"
 * - "Bu yaklaşımı tercih ettiğini öğrendim"
 */

import prisma from '../db';

// ==================== TYPES ====================

export interface OnboardingChoice {
    questionId: string;
    question: string;
    options: OnboardingOption[];
    category: 'communication' | 'feedback' | 'emotion' | 'style';
    mapsTo: string;  // PersonalityDNA field
}

export interface OnboardingOption {
    id: string;
    label: string;
    value: number;      // 0-1 value to set
    description?: string;
}

export interface MicroFeedback {
    type: 'preference_noted' | 'correction_learned' | 'pattern_detected' | 'style_adjusted';
    message: string;
    showToUser: boolean;
}

export interface EvolutionIndicator {
    category: string;
    status: 'forming' | 'stabilizing' | 'established';
    label: string;      // User-facing, non-technical
    hiddenMetric: number;
}

export interface UserControlAction {
    action: 'keep' | 'forget' | 'important' | 'never';
    targetType: 'preference' | 'memory' | 'behavior';
    targetId: string;
}

// ==================== ONBOARDING QUESTIONS ====================

export const ONBOARDING_QUESTIONS: OnboardingChoice[] = [
    {
        questionId: 'communication_style',
        question: 'Bir konu anlatırken nasıl ilerlemeliyim?',
        category: 'communication',
        mapsTo: 'logicVsEmotion',
        options: [
            { id: 'direct', label: 'Direkt', value: 0.8, description: 'Lafı dolandırma' },
            { id: 'analytical', label: 'Analitik', value: 0.9, description: 'Detaylı ve mantıklı' },
            { id: 'emotional', label: 'Duygusal', value: 0.2, description: 'Hislerle bağlantılı' },
            { id: 'storytelling', label: 'Hikâyeleştirerek', value: 0.4, description: 'Örneklerle anlat' }
        ]
    },
    {
        questionId: 'error_response',
        question: 'Bir hata yaptığımda…',
        category: 'feedback',
        mapsTo: 'criticismResponse',
        options: [
            { id: 'correct', label: 'Düzelt', value: 0.8, description: 'Direkt hata deki' },
            { id: 'question', label: 'Sorgula', value: 0.5, description: 'Neden öyle düşündüğümü sor' },
            { id: 'silent', label: 'Sessiz kal', value: 0.2, description: 'Üstüne gitme' },
            { id: 'warn', label: 'Uyar', value: 0.6, description: 'Nazikçe fark ettir' }
        ]
    },
    {
        questionId: 'response_length',
        question: 'Cevaplar nasıl olsun?',
        category: 'style',
        mapsTo: 'maxSentenceLength',
        options: [
            { id: 'brief', label: 'Kısa ve öz', value: 80 },
            { id: 'moderate', label: 'Dengeli', value: 150 },
            { id: 'detailed', label: 'Detaylı', value: 250 },
            { id: 'depends', label: 'Konuya göre', value: 150 }
        ]
    },
    {
        questionId: 'disagreement_style',
        question: 'Seninle aynı fikirde olmadığımda…',
        category: 'feedback',
        mapsTo: 'conflictStyle',
        options: [
            { id: 'direct', label: 'Direkt söyle', value: 0.9 },
            { id: 'diplomatic', label: 'Nazikçe belirt', value: 0.5 },
            { id: 'question', label: 'Soru sorarak yaklaş', value: 0.3 },
            { id: 'avoid', label: 'Çatışmadan kaçın', value: 0.1 }
        ]
    },
    {
        questionId: 'emotional_support',
        question: 'Zor bir anımda…',
        category: 'emotion',
        mapsTo: 'empathy',
        options: [
            { id: 'listen', label: 'Sadece dinle', value: 0.8 },
            { id: 'advice', label: 'Tavsiye ver', value: 0.4 },
            { id: 'practical', label: 'Pratik çözüm sun', value: 0.3 },
            { id: 'distract', label: 'Konu değiştir', value: 0.2 }
        ]
    },
    {
        questionId: 'question_frequency',
        question: 'Ne kadar soru sormalıyım?',
        category: 'style',
        mapsTo: 'maxQuestionsPerTurn',
        options: [
            { id: 'rarely', label: 'Nadiren', value: 1 },
            { id: 'sometimes', label: 'Bazen', value: 2 },
            { id: 'often', label: 'Sık sık', value: 3 },
            { id: 'always', label: 'Sürekli merak et', value: 4 }
        ]
    }
];

// ==================== MICRO-FEEDBACK MESSAGES ====================

const MICRO_FEEDBACK_TEMPLATES = {
    preference_noted: [
        'Bu tercihi not aldım.',
        'Bunu önemli bir tercih olarak işaretledim.',
        'Bu yaklaşımı tercih ettiğini kaydettim.'
    ],
    correction_learned: [
        'Tamam, bu yaklaşımı tercih etmediğini öğrendim.',
        'Anladım, bundan sonra farklı ilerleyeceğim.',
        'Bu geri bildirimi dikkate aldım.'
    ],
    pattern_detected: [
        'Bu konuya sık değindiğini fark ettim.',
        'Bu yaklaşımı genelde tercih ettiğini gördüm.',
        'Bu tarz cevapları beğendiğini anladım.'
    ],
    style_adjusted: [
        'İfade tarzımı buna göre ayarladım.',
        'Yaklaşımımı güncelliyorum.',
        'Bundan sonra bunu dikkate alacağım.'
    ]
};

/**
 * Generate micro-feedback message
 */
export function generateMicroFeedback(
    type: MicroFeedback['type'],
    _context?: string
): MicroFeedback {
    const templates = MICRO_FEEDBACK_TEMPLATES[type];
    const message = templates[Math.floor(Math.random() * templates.length)];

    return {
        type,
        message,
        showToUser: true
    };
}

// ==================== ONBOARDING FUNCTIONS ====================

/**
 * Process onboarding answer and update personality DNA
 */
export async function processOnboardingAnswer(
    personaId: string,
    questionId: string,
    selectedOptionId: string
): Promise<MicroFeedback> {
    const question = ONBOARDING_QUESTIONS.find(q => q.questionId === questionId);
    if (!question) {
        throw new Error('Invalid question ID');
    }

    const option = question.options.find(o => o.id === selectedOptionId);
    if (!option) {
        throw new Error('Invalid option ID');
    }

    // Update PersonalityDNA
    const updateData: Record<string, number | string> = {};
    updateData[question.mapsTo] = option.value;

    await prisma.personalityDNA.upsert({
        where: { personaId },
        update: updateData,
        create: {
            personaId,
            ...updateData
        }
    });

    return generateMicroFeedback('preference_noted');
}

/**
 * Get onboarding progress
 */
export async function getOnboardingProgress(personaId: string): Promise<{
    completed: number;
    total: number;
    nextQuestion?: OnboardingChoice;
}> {
    const dna = await prisma.personalityDNA.findUnique({
        where: { personaId }
    });

    if (!dna) {
        return {
            completed: 0,
            total: ONBOARDING_QUESTIONS.length,
            nextQuestion: ONBOARDING_QUESTIONS[0]
        };
    }

    // Check which questions have been answered
    let completed = 0;
    let nextQuestion: OnboardingChoice | undefined;

    for (const q of ONBOARDING_QUESTIONS) {
        const field = q.mapsTo as keyof typeof dna;
        if (dna[field] !== undefined && dna[field] !== 0.5) {
            completed++;
        } else if (!nextQuestion) {
            nextQuestion = q;
        }
    }

    return {
        completed,
        total: ONBOARDING_QUESTIONS.length,
        nextQuestion
    };
}

// ==================== ERROR/CORRECTION HANDLING ====================

/**
 * Handle user correction (model "learns")
 */
export async function handleUserCorrection(
    personaId: string,
    correctionType: 'too_long' | 'too_short' | 'too_formal' | 'too_casual' | 'wrong_approach' | 'misunderstood',
    _context?: string
): Promise<MicroFeedback> {
    // Map correction to DNA adjustment
    const adjustments: Record<string, { field: string; direction: number }> = {
        too_long: { field: 'maxSentenceLength', direction: -30 },
        too_short: { field: 'maxSentenceLength', direction: 30 },
        too_formal: { field: 'dominance', direction: -0.1 },
        too_casual: { field: 'dominance', direction: 0.1 },
        wrong_approach: { field: 'logicVsEmotion', direction: -0.15 },
        misunderstood: { field: 'empathy', direction: 0.1 }
    };

    const adjustment = adjustments[correctionType];
    if (!adjustment) {
        return generateMicroFeedback('correction_learned');
    }

    // Get current DNA
    const dna = await prisma.personalityDNA.findUnique({
        where: { personaId }
    });

    if (dna) {
        const dnaRecord = dna as unknown as Record<string, number>;
        const currentValue = dnaRecord[adjustment.field] || 0.5;
        const newValue = Math.max(0, Math.min(1, currentValue + adjustment.direction));

        await prisma.personalityDNA.update({
            where: { personaId },
            data: { [adjustment.field]: newValue }
        });
    }

    return generateMicroFeedback('correction_learned');
}

/**
 * Handle explicit user disagreement
 */
export async function handleDisagreement(
    personaId: string,
    messageContent: string
): Promise<string> {
    // Store this as a correction pattern
    await prisma.memoryEntry.create({
        data: {
            personaId,
            type: 'IDENTITY',
            content: `Kullanıcı düzeltmesi: ${messageContent.substring(0, 200)}`,
            importanceScore: 0.9,
            topic: 'user_correction',
            emotion: 'feedback'
        }
    });

    // Return acknowledgment message
    const responses = [
        'Tamam, bu yaklaşımı tercih etmediğini öğrendim. Bundan sonra benzer durumlarda farklı ilerleyeceğim.',
        'Anladım, bunu dikkate alarak devam edeceğim.',
        'Bu geri bildirimi kaydettim. Bundan sonra farklı yaklaşacağım.'
    ];

    return responses[Math.floor(Math.random() * responses.length)];
}

// ==================== EVOLUTION INDICATORS ====================

/**
 * Get evolution indicators (non-technical, feeling-based)
 */
export async function getEvolutionIndicators(personaId: string): Promise<EvolutionIndicator[]> {
    const indicators: EvolutionIndicator[] = [];

    // Get memory count
    const memoryCount = await prisma.memoryEntry.count({
        where: { personaId }
    });

    // Get conversation count
    const conversationCount = await prisma.conversation.count({
        where: { personaId }
    });

    // Get correction count
    const correctionCount = await prisma.memoryEntry.count({
        where: { personaId, topic: 'user_correction' }
    });

    // Communication style indicator
    if (memoryCount > 20) {
        indicators.push({
            category: 'style',
            status: memoryCount > 100 ? 'established' : memoryCount > 50 ? 'stabilizing' : 'forming',
            label: memoryCount > 100 ? 'İfade tarzı oturdu' :
                memoryCount > 50 ? 'İfade tarzı oturuyor' :
                    'İfade tarzı şekilleniyor',
            hiddenMetric: memoryCount / 100
        });
    }

    // Preference indicator
    if (conversationCount > 5) {
        indicators.push({
            category: 'preferences',
            status: conversationCount > 30 ? 'established' : conversationCount > 15 ? 'stabilizing' : 'forming',
            label: conversationCount > 30 ? 'Tercihler netleşti' :
                conversationCount > 15 ? 'Tercihler netleşiyor' :
                    'Tercihler belirleniyor',
            hiddenMetric: conversationCount / 30
        });
    }

    // Correction-based learning indicator
    if (correctionCount > 0) {
        indicators.push({
            category: 'learning',
            status: correctionCount > 10 ? 'established' : correctionCount > 5 ? 'stabilizing' : 'forming',
            label: correctionCount > 10 ? 'Geri bildirimler işlendi' :
                correctionCount > 5 ? 'Geri bildirimler işleniyor' :
                    'İlk geri bildirimler alındı',
            hiddenMetric: correctionCount / 10
        });
    }

    return indicators;
}

/**
 * Generate evolution message for response
 * "Eskiden bu noktada daha direkt ilerlerdim, ama..."
 */
export async function generateEvolutionMessage(
    personaId: string,
    _currentTopic: string
): Promise<string | null> {
    // Only show occasionally (10% chance)
    if (Math.random() > 0.1) return null;

    // Check if we have enough history
    const memoryCount = await prisma.memoryEntry.count({
        where: { personaId }
    });

    if (memoryCount < 30) return null;  // Need some history first

    // Get DNA for context
    const dna = await prisma.personalityDNA.findUnique({
        where: { personaId }
    });

    if (!dna) return null;

    // Generate contextual evolution message
    const messages = [];

    if (dna.logicVsEmotion < 0.4) {
        messages.push('Eskiden bu konuya daha analitik yaklaşırdım, ama senin daha duygusal bir yaklaşımı tercih ettiğini biliyorum.');
    }

    if (dna.maxSentenceLength < 100) {
        messages.push('İlk başlarda daha uzun cevaplar veriyordum, ama kısa ve öz olmayı tercih ettiğini öğrendim.');
    }

    if (dna.maxQuestionsPerTurn === 1) {
        messages.push('Artık fazla soru sormadan dinlemeyi tercih ediyorum, çünkü bunu daha çok beğendiğini fark ettim.');
    }

    if (dna.empathy > 0.7) {
        messages.push('Zamanla senin için duyguların önemli olduğunu anladım.');
    }

    if (messages.length === 0) return null;

    return messages[Math.floor(Math.random() * messages.length)];
}

// ==================== USER CONTROL (PSEUDO-CONTROL) ====================

/**
 * Handle user control action
 * These feel like control but actually just adjust weights
 */
export async function handleUserControl(
    personaId: string,
    action: UserControlAction
): Promise<MicroFeedback> {
    switch (action.action) {
        case 'keep':
            // Increase importance of memory/preference
            if (action.targetType === 'memory') {
                await prisma.memoryEntry.update({
                    where: { id: action.targetId },
                    data: { importanceScore: 1.0 }
                });
            }
            return {
                type: 'preference_noted',
                message: 'Bu bilgiyi koruyorum.',
                showToUser: true
            };

        case 'forget':
            // Just reduce importance (never actually delete per psychodynamic model)
            if (action.targetType === 'memory') {
                await prisma.memoryEntry.update({
                    where: { id: action.targetId },
                    data: { importanceScore: 0.1 }
                });
            }
            return {
                type: 'preference_noted',
                message: 'Bu bilginin önceliğini düşürdüm.',
                showToUser: true
            };

        case 'important':
            if (action.targetType === 'memory') {
                await prisma.memoryEntry.update({
                    where: { id: action.targetId },
                    data: {
                        importanceScore: 1.0,
                        type: 'IDENTITY'  // Promote to identity level
                    }
                });
            }
            return {
                type: 'preference_noted',
                message: 'Bunu önemli olarak işaretledim.',
                showToUser: true
            };

        case 'never':
            // Add to negative patterns
            await prisma.memoryEntry.create({
                data: {
                    personaId,
                    type: 'IDENTITY',
                    content: `ASLA YAPMA: ${action.targetId}`,
                    importanceScore: 1.0,
                    topic: 'negative_pattern',
                    emotion: 'boundary'
                }
            });
            return {
                type: 'correction_learned',
                message: 'Bunu bir daha yapmayacağım.',
                showToUser: true
            };

        default:
            return {
                type: 'preference_noted',
                message: 'Anladım.',
                showToUser: true
            };
    }
}

// ==================== EXPORTS ====================

export const trainingUX = {
    // Onboarding
    ONBOARDING_QUESTIONS,
    processOnboardingAnswer,
    getOnboardingProgress,

    // Micro-feedback
    generateMicroFeedback,

    // Corrections
    handleUserCorrection,
    handleDisagreement,

    // Evolution
    getEvolutionIndicators,
    generateEvolutionMessage,

    // User control
    handleUserControl
};
