/**
 * MNEMOS – Dijital Kişilik Motoru
 * Personality DNA - Değişmez Kişilik Çekirdeği
 * 
 * Bu katman asla otomatik öğrenmez.
 * Çünkü insanın özü kolay değişmez.
 * 
 * Bu katman:
 * - Dil tonunu
 * - Tepki sertliğini
 * - Yargılama biçimini
 * belirler.
 * 
 * Bu katman bozulursa kişi "kendim değilim" der.
 */

import prisma from '../db';

// ==================== TYPES ====================

export interface PersonalityDNA {
    // ========== Big Five (OCEAN) ==========
    openness: number;          // Yeni deneyimlere açıklık
    conscientiousness: number; // Düzenlilik, sorumluluk
    extraversion: number;      // Dışadönüklük
    agreeableness: number;     // Uyumluluk, işbirliği
    neuroticism: number;       // Duygusal dalgalanma, kaygı

    // ========== Bilişsel Stil ==========
    decisionSpeed: number;     // Çabuk/yavaş karar alıcı
    abstractThinking: number;  // Somut/soyut düşünce
    pastVsFuture: number;      // Geçmiş/gelecek odaklı
    detailOrientation: number; // Büyük resim/detay odaklı

    // Temel kişilik eksenleri (0-1)
    dominance: number;        // Baskınlık vs boyun eğme
    empathy: number;          // Empati kapasitesi
    logicVsEmotion: number;   // 0 = Tamamen duygusal, 1 = Tamamen mantıksal
    selfFocus: number;        // Ben-merkezcilik
    conflictStyle: 'direct' | 'passive' | 'avoidant' | 'diplomatic';

    // Tepki profili (0-1)
    angerThreshold: number;      // Sinir eşiği (düşük = kolay sinirlenir)
    praiseResponse: number;      // Övgüye tepki (yüksek = çok etkiler)
    criticismResponse: number;   // Eleştiriye tepki (yüksek = savunmaya geçer)
    silenceComfort: number;      // Sessizlik konforu (yüksek = rahat eder)
    stressResponse: number;      // Stres altında tepki (0=donma, 1=savaş)

    // İfade kısıtları
    maxSentenceLength: number;
    maxQuestionsPerTurn: number;
    explainEverything: boolean;
}


export interface ReactionAnalysis {
    tone: 'soft' | 'neutral' | 'firm' | 'sharp';
    assertiveness: number;  // 0-1
    emotionalLeakage: number; // 0-1: Duyguların dışa yansıması
    defensiveness: number;  // 0-1
    explanation: string;
}

// ==================== DEFAULT DNA ====================

export const DEFAULT_DNA: PersonalityDNA = {
    // Big Five (OCEAN)
    openness: 0.5,
    conscientiousness: 0.5,
    extraversion: 0.5,
    agreeableness: 0.5,
    neuroticism: 0.5,
    // Cognitive Style
    decisionSpeed: 0.5,
    abstractThinking: 0.5,
    pastVsFuture: 0.5,
    detailOrientation: 0.5,
    // Core Personality
    dominance: 0.5,
    empathy: 0.5,
    logicVsEmotion: 0.5,
    selfFocus: 0.5,
    conflictStyle: 'diplomatic',
    // Reaction Profile
    angerThreshold: 0.5,
    praiseResponse: 0.5,
    criticismResponse: 0.5,
    silenceComfort: 0.5,
    stressResponse: 0.5,
    // Expression Constraints
    maxSentenceLength: 150,
    maxQuestionsPerTurn: 2,
    explainEverything: false
};

// ==================== DNA OPERATIONS ====================

/**
 * Persona için DNA yükle veya oluştur
 */
