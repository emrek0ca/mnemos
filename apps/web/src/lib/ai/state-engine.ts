/**
 * MNEMOS – Dijital Kişilik Motoru
 * State Engine - Ruh Hali Motoru
 * 
 * Her etkileşimde değişen mental state.
 * Bu yoksa "robot" hissi gelir.
 * 
 * Özellikler:
 * - Önceki konuşmadan etkilenir
 * - Günün saatine göre değişir  
 * - Aynı soruya farklı cevap verdirir
 */

import prisma from '../db';

// ==================== TYPES ====================

export interface MentalState {
    energy: number;          // 0-1: Enerji seviyesi
    irritation: number;      // 0-1: Sinirlilik
    confidence: number;      // 0-1: Özgüven
    focus: number;           // 0-1: Odaklanma
    openness: number;        // 0-1: Konuşmaya açıklık
    patience: number;        // 0-1: Sabır
}

export interface StateContext {
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
    conversationLength: number;  // Kaç tur oldu
    topicHeaviness: number;      // Ağır konular yorar (0-1)
    conflictExposure: number;    // Çatışma maruziyeti (0-1)
    lastEmotionalIntensity: number; // Son mesajın duygusal yoğunluğu
}

export interface StateEffect {
    description: string;
    modifiers: {
        responseLength: 'shorter' | 'normal' | 'longer';
        toneSharpness: number;  // 0-1, yüksek = daha keskin
        questionTendency: number; // 0-1, soru sorma eğilimi
        explanationDepth: 'minimal' | 'normal' | 'detailed';
        silenceProbability: number; // 0-1, bazen cevapsız kalma
    };
}

// ==================== DEFAULT STATE ====================

export const DEFAULT_STATE: MentalState = {
    energy: 0.7,
    irritation: 0.2,
    confidence: 0.6,
    focus: 0.7,
    openness: 0.6,
    patience: 0.7
};

// ==================== TIME OF DAY ====================

function getTimeOfDay(): StateContext['timeOfDay'] {
    const hour = new Date().getHours();
    if (hour >= 6 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 22) return 'evening';
    return 'night';
}

// Saat bazlı doğal enerji değişimi
function getTimeBasedStateModifiers(): Partial<MentalState> {
    const timeOfDay = getTimeOfDay();

    switch (timeOfDay) {
        case 'morning':
            return {
                energy: 0.8,
                focus: 0.8,
                patience: 0.7,
                irritation: 0.2
            };
        case 'afternoon':
            return {
                energy: 0.6,
                focus: 0.6,
                patience: 0.6,
                irritation: 0.3
            };
        case 'evening':
            return {
                energy: 0.5,
                focus: 0.5,
                patience: 0.5,
                openness: 0.7  // Akşam daha açık konuşulur
            };
        case 'night':
            return {
                energy: 0.4,
                focus: 0.4,
                patience: 0.8, // Gece daha sabırlı
                openness: 0.8  // Gece daha derin konuşmalar
            };
    }
}

// ==================== STATE CALCULATION ====================

/**
 * Mevcut mental state'i hesapla
 * Son state + zaman faktörleri + konuşma bağlamı
 */
