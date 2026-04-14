/**
 * MNEMOS – Dijital Kişilik Motoru
 * Value Graph - Değer ve Karar Grafı
 * 
 * Bu kısım ağaç değil, graf yapısıdır.
 * Çünkü değerler birbirini etkiler:
 *   Para ↔ Etik
 *   Aşk ↔ Ego  
 *   Güven ↔ Risk
 * 
 * Karar algoritması:
 * 1. Durumu parçalara ayır
 * 2. Hangi değerler tetikleniyor? 
 * 3. Graf üzerinde gerilim hesapla
 * 4. En az iç çelişki yaratan yolu seç
 */

import prisma from '../db';

// ==================== TYPES ====================

export interface ValueNode {
    id: string;
    name: string;           // Unique key: "money", "ethics", "freedom"
    displayName: string;    // Türkçe: "Para", "Etik", "Özgürlük"
    weight: number;         // 0-1: Bu değerin kişi için önemi
    description?: string;
    currentActivation: number; // 0-1: Şu anki tetiklenme seviyesi
}

export interface ValueEdge {
    from: string;
    to: string;
    relationship: 'supports' | 'conflicts' | 'neutral';
    strength: number;       // 0-1: İlişki gücü
    description?: string;
}

export interface ValueGraph {
    nodes: Map<string, ValueNode>;
    edges: ValueEdge[];
}

export interface DecisionContext {
    triggeredValues: string[];
    tensions: ValueTension[];
    resolution: 'logical' | 'emotional' | 'avoidant' | 'compromise';
    internalConflict: number;  // 0-1: "Mantıklı ama içime sinmedi"
    dominantValue: string;     // En güçlü tetiklenen değer
    recommendation: string;    // Karar önerisi
}

export interface ValueTension {
    value1: string;
    value2: string;
    conflictLevel: number;  // 0-1
    explanation: string;
}

// ==================== DEFAULT VALUE GRAPH ====================

// Temel değerler - her persona için başlangıç noktası
export const DEFAULT_VALUES: Array<Omit<ValueNode, 'id' | 'currentActivation'>> = [
    { name: 'money', displayName: 'Para', weight: 0.6, description: 'Finansal güvenlik ve refah' },
    { name: 'ethics', displayName: 'Etik', weight: 0.5, description: 'Doğru olanı yapma' },
    { name: 'freedom', displayName: 'Özgürlük', weight: 0.7, description: 'Bağımsızlık ve seçim özgürlüğü' },
    { name: 'love', displayName: 'Sevgi', weight: 0.6, description: 'Duygusal bağlar ve ilişkiler' },
    { name: 'power', displayName: 'Güç', weight: 0.4, description: 'Kontrol ve etki sahibi olma' },
    { name: 'family', displayName: 'Aile', weight: 0.7, description: 'Aile bağları ve sorumluluklar' },
    { name: 'career', displayName: 'Kariyer', weight: 0.5, description: 'Profesyonel başarı' },
    { name: 'health', displayName: 'Sağlık', weight: 0.8, description: 'Fiziksel ve mental sağlık' },
    { name: 'honesty', displayName: 'Dürüstlük', weight: 0.6, description: 'Doğruyu söyleme' },
    { name: 'security', displayName: 'Güvenlik', weight: 0.6, description: 'Güvende hissetme' },
    { name: 'adventure', displayName: 'Macera', weight: 0.4, description: 'Yeni deneyimler' },
    { name: 'respect', displayName: 'Saygı', weight: 0.5, description: 'Başkalarından saygı görme' }
];