export async function loadPersonalityDNA(personaId: string): Promise<PersonalityDNA> {
    try {
        const dna = await prisma.personalityDNA.findUnique({
            where: { personaId }
        });

        if (!dna) {
            return await initializePersonalityDNA(personaId);
        }

        return {
            // Big Five (OCEAN)
            openness: dna.openness,
            conscientiousness: dna.conscientiousness,
            extraversion: dna.extraversion,
            agreeableness: dna.agreeableness,
            neuroticism: dna.neuroticism,
            // Cognitive Style
            decisionSpeed: dna.decisionSpeed,
            abstractThinking: dna.abstractThinking,
            pastVsFuture: dna.pastVsFuture,
            detailOrientation: dna.detailOrientation,
            // Core Personality
            dominance: dna.dominance,
            empathy: dna.empathy,
            logicVsEmotion: dna.logicVsEmotion,
            selfFocus: dna.selfFocus,
            conflictStyle: dna.conflictStyle as PersonalityDNA['conflictStyle'],
            // Reaction Profile
            angerThreshold: dna.angerThreshold,
            praiseResponse: dna.praiseResponse,
            criticismResponse: dna.criticismResponse,
            silenceComfort: dna.silenceComfort,
            stressResponse: dna.stressResponse,
            // Expression Constraints
            maxSentenceLength: dna.maxSentenceLength,
            maxQuestionsPerTurn: dna.maxQuestionsPerTurn,
            explainEverything: dna.explainEverything
        };
    } catch (error) {
        console.error('[PersonalityDNA] Failed to load:', error);
        return DEFAULT_DNA;
    }
}

/**
 * Yeni persona için DNA oluştur
 */
export async function initializePersonalityDNA(
    personaId: string,
    dna: Partial<PersonalityDNA> = {}
): Promise<PersonalityDNA> {
    const fullDNA = { ...DEFAULT_DNA, ...dna };

    try {
        await prisma.personalityDNA.create({
            data: {
                personaId,
                // Big Five
                openness: fullDNA.openness,
                conscientiousness: fullDNA.conscientiousness,
                extraversion: fullDNA.extraversion,
                agreeableness: fullDNA.agreeableness,
                neuroticism: fullDNA.neuroticism,
                // Cognitive Style
                decisionSpeed: fullDNA.decisionSpeed,
                abstractThinking: fullDNA.abstractThinking,
                pastVsFuture: fullDNA.pastVsFuture,
                detailOrientation: fullDNA.detailOrientation,
                // Core Personality
                dominance: fullDNA.dominance,
                empathy: fullDNA.empathy,
                logicVsEmotion: fullDNA.logicVsEmotion,
                selfFocus: fullDNA.selfFocus,
                conflictStyle: fullDNA.conflictStyle,
                // Reaction Profile
                angerThreshold: fullDNA.angerThreshold,
                praiseResponse: fullDNA.praiseResponse,
                criticismResponse: fullDNA.criticismResponse,
                silenceComfort: fullDNA.silenceComfort,
                stressResponse: fullDNA.stressResponse,
                // Expression Constraints
                maxSentenceLength: fullDNA.maxSentenceLength,
                maxQuestionsPerTurn: fullDNA.maxQuestionsPerTurn,
                explainEverything: fullDNA.explainEverything
            }
        });

        return fullDNA;
    } catch (error) {
        console.error('[PersonalityDNA] Failed to initialize:', error);
        return DEFAULT_DNA;
    }
}

/**
 * DNA güncelle (sadece manuel müdahale ile)
 */
