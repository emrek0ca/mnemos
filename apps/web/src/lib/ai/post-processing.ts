export const FORBIDDEN_PHRASES = [
    "genel olarak",
    "beni bilenler bilir",
    "mümkün",
    "zor",
    "birçok faktöre bağlı",
    "şunu söylemek gerekirse",
    "yapay zeka olarak",
    "yapay zekâ olarak",
    "bir dil modeli olarak",
    "yardımcı olabilir miyim",
    "nasıl yardımcı olabilirim",
    "anladım",
    "çok ilginç",
    "peki",
    "söylemem gerekirse"
];

export function scrubResponse(text: string): string {
    let cleanText = text;

    // 1. Remove Forbidden Phrases (Case insensitive)
    FORBIDDEN_PHRASES.forEach(phrase => {
        const regex = new RegExp(phrase, 'gi');
        cleanText = cleanText.replace(regex, "");
    });

    // 2. Fix Double Spaces and Punctuation
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    cleanText = cleanText.replace(/ \./g, '.').replace(/ ,/g, ',');

    // 3. Enforce First Sentence Length (Max 15 words)
    // Only if total text is longer than one sentence
    const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
    if (sentences.length > 0) {
        const firstSentence = sentences[0];
        const words = firstSentence.split(' ');
        if (words.length > 20) { // Using 20 as soft limit post-processing, strict 15 in prompt
            // If first sentence is too long, we might just cut it or keep it if it's the only one.
            // For safety, let's just trim potential filler words from start if possible, 
            // but programmatic rewriting is risky. 
            // Let's rely on prompt for structure, this scrubber is for Phrases.
        }
    }

    // 4. Remove leading "..." if it's not the mirrored silence feature
    if (cleanText.startsWith('...') && cleanText.length > 5) {
        cleanText = cleanText.substring(3).trim();
    }

    // 5. Hard stop: If empty after scrub, return fallback
    if (cleanText.length === 0) {
        return "...";
    }

    return cleanText;
}
