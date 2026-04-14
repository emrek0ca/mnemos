import { useState, useEffect, useCallback, useRef } from 'react';

interface UseVoiceReturn {
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string, options?: { pitch?: number; rate?: number; volume?: number }) => void;
    cancelSpeech: () => void;
    supported: boolean;
}

export function useVoice(): UseVoiceReturn {
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [supported, setSupported] = useState(false);

    const recognitionRef = useRef<any>(null);
    const synthesisRef = useRef<SpeechSynthesis | null>(null);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            // Check support
            const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
            const speechSupported = !!SpeechRecognition;
            const synthesisSupported = 'speechSynthesis' in window;

            setSupported(speechSupported && synthesisSupported);

            if (speechSupported) {
                const recognition = new SpeechRecognition();
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.lang = 'tr-TR'; // Default to Turkish

                recognition.onstart = () => setIsListening(true);
                recognition.onend = () => setIsListening(false);

                recognition.onresult = (event: any) => {
                    let finalTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscript += event.results[i][0].transcript;
                        } else {
                            // Interim - optional handling
                        }
                    }
                    if (finalTranscript) {
                        setTranscript(finalTranscript);
                    }
                };

                recognitionRef.current = recognition;
            }

            if (synthesisSupported) {
                synthesisRef.current = window.speechSynthesis;
            }
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            try {
                recognitionRef.current.start();
            } catch (e) {
                console.error("Mic start error", e);
            }
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
        }
    }, [isListening]);

    const speak = useCallback((text: string, options?: { pitch?: number; rate?: number; volume?: number }) => {
        if (synthesisRef.current) {
            // Cancel previous
            synthesisRef.current.cancel();

            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'tr-TR';

            if (options) {
                if (options.pitch) utterance.pitch = options.pitch;
                if (options.rate) utterance.rate = options.rate;
                if (options.volume) utterance.volume = options.volume;
            }

            // Find a good Turkish voice if available
            const voices = synthesisRef.current.getVoices();
            const trVoice = voices.find(v => v.lang.includes('tr')) || voices[0];
            if (trVoice) utterance.voice = trVoice;

            utterance.onstart = () => setIsSpeaking(true);
            utterance.onend = () => setIsSpeaking(false);
            utterance.onerror = () => setIsSpeaking(false);

            synthesisRef.current.speak(utterance);
        }
    }, []);

    const cancelSpeech = useCallback(() => {
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
            setIsSpeaking(false);
        }
    }, []);

    return {
        isListening,
        isSpeaking,
        transcript,
        startListening,
        stopListening,
        speak,
        cancelSpeech,
        supported
    };
}
