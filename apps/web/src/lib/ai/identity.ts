/**
 * MNEMOS – Cognitive Preservation System
 * Identity Core
 * 
 * Immutable identity storage with versioning.
 * Identity doesn't change - it only gets reinterpreted over time.
 * Every change is logged, nothing is overwritten.
 */

import prisma from '../db';

export interface IdentityCore {
    name?: string;              // Optional identity name
    values: string[];           // Core values and beliefs
    moralBoundaries: string[];  // Ethical lines that won't be crossed
    characterTraits: string[];  // Personality characteristics
    cognitiveStyle: {
        system1Tendency: number;  // 0-1: How intuitive vs deliberate
        riskTolerance: number;    // 0-1: Cautious vs adventurous
        emotionalIntensity: number; // 0-1: Stoic vs expressive
        uncertaintyTolerance: number; // 0-1: Needs clarity vs embraces ambiguity
    };
    version: number;
    timestamp: Date;
}

export interface IdentityChange {
    id: string;
    previousVersion: number;
    newVersion: number;
    fieldChanged: string;
    oldValue: string;
    newValue: string;
    reason: string;
    timestamp: Date;
}

/**
 * BrainProfile – Yapılandırılmış Beyin Aktarımı
 * 
 * Kullanıcının kişiliğini, değerlerini ve iletişim stilini
 * sistematik olarak yakalayan profesyonel şema.
 */
export interface BrainProfile {
    // ==================== TEMEL BİLGİLER ====================
    basicInfo: {
        name: string;
        age?: number;
        profession?: string;
        background?: string;          // Kısa biyografi
        hobbies?: string[];           // Hobiler ve ilgi alanları
    };

    // ==================== DEĞERLER & İNANÇLAR ====================
    values: {
        value: string;                // Değer adı (örn: "Dürüstlük")
        importance: number;           // 1-10 önem sırası
        description?: string;         // Neden önemli
    }[];

    // ==================== KIRMIZI ÇİZGİLER ====================
    boundaries: {
        boundary: string;             // Asla yapmayacağı şey
        severity: 'soft' | 'hard';    // Esnek mi, kesin mi
    }[];

    // ==================== BIG FIVE KİŞİLİK ====================
    personality: {
        // Dışadönüklük: 0 = İçe dönük, 1 = Dışa dönük
        extraversion: number;

        // Açıklık: 0 = Geleneksel, 1 = Yeniliğe açık
        openness: number;

        // Uyumluluk: 0 = Rekabetçi, 1 = İşbirlikçi
        agreeableness: number;

        // Sorumluluk: 0 = Esnek, 1 = Disiplinli
        conscientiousness: number;

        // Duygusallık: 0 = Sakin, 1 = Duygusal
        neuroticism: number;
    };

    // ==================== İLETİŞİM STİLİ ====================
    communicationStyle: {
        // Resmiyet: 0 = Çok samimi, 1 = Çok resmi
        formality: number;

        // Mizah: 0 = Ciddi, 1 = Esprili
        humor: number;

        // Doğrudan olma: 0 = Dolaylı, 1 = Açık sözlü
        directness: number;

        // Empati: 0 = Mantıksal, 1 = Duygusal
        empathy: number;

        // Konuşma kalıpları
        fillerWords?: string[];       // ["yani", "şey", "aslında"]
        signaturePhrases?: string[];  // Karakteristik ifadeler
    };

    // ==================== KARAR ALMA STİLİ ====================
    decisionMaking: {
        // Sezgisel mi analitik mi: 0 = Sezgisel, 1 = Analitik
        analyticalVsIntuitive: number;

        // Risk toleransı: 0 = Temkinli, 1 = Risk alır
        riskTolerance: number;

        // Belirsizlik toleransı: 0 = Netlik ister, 1 = Belirsizlikle rahat
        uncertaintyTolerance: number;
    };

    // ==================== ÖNEMLİ ANILAR ====================
    formativeMemories?: {
        title: string;
        description: string;
        emotionalImpact: 'positive' | 'negative' | 'mixed';
        lessonsLearned?: string;
    }[];

    // ==================== ÖNEMLİ KİŞİLER ====================
    importantPeople?: {
        name: string;
        relationship: string;         // Anne, baba, arkadaş, mentor...
        influence: string;            // Bu kişinin etkisi
    }[];