export async function calculateCurrentState(
    personaId: string,
    context: Partial<StateContext> = {}
): Promise<MentalState> {
    // Son kaydedilmiş state'i al
    const lastState = await getLastState(personaId);
    const baseState = lastState || DEFAULT_STATE;

    // Zaman bazlı modifiers
    const timeModifiers = getTimeBasedStateModifiers();

    // Konuşma uzunluğu etkisi - uzun konuşmalar yorar
    const lengthFatigue = Math.min(0.3, (context.conversationLength || 0) * 0.02);

    // Ağır konu etkisi
    const heavinessImpact = (context.topicHeaviness || 0) * 0.2;

    // Çatışma etkisi
    const conflictImpact = (context.conflictExposure || 0) * 0.25;

    // Yeni state hesapla
    const newState: MentalState = {
        energy: clamp(
            blend(baseState.energy, timeModifiers.energy || baseState.energy, 0.3)
            - lengthFatigue - heavinessImpact,
            0.1, 1
        ),
        irritation: clamp(
            blend(baseState.irritation, timeModifiers.irritation || baseState.irritation, 0.3)
            + conflictImpact + (context.lastEmotionalIntensity || 0) * 0.1,
            0, 0.9
        ),
        confidence: clamp(
            blend(baseState.confidence, 0.6, 0.1), // Yavaşça normale dön
            0.2, 1
        ),
        focus: clamp(
            blend(baseState.focus, timeModifiers.focus || baseState.focus, 0.3)
            - lengthFatigue * 1.5,
            0.2, 1
        ),
        openness: clamp(
            blend(baseState.openness, timeModifiers.openness || baseState.openness, 0.3),
            0.2, 1
        ),
        patience: clamp(
            blend(baseState.patience, timeModifiers.patience || baseState.patience, 0.3)
            - conflictImpact - lengthFatigue,
            0.1, 1
        )
    };

    return newState;
}

/**
 * State'in konuşma üzerindeki etkilerini hesapla
 */
export function calculateStateEffects(state: MentalState): StateEffect {
    const effects: StateEffect = {
        description: '',
        modifiers: {
            responseLength: 'normal',
            toneSharpness: 0.3,
            questionTendency: 0.5,
            explanationDepth: 'normal',
            silenceProbability: 0
        }
    };

    // Düşük enerji → Kısa cevaplar
    if (state.energy < 0.4) {
        effects.modifiers.responseLength = 'shorter';
        effects.modifiers.explanationDepth = 'minimal';
        effects.description += 'Enerjisi düşük, kısa yanıtlar verecek. ';
    }

    // Yüksek irritation → Daha keskin ton
    if (state.irritation > 0.6) {
        effects.modifiers.toneSharpness = 0.7 + (state.irritation - 0.6);
        effects.description += 'Biraz gergin, daha keskin olabilir. ';
    }

    // Düşük patience → "Bunu daha önce konuştuk" tarzı
    if (state.patience < 0.3) {
        effects.modifiers.silenceProbability = 0.1;
        effects.description += 'Sabrı azalmış, tekrarlara toleransı düşük. ';
    }

    // Düşük focus → Konu değiştirme eğilimi
    if (state.focus < 0.4) {
        effects.modifiers.questionTendency = 0.2;
        effects.description += 'Odaklanması düşük, derine inmeyebilir. ';
    }

    // Yüksek openness → Daha detaylı
    if (state.openness > 0.7) {
        effects.modifiers.explanationDepth = 'detailed';
        effects.modifiers.responseLength = 'longer';
        effects.description += 'Açık modda, daha detaylı konuşabilir. ';
    }

    // Yüksek confidence → Daha kesin ifadeler
    if (state.confidence > 0.7) {
        effects.modifiers.toneSharpness = Math.max(effects.modifiers.toneSharpness, 0.5);
        effects.description += 'Kendinden emin, kesin konuşacak. ';
    }

    return effects;
}

// ==================== STATE PERSISTENCE ====================

/**
 * Mental state'i kaydet
 */
export async function logState(
    personaId: string,
    state: MentalState,
    context: Partial<StateContext> = {},
    conversationId?: string
): Promise<void> {
    try {
        await prisma.mentalStateLog.create({
            data: {
                personaId,
                conversationId,
                energy: state.energy,
                irritation: state.irritation,
                confidence: state.confidence,
                focus: state.focus,
                openness: state.openness,
                patience: state.patience,
                timeOfDay: getTimeOfDay(),
                topicHeaviness: context.topicHeaviness || 0.5,
                turnCount: context.conversationLength || 0
            }
        });
    } catch (error) {
        console.error('[StateEngine] Failed to log state:', error);
    }
}

/**
 * Son kaydedilmiş state'i al
 */
