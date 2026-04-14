/**
 * MNEMOS – Dijital Kişilik Motoru
 * Perspective Alignment - Deictic Positioning Engine
 * 
 * BU MODÜL ÖZNE ÜRETMEZ.
 * Özneyle mesafeyi ayarlar.
 * 
 * YANLIŞ: "Ben genelde böyle düşünürüm" ❌
 * DOĞRU: "Senin anlattıklarına göre..." ✅
 * 
 * Teknik terim: Deictic positioning
 * - Deixis = referans noktası
 * - Konuşmacının kendini kullanıcıya göre konumlandırması
 */

// ==================== TYPES ====================

export type PositioningMode =
    | 'listening'     // "Anlattığın şey..."
    | 'reflecting'    // "Senin için..."
    | 'observing'     // "Buradan bakınca..."
    | 'alongside'     // "Birlikte düşünürsek..."
    | 'distanced';    // "Dışardan bakınca..."

export interface PositioningContext {
    mode: PositioningMode;
    prefix: string;
    connector: string;
    suffix?: string;
}

export interface AlignmentResult {
    positioning: PositioningContext;
    transformedText: string;
    distanceLevel: number;  // 0 = çok yakın, 1 = uzak
}

export interface MessageAnalysis {
    isPersonalShare: boolean;
    isAskingOpinion: boolean;
    isEmotional: boolean;
    isFactual: boolean;
    suggestedMode: PositioningMode;
}

// ==================== POSITIONING TEMPLATES ====================

const POSITIONING_PREFIXES: Record<PositioningMode, string[]> = {
    listening: [
        'Anlattığın şey',
        'Söylediklerine bakınca',
        'Anlattıklarından',
        'Bu durumda',
        'Paylaştığın şey'
    ],
    reflecting: [
        'Senin için',
        'Senin açından',
        'Sana göre',
        'Senin durumunda',
        'Senin yerinde olsam'
    ],
    observing: [
        'Buradan bakınca',
        'Dışardan bakıldığında',
        'Genel olarak',
        'Görünen o ki',
        'Anladığım kadarıyla'
    ],
    alongside: [
        'Birlikte düşünürsek',
        'Beraber bakarsak',
        'Şöyle düşünelim',
        'Bir de şöyle bakalım'
    ],
    distanced: [
        'Objektif bakarsak',
        'Mantıksal olarak',
        'Soyut düşünürsek',
        'Genel bir bakışla'
    ]
};

const POSITIONING_CONNECTORS: Record<PositioningMode, string[]> = {
    listening: ['...', ', ', ' - '],
    reflecting: ['...', ', '],
    observing: [', ', ': '],
    alongside: [' - ', ': '],
    distanced: [', ', ': ']
};

// ==================== ANALYSIS FUNCTIONS ====================

/**
 * Analyze user message to determine appropriate positioning
 */
export function analyzeMessage(message: string): MessageAnalysis {
    const text = message.toLowerCase();

    // Personal share detection
    const personalMarkers = [
        'bugün', 'dün', 'geçen', 'bana', 'benim', 'yaşadım', 'oldu',
        'hissediyorum', 'düşünüyorum', 'koruyorum', 'endişeleniyorum'
    ];
    const isPersonalShare = personalMarkers.some(m => text.includes(m));

    // Opinion request detection
    const opinionMarkers = [
        'ne dersin', 'ne düşünüyorsun', 'sence', 'fikrin ne',
        'nasıl görüyorsun', 'görüşün ne'
    ];
    const isAskingOpinion = opinionMarkers.some(m => text.includes(m));

    // Emotional detection
    const emotionalMarkers = [
        'üzgün', 'mutlu', 'kızgın', 'korkuyorum', 'endişeli',
        'stresli', 'heyecanlı', 'sinirli', 'mutsuz'
    ];
    const isEmotional = emotionalMarkers.some(m => text.includes(m));

    // Factual detection
    const factualMarkers = [
        'nedir', 'nasıl', 'ne zaman', 'neden', 'kim', 'kaç',
        'bilgi', 'açıkla', 'anlat'
    ];
    const isFactual = factualMarkers.some(m => text.includes(m));

    // Determine suggested mode
    let suggestedMode: PositioningMode;

    if (isEmotional) {
        suggestedMode = 'listening';  // Emotional → empathetic positioning
    } else if (isPersonalShare) {
        suggestedMode = 'reflecting';  // Personal → mirror back
    } else if (isAskingOpinion) {
        suggestedMode = 'alongside';  // Opinion → collaborative
    } else if (isFactual) {
        suggestedMode = 'observing';  // Factual → objective
    } else {
        suggestedMode = 'listening';  // Default
    }

    return {
        isPersonalShare,
        isAskingOpinion,
        isEmotional,
        isFactual,
        suggestedMode
    };
}

// ==================== POSITIONING FUNCTIONS ====================

/**
 * Get positioning context for a mode
 */
export function getPositioningContext(mode: PositioningMode): PositioningContext {
    const prefixes = POSITIONING_PREFIXES[mode];
    const connectors = POSITIONING_CONNECTORS[mode];

    return {
        mode,
        prefix: prefixes[Math.floor(Math.random() * prefixes.length)],
        connector: connectors[Math.floor(Math.random() * connectors.length)]
    };
}

/**
 * Calculate distance level based on context
 * 0 = very close (empathetic), 1 = distant (objective)
 */