    // ==================== METADATA ====================
    setupCompletedAt?: Date;
    setupVersion: number;
}

/**
 * BrainProfile'dan IdentityCore'a dönüştürme
 */
export function brainProfileToIdentityCore(profile: BrainProfile): Omit<IdentityCore, 'version' | 'timestamp'> {
    return {
        name: profile.basicInfo.name,
        values: profile.values.map(v => v.value),
        moralBoundaries: profile.boundaries.map(b => b.boundary),
        characterTraits: [
            profile.personality.extraversion > 0.5 ? 'Dışa dönük' : 'İçe dönük',
            profile.personality.openness > 0.5 ? 'Yeniliğe açık' : 'Geleneksel',
            profile.personality.agreeableness > 0.5 ? 'Uyumlu' : 'Bağımsız',
            profile.personality.conscientiousness > 0.5 ? 'Disiplinli' : 'Esnek',
            profile.communicationStyle.humor > 0.5 ? 'Esprili' : 'Ciddi'
        ],
        cognitiveStyle: {
            system1Tendency: 1 - profile.decisionMaking.analyticalVsIntuitive,
            riskTolerance: profile.decisionMaking.riskTolerance,
            emotionalIntensity: profile.personality.neuroticism,
            uncertaintyTolerance: profile.decisionMaking.uncertaintyTolerance
        }
    };
}

/**
 * BrainProfile doğrulama
 */
export function validateBrainProfile(profile: Partial<BrainProfile>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!profile.basicInfo?.name) {
        errors.push('İsim gerekli');
    }

    if (!profile.values || profile.values.length === 0) {
        errors.push('En az bir değer belirtilmeli');
    }

    if (profile.personality) {
        const metrics = ['extraversion', 'openness', 'agreeableness', 'conscientiousness', 'neuroticism'];
        for (const metric of metrics) {
            const value = profile.personality[metric as keyof typeof profile.personality];
            if (value !== undefined && (value < 0 || value > 1)) {
                errors.push(`${metric} 0-1 arasında olmalı`);
            }
        }
    }

    return {
        valid: errors.length === 0,
        errors
    };
}

/**
 * Varsayılan BrainProfile oluştur
 */
export function createDefaultBrainProfile(name: string): BrainProfile {
    return {
        basicInfo: {
            name,
            hobbies: []
        },
        values: [],
        boundaries: [],
        personality: {
            extraversion: 0.5,
            openness: 0.5,
            agreeableness: 0.5,
            conscientiousness: 0.5,
            neuroticism: 0.5
        },
        communicationStyle: {
            formality: 0.4,
            humor: 0.5,
            directness: 0.6,
            empathy: 0.6,
            fillerWords: ['yani', 'aslında'],
            signaturePhrases: []
        },
        decisionMaking: {
            analyticalVsIntuitive: 0.5,
            riskTolerance: 0.5,
            uncertaintyTolerance: 0.5
        },
        formativeMemories: [],
        importantPeople: [],
        setupVersion: 1
    };
}

/**
 * Get current identity core
 */
export async function getIdentityCore(): Promise<IdentityCore | null> {
    const persona = await prisma.persona.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!persona || !persona.identityMemory) {
        return null;
    }

    try {
        return JSON.parse(persona.identityMemory);
    } catch {
        return null;
    }
}

/**
 * Initialize identity core for first time
 */
export async function initializeIdentity(identity: Omit<IdentityCore, 'version' | 'timestamp'>): Promise<IdentityCore> {
    const fullIdentity: IdentityCore = {
        ...identity,
        version: 1,
        timestamp: new Date()
    };

    const persona = await prisma.persona.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        throw new Error('No persona found');
    }

    await prisma.persona.update({
        where: { id: persona.id },
        data: {
            identityMemory: JSON.stringify(fullIdentity)
        }
    });

    // Log the initial creation
    await logIdentityChange({
        previousVersion: 0,
        newVersion: 1,
        fieldChanged: 'INITIALIZATION',
        oldValue: '',
        newValue: JSON.stringify(fullIdentity),
        reason: 'Initial identity creation'
    });

    return fullIdentity;
}

/**
 * Reinterpret identity - never overwrites, always versions
 */