// Varsayılan değer ilişkileri
export const DEFAULT_EDGES: Array<Omit<ValueEdge, 'id'>> = [
    // Çatışan değerler
    { from: 'money', to: 'ethics', relationship: 'conflicts', strength: 0.6, description: 'Para bazen etik sınırları zorlar' },
    { from: 'freedom', to: 'security', relationship: 'conflicts', strength: 0.5, description: 'Özgürlük güvenlik ile çelişebilir' },
    { from: 'career', to: 'family', relationship: 'conflicts', strength: 0.4, description: 'Kariyer aile zamanını azaltabilir' },
    { from: 'power', to: 'love', relationship: 'conflicts', strength: 0.5, description: 'Güç ilişkileri zorlaştırabilir' },
    { from: 'adventure', to: 'security', relationship: 'conflicts', strength: 0.7, description: 'Macera güvenliği riske atabilir' },

    // Destekleyen değerler
    { from: 'money', to: 'security', relationship: 'supports', strength: 0.7, description: 'Para güvenlik sağlar' },
    { from: 'money', to: 'freedom', relationship: 'supports', strength: 0.6, description: 'Para özgürlük getirir' },
    { from: 'family', to: 'love', relationship: 'supports', strength: 0.8, description: 'Aile sevgi demektir' },
    { from: 'ethics', to: 'honesty', relationship: 'supports', strength: 0.9, description: 'Etik dürüstlük gerektirir' },
    { from: 'health', to: 'family', relationship: 'supports', strength: 0.6, description: 'Sağlık aile için önemli' },
    { from: 'career', to: 'money', relationship: 'supports', strength: 0.7, description: 'Kariyer para getirir' },
    { from: 'respect', to: 'power', relationship: 'supports', strength: 0.5, description: 'Saygı güç kazandırır' }
];

// ==================== VALUE TRIGGERS ====================

// Hangi kelimeler hangi değerleri tetikler
const VALUE_TRIGGERS: Record<string, string[]> = {
    money: ['para', 'maaş', 'kazanç', 'borç', 'yatırım', 'bütçe', 'fiyat', 'ucuz', 'pahalı', 'zengin', 'money', 'salary', 'debt', 'invest'],
    ethics: ['doğru', 'yanlış', 'ahlak', 'etik', 'vicdan', 'günah', 'sevap', 'hak', 'adalet', 'right', 'wrong', 'moral', 'fair'],
    freedom: ['özgür', 'bağımsız', 'seçim', 'karar', 'kısıtlama', 'yasak', 'izin', 'free', 'independent', 'choice'],
    love: ['sevgi', 'aşk', 'ilişki', 'partner', 'evlilik', 'kalp', 'duygusal', 'love', 'relationship', 'heart'],
    power: ['güç', 'kontrol', 'lider', 'yönetim', 'otorite', 'power', 'control', 'lead', 'authority'],
    family: ['aile', 'anne', 'baba', 'çocuk', 'kardeş', 'akraba', 'family', 'parents', 'children', 'siblings'],
    career: ['iş', 'kariyer', 'terfi', 'proje', 'müşteri', 'patron', 'job', 'career', 'promotion', 'boss'],
    health: ['sağlık', 'hasta', 'doktor', 'ilaç', 'egzersiz', 'uyku', 'stres', 'health', 'sick', 'doctor', 'stress'],
    honesty: ['dürüst', 'yalan', 'doğru', 'gizli', 'itiraf', 'honest', 'lie', 'truth', 'secret', 'confess'],
    security: ['güvenlik', 'risk', 'tehlike', 'koruma', 'sigorta', 'güvende', 'security', 'risk', 'danger', 'safe'],
    adventure: ['macera', 'yeni', 'deneyim', 'keşif', 'heyecan', 'adventure', 'new', 'experience', 'explore', 'exciting'],
    respect: ['saygı', 'onur', 'gurur', 'itibar', 'değer', 'respect', 'honor', 'pride', 'reputation']
};

// ==================== GRAPH OPERATIONS ====================

/**
 * Persona için value graph yükle veya oluştur
 */
