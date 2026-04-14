/**
 * Get dominant emotion from perception
 */
export function getDominantEmotion(emotion: Record<string, number>): string | undefined {
    let max = 0;
    let dominant: string | undefined = undefined;
    for (const [key, value] of Object.entries(emotion)) {
        if (value > max) {
            max = value;
            dominant = key;
        }
    }
    return dominant;
}