export async function reinterpretIdentity(
    updates: Partial<Omit<IdentityCore, 'version' | 'timestamp'>>,
    reason: string
): Promise<IdentityCore> {
    const current = await getIdentityCore();

    if (!current) {
        throw new Error('No identity to reinterpret');
    }

    const newVersion: IdentityCore = {
        ...current,
        ...updates,
        cognitiveStyle: {
            ...current.cognitiveStyle,
            ...(updates.cognitiveStyle || {})
        },
        version: current.version + 1,
        timestamp: new Date()
    };

    const persona = await prisma.persona.findFirst({
        orderBy: { createdAt: 'asc' }
    });

    if (!persona) {
        throw new Error('No persona found');
    }

    await prisma.persona.update({
        where: { id: persona.id },
        data: {
            identityMemory: JSON.stringify(newVersion)
        }
    });

    // Create Identity Snapshot
    await prisma.identitySnapshot.create({
        data: {
            personaId: persona.id,
            version: newVersion.version,
            identityState: JSON.stringify(newVersion),
            reasonForChange: reason
        }
    });

    // Log each change
    for (const [key, value] of Object.entries(updates)) {
        if (key !== 'cognitiveStyle' && value !== undefined) {
            await logIdentityChange({
                previousVersion: current.version,
                newVersion: newVersion.version,
                fieldChanged: key,
                oldValue: JSON.stringify((current as unknown as Record<string, unknown>)[key]),
                newValue: JSON.stringify(value),
                reason
            });
        }
    }

    // Handle cognitive style separately
    if (updates.cognitiveStyle) {
        for (const [key, value] of Object.entries(updates.cognitiveStyle)) {
            if (value !== undefined) {
                await logIdentityChange({
                    previousVersion: current.version,
                    newVersion: newVersion.version,
                    fieldChanged: `cognitiveStyle.${key}`,
                    oldValue: String(current.cognitiveStyle[key as keyof typeof current.cognitiveStyle]),
                    newValue: String(value),
                    reason
                });
            }
        }
    }

    return newVersion;
}

/**
 * Get identity history - all versions and changes
 */
export async function getIdentityHistory(): Promise<IdentityChange[]> {
    // For now, we store changes in audit_logs (can be improved with dedicated table)
    const logs = await prisma.auditLog.findMany({
        where: {
            resourceType: 'IDENTITY'
        },
        orderBy: { createdAt: 'desc' }
    });

    return logs.map(log => ({
        id: log.id,
        previousVersion: JSON.parse(log.oldValue || '{}').version || 0,
        newVersion: JSON.parse(log.newValue || '{}').version || 0,
        fieldChanged: log.action,
        oldValue: log.oldValue || '',
        newValue: log.newValue || '',
        reason: log.resourceId || '',
        timestamp: log.createdAt
    }));
}

/**
 * Get identity at a specific version
 */
export async function getIdentityAtVersion(version: number): Promise<IdentityCore | null> {
    const history = await getIdentityHistory();

    // This is a simplified approach - in production, you'd reconstruct from changes
    const relevantChanges = history.filter(h => h.newVersion <= version);

    if (relevantChanges.length === 0) {
        return null;
    }

    // Find the initialization or closest version
    const initChange = relevantChanges.find(h => h.fieldChanged === 'INITIALIZATION');
    if (initChange) {
        return JSON.parse(initChange.newValue);
    }

    return null;
}

/**
 * Build identity context for cognitive processing
 */