export function calculateDistance(
    analysis: MessageAnalysis,
    topicSensitivity: 'low' | 'medium' | 'high'
): number {
    let distance = 0.5;  // Default: neutral

    // Emotional content → closer
    if (analysis.isEmotional) distance -= 0.3;

    // Personal share → closer
    if (analysis.isPersonalShare) distance -= 0.2;

    // Factual → more distant
    if (analysis.isFactual) distance += 0.2;

    // High sensitivity → closer
    if (topicSensitivity === 'high') distance -= 0.2;

    // Opinion request → moderate
    if (analysis.isAskingOpinion) distance = 0.4;

    return Math.max(0, Math.min(1, distance));
}

/**
 * Transform response with appropriate positioning
 * Adds context-aware prefix without adding "I" statements
 */
export function alignPerspective(
    response: string,
    userMessage: string,
    options?: {
        forceMode?: PositioningMode;
        topicSensitivity?: 'low' | 'medium' | 'high';
        addPrefix?: boolean;
    }
): AlignmentResult {
    const analysis = analyzeMessage(userMessage);
    const mode = options?.forceMode || analysis.suggestedMode;
    const positioning = getPositioningContext(mode);
    const distanceLevel = calculateDistance(analysis, options?.topicSensitivity || 'medium');

    let transformedText = response;

    // Optionally add positioning prefix
    if (options?.addPrefix !== false && Math.random() < 0.4) {
        // Only add prefix 40% of the time to feel natural
        transformedText = `${positioning.prefix}${positioning.connector}${response}`;
    }

    return {
        positioning,
        transformedText,
        distanceLevel
    };
}

// ==================== RESPONSE TRANSFORMERS ====================

/**
 * Transform AI "I" statements to user-focused statements
 * CRITICAL: This removes any self-referential language
 */
export function removeFirstPerson(text: string): string {
    // Turkish first-person patterns to remove/transform
    const transformations: [RegExp, string][] = [
        // "Ben" variations
        [/\bben\s+(?:de\s+)?(?:genelde|genellikle|normalde)\s*/gi, 'Genellikle '],
        [/\bben\s+(?:de\s+)?/gi, ''],
        [/\bbence\b/gi, 'belki'],
        [/\bbenim\s+(?:için|açımdan)\b/gi, 'bu durumda'],
        [/\bbenim\b/gi, ''],

        // "Bana" variations
        [/\bbana\s+göre\b/gi, 'görünen o ki'],
        [/\bbana\s+(?:da\s+)?öyle\s+geliyor\b/gi, 'öyle görünüyor'],

        // Feeling statements
        [/\bhissediyorum\b/gi, 'görünüyor'],
        [/\bdüşünüyorum\b/gi, 'görünüyor'],
        [/\bsanıyorum\b/gi, 'belki'],

        // Action statements  
        [/\byapardım\b/gi, 'yapılabilir'],
        [/\bsöylerdim\b/gi, 'söylenebilir'],
        [/\bederim\b/gi, 'edilir'],
        [/\byaparım\b/gi, 'yapılır'],
    ];

    let result = text;
    for (const [pattern, replacement] of transformations) {
        result = result.replace(pattern, replacement);
    }

    // Clean up double spaces
    result = result.replace(/\s+/g, ' ').trim();

    // Fix sentence start capitalization if needed
    result = result.charAt(0).toUpperCase() + result.slice(1);

    return result;
}

/**
 * Add user-focused framing to response
 */
export function addUserFocusedFrame(
    response: string,
    analysis: MessageAnalysis
): string {
    // If user shared something emotional
    if (analysis.isEmotional) {
        const frames = [
            'Bu konuda söylediklerin önemli.',
            'Anlattığın durumu anlıyorum.',
            'Paylaştıkların geçerli hisler.'
        ];

        // Randomly add frame suffix (30% chance)
        if (Math.random() < 0.3) {
            const frame = frames[Math.floor(Math.random() * frames.length)];
            return `${response} ${frame}`;
        }
    }

    // If user asking opinion - redirect to them
    if (analysis.isAskingOpinion) {
        const redirects = [
            'Sen ne hissediyorsun bu konuda?',
            'Senin içgüdün ne diyor?',
            'Peki sen ne düşünüyorsun gerçekten?'
        ];

        // Sometimes add redirect (20% chance)
        if (Math.random() < 0.2) {
            const redirect = redirects[Math.floor(Math.random() * redirects.length)];
            return `${response} ${redirect}`;
        }
    }

    return response;
}

// ==================== MAIN ALIGNMENT FUNCTION ====================

/**
 * Full perspective alignment pipeline
 * Takes raw response and transforms it to be user-focused
 */
export function fullAlignment(
    rawResponse: string,
    userMessage: string,
    options?: {
        topicSensitivity?: 'low' | 'medium' | 'high';
        removeFirstPerson?: boolean;
        addFrame?: boolean;
    }
): AlignmentResult {
    const analysis = analyzeMessage(userMessage);

    let processed = rawResponse;

    // Step 1: Remove first-person language if enabled
    if (options?.removeFirstPerson !== false) {
        processed = removeFirstPerson(processed);
    }

    // Step 2: Add user-focused frame if enabled
    if (options?.addFrame !== false) {
        processed = addUserFocusedFrame(processed, analysis);
    }

    // Step 3: Apply perspective alignment
    return alignPerspective(processed, userMessage, {
        topicSensitivity: options?.topicSensitivity,
        addPrefix: true
    });
}

// ==================== EXPORTS ====================

export const perspectiveAlignment = {
    analyzeMessage,
    getPositioningContext,
    calculateDistance,
    alignPerspective,
    removeFirstPerson,
    addUserFocusedFrame,
    fullAlignment
};