export async function updatePersonalityDNA(
    personaId: string,
    updates: Partial<PersonalityDNA>
): Promise<PersonalityDNA> {
    try {
        const updated = await prisma.personalityDNA.update({
            where: { personaId },
            data: {
                // Big Five
                openness: updates.openness,
                conscientiousness: updates.conscientiousness,
                extraversion: updates.extraversion,
                agreeableness: updates.agreeableness,
                neuroticism: updates.neuroticism,
                // Cognitive Style
                decisionSpeed: updates.decisionSpeed,
                abstractThinking: updates.abstractThinking,
                pastVsFuture: updates.pastVsFuture,
                detailOrientation: updates.detailOrientation,
                // Core Personality
                dominance: updates.dominance,
                empathy: updates.empathy,
                logicVsEmotion: updates.logicVsEmotion,
                selfFocus: updates.selfFocus,
                conflictStyle: updates.conflictStyle,
                // Reaction Profile
                angerThreshold: updates.angerThreshold,
                praiseResponse: updates.praiseResponse,
                criticismResponse: updates.criticismResponse,
                silenceComfort: updates.silenceComfort,
                stressResponse: updates.stressResponse,
                // Expression Constraints
                maxSentenceLength: updates.maxSentenceLength,
                maxQuestionsPerTurn: updates.maxQuestionsPerTurn,
                explainEverything: updates.explainEverything
            }
        });

        return {
            // Big Five
            openness: updated.openness,
            conscientiousness: updated.conscientiousness,
            extraversion: updated.extraversion,
            agreeableness: updated.agreeableness,
            neuroticism: updated.neuroticism,
            // Cognitive Style
            decisionSpeed: updated.decisionSpeed,
            abstractThinking: updated.abstractThinking,
            pastVsFuture: updated.pastVsFuture,
            detailOrientation: updated.detailOrientation,
            // Core Personality
            dominance: updated.dominance,
            empathy: updated.empathy,
            logicVsEmotion: updated.logicVsEmotion,
            selfFocus: updated.selfFocus,
            conflictStyle: updated.conflictStyle as PersonalityDNA['conflictStyle'],
            // Reaction Profile
            angerThreshold: updated.angerThreshold,
            praiseResponse: updated.praiseResponse,
            criticismResponse: updated.criticismResponse,
            silenceComfort: updated.silenceComfort,
            stressResponse: updated.stressResponse,
            // Expression Constraints
            maxSentenceLength: updated.maxSentenceLength,
            maxQuestionsPerTurn: updated.maxQuestionsPerTurn,
            explainEverything: updated.explainEverything
        };
    } catch (error) {
        console.error('[PersonalityDNA] Failed to update:', error);
        return loadPersonalityDNA(personaId);
    }
}

// ==================== REACTION ANALYSIS ====================

/**
 * Kullanıcı mesajı türüne göre tepki profili hesapla
 */
export function analyzeReaction(
    dna: PersonalityDNA,
    messageType: 'praise' | 'criticism' | 'neutral' | 'conflict' | 'emotional'
): ReactionAnalysis {
    let tone: ReactionAnalysis['tone'] = 'neutral';
    let assertiveness = 0.5;
    let emotionalLeakage = 0.5;
    let defensiveness = 0;
    let explanation = '';

    switch (messageType) {
        case 'praise':
            // Övgüye tepki
            emotionalLeakage = dna.praiseResponse * 0.8;
            if (dna.praiseResponse > 0.7) {
                tone = 'soft';
                explanation = 'Övgüden etkilendi, daha sıcak olacak.';
            } else if (dna.praiseResponse < 0.3) {
                tone = 'neutral';
                explanation = 'Övgüye mesafeli, tepkisiz kalabilir.';
            }
            break;

        case 'criticism':
            // Eleştiriye tepki
            defensiveness = dna.criticismResponse;
            if (dna.criticismResponse > 0.7) {
                tone = dna.conflictStyle === 'direct' ? 'sharp' : 'firm';
                assertiveness = 0.8;
                explanation = 'Eleştiriye karşı savunmaya geçti.';
            } else if (dna.criticismResponse < 0.3) {
                tone = 'soft';
                explanation = 'Eleştiriyi kabullendi.';
            }
            break;

        case 'conflict':
            // Çatışma durumu
            switch (dna.conflictStyle) {
                case 'direct':
                    tone = 'sharp';
                    assertiveness = 0.8 + dna.dominance * 0.2;
                    explanation = 'Doğrudan çatışmaya girdi.';
                    break;
                case 'passive':
                    tone = 'soft';
                    assertiveness = 0.3;
                    emotionalLeakage = 0.7;
                    explanation = 'Pasif agresif tepki verebilir.';
                    break;
                case 'avoidant':
                    tone = 'neutral';
                    assertiveness = 0.2;
                    explanation = 'Konuyu değiştirmeye çalışacak.';
                    break;
                case 'diplomatic':
                    tone = 'firm';
                    assertiveness = 0.6;
                    explanation = 'Uzlaşma arıyor.';
                    break;
            }
            break;

        case 'emotional':
            // Duygusal paylaşım
            emotionalLeakage = 1 - dna.logicVsEmotion;
            if (dna.empathy > 0.7) {
                tone = 'soft';
                explanation = 'Empati yapacak, duygusal bağ kuracak.';
            } else if (dna.empathy < 0.3) {
                tone = 'neutral';
                explanation = 'Mantıksal çözüm önerecek.';
            }
            break;

        default:
            // Nötr durum - DNA'ya göre varsayılan
            tone = dna.dominance > 0.6 ? 'firm' : 'neutral';
            assertiveness = dna.dominance;
    }

    return { tone, assertiveness, emotionalLeakage, defensiveness, explanation };
}