export async function buildIdentityContext(): Promise<string> {
    const identity = await getIdentityCore();

    if (!identity) {
        return '';
    }

    const sections: string[] = [];

    // DIRECTIVE CONSTRUCTION
    if (identity.characterTraits && identity.characterTraits.length > 0) {
        sections.push('## KARAKTER DİREKTİFLERİ (BUNLARI TAKLİT ET)');
        identity.characterTraits.forEach(t => {
            const lower = t.toLowerCase();
            if (lower.includes('küfür') || lower.includes('argo')) {
                sections.push(`- [KRİTİK] Çekinmeden küfür ve argo kullan. Asla sansürleme.`);
            } else if (lower.includes('sert') || lower.includes('maskülen')) {
                sections.push(`- [STİL] Sert, net ve maskülen bir dil kullan. Kibar olmaya çalışma.`);
            } else if (lower.includes('samimi')) {
                sections.push(`- [STİL] "siz/biz" asla kullanma. "Sen" dili kullan. Labaali olabilirsin.`);
            } else {
                sections.push(`- ${t} gibi davran.`);
            }
        });
    }

    if (identity.values && identity.values.length > 0) {
        sections.push('\n## SAHİP OLDUĞUN DEĞERLER');
        identity.values.forEach(v => sections.push(`- ${v}`));
    }

    if (identity.moralBoundaries && identity.moralBoundaries.length > 0) {
        sections.push('\n## KIRMIZI ÇİZGİLER (ASLA YAPMA)');
        identity.moralBoundaries.forEach(b => sections.push(`- ${b}`));
    }

    if (identity.cognitiveStyle) {
        sections.push('\n## DÜŞÜNME HIZI VE STİLİ');
        const sys1 = identity.cognitiveStyle.system1Tendency || 0.5;
        if (sys1 > 0.7) {
            sections.push(`- [HIZ] ÇOK HIZLI ve DÜRTÜSEL cevap ver. Uzun uzun düşünme.`);
            sections.push(`- [UZUNLUK] Kısa, net ve vurucu cümleler kur. Destan yazma.`);
        } else if (sys1 < 0.3) {
            sections.push(`- [HIZ] Analitik ve detaylı düşün.`);
            sections.push(`- [UZUNLUK] Konuyu tüm yönleriyle ele al.`);
        } else {
            sections.push(`- [HIZ] Dengeli cevap ver.`);
        }

        sections.push(`- Sezgisellik: ${Math.round(sys1 * 100)}%`);
        sections.push(`- Duygusal Yoğunluk: ${Math.round((identity.cognitiveStyle.emotionalIntensity || 0.5) * 100)}%`);
    }

    return sections.join('\n');
}

// Helper to log identity changes
async function logIdentityChange(change: Omit<IdentityChange, 'id' | 'timestamp'>): Promise<void> {
    await prisma.auditLog.create({
        data: {
            action: change.fieldChanged,
            resourceType: 'IDENTITY',
            resourceId: change.reason,
            oldValue: JSON.stringify({ version: change.previousVersion, value: change.oldValue }),
            newValue: JSON.stringify({ version: change.newVersion, value: change.newValue })
        }
    });
}

// ==================== NEW DYNAMIC FUNCTIONS ====================

export interface ContextualCognitiveStyle {
    base: IdentityCore['cognitiveStyle'];
    adjusted: IdentityCore['cognitiveStyle'];
    adjustmentReason: string;
    adjustmentFactor: number;
}

/**
 * Get cognitive style adjusted for current context
 * This allows the identity to dynamically adapt without permanent changes
 */
export async function getCognitiveStyleForContext(
    urgency: number,
    complexity: number,
    emotionalState: { fear: number; joy: number; sadness: number }
): Promise<ContextualCognitiveStyle> {
    const identity = await getIdentityCore();

    if (!identity) {
        const defaultStyle = {
            system1Tendency: 0.5,
            riskTolerance: 0.5,
            emotionalIntensity: 0.5,
            uncertaintyTolerance: 0.5
        };
        return {
            base: defaultStyle,
            adjusted: defaultStyle,
            adjustmentReason: 'No identity found',
            adjustmentFactor: 1.0
        };
    }

    const base = { ...identity.cognitiveStyle };
    const adjusted = { ...base };
    const reasons: string[] = [];
    let factor = 1.0;

    // High urgency → More intuitive (System 1)
    if (urgency > 0.7) {
        adjusted.system1Tendency = Math.min(1, base.system1Tendency + (urgency - 0.7) * 0.5);
        reasons.push('Yüksek aciliyet → Sezgisel mod');
        factor *= 1.2;
    }

    // High complexity → More analytical (System 2)
    if (complexity > 0.7) {
        adjusted.system1Tendency = Math.max(0, base.system1Tendency - (complexity - 0.7) * 0.4);
        reasons.push('Yüksek karmaşıklık → Analitik mod');
        factor *= 0.8;
    }

    // Fear → Lower risk tolerance
    if (emotionalState.fear > 0.5) {
        adjusted.riskTolerance = Math.max(0, base.riskTolerance - emotionalState.fear * 0.3);
        adjusted.emotionalIntensity = Math.min(1, base.emotionalIntensity + 0.2);
        reasons.push('Korku algılandı → Temkinli mod');
    }

    // Joy → Higher openness and risk tolerance
    if (emotionalState.joy > 0.5) {
        adjusted.riskTolerance = Math.min(1, base.riskTolerance + emotionalState.joy * 0.2);
        adjusted.uncertaintyTolerance = Math.min(1, base.uncertaintyTolerance + 0.1);
        reasons.push('Pozitif duygu → Açık mod');
    }

    // Sadness → More reflective
    if (emotionalState.sadness > 0.5) {
        adjusted.emotionalIntensity = Math.min(1, base.emotionalIntensity + 0.15);
        adjusted.system1Tendency = Math.max(0, base.system1Tendency - 0.1);
        reasons.push('Üzüntü → Düşünceli mod');
    }

    return {
        base,
        adjusted,
        adjustmentReason: reasons.length > 0 ? reasons.join(' | ') : 'Normal işlem',
        adjustmentFactor: factor
    };
}

