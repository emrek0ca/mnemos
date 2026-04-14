/**
 * MNEMOS – Dream Engine (Neuroplasticity System)
 * 
 * "Uyku" sırasında çalışan, anıları analiz edip kimliği 
 * mikro düzeyde değiştiren (nöroplastisite) modül.
 */

import prisma from '../db';
import Groq from 'groq-sdk';
import { getIdentityCore, reinterpretIdentity, IdentityCore } from './identity';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

interface DreamingResult {
    analysis: string;
    proposedChanges: Partial<IdentityCore>;
    applied: boolean;
    snapshotId?: string;
}

/**
 * Trigger the dreaming process
 * 1. Harvest recent episodic memories
 * 2. Analyze for personality patterns
 * 3. Snapshot current identity
 * 4. Apply mutations to identity
 */
/**
 * Analyze recent memories and propose identity changes (Dry Run)
 */
export async function analyzeDreaming(personaId: string): Promise<DreamingResult> {
    // 1. Harvest Memories (Last 7 days or last 50 episodic)
    const recentMemories = await prisma.memoryEntry.findMany({
        where: {
            personaId,
            type: { in: ['EPISODIC', 'EPISODIC_SUMMARY'] },
            createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    if (recentMemories.length < 5) {
        return {
            analysis: "Yeterli anı birikmediği için değişim gerekmiyor.",
            proposedChanges: {},
            applied: false
        };
    }

    const memoryText = recentMemories.map(m => `- ${m.content}`).join('\n');
    const currentIdentity = await getIdentityCore();

    if (!currentIdentity) throw new Error("Identity not found");

    // 2. Reinterpretation Prompt
    const prompt = `
SEN BİR BİLİŞSEL PSİKOLOG VE NÖROPLASTİSİTE MOTORUSUN.
Aşağıda bir yapay zihnin ("Persona") mevcut kimlik parametreleri ve son yaşadığı anılar (deneyimler) bulunmaktadır.

GÖREVİN:
Bu deneyimlerin, personanın karakterini NASIL değiştirdiğini analiz etmek.
İnsanlar sabit değildir; yaşadıklarıyla değişirler.
- Çok fazla çatışma yaşadıysa -> Belki daha "Sert" veya daha "İçe Kapanık" olur.
- Çok fazla "Mizah" içerikli sohbet ettiyse -> "Mizah" seviyesi artar.
- Risk aldıysa ve ödüllendirildiyse -> "Risk Toleransı" artar.

MEVCUT KİMLİK:
${JSON.stringify(currentIdentity, null, 2)}

SON DENEYİMLER:
${memoryText}

ANALİZ KURALLARI:
1. Değişimler KÜÇÜK olmalı (0.01 - 0.05 arası). Radikal değişim yok.
2. Sadece gerçekten etkilenen parametreleri değiştir.
3. "Analiz" kısmında neden bu değişimi önerdiğini psikolojik olarak açıkla.

ÇIKTI FORMATI (JSON):
{
  "analysis": "Kısa psikolojik analiz...",
  "proposedChanges": {
     "cognitiveStyle": { "riskTolerance": 0.55 },
     "personalityStyle": { "warmth": 0.62 }
  }
}
`;

    const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
            { role: 'system', content: 'Sen JSON üreten bir nöroplastisite motorusun.' },
            { role: 'user', content: prompt }
        ],
        response_format: { type: 'json_object' }
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');
    const analysis = result.analysis || "Analiz yapılamadı.";
    const proposedChanges = result.proposedChanges || {};

    return {
        analysis,
        proposedChanges,
        applied: false
    };
}

/**
 * Apply approved changes to identity
 */
export async function applyDreaming(personaId: string, analysis: string, changes: Partial<IdentityCore>): Promise<DreamingResult> {
    const currentIdentity = await getIdentityCore();
    if (!currentIdentity) throw new Error("Identity not found");

    // Snapshot (Version History)
    // Save Snapshot to DB
    await prisma.identitySnapshot.create({
        data: {
            personaId,
            version: currentIdentity.version || 0,
            identityState: JSON.stringify(currentIdentity),
            reasonForChange: analysis
        }
    });

    // Use reinterpretIdentity to handle versioning and logging
    await reinterpretIdentity(changes, `Neuroplasticity Dream: ${analysis.substring(0, 50)}...`);

    return {
        analysis,
        proposedChanges: changes,
        applied: true,
        snapshotId: "new-snapshot"
    };
}

function mergeIdentity(base: IdentityCore, changes: any): IdentityCore {
    const merged = { ...base } as any;

    // Deep merge for nested objects like cognitiveStyle, personalityStyle
    for (const key in changes) {
        if (typeof changes[key] === 'object' && changes[key] !== null && !Array.isArray(changes[key])) {
            merged[key] = { ...merged[key], ...changes[key] };
        } else {
            merged[key] = changes[key];
        }
    }

    return merged as IdentityCore;
}
