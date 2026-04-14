'use client';

import { useEffect, useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Button, Card, Input } from '@/components/ui';
import { Send, Brain, Loader2, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ChatMicroFeedback } from '@/components/chat/ChatMicroFeedback';

interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    createdAt: string;
}

interface Persona {
    id: string;
    name: string;
}

export default function ChatPage() {
    const params = useParams();
    const personaId = params.id as string;

    const [persona, setPersona] = useState<Persona | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchPersona();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [personaId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    async function fetchPersona() {
        try {
            const response = await fetch('/api/personas');
            if (response.ok) {
                const data = await response.json();
                const found = data.personas.find((p: Persona) => p.id === personaId);
                setPersona(found || null);
            }
        } catch (error) {
            console.error('Error fetching persona:', error);
        } finally {
            setLoading(false);
        }
    }

    async function sendMessage() {
        if (!input.trim() || sending) return;

        const userMessage = input.trim();
        setInput('');
        setSending(true);
        const startTime = Date.now();

        const tempUserMsg: Message = {
            id: `temp-${Date.now()}`,
            role: 'USER',
            content: userMessage,
            createdAt: new Date().toISOString()
        };
        setMessages(prev => [...prev, tempUserMsg]);

        try {
            const response = await fetch('/api/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    personaId,
                    message: userMessage,
                    conversationId
                })
            });

            if (response.ok) {
                const data = await response.json();
                setConversationId(data.conversationId);

                const assistantMsg: Message = {
                    id: data.messageId,
                    role: 'ASSISTANT',
                    content: data.content,
                    createdAt: new Date().toISOString()
                };
                setMessages(prev => [...prev, assistantMsg]);
                setMessages(prev => [...prev, assistantMsg]);
            } else {
                setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
        } finally {
            // Ensure HUD is visible for at least 3 seconds
            const elapsed = Date.now() - startTime;
            if (elapsed < 3000) {
                await new Promise(resolve => setTimeout(resolve, 3000 - elapsed));
            }
            setSending(false);
        }
    }



    function handleKeyPress(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    }

    function exportConversation() {
        const exportData = {
            persona: persona?.name,
            conversationId,
            exportedAt: new Date().toISOString(),
            messages: messages.map(m => ({
                role: m.role,
                content: m.content,
                timestamp: m.createdAt
            }))
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mnemos-conversation-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
        );
    }

    if (!persona) {
        return (
            <div className="text-center py-12">
                <p className="text-slate-500">Persona bulunamadı</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-[calc(100vh-8rem)]">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
                        <Brain className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">{persona.name}</h1>
                        <p className="text-sm text-slate-500">Bilişsel sohbet</p>
                    </div>
                </div>
                <div className="flex gap-2">

                    {messages.length > 0 && (
                        <Button variant="outline" size="sm" onClick={exportConversation}>
                            <Download className="h-4 w-4 mr-1" />
                            Dışa Aktar
                        </Button>
                    )}
                </div>
            </div>



            {/* Messages */}
            <Card className="flex-1 overflow-hidden">
                <div className="h-full overflow-y-auto p-6 space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center py-12">
                            <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">Sohbete Başla</h3>
                            <p className="text-slate-500 max-w-md mx-auto">
                                Her etkileşim bilişsel profilin şekillenmesine yardımcı olur.
                                Düşüncelerini paylaş, sorular sor, birlikte karar ver.
                            </p>
                        </div>
                    ) : (
                        messages.map((message) => (
                            <div
                                key={message.id}
                                className={cn(
                                    'flex',
                                    message.role === 'USER' ? 'justify-end' : 'justify-start'
                                )}
                            >
                                <div
                                    className={cn(
                                        'max-w-[75%] rounded-2xl px-4 py-3',
                                        message.role === 'USER'
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 text-slate-900'
                                    )}
                                >
                                    <p className="whitespace-pre-wrap">{message.content}</p>
                                    {message.role === 'ASSISTANT' && (
                                        <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                            <ChatMicroFeedback
                                                personaId={personaId}
                                                messageId={message.id}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}

                    {/* Replaced loader with ThoughtHUD */}
                    <div ref={messagesEndRef} />
                </div>
            </Card >



            {/* Input */}
            <div className="mt-4 flex gap-3">
                <Input
                    placeholder="Bir şeyler yaz..."
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1"
                    disabled={sending}
                />
                <Button onClick={sendMessage} disabled={!input.trim() || sending}>
                    {sending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Send className="h-4 w-4" />
                    )}
                </Button>
            </div>
        </div >
    );
}
