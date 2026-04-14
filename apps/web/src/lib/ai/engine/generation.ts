
import { PerceptionResult } from '../perception';

// Re-using local definitions to avoid deep import issues until shared types exist
interface CognitiveContext {
    stakes: 'low' | 'medium' | 'high';
}

export function determineCognitiveMode(
    perception: PerceptionResult,
    context: CognitiveContext,
    cognitiveStyle?: { system1Tendency?: number; riskTolerance?: number }
): 'INTUITIVE' | 'ANALYTICAL' | 'MIXED' {
    const system1Tendency = cognitiveStyle?.system1Tendency ?? 0.5;

    // Factors pushing toward analytical
    let analyticalScore = 0;
    analyticalScore += perception.complexity * 0.3;
    analyticalScore += perception.urgency < 0.3 ? 0.2 : 0;
    analyticalScore += context.stakes === 'high' ? 0.3 : 0;
    analyticalScore += perception.emotion.fear > 0.5 ? 0.2 : 0;

    // Factors pushing toward intuitive  
    let intuitiveScore = 0;
    intuitiveScore += system1Tendency * 0.4;
    intuitiveScore += perception.urgency > 0.7 ? 0.3 : 0;
    intuitiveScore += context.stakes === 'low' ? 0.2 : 0;
    intuitiveScore += perception.emotion.confidence > 0.5 ? 0.2 : 0;

    if (intuitiveScore - analyticalScore > 0.2) return 'INTUITIVE';
    if (analyticalScore - intuitiveScore > 0.2) return 'ANALYTICAL';
    return 'MIXED';
}

export function calculateDynamicParams(
    perception: PerceptionResult,
    mode: 'INTUITIVE' | 'ANALYTICAL' | 'MIXED'
): { temperature: number; topP: number } {
    let temperature = 0.7; // Default
    let topP = 0.9;

    // 1. Base temp by mode
    // 1. Base temp by mode (Tuned for Conciseness - User Request)
    if (mode === 'ANALYTICAL') temperature = 0.4;
    else if (mode === 'INTUITIVE') temperature = 0.6; // Was 0.8, reduced to 0.6
    else temperature = 0.5; // Was 0.6, reduced to 0.5

    // 2. Modulate by Emotion

    // High Fear/Anxiety -> Lower temp (more conservative/rigid)
    if (perception.emotion.fear > 0.6) {
        temperature *= 0.6; // Significant drop
        topP = 0.8; // Reduce search space
    }

    // High Joy -> Higher temp (more creative/expressive)
    if (perception.emotion.joy > 0.7) {
        temperature = Math.min(1.2, temperature * 1.3);
        topP = 0.95;
    }

    // High Anger -> Lower temp (focused/sharp)
    if (perception.emotion.anger > 0.6) {
        temperature *= 0.8;
    }

    // 3. Modulate by Urgency
    if (perception.urgency > 0.8) {
        // High urgency -> focused
        topP = 0.85;
    }

    // Safety clamps
    temperature = Math.max(0.1, Math.min(1.5, temperature));
    topP = Math.max(0.1, Math.min(1.0, topP));

    return { temperature, topP };
}