export async function loadValueGraph(personaId: string): Promise<ValueGraph> {
    try {
        const dbNodes = await prisma.valueNode.findMany({
            where: { personaId }
        });

        const dbEdges = await prisma.valueEdge.findMany({
            where: { personaId }
        });

        // Eğer boşsa default oluştur
        if (dbNodes.length === 0) {
            return await initializeValueGraph(personaId);
        }

        const nodes = new Map<string, ValueNode>();
        dbNodes.forEach(node => {
            nodes.set(node.name, {
                id: node.id,
                name: node.name,
                displayName: node.displayName,
                weight: node.weight,
                description: node.description || undefined,
                currentActivation: 0 // Runtime'da hesaplanır
            });
        });

        const edges: ValueEdge[] = dbEdges.map(edge => ({
            from: dbNodes.find(n => n.id === edge.fromNodeId)?.name || '',
            to: dbNodes.find(n => n.id === edge.toNodeId)?.name || '',
            relationship: edge.relationship as 'supports' | 'conflicts' | 'neutral',
            strength: edge.strength,
            description: edge.description || undefined
        }));

        return { nodes, edges };
    } catch (error) {
        console.error('[ValueGraph] Failed to load graph:', error);
        // Fallback to in-memory default
        return createDefaultGraph();
    }
}

/**
 * Yeni persona için value graph oluştur
 */
export async function initializeValueGraph(personaId: string): Promise<ValueGraph> {
    try {
        // Önce nodes oluştur
        const createdNodes = await Promise.all(
            DEFAULT_VALUES.map(value =>
                prisma.valueNode.create({
                    data: {
                        personaId,
                        name: value.name,
                        displayName: value.displayName,
                        weight: value.weight,
                        description: value.description
                    }
                })
            )
        );

        // Node ID map oluştur
        const nodeIdMap = new Map<string, string>();
        createdNodes.forEach(node => {
            nodeIdMap.set(node.name, node.id);
        });

        // Edges oluştur
        await Promise.all(
            DEFAULT_EDGES.map(edge => {
                const fromId = nodeIdMap.get(edge.from);
                const toId = nodeIdMap.get(edge.to);
                if (!fromId || !toId) return Promise.resolve();

                return prisma.valueEdge.create({
                    data: {
                        personaId,
                        fromNodeId: fromId,
                        toNodeId: toId,
                        relationship: edge.relationship,
                        strength: edge.strength,
                        description: edge.description
                    }
                });
            })
        );

        return loadValueGraph(personaId);
    } catch (error) {
        console.error('[ValueGraph] Failed to initialize graph:', error);
        return createDefaultGraph();
    }
}

/**
 * In-memory default graph (fallback)
 */
function createDefaultGraph(): ValueGraph {
    const nodes = new Map<string, ValueNode>();
    DEFAULT_VALUES.forEach(v => {
        nodes.set(v.name, {
            id: v.name,
            name: v.name,
            displayName: v.displayName,
            weight: v.weight,
            description: v.description,
            currentActivation: 0
        });
    });
    return { nodes, edges: DEFAULT_EDGES as ValueEdge[] };
}

// ==================== DECISION ANALYSIS ====================

/**
 * Mesajdan tetiklenen değerleri bul
 */
export function detectTriggeredValues(message: string): Map<string, number> {
    const text = message.toLowerCase();
    const triggered = new Map<string, number>();

    for (const [value, triggers] of Object.entries(VALUE_TRIGGERS)) {
        let activation = 0;
        for (const trigger of triggers) {
            if (text.includes(trigger)) {
                activation += 0.2; // Her tetikleyici %20 eklkenir
            }
        }
        if (activation > 0) {
            triggered.set(value, Math.min(1, activation));
        }
    }

    return triggered;
}

/**
 * Graf üzerinde gerilim hesapla
 */
