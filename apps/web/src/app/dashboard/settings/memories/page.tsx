'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import {
    Brain,
    Clock,
    Eye,
    EyeOff,
    Search,
    Star,
    RefreshCw,
    Edit2,
    Plus,
    TrendingUp,
    Activity,
    Lightbulb,
    MessageSquare
} from 'lucide-react';

interface MemoryItem {
    id: string;
    content: string;
    type: string;
    importanceScore: number;
    accessCount: number;
    lastAccessed: string | null;
    metadata?: {
        emotion?: string;
        people?: string[];
        topic?: string;
    } | null;
    createdAt: string;
    state?: 'active' | 'faded' | 'suppressed';
}

export default function MemoriesPage() {
    const [memories, setMemories] = useState<MemoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'memories' | 'thoughts'>('memories');
    const [filter, setFilter] = useState<'all' | 'active' | 'suppressed'>('all');
    const [searchQuery, setSearchQuery] = useState('');

    // Editing state
    const [editingMemory, setEditingMemory] = useState<MemoryItem | null>(null);
    const [editContent, setEditContent] = useState('');
    const [editImportance, setEditImportance] = useState(0.5);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        fetchMemories();
    }, []);

    // New memory creation state
    const [showNewMemory, setShowNewMemory] = useState(false);
    const [newContent, setNewContent] = useState('');
    const [newType, setNewType] = useState<'EPISODIC' | 'IDENTITY' | 'WORKING'>('EPISODIC');
    const [newImportance, setNewImportance] = useState(0.5);
    const [creating, setCreating] = useState(false);

    async function fetchMemories() {
        try {
            const response = await fetch('/api/memories');
            if (response.ok) {
                const data = await response.json();
                const memoriesWithState = (data.memories || []).map((m: MemoryItem) => ({
                    ...m,
                    state: m.importanceScore < 0.3 ? 'suppressed' : m.importanceScore < 0.5 ? 'faded' : 'active'
                }));
                setMemories(memoriesWithState);
            }
        } catch (error) {
            console.error('Error fetching memories:', error);
        } finally {
            setLoading(false);
        }
    }

    async function suppressMemory(id: string) {
        try {
            await fetch(`/api/memories/${id}/suppress`, { method: 'POST' });
            // Optimistic update
            setMemories(prev => prev.map(m =>
                m.id === id ? { ...m, state: 'suppressed', importanceScore: 0.1 } : m
            ));
        } catch (error) {
            console.error('Error suppressing memory:', error);
        }
    }

    async function recallMemory(id: string) {
        try {
            await fetch(`/api/memories/${id}/recall`, { method: 'POST' });
            // Optimistic update
            setMemories(prev => prev.map(m =>
                m.id === id ? { ...m, state: 'active', importanceScore: 0.8 } : m
            ));
        } catch (error) {
            console.error('Error recalling memory:', error);
        }
    }

    function startEditing(memory: MemoryItem) {
        setEditingMemory(memory);
        setEditContent(memory.content);
        setEditImportance(memory.importanceScore);
    }

    async function saveEdit() {
        if (!editingMemory) return;
        setSaving(true);
        try {
            const response = await fetch('/api/memories', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: editingMemory.id,
                    content: editContent,
                    importance: editImportance
                })
            });

            if (response.ok) {
                const data = await response.json();
                setMemories(prev => prev.map(m =>
                    m.id === editingMemory.id ? {
                        ...m,
                        content: data.memory.content,
                        importanceScore: data.memory.importanceScore,
                        state: data.memory.importanceScore < 0.3 ? 'suppressed' : data.memory.importanceScore < 0.5 ? 'faded' : 'active'
                    } : m
                ));
                setEditingMemory(null);
            }
        } catch (error) {
            console.error('Error updating memory:', error);
        } finally {
            setSaving(false);
        }
    }

    async function createMemory() {
        if (!newContent.trim()) return;
        setCreating(true);
        try {
            const response = await fetch('/api/memories', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    content: newContent,
                    type: newType,
                    importance: newImportance
                })
            });

            if (response.ok) {
                const data = await response.json();
                const newMemory: MemoryItem = {
                    ...data.memory,
                    accessCount: 0,
                    lastAccessed: null,
                    createdAt: new Date().toISOString(),
                    state: data.memory.importanceScore < 0.3 ? 'suppressed' : data.memory.importanceScore < 0.5 ? 'faded' : 'active'
                };
                setMemories(prev => [newMemory, ...prev]);
                setShowNewMemory(false);
                setNewContent('');
                setNewImportance(0.5);
            }
        } catch (error) {
            console.error('Error creating memory:', error);
        } finally {
            setCreating(false);
        }
    }

    function formatDate(dateString: string) {
        return new Date(dateString).toLocaleDateString('tr-TR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    const filteredMemories = memories.filter(m => {
        // Separate by tab: memories vs AI thoughts
        const isThought = m.type === 'INTERNAL_MONOLOGUE';
        const matchesTab = activeTab === 'thoughts' ? isThought : !isThought;

        const matchesFilter = filter === 'all' || m.state === filter;
        const matchesSearch = !searchQuery ||
            m.content.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesTab && matchesFilter && matchesSearch;
    });

    // Count stats per tab
    const userMemories = memories.filter(m => m.type !== 'INTERNAL_MONOLOGUE');
    const aiThoughts = memories.filter(m => m.type === 'INTERNAL_MONOLOGUE');

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Hafıza Yönetimi</h1>
                    <p className="text-slate-600 mt-1">
                        Anılarınızı görüntüleyin, düzenleyin veya bastırın
                    </p>
                </div>
                <Button
                    onClick={() => setShowNewMemory(true)}
                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                    disabled={activeTab === 'thoughts'}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Yeni Anı
                </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-fit">
                <button
                    onClick={() => setActiveTab('memories')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'memories'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <MessageSquare className="h-4 w-4" />
                    Anılar
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'memories' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                        {userMemories.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('thoughts')}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'thoughts'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                        }`}
                >
                    <Lightbulb className="h-4 w-4" />
                    AI Düşünceleri
                    <span className={`px-2 py-0.5 rounded-full text-xs ${activeTab === 'thoughts' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                        }`}>
                        {aiThoughts.length}
                    </span>
                </button>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 items-center">
                <div className="flex gap-2">
                    {(['all', 'active', 'suppressed'] as const).map(f => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === f
                                ? 'bg-slate-900 text-white'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                        >
                            {f === 'all' ? 'Tümü' : f === 'active' ? 'Aktif' : 'Bastırılmış'}
                        </button>
                    ))}
                </div>

                <div className="flex-1 min-w-[200px]">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Anılarda ara..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={fetchMemories}>
                    <RefreshCw className="h-4 w-4" />
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                    <CardContent className="py-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-slate-900">
                                {activeTab === 'memories' ? userMemories.length : aiThoughts.length}
                            </p>
                            <p className="text-sm text-slate-500">
                                {activeTab === 'memories' ? 'Toplam Anı' : 'Toplam Düşünce'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-emerald-600">
                                {(activeTab === 'memories' ? userMemories : aiThoughts).filter(m => m.state === 'active').length}
                            </p>
                            <p className="text-sm text-slate-500">Aktif</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="py-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-amber-600">
                                {(activeTab === 'memories' ? userMemories : aiThoughts).filter(m => m.state === 'suppressed').length}
                            </p>
                            <p className="text-sm text-slate-500">Bastırılmış</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Memory List */}
            {filteredMemories.length === 0 ? (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Brain className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-slate-900 mb-2">Anı bulunamadı</h3>
                        <p className="text-slate-500">
                            {filter !== 'all' ? 'Bu filtreye uygun anı yok' : 'Henüz kayıtlı anınız yok'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredMemories.map((memory) => (
                        <Card
                            key={memory.id}
                            className={`transition-opacity ${memory.state === 'suppressed' ? 'opacity-60' : ''}`}
                        >
                            <CardContent className="py-4">
                                <div className="flex items-start gap-4">
                                    {/* State indicator */}
                                    <div className={`mt-1 p-2 rounded-lg ${memory.state === 'active' ? 'bg-emerald-100' :
                                        memory.state === 'faded' ? 'bg-amber-100' : 'bg-slate-100'
                                        }`}>
                                        {memory.state === 'suppressed' ? (
                                            <EyeOff className="h-4 w-4 text-slate-500" />
                                        ) : (
                                            <Brain className="h-4 w-4 text-emerald-600" />
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start gap-2">
                                            <p className={`text-slate-900 flex-1 ${memory.state === 'suppressed' ? 'line-through' : ''}`}>
                                                {memory.content}
                                            </p>
                                            {/* Frequently accessed badge */}
                                            {memory.accessCount > 5 && (
                                                <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium" title="Sık erişilen anı">
                                                    <TrendingUp className="h-3 w-3" />
                                                    {memory.accessCount}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-slate-500">
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(memory.createdAt)}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Star className="h-3 w-3" />
                                                Önem: {Math.round(memory.importanceScore * 100)}%
                                            </span>
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-xs">
                                                {memory.type}
                                            </span>
                                            {memory.accessCount > 0 && (
                                                <span className="flex items-center gap-1 text-xs text-slate-400" title="Erişim sayısı">
                                                    <Activity className="h-3 w-3" />
                                                    {memory.accessCount} erişim
                                                </span>
                                            )}
                                            {memory.lastAccessed && (
                                                <span className="text-xs text-slate-400">
                                                    Son: {formatDate(memory.lastAccessed)}
                                                </span>
                                            )}
                                            {memory.metadata?.emotion && (
                                                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-700 text-xs">
                                                    {memory.metadata.emotion}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => startEditing(memory)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>

                                        {memory.state === 'suppressed' ? (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => recallMemory(memory.id)}
                                            >
                                                <Eye className="h-4 w-4 mr-1" />
                                                Geri Çağır
                                            </Button>
                                        ) : (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => suppressMemory(memory.id)}
                                            >
                                                <EyeOff className="h-4 w-4 mr-1" />
                                                Bastır
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Modal */}
            {editingMemory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle>Anı Düzenle</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                    İçerik
                                </label>
                                <textarea
                                    value={editContent}
                                    onChange={(e) => setEditContent(e.target.value)}
                                    rows={5}
                                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1.5"
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                        Önem Skoru
                                    </label>
                                    <span className="text-sm font-medium">{Math.round(editImportance * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={editImportance}
                                    onChange={(e) => setEditImportance(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-900"
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    Düşük skorlar (&lt; 30%) anının bastırılmasına neden olabilir.
                                </p>
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setEditingMemory(null)}>İptal</Button>
                                <Button onClick={saveEdit} disabled={saving} className="bg-slate-900 text-white hover:bg-slate-800">
                                    {saving ? 'Kaydediliyor...' : 'Kaydet'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* New Memory Modal */}
            {showNewMemory && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
                    <Card className="w-full max-w-lg shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Plus className="h-5 w-5 text-indigo-600" />
                                Yeni Anı Ekle
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <label className="text-sm font-medium leading-none">
                                    İçerik
                                </label>
                                <textarea
                                    value={newContent}
                                    onChange={(e) => setNewContent(e.target.value)}
                                    rows={4}
                                    placeholder="Anı içeriğini yazın..."
                                    className="flex min-h-[80px] w-full rounded-md border border-slate-200 bg-transparent px-3 py-2 text-sm ring-offset-white placeholder:text-slate-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2 mt-1.5"
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium leading-none">
                                    Tür
                                </label>
                                <div className="flex gap-2 mt-2">
                                    {(['EPISODIC', 'IDENTITY', 'WORKING'] as const).map(type => (
                                        <button
                                            key={type}
                                            onClick={() => setNewType(type)}
                                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${newType === type
                                                ? 'bg-indigo-600 text-white'
                                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                                }`}
                                        >
                                            {type === 'EPISODIC' && 'Epizodik'}
                                            {type === 'IDENTITY' && 'Kimlik'}
                                            {type === 'WORKING' && 'Çalışma'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-1.5">
                                    <label className="text-sm font-medium leading-none">
                                        Önem Skoru
                                    </label>
                                    <span className="text-sm font-medium">{Math.round(newImportance * 100)}%</span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={newImportance}
                                    onChange={(e) => setNewImportance(parseFloat(e.target.value))}
                                    className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-2">
                                <Button variant="ghost" onClick={() => setShowNewMemory(false)}>İptal</Button>
                                <Button
                                    onClick={createMemory}
                                    disabled={creating || !newContent.trim()}
                                    className="bg-indigo-600 text-white hover:bg-indigo-700"
                                >
                                    {creating ? 'Oluşturuluyor...' : 'Oluştur'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