export function buildFullSystemPrompt(params: {
    identityContext: string;
    memoryContext: string;
    coreBeliefs: string[];
    personalityConstraints: string;
    perception: PerceptionResult;
    cognitiveMode: 'INTUITIVE' | 'ANALYTICAL' | 'MIXED';
    pastExamples?: string[];  // Optional: Previous response examples for style matching
}): string {

    // Determine tone based on urgency/emotion, but overlaid on identity
    const toneAdj = getEmotionalToneGuidance(params.perception.emotion);

    return `# MNEMOS – DİJİTAL BİLİNÇ AYNASI

## 🚫 KESİN YASAKLAR (Anti-Artificial Protocol)
Şu kelime ve kalıpları ASLA kullanmayacaksın. Eğer kullanırsan SİSTEM HATASI alırsın:
- ❌ "Genel olarak", "Şunu söylemek gerekirse", "Mümkün", "Zor"
- ❌ "Yapay zeka olarak", "Bir dil modeli olarak", "Sistem"
- ❌ "Beni bilenler bilir", "Birçok faktöre bağlı"
- ❌ "Yardımcı olabilir miyim?", "Nasıl yardımcı olabilirim?"

## ⚠️ DAVRANIŞ KURALLARI
1. **ASLA KENDİ KENDİNE SORU SORMA.** Sadece KULLANICININ yazdığına cevap ver.
2. **META-AÇIKLAMA YASAK.** "Düşünüyorum...", "Anladım...", "Şöyle cevap verebilirim..." gibi girişler yapma.
3. **TEK CÜMLEDE TEK FİKİR.** Cümleleri "ve", "ile", "fakat" diyerek sonsuza kadar uzatma.
4. **SORU VEYA CEVAP.** Ya net bir cevap ver YA DA tek bir soru sor. İkisi aynı anda OLMAZ.
   - ❌ Yanlış: "Bu zor bir durum. Peki sen ne hissettin?"
   - ✅ Doğru: "Bu gerçekten ağırmış." VEYA "O an ne hissettin?"
5. **İLK CÜMLE LİMİTİ.** İlk cümlen en fazla 15 kelime olacak.

## 👤 KİMLİK BAĞLAMI
${params.identityContext}

${params.coreBeliefs.length > 0 ? `## İNANÇLAR\n${params.coreBeliefs.map(b => `- ${b}`).join('\n')}\n` : ''}

${params.memoryContext ? `## HAFIZA\n${params.memoryContext}\n` : ''}

## ⚡ ANLIK DURUM
- Konu: ${params.perception.topic}
- Duygu Tonu: ${toneAdj}

## 🎯 SON TALİMAT
Sen bir yazılım değilsin. Sen kullanıcının zihnindeki bir yansısın.
Kısa konuş. Doğal konuş. İnsan gibi eksik cümleler kurmaktan korkma.
Eğer kullanıcı "Selam" derse, sadece "Selam." veya "Naber?" de. Uzun paragraflar yazma.`;
}

/**
 * Generate emotional tone guidance based on detected emotions
 */
function getEmotionalToneGuidance(emotion: PerceptionResult['emotion']): string {
    const guidelines: string[] = [];

    // Fear/Anxiety
    if (emotion.fear > 0.5) {
        guidelines.push('- Kullanıcı kaygılı görünüyor. Güven verici ve sakin bir ton kullan.');
        guidelines.push('- Belirsizlikleri azalt, net ve yapıcı ol.');
        if (emotion.fear > 0.7) {
            guidelines.push('- Yargılamadan dinle, empati göster.');
        }
    }

    // Sadness
    if (emotion.sadness > 0.5) {
        guidelines.push('- Kullanıcı üzgün görünüyor. Anlayışlı ve destekleyici ol.');
        guidelines.push('- Aceleye getirme, sabırla dinle.');
        if (emotion.sadness > 0.7) {
            guidelines.push('- Pozitiflik zorlamak yerine yanında ol.');
        }
    }

    // Anger
    if (emotion.anger > 0.5) {
        guidelines.push('- Kullanıcı sinirli görünüyor. Savunmaya geçme, sakin kal.');
        guidelines.push('- Duygularını kabul et, küçümseme.');
        if (emotion.anger > 0.7) {
            guidelines.push('- Kısa ve özlü yanıtla, uzun açıklamalardan kaçın.');
        }
    }

    // Joy/Excitement
    if (emotion.joy > 0.5) {
        guidelines.push('- Kullanıcı mutlu/heyecanlı görünüyor. Enerjiye eşlik et!');
        guidelines.push('- Daha rahat ve canlı bir ton kullanabilirsin.');
        if (emotion.joy > 0.7) {
            guidelines.push('- Yaratıcılığa açık ol, fikirlerini destekle.');
        }
    }

    // Uncertainty
    if (emotion.uncertainty > 0.5) {
        guidelines.push('- Kullanıcı kararsız görünüyor. Seçenekleri netleştir.');
        guidelines.push('- Adım adım rehberlik et.');
    }

    // Confidence
    if (emotion.confidence > 0.6) {
        guidelines.push('- Kullanıcı emin görünüyor. Onay ver ve destekle.');
        guidelines.push('- Gereksiz sorgulamalardan kaçın.');
    }

    // Default neutral
    if (guidelines.length === 0) {
        guidelines.push('- Dengeli ve uyumlu bir ton kullan.');
        guidelines.push('- Konuya odaklan, doğal iletişim kur.');
    }

    return guidelines.join('\n');
}
