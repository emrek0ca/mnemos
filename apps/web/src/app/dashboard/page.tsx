'use client';

import { useEffect, useState, useRef, ChangeEvent } from 'react';
import { Button, Input } from '@/components/ui';
import { Send, Brain, Loader2, Volume2, Mic, MicOff, Image as ImageIcon, X, Download, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { useVoice } from '@/hooks/use-voice';
import { ThoughtStream } from '@/components/dashboard/thought-stream';
import { PersonalitySetupBanner } from '@/components/dashboard/personality-setup-banner';
import { ContinuityScreen } from '@/components/dashboard/continuity-screen';



interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
    reasoning?: string;
    imageUrl?: string; // Vision Feature
}

interface Persona {
    id: string;
    name: string;
    identityMemory?: string; // JSON string
    personalityDNA?: {
        setupCompleted?: boolean;
    };
}

interface IdentitySettings {
    voiceSettings?: {
        pitch: number;
        rate: number;
    };
}

export default function DashboardPage() {
    const [persona, setPersona] = useState<Persona | null>(null);

    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showContinuity, setShowContinuity] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Vision Feature State
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Voice Hook
    const { isListening, isSpeaking, transcript, startListening, stopListening, speak, cancelSpeech, supported } = useVoice();
    // hasRecognitionSupport removed as it's not exported or used currently
    const [voiceModeEnabled, setVoiceModeEnabled] = useState(false); // If true, auto-speak responses

    // Update input from voice transcript
    useEffect(() => {
        if (transcript) {
            setInput(transcript);
        }
    }, [transcript]);

    // Send message automatically if silence detected? 
    // For now, let's keep it manual send or manual Enter key for safety.

    // Auto-Speak Response
    useEffect(() => {
        if (voiceModeEnabled && messages.length > 0) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg.role === 'ASSISTANT' && !isSpeaking) {
                // Strip markdown/artifacts before speaking if needed, but basic text is fine
                // Simple stripping: remove *text* or **text**
                const cleanText = lastMsg.content.replace(/[\*\_\[\]]/g, '');

                let voiceOptions = { pitch: 1, rate: 1 };
                if (persona?.identityMemory) {
                    try {
                        const identity = JSON.parse(persona.identityMemory) as IdentitySettings;
                        if (identity.voiceSettings) {
                            voiceOptions = identity.voiceSettings;
                        }
                    } catch {
                        // ignore parse error
                    }
                }

                speak(cleanText, voiceOptions);
            }
        }
    }, [messages, voiceModeEnabled, speak, persona, isSpeaking]);

    // Auto-load persona on mount
    useEffect(() => {
        fetchPersona();
    }, []);

    useEffect(() => {
        if (persona) {
            fetchHistory(persona.id);
        }
    }, [persona]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchPersona() {
        try {
            const response = await fetch('/api/personas');
            if (response.ok) {
                const data = await response.json();
                const firstPersona = data.personas[0];
                if (firstPersona) {
                    setPersona(firstPersona);
                }
            }
        } catch (error) {
            console.error('Error fetching persona:', error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchHistory(personaId: string) {
        try {
            const response = await fetch(`/api/chat/history?personaId=${personaId}`);
            if (response.ok) {
                const data = await response.json();
                if (data.messages && data.messages.length > 0) {
                    setMessages(data.messages);
                    setConversationId(data.conversationId);

                    // WELCOME BACK LOGIC
                    const lastMsg = data.messages[data.messages.length - 1];
                    if (lastMsg) {
                        const lastTime = new Date(lastMsg.createdAt).getTime();
                        const now = Date.now();
                        const hoursDiff = (now - lastTime) / (1000 * 60 * 60);

                        // If absent for more than 24 hours
                        if (hoursDiff > 24) {
                            setTimeout(() => {
                                const welcomeMsg: Message = {
                                    id: `welcome-${Date.now()}`,
                                    role: 'ASSISTANT',
                                    content: "Buraya dönmeni bekliyordum.",
                                    createdAt: new Date().toISOString()
                                };
                                setMessages(prev => [...prev, welcomeMsg]);
                            }, 1000);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('Error fetching history:', error);
        }
    }

    function handleImageUpload(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            if (file.size > 5 * 1024 * 1024) {
                alert('Dosya boyutu 5MB\'dan küçük olmalıdır.');
                return;
            }
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setSelectedImage(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }

    async function sendMessage() {
        if ((!input.trim() && !imageFile) || sending || !persona) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);
        if (isListening) stopListening(); // Stop listening while processing

        const tempUserMsg: Message = {
            id: `temp - ${Date.now()} `,
            role: 'USER',
            content: userMessage,
            createdAt: new Date().toISOString(),
            imageUrl: selectedImage || undefined,
        };

        // Reset image state
        setSelectedImage(null);
        setImageFile(null);
        if (fileInputRef.current) fileInputRef.current.value = '';


        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const formData = new FormData();
            formData.append('personaId', persona.id);
            formData.append('message', userMessage);
            if (conversationId) {
                formData.append('conversationId', conversationId);
            }
            if (imageFile) {
                formData.append('image', imageFile);
            }

            const response = await fetch('/api/chat', {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setConversationId(data.conversationId);

                const assistantMsg: Message = {
                    id: data.messageId,
                    role: 'ASSISTANT',
                    content: data.content,
                    reasoning: data.reasoning,
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                // Handle Errors
                const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

                if (response.status === 403 && errorData.error === 'LIMIT_REACHED') {
                    // 1. Add the "Stop Phrase" as a final assistant message
                    const stopMsg: Message = {
                        id: `limit-${Date.now()}`,
                        role: 'ASSISTANT',
                        content: errorData.message || "Burada durmamız gerekiyor.",
                        createdAt: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, stopMsg]);

                    // 2. Show Continuity Screen after a brief delay (natural pause)
                    setTimeout(() => {
                        setShowContinuity(true);
                    }, 1500);

                } else {
                    console.error('Failed to send message:', response.status, errorData);
                    if (errorData.details) {
                        alert(`Hata: ${errorData.details}`);
                    } else {
                        alert(`Hata oluştu: ${response.status}`);
                    }
                    setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
                }
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        } finally {
            setSending(false);
        }
    }



    function handleKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function handleMicClick() {
        if (isListening) {
            stopListening();
        } else {
            setVoiceModeEnabled(true); // Enable voice responses if user initiates voice
            startListening();
        }
    }

    function toggleMute() {
        if (isSpeaking) {
            cancelSpeech();
        }
        setVoiceModeEnabled(!voiceModeEnabled);
    }

    function exportConversation() {
        if (!persona) return;
        const exportData = {
            persona: persona.name,
            conversationId,
            exportedAt: new Date().toISOString(),
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.createdAt,
                imageUrl: m.imageUrl,
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mnemos - conversation - ${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-slate-50">
                <div className="flex flex-col items-center gap-4">
                    <Brain className="h-12 w-12 text-slate-300 animate-pulse" />
                    <p className="text-slate-500">Zihin yükleniyor...</p>
                </div>
            </div>
        );
    }

    if (!persona) {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-slate-50">
                <div className="text-center p-8 bg-white rounded-2xl shadow-sm border border-slate-100 max-w-md">
                    <Brain className="h-12 w-12 text-indigo-500 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Henüz Bir Kimlik Yok</h2>
                    <p className="text-slate-500 mb-6">
                        Sistemi kullanmaya başlamak için önce bir bilişsel kimlik oluşturmalısınız.
                    </p>
                    <Link href="/dashboard/settings">
                        <Button className="w-full">
                            <Settings className="h-4 w-4 mr-2" />
                            Ayarlara Git
                        </Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen bg-slate-50">
            {/* Personality Setup Banner */}
            {persona && !persona.personalityDNA?.setupCompleted && (
                <div className="shrink-0 px-4 md:px-8 pt-4">
                    <PersonalitySetupBanner
                        personaId={persona.id}
                        setupCompleted={persona.personalityDNA?.setupCompleted}
                    />
                </div>
            )}

            {/* Minimal Header */}
            <div className="shrink-0 h-16 bg-white border-b border-slate-200 px-4 md:px-8 flex items-center justify-between z-10 relative">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center shadow-sm">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="font-bold text-slate-900 leading-tight">{persona.name}</h1>
                        <p className="text-[10px] text-slate-500 font-medium tracking-wider uppercase">MNEMOS SİSTEMİ</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Voice Toggle */}
                    {supported && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={toggleMute}
                            className={cn("text-slate-500", voiceModeEnabled && "text-indigo-600 bg-indigo-50")}
                            title={voiceModeEnabled ? "Sesi Kapat" : "Sesi Aç"}
                        >
                            {voiceModeEnabled ? <Volume2 className="h-5 w-5" /> : <Volume2 className="h-5 w-5 opacity-50" />}
                        </Button>
                    )}



                    {messages.length > 0 && (
                        <Button variant="ghost" size="sm" onClick={exportConversation} className="text-slate-500" title="Dışa Aktar">
                            <Download className="h-5 w-5" />
                        </Button>
                    )}

                    <div className="w-px h-6 bg-slate-200 mx-1" />

                    <Link href="/dashboard/settings">
                        <Button variant="ghost" size="sm" className="text-slate-500 hover:text-slate-900">
                            <Settings className="h-5 w-5" />
                            <span className="sr-only">Ayarlar</span>
                        </Button>
                    </Link>


                </div>
            </div>



            {/* Main Chat Area */}
            <main className="flex-1 overflow-hidden relative flex flex-col max-w-5xl mx-auto w-full">
                {/* Messages List */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
                    {messages.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-center p-8 opacity-0 animate-in fade-in zoom-in duration-500 slide-in-from-bottom-4 fill-mode-forwards" style={{ animationDelay: '0.2s', animationFillMode: 'forwards' }}>
                            <div className="h-20 w-20 bg-gradient-to-tr from-slate-100 to-indigo-50 rounded-full flex items-center justify-center mb-6 shadow-inner ring-1 ring-white">
                                <Brain className="h-10 w-10 text-indigo-400/80" />
                            </div>
                            <h2 className="text-2xl font-semibold text-slate-900 mb-3">Hatıralar dinliyor.</h2>
                            <p className="text-slate-500 max-w-md leading-relaxed">
                                Kendinle konuşmaya başla.
                            </p>
                        </div>
                    ) : (
                        messages.map((message, index) => (
                            <div
                                key={`${message.id} -${index} `}
                                className={cn(
                                    'flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300',
                                    message.role === 'USER' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        'max-w-[85%] md:max-w-[70%] rounded-2xl px-5 py-4 shadow-sm',
                                        message.role === 'USER'
                                            ? 'bg-slate-900 text-slate-50 rounded-tr-sm'
                                            : 'bg-white text-slate-800 border border-slate-100 rounded-tl-sm'
                                    )}
                                >
                                    <p className="whitespace-pre-wrap leading-relaxed">{message.content}</p>


                                </div>
                            </div>
                        ))
                    )}
                    {sending && (
                        <div className="flex justify-start animate-in fade-in duration-300">
                            <div className="bg-white border border-slate-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
                                <span className="text-xs text-slate-400 font-medium">...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} className="h-4" />
                </div>

                {/* Input Area */}
                <div className="p-4 md:p-6 bg-gradient-to-t from-slate-50 to-slate-50/0">
                    <div className="relative max-w-4xl mx-auto shadow-lg rounded-2xl bg-white focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all border border-slate-200">
                        <Input
                            placeholder="Zihnine bir şeyler söyle..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyPress}
                            className="w-full pr-24 pl-6 py-4 h-auto text-base border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400"
                            disabled={sending}
                            autoFocus
                        />

                        {/* Image Preview */}
                        {selectedImage && (
                            <div className="absolute left-4 bottom-16 bg-white p-2 rounded-xl shadow-lg border border-slate-100 animate-in fade-in zoom-in duration-200">
                                <div className="relative h-20 w-20 rounded-lg overflow-hidden group">
                                    <img src={selectedImage} alt="Upload preview" className="h-full w-full object-cover" />
                                    <button
                                        onClick={() => {
                                            setSelectedImage(null);
                                            setImageFile(null);
                                            if (fileInputRef.current) fileInputRef.current.value = '';
                                        }}
                                        className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                            {/* Hidden File Input */}
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleImageUpload}
                            />

                            {/* Image Upload Button */}
                            <Button
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={sending}
                                className="h-9 w-9 p-0 rounded-xl bg-slate-100 text-slate-400 hover:text-slate-600 transition-all"
                                title="Resim Yükle"
                            >
                                <ImageIcon className="h-4 w-4" />
                            </Button>

                            {/* Mic Button */}
                            {supported && (
                                <Button
                                    size="sm"
                                    onClick={handleMicClick}
                                    disabled={sending}
                                    className={cn(
                                        "h-9 w-9 p-0 rounded-xl transition-all",
                                        isListening ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-slate-100 text-slate-400 hover:text-slate-600"
                                    )}
                                    title="Konuş"
                                >
                                    {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                                </Button>
                            )}

                            <Button
                                size="sm"
                                onClick={sendMessage}
                                disabled={!input.trim() || sending}
                                className={cn(
                                    "h-9 w-9 p-0 rounded-xl transition-all",
                                    input.trim() ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "bg-slate-100 text-slate-300"
                                )}
                            >
                                {sending ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Send className="h-4 w-4 ml-0.5" />
                                )}
                            </Button>
                        </div>
                    </div>

                </div>
            </main>

            {/* Background Thought Stream */}
            <ThoughtStream
                onProactiveReply={(proactiveMessage) => {
                    // Add AI's proactive message to chat as an ASSISTANT message
                    const aiMsg: Message = {
                        id: `proactive - ${Date.now()} `,
                        role: 'ASSISTANT',
                        content: proactiveMessage,

                        createdAt: new Date().toISOString()
                    };
                    setMessages(prev => [...prev, aiMsg]);
                }}
            />
            {/* Continuity Overlay */}
            {showContinuity && (
                <ContinuityScreen
                    onContinue={() => {
                        // TODO: Direct to Premium Upgrade / Payment
                        window.location.href = '/dashboard/settings?upgrade=true';
                    }}
                />
            )}
        </div>
    );
}