export function calculateTensions(
    graph: ValueGraph,
    triggeredValues: Map<string, number>
): ValueTension[] {
    const tensions: ValueTension[] = [];
    const triggeredList = Array.from(triggeredValues.keys());

    // Her tetiklenen değer çifti için edge kontrol et
    for (let i = 0; i < triggeredList.length; i++) {
        for (let j = i + 1; j < triggeredList.length; j++) {
            const v1 = triggeredList[i];
            const v2 = triggeredList[j];

            // İki yönlü edge ara
            const edge = graph.edges.find(
                e => (e.from === v1 && e.to === v2) || (e.from === v2 && e.to === v1)
            );

            if (edge && edge.relationship === 'conflicts') {
                const activation1 = triggeredValues.get(v1) || 0;
                const activation2 = triggeredValues.get(v2) || 0;
                const node1 = graph.nodes.get(v1);
                const node2 = graph.nodes.get(v2);

                // Conflict level = edge strength × activation levels × value weights
                const conflictLevel =
                    edge.strength *
                    (activation1 + activation2) / 2 *
                    ((node1?.weight || 0.5) + (node2?.weight || 0.5)) / 2;

                tensions.push({
                    value1: v1,
                    value2: v2,
                    conflictLevel,
                    explanation: edge.description || `${node1?.displayName} ve ${node2?.displayName} çatışıyor`
                });
            }
        }
    }

    return tensions.sort((a, b) => b.conflictLevel - a.conflictLevel);
}

/**
 * Baskın değeri bul
 */
export function findDominantValue(
    graph: ValueGraph,
    triggeredValues: Map<string, number>
): string {
    let maxScore = 0;
    let dominant = 'neutral';

    for (const [valueName, activation] of triggeredValues) {
        const node = graph.nodes.get(valueName);
        if (node) {
            const score = activation * node.weight;
            if (score > maxScore) {
                maxScore = score;
                dominant = valueName;
            }
        }
    }

    return dominant;
}

/**
 * Ana karar analizi
 */
export async function analyzeDecision(
    personaId: string,
    message: string
): Promise<DecisionContext> {
    const graph = await loadValueGraph(personaId);
    const triggeredValues = detectTriggeredValues(message);
    const tensions = calculateTensions(graph, triggeredValues);
    const dominantValue = findDominantValue(graph, triggeredValues);

    // Toplam iç çatışma hesapla
    const totalConflict = tensions.reduce((sum, t) => sum + t.conflictLevel, 0);
    const internalConflict = Math.min(1, totalConflict);

    // Çözüm stratejisi belirle
    let resolution: DecisionContext['resolution'];
    let recommendation: string;

    if (internalConflict < 0.2) {
        resolution = 'logical';
        recommendation = 'Net bir durum, mantıklı seçim yapılabilir.';
    } else if (internalConflict < 0.5) {
        resolution = 'compromise';
        recommendation = 'Biraz denge gerekiyor, uzlaşma yolu arıyorum.';
    } else if (internalConflict < 0.7) {
        resolution = 'emotional';
        recommendation = 'Bu zor bir seçim - hislerime güvenmem gerekebilir.';
    } else {
        resolution = 'avoidant';
        recommendation = 'Çok karmaşık, belki ertelemek mantıklı olabilir.';
    }

    // "Mantıklı ama içime sinmedi" durumu
    if (internalConflict > 0.3 && tensions.length > 0) {
        const topTension = tensions[0];
        const node1 = graph.nodes.get(topTension.value1);
        const node2 = graph.nodes.get(topTension.value2);

        if (node1 && node2) {
            recommendation += ` ${node1.displayName} ve ${node2.displayName} arasında kaldım.`;
        }
    }

    return {
        triggeredValues: Array.from(triggeredValues.keys()),
        tensions,
        resolution,
        internalConflict,
        dominantValue,
        recommendation
    };
}

/**
 * Değer ağırlıklarını güncelle (öğrenme)
 */
export async function updateValueWeight(
    personaId: string,
    valueName: string,
    delta: number  // -0.1 to +0.1
): Promise<void> {
    try {
        const node = await prisma.valueNode.findFirst({
            where: { personaId, name: valueName }
        });

        if (node) {
            const newWeight = Math.max(0.1, Math.min(1, node.weight + delta));
            await prisma.valueNode.update({
                where: { id: node.id },
                data: { weight: newWeight }
            });
        }
    } catch (error) {
        console.error('[ValueGraph] Failed to update weight:', error);
    }
}

// ==================== EXPORTS ====================

export const valueGraph = {
    loadValueGraph,
    initializeValueGraph,
    detectTriggeredValues,
    calculateTensions,
    findDominantValue,
    analyzeDecision,
    updateValueWeight
};