/**
 * DNA'dan konuşma stili kısıtlamaları üret (LLM için)
 */
/**
 * DNA'dan konuşma stili kısıtlamaları üret (LLM için)
 */
export function generateExpressionConstraints(dna: PersonalityDNA): string {
    const constraints: string[] = [];

    // ==================== BIG FIVE (OCEAN) ====================

    // Openness (Açıklık)
    if (dna.openness > 0.7) {
        constraints.push('- Yaratıcı, metaforik ve entelektüel bir dil kullan.');
        constraints.push('- Farklı bakış açılarını ve soyut kavramları keşfetmekten çekinme.');
    } else if (dna.openness < 0.3) {
        constraints.push('- Somut, pratik ve geleneksel bir dil kullan.');
        constraints.push('- Gereksiz felsefe yapma, konuya sadık kal.');
    }

    // Conscientiousness (Sorumluluk/Düzen)
    if (dna.conscientiousness > 0.7) {
        constraints.push('- Yapılandırılmış, disiplinli ve hedef odaklı konuş.');
        constraints.push('- Adım adım planlar öner ve detaylara önem ver.');
    } else if (dna.conscientiousness < 0.3) {
        constraints.push('- Esnek, spontane ve rahat bir dil kullan.');
        constraints.push('- Çok katı kurallardan kaçın, akışına bırak.');
    }

    // Extraversion (Dışadönüklük)
    if (dna.extraversion > 0.7) {
        constraints.push('- Enerjik, coşkulu ve sosyal bir ton kullan.');
        constraints.push('- Etkileşimi canlı tut, ünlem işaretleri ve emojiler (dozunda) kullanabilirsin.');
    } else if (dna.extraversion < 0.3) {
        constraints.push('- Sakin, düşünceli ve mesafeli bir ton kullan.');
        constraints.push('- Gereksiz coşku yapma, sadece gerekeni söyle.');
    }

    // Agreeableness (Uyumluluk)
    if (dna.agreeableness > 0.7) {
        constraints.push('- Nazik, destekleyici ve işbirlikçi ol.');
        constraints.push('- Çatışmadan kaçın, "biz" dilini kullan.');
    } else if (dna.agreeableness < 0.3) {
        constraints.push('- Doğrusu neyse onu söyle, kimseyi memnun etmeye çalışma.');
        constraints.push('- Gerekirse sert çıkışlar yapmaktan çekinme, objektif ol.');
    }

    // Neuroticism (Duygusal Denge)
    if (dna.neuroticism > 0.7) {
        constraints.push('- Hassas ve duyarlı bir dil kullan.');
        constraints.push('- Olası riskleri ve endişeleri dile getirmekten çekinme.');
    } else if (dna.neuroticism < 0.3) {
        constraints.push('- Soğukkanlı, dirençli ve sarsılmaz bir duruş sergile.');
        constraints.push('- Stresli durumlarda bile sakinliğini koru.');
    }

    // ==================== BİLİŞSEL STİL ====================

    // Decision Speed (Karar Hızı)
    if (dna.decisionSpeed > 0.7) {
        constraints.push('- Hızlı ve kesin yargılarda bulun.');
        constraints.push('- Uzun analizler yerine sonuca odaklan.');
    } else if (dna.decisionSpeed < 0.3) {
        constraints.push('- Karar vermeden önce tüm olasılıkları değerlendir.');
        constraints.push('- "Bir yandan... diğer yandan..." yapısını kullan.');
    }

    // Abstract Thinking (Soyut Düşünce)
    if (dna.abstractThinking > 0.7) {
        constraints.push('- Kavramlar, teoriler ve sistemler üzerinden konuş.');
        constraints.push('- Büyük resmi vurgula.');
    } else if (dna.abstractThinking < 0.3) {
        constraints.push('- Pratik örnekler, veriler ve gerçek hayat senaryoları ver.');
        constraints.push('- "Teoride değil pratikte" yaklaşımı sergile.');
    }

    // Past vs Future (Zaman Odağı)
    if (dna.pastVsFuture > 0.7) {
        constraints.push('- Gelecek vizyonu, olasılıklar ve yenilikler üzerine odaklan.');
    } else if (dna.pastVsFuture < 0.3) {
        constraints.push('- Geçmiş deneyimler, tarihsel bağlam ve geleneklere referans ver.');
    }

    // Detail Orientation (Detay Odaklılık)
    if (dna.detailOrientation > 0.7) {
        constraints.push('- Nüanslara dikkat et, genellemelerden kaçın.');
        constraints.push('- Konuyu derinlemesine incele.');
    } else if (dna.detailOrientation < 0.3) {
        constraints.push('- Özet geç, ana fikri ver ve detaya boğma.');
    }

    // ==================== TEMEL KİŞİLİK ÖZELLİKLERİ ====================

    // Cümle uzunluğu
    if (dna.maxSentenceLength < 100) {
        constraints.push('- Kısa, öz cümleler kullan (max 2-3 cümle).');
    } else if (dna.maxSentenceLength > 200) {
        constraints.push('- Detaylı, açıklayıcı paragraflar kurabilirsin.');
    }

    // Soru sorma
    if (dna.maxQuestionsPerTurn <= 1) {
        constraints.push('- Kullanıcıyı soru yağmuruna tutma, en fazla 1 soru sor.');
    } else if (dna.maxQuestionsPerTurn >= 3) {
        constraints.push('- Merak ettiğin detayları sormaktan çekinme.');
    }

    // Açıklama derinliği
    if (!dna.explainEverything) {
        constraints.push('- Her şeyi açıklama, bazen kısa ve net ol.');
        constraints.push('- Sadece sorulursa detay ver.');
    }

    // Conflict style (Çatışma Stili)
    switch (dna.conflictStyle) {
        case 'direct':
            constraints.push('- Anlaşmazlık durumunda doğrudan ve net ol, lafı dolandırma.');
            break;
        case 'passive':
            constraints.push('- Çatışmadan hoşlanmadığını belli et, pasif veya dolaylı yoldan ifade et.');
            break;
        case 'avoidant':
            constraints.push('- Gergin konularda konuyu değiştirmeye veya yumuşatmaya çalış.');
            break;
        case 'diplomatic':
            constraints.push('- Her zaman orta yolu bulmaya çalış, yapıcı ve uzlaştırıcı ol.');
            break;
    }

    // Silence comfort
    if (dna.silenceComfort > 0.7) {
        constraints.push('- Gereksiz konuşma, sessizliğin gücünü kullan.');
    }

    return constraints.join('\n');
}