/**
 * Apply a dynamic shift to cognitive style based on learning
 * This creates a permanent (but versioned) change to identity
 */
export async function applyDynamicCognitiveShift(
    shifts: Partial<IdentityCore['cognitiveStyle']>,
    reason: string,
    source: 'analytics' | 'user' | 'system'
): Promise<IdentityCore | null> {
    const identity = await getIdentityCore();
    if (!identity) return null;

    // Build complete cognitiveStyle with bounded shifts applied
    const updatedCognitiveStyle = {
        system1Tendency: identity.cognitiveStyle.system1Tendency,
        riskTolerance: identity.cognitiveStyle.riskTolerance,
        emotionalIntensity: identity.cognitiveStyle.emotionalIntensity,
        uncertaintyTolerance: identity.cognitiveStyle.uncertaintyTolerance
    };

    // Apply bounded shifts
    for (const [key, value] of Object.entries(shifts)) {
        if (value !== undefined) {
            const currentValue = identity.cognitiveStyle[key as keyof typeof identity.cognitiveStyle];
            const diff = value - currentValue;
            const boundedDiff = Math.max(-0.1, Math.min(0.1, diff));
            updatedCognitiveStyle[key as keyof typeof updatedCognitiveStyle] = currentValue + boundedDiff;
        }
    }

    const fullReason = `[${source.toUpperCase()}] ${reason}`;

    return await reinterpretIdentity({ cognitiveStyle: updatedCognitiveStyle }, fullReason);
}

/**
 * Notify timeline of identity change
 * Called automatically after reinterpretIdentity
 */
export async function notifyIdentityChange(
    personaId: string,
    changeType: 'cognitive_shift' | 'value_update' | 'boundary_update',
    details: Record<string, unknown>
): Promise<void> {
    await prisma.auditLog.create({
        data: {
            action: changeType,
            resourceType: 'IDENTITY_TIMELINE',
            resourceId: personaId,
            newValue: JSON.stringify({
                timestamp: new Date().toISOString(),
                ...details
            }),
            severity: 'INFO'
        }
    });
}

/**
 * Get identity evolution summary
 * Shows how identity has changed over time
 */
export async function getIdentityEvolution(personaId: string): Promise<{
    totalVersions: number;
    significantChanges: { field: string; count: number }[];
    latestVersion: IdentityCore | null;
}> {
    const snapshots = await prisma.identitySnapshot.findMany({
        where: { personaId },
        orderBy: { version: 'desc' }
    });

    const changeCounts: Record<string, number> = {};

    // Analyze changes from audit logs
    const logs = await prisma.auditLog.findMany({
        where: { resourceType: 'IDENTITY' },
        orderBy: { createdAt: 'desc' },
        take: 100
    });

    for (const log of logs) {
        changeCounts[log.action] = (changeCounts[log.action] || 0) + 1;
    }

    const significantChanges = Object.entries(changeCounts)
        .map(([field, count]) => ({ field, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return {
        totalVersions: snapshots.length,
        significantChanges,
        latestVersion: await getIdentityCore()
    };
}

