'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { Brain, Plus, Trash2, MessageSquare, Clock } from 'lucide-react';
import Link from 'next/link';

interface Persona {
    id: string;
    name: string;
    system1Weight: number;
    system2Weight: number;
    createdAt: string;
    _count: {
        conversations: number;
        memoryEntries: number;
    };
}

export default function PersonasPage() {
    const [personas, setPersonas] = useState<Persona[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newPersonaName, setNewPersonaName] = useState('');
    const [creating, setCreating] = useState(false);

    useEffect(() => {
        fetchPersonas();
    }, []);

    async function fetchPersonas() {
        try {
            const response = await fetch('/api/personas');
            if (response.ok) {
                const data = await response.json();
                setPersonas(data.personas);
            }
        } catch (error) {
            console.error('Error fetching personas:', error);
        } finally {
            setLoading(false);
        }
    }

    async function createPersona() {
        if (!newPersonaName.trim()) return;

        setCreating(true);
        try {
            const response = await fetch('/api/personas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newPersonaName })
            });

            if (response.ok) {
                setNewPersonaName('');
                setShowCreateForm(false);
                fetchPersonas();
            }
        } catch (error) {
            console.error('Error creating persona:', error);
        } finally {
            setCreating(false);
        }
    }

    async function deletePersona(id: string) {
        if (!confirm('Bu zihinsel kaydı silmek istediğinize emin misiniz? Tüm anılar kaybolacak.')) {
            return;
        }

        try {
            const response = await fetch(`/api/personas?id=${id}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                fetchPersonas();
            }
        } catch (error) {
            console.error('Error deleting persona:', error);
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Bilişsel Sohbet</h1>
                    <p className="text-slate-600 mt-1">
                        Korunan zihinsel temsilinizle konuşun
                    </p>
                </div>
                <Button onClick={() => setShowCreateForm(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Kayıt
                </Button>
            </div>

            {/* Create Form */}
            {showCreateForm && (
                <Card>
                    <CardContent className="p-6">
                        <div className="flex gap-4">
                            <Input
                                placeholder="Kayıt adı..."
                                value={newPersonaName}
                                onChange={(e) => setNewPersonaName(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && createPersona()}
                                className="flex-1"
                            />
                            <Button onClick={createPersona} loading={creating}>
                                Oluştur
                            </Button>
                            <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                                İptal
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Personas Grid */}
            {personas.length === 0 ? (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Henüz kayıt yok</h3>
                        <p className="text-slate-500 mb-6">
                            İlk bilişsel kaydınızı oluşturarak başlayın
                        </p>
                        <Button onClick={() => setShowCreateForm(true)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Kayıt Oluştur
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {personas.map((persona) => (
                        <Card key={persona.id} className="hover:shadow-lg transition-shadow group">
                            <CardHeader className="pb-2">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center">
                                            <span className="text-white font-bold">M</span>
                                        </div>
                                        <div>
                                            <CardTitle className="text-lg">{persona.name}</CardTitle>
                                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(persona.createdAt)}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deletePersona(persona.id)}
                                        className="p-2 text-slate-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {/* Stats */}
                                <div className="flex gap-4 text-sm text-slate-500 mb-4">
                                    <span>{persona._count.conversations} sohbet</span>
                                    <span>{persona._count.memoryEntries} anı</span>
                                </div>

                                {/* Cognitive Profile */}
                                <div className="space-y-2 mb-4">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-slate-500">Sezgisellik</span>
                                        <span className="font-medium">{Math.round(persona.system1Weight * 100)}%</span>
                                    </div>
                                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-slate-700 rounded-full transition-all"
                                            style={{ width: `${persona.system1Weight * 100}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Chat Button */}
                                <Link href="/dashboard" className="block">
                                    <Button variant="primary" size="sm" className="w-full">
                                        <MessageSquare className="h-4 w-4 mr-2" />
                                        Sohbet Başlat
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