export async function getLastState(personaId: string): Promise<MentalState | null> {
    try {
        const lastLog = await prisma.mentalStateLog.findFirst({
            where: { personaId },
            orderBy: { createdAt: 'desc' }
        });

        if (!lastLog) return null;

        // Eğer son state çok eskiyse (24 saat+), varsayılana dön
        const hoursSinceLastState = (Date.now() - lastLog.createdAt.getTime()) / (1000 * 60 * 60);
        if (hoursSinceLastState > 24) {
            return DEFAULT_STATE;
        }

        // Zamanla doğal recovery (her saat için %5)
        const recoveryFactor = Math.min(1, hoursSinceLastState * 0.05);

        return {
            energy: blend(lastLog.energy, DEFAULT_STATE.energy, recoveryFactor),
            irritation: blend(lastLog.irritation, DEFAULT_STATE.irritation, recoveryFactor),
            confidence: blend(lastLog.confidence, DEFAULT_STATE.confidence, recoveryFactor),
            focus: blend(lastLog.focus, DEFAULT_STATE.focus, recoveryFactor),
            openness: blend(lastLog.openness, DEFAULT_STATE.openness, recoveryFactor),
            patience: blend(lastLog.patience, DEFAULT_STATE.patience, recoveryFactor)
        };
    } catch (error) {
        console.error('[StateEngine] Failed to get last state:', error);
        return null;
    }
}

/**
 * State geçmişini al (analiz için)
 */
export async function getStateHistory(
    personaId: string,
    limit: number = 50
): Promise<Array<MentalState & { createdAt: Date }>> {
    try {
        const logs = await prisma.mentalStateLog.findMany({
            where: { personaId },
            orderBy: { createdAt: 'desc' },
            take: limit
        });

        return logs.map(log => ({
            energy: log.energy,
            irritation: log.irritation,
            confidence: log.confidence,
            focus: log.focus,
            openness: log.openness,
            patience: log.patience,
            createdAt: log.createdAt
        }));
    } catch (error) {
        console.error('[StateEngine] Failed to get state history:', error);
        return [];
    }
}

// ==================== STATE UPDATES FROM INTERACTION ====================

/**
 * Etkileşime göre state güncelle
 */
export function updateStateFromInteraction(
    currentState: MentalState,
    interaction: {
        wasPositive: boolean;
        wasEmotional: boolean;
        userFrustrationDetected: boolean;
        topicWasHeavy: boolean;
        turnNumber: number;
    }
): MentalState {
    let { energy, irritation, confidence, focus, openness, patience } = currentState;

    // Pozitif etkileşim → Enerji ve özgüven artar
    if (interaction.wasPositive) {
        energy = clamp(energy + 0.05, 0, 1);
        confidence = clamp(confidence + 0.03, 0, 1);
        irritation = clamp(irritation - 0.05, 0, 1);
    }

    // Kullanıcı hayal kırıklığı → Irritation artar
    if (interaction.userFrustrationDetected) {
        irritation = clamp(irritation + 0.1, 0, 1);
        patience = clamp(patience - 0.05, 0, 1);
    }

    // Duygusal etkileşim → Enerji düşer, openness artar
    if (interaction.wasEmotional) {
        energy = clamp(energy - 0.05, 0, 1);
        openness = clamp(openness + 0.05, 0, 1);
    }

    // Ağır konu → Genel yorgunluk
    if (interaction.topicWasHeavy) {
        energy = clamp(energy - 0.08, 0, 1);
        focus = clamp(focus - 0.05, 0, 1);
    }

    // Uzun konuşma → Sabır ve odak düşer
    if (interaction.turnNumber > 10) {
        patience = clamp(patience - 0.02, 0, 1);
        focus = clamp(focus - 0.02, 0, 1);
    }

    return { energy, irritation, confidence, focus, openness, patience };
}

// ==================== HELPERS ====================

function clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value));
}

function blend(a: number, b: number, factor: number): number {
    return a * (1 - factor) + b * factor;
}

// ==================== EXPORTS ====================

export const stateEngine = {
    calculateCurrentState,
    calculateStateEffects,
    logState,
    getLastState,
    getStateHistory,
    updateStateFromInteraction,
    getTimeOfDay
};