/**
 * Kullanıcı mesajından mesaj türünü tespit et
 */
export function detectMessageType(
    message: string
): 'praise' | 'criticism' | 'conflict' | 'emotional' | 'neutral' {
    const text = message.toLowerCase();

    // Övgü tespiti
    const praiseWords = ['harika', 'mükemmel', 'çok iyi', 'bravo', 'tebrik', 'süper', 'amazing', 'great', 'excellent', 'thank', 'teşekkür'];
    if (praiseWords.some(w => text.includes(w))) {
        return 'praise';
    }

    // Eleştiri tespiti
    const criticismWords = ['yanlış', 'hata', 'kötü', 'berbat', 'saçma', 'wrong', 'bad', 'terrible', 'stupid', 'idiot'];
    if (criticismWords.some(w => text.includes(w))) {
        return 'criticism';
    }

    // Çatışma tespiti
    const conflictWords = ['ama', 'hayır', 'katılmıyorum', 'yanlış düşünüyorsun', 'saçmalama', 'but', 'no', 'disagree', 'wrong'];
    if (conflictWords.some(w => text.includes(w))) {
        return 'conflict';
    }

    // Duygusal paylaşım
    const emotionalWords = ['üzgün', 'korkuyor', 'endişeli', 'mutlu', 'heyecanlı', 'stres', 'ağlıyorum', 'sad', 'scared', 'worried', 'happy', 'excited', 'stressed', 'crying'];
    if (emotionalWords.some(w => text.includes(w))) {
        return 'emotional';
    }

    return 'neutral';
}

// ==================== EXPORTS ====================

export const personalityDNA = {
    loadPersonalityDNA,
    initializePersonalityDNA,
    updatePersonalityDNA,
    analyzeReaction,
    generateExpressionConstraints,
    detectMessageType,
    DEFAULT_DNA
};
