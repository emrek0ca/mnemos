/**
 * MNEMOS – Text-to-Speech Service
 * 
 * Provides voice synthesis with gender selection
 * Uses Web Speech API for client-side TTS
 * Can be extended for cloud-based TTS (Azure, Google, etc.)
 */

export interface VoiceSettings {
    gender: 'male' | 'female';
    pitch: number;     // 0.5 - 2.0
    rate: number;      // 0.5 - 2.0
    volume: number;    // 0 - 1
    language: string;  // 'tr-TR'
}

export interface TTSResult {
    success: boolean;
    error?: string;
}

// Default voice settings
export const DEFAULT_VOICE_SETTINGS: VoiceSettings = {
    gender: 'female',
    pitch: 1.0,
    rate: 0.95,
    volume: 1.0,
    language: 'tr-TR'
};

// Gender-specific voice adjustments
const GENDER_SETTINGS = {
    male: { pitch: 0.85, rate: 0.9 },
    female: { pitch: 1.1, rate: 0.95 }
};

/**
 * Text-to-Speech Service Class
 * Works with Web Speech API (client-side)
 */
export class TTSService {
    private synthesis: SpeechSynthesis | null = null;
    private currentUtterance: SpeechSynthesisUtterance | null = null;
    private settings: VoiceSettings;
    private availableVoices: SpeechSynthesisVoice[] = [];

    constructor(settings: Partial<VoiceSettings> = {}) {
        this.settings = { ...DEFAULT_VOICE_SETTINGS, ...settings };

        // Initialize only in browser environment
        if (typeof window !== 'undefined' && window.speechSynthesis) {
            this.synthesis = window.speechSynthesis;
            this.loadVoices();
        }
    }

    /**
     * Load available voices (async, voices may load after page load)
     */
    private loadVoices(): void {
        if (!this.synthesis) return;

        const loadVoicesHandler = () => {
            this.availableVoices = this.synthesis!.getVoices();
        };

        // Voices may already be loaded
        loadVoicesHandler();

        // Or they may load later
        this.synthesis.onvoiceschanged = loadVoicesHandler;
    }

    /**
     * Find best Turkish voice based on gender preference
     */
    private findBestVoice(): SpeechSynthesisVoice | null {
        // Prefer voices with Turkish language
        const turkishVoices = this.availableVoices.filter(
            v => v.lang.startsWith('tr') || v.lang === 'tr-TR'
        );

        if (turkishVoices.length === 0) {
            // Fallback to any available voice
            return this.availableVoices[0] || null;
        }

        // Try to find gender-matching voice
        const genderKeywords = this.settings.gender === 'male'
            ? ['erkek', 'male', 'ahmet', 'mehmet', 'can']
            : ['kadın', 'female', 'emel', 'ayşe', 'zeynep'];

        const genderMatch = turkishVoices.find(v =>
            genderKeywords.some(kw => v.name.toLowerCase().includes(kw))
        );

        return genderMatch || turkishVoices[0];
    }

    /**
     * Speak text with current settings
     */
    speak(text: string): Promise<TTSResult> {
        return new Promise((resolve) => {
            if (!this.synthesis) {
                resolve({ success: false, error: 'TTS not available' });
                return;
            }

            // Cancel any ongoing speech
            this.stop();

            const utterance = new SpeechSynthesisUtterance(text);

            // Apply settings
            const genderAdjust = GENDER_SETTINGS[this.settings.gender];
            utterance.pitch = this.settings.pitch * genderAdjust.pitch;
            utterance.rate = this.settings.rate * genderAdjust.rate;
            utterance.volume = this.settings.volume;
            utterance.lang = this.settings.language;

            // Set voice
            const voice = this.findBestVoice();
            if (voice) {
                utterance.voice = voice;
            }

            // Event handlers
            utterance.onend = () => {
                this.currentUtterance = null;
                resolve({ success: true });
            };

            utterance.onerror = (event) => {
                this.currentUtterance = null;
                resolve({ success: false, error: event.error });
            };

            this.currentUtterance = utterance;
            this.synthesis.speak(utterance);
        });
    }

    /**
     * Stop current speech
     */
    stop(): void {
        if (this.synthesis) {
            this.synthesis.cancel();
            this.currentUtterance = null;
        }
    }

    /**
     * Pause current speech
     */
    pause(): void {
        if (this.synthesis) {
            this.synthesis.pause();
        }
    }

    /**
     * Resume paused speech
     */
    resume(): void {
        if (this.synthesis) {
            this.synthesis.resume();
        }
    }

    /**
     * Check if currently speaking
     */
    isSpeaking(): boolean {
        return this.synthesis?.speaking || false;
    }

    /**
     * Update voice settings
     */
    updateSettings(settings: Partial<VoiceSettings>): void {
        this.settings = { ...this.settings, ...settings };
    }

    /**
     * Get current settings
     */
    getSettings(): VoiceSettings {
        return { ...this.settings };
    }

    /**
     * Get available Turkish voices
     */
    getAvailableVoices(): Array<{ name: string; gender: string }> {
        return this.availableVoices
            .filter(v => v.lang.startsWith('tr'))
            .map(v => ({
                name: v.name,
                gender: v.name.toLowerCase().includes('emel') ||
                    v.name.toLowerCase().includes('female') ? 'female' : 'male'
            }));
    }
}

// Singleton instance for easy import
let ttsInstance: TTSService | null = null;

export function getTTSService(settings?: Partial<VoiceSettings>): TTSService {
    if (!ttsInstance) {
        ttsInstance = new TTSService(settings);
    } else if (settings) {
        ttsInstance.updateSettings(settings);
    }
    return ttsInstance;
}

/**
 * React hook for TTS (can be used in components)
 * Example usage:
 * const { speak, stop, isSpeaking, setGender } = useTTS();
 */
export function createTTSHook() {
    return {
        speak: async (text: string, settings?: Partial<VoiceSettings>) => {
            const tts = getTTSService(settings);
            return tts.speak(text);
        },
        stop: () => {
            const tts = getTTSService();
            tts.stop();
        },
        isSpeaking: () => {
            const tts = getTTSService();
            return tts.isSpeaking();
        },
        setGender: (gender: 'male' | 'female') => {
            const tts = getTTSService();
            tts.updateSettings({ gender });
        }
    };
}
