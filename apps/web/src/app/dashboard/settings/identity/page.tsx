'use client';

import { useEffect, useState } from 'react';
import { Button, Card, CardContent, CardHeader, CardTitle, Input } from '@/components/ui';
import { Save, Plus, X, Brain, Heart, Shield, Zap, MessageCircle, Sparkles, Moon, Quote, Volume2 } from 'lucide-react';
import { ARCHETYPES, ArchetypeType } from '@/lib/ai/personality-renderer';

interface IdentityCore {
    values: string[];
    moralBoundaries: string[];
    characterTraits: string[];
    signaturePhrases?: string[];
    voiceSettings?: {
        pitch: number;
        rate: number;
    };
    cognitiveStyle: {
        system1Tendency: number;
        riskTolerance: number;
        emotionalIntensity: number;
        uncertaintyTolerance: number;
    };
    personalityStyle: {
        formality: number;
        directness: number;
        warmth: number;
        humor: number;
        confidence: number;
    };
    version?: number;
}

export default function SettingsPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<'identity' | 'cognitive' | 'personality'>('identity');

    // Dream State
    const [dreaming, setDreaming] = useState(false);
    const [dreamResult, setDreamResult] = useState<{ analysis: string; proposedChanges?: IdentityCore; applied: boolean } | null>(null);

    const [identity, setIdentity] = useState<IdentityCore>({
        values: [],
        moralBoundaries: [],
        characterTraits: [],
        signaturePhrases: [],
        voiceSettings: { pitch: 1.0, rate: 1.0 },
        cognitiveStyle: {
            system1Tendency: 0.5,
            riskTolerance: 0.5,
            emotionalIntensity: 0.5,
            uncertaintyTolerance: 0.5
        },
        personalityStyle: {
            formality: 0.4,
            directness: 0.6,
            warmth: 0.6,
            humor: 0.3,
            confidence: 0.5
        }
    });

    const [newValue, setNewValue] = useState('');
    const [newBoundary, setNewBoundary] = useState('');
    const [newTrait, setNewTrait] = useState('');
    const [newPhrase, setNewPhrase] = useState('');

    useEffect(() => {
        fetchIdentity();
    }, []);

    async function fetchIdentity() {
        try {
            const response = await fetch('/api/identity');
            if (response.ok) {
                const data = await response.json();
                if (data.identity) {
                    setIdentity({
                        values: data.identity.values || [],
                        moralBoundaries: data.identity.moralBoundaries || [],
                        characterTraits: data.identity.characterTraits || [],
                        signaturePhrases: data.identity.signaturePhrases || [],
                        voiceSettings: data.identity.voiceSettings || { pitch: 1.0, rate: 1.0 },
                        cognitiveStyle: {
                            system1Tendency: data.identity.cognitiveStyle?.system1Tendency ?? 0.5,
                            riskTolerance: data.identity.cognitiveStyle?.riskTolerance ?? 0.5,
                            emotionalIntensity: data.identity.cognitiveStyle?.emotionalIntensity ?? 0.5,
                            uncertaintyTolerance: data.identity.cognitiveStyle?.uncertaintyTolerance ?? 0.5
                        },
                        personalityStyle: {
                            formality: data.identity.personalityStyle?.formality ?? 0.4,
                            directness: data.identity.personalityStyle?.directness ?? 0.6,
                            warmth: data.identity.personalityStyle?.warmth ?? 0.6,
                            humor: data.identity.personalityStyle?.humor ?? 0.3,
                            confidence: data.identity.personalityStyle?.confidence ?? 0.5
                        },
                        version: data.identity.version
                    });
                }
            }
        } catch (error) {
            console.error('Error fetching identity:', error);
        } finally {
            setLoading(false);
        }
    }

    // ... (saveIdentity, analyzeDream, applyDream unchanged)

    async function saveIdentity() {
        setSaving(true);
        try {
            const response = await fetch('/api/identity', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(identity)
            });
            if (response.ok) {
                const data = await response.json();
                setIdentity(prev => ({ ...prev, version: data.identity.version }));
            }
        } catch (error) {
            console.error('Error saving identity:', error);
        } finally {
            setSaving(false);
        }
    }

    async function analyzeDream() {
        setDreaming(true);
        setDreamResult(null);
        try {
            const response = await fetch('/api/dream', {
                method: 'POST',
                body: JSON.stringify({ action: 'analyze' })
            });
            const data = await response.json();
            if (data.success) {
                setDreamResult({
                    analysis: data.result.analysis,
                    proposedChanges: data.result.proposedChanges,
                    applied: false
                });
            }
        } catch (error) {
            console.error('Dream analysis failed:', error);
        } finally {
            setDreaming(false);
        }
    }

    async function applyDream() {
        if (!dreamResult || !dreamResult.proposedChanges) return;

        setSaving(true);
        try {
            const response = await fetch('/api/dream', {
                method: 'POST',
                body: JSON.stringify({
                    action: 'apply',
                    analysis: dreamResult.analysis,
                    changes: dreamResult.proposedChanges
                })
            });
            const data = await response.json();
            if (data.success) {
                setDreamResult(prev => prev ? { ...prev, applied: true } : null);
                await fetchIdentity(); // Refresh visual state
            }
        } catch (error) {
            console.error('Dream application failed:', error);
        } finally {
            setSaving(false);
        }
    }

    function addItem(list: 'values' | 'moralBoundaries' | 'characterTraits' | 'signaturePhrases', value: string) {
        if (!value.trim()) return;
        setIdentity(prev => ({
            ...prev,
            [list]: [...(prev[list] || []), value.trim()]
        }));
    }

    function removeItem(list: 'values' | 'moralBoundaries' | 'characterTraits' | 'signaturePhrases', index: number) {
        setIdentity(prev => ({
            ...prev,
            [list]: (prev[list] || []).filter((_, i) => i !== index)
        }));
    }

    function updateCognitiveStyle(key: keyof IdentityCore['cognitiveStyle'], value: number) {
        setIdentity(prev => ({
            ...prev,
            cognitiveStyle: { ...prev.cognitiveStyle, [key]: value }
        }));
    }

    function updatePersonalityStyle(key: keyof IdentityCore['personalityStyle'], value: number) {
        setIdentity(prev => ({
            ...prev,
            personalityStyle: {
                ...prev.personalityStyle,
                [key]: value
            }
        }));
    }

    function updateVoiceStyle(key: 'pitch' | 'rate', value: number) {
        setIdentity(prev => ({
            ...prev,
            voiceSettings: {
                ...(prev.voiceSettings || { pitch: 1, rate: 1 }),
                [key]: value
            }
        }));
    }

    function applyArchetype(type: ArchetypeType) {
        const arch = ARCHETYPES[type];
        if (!arch) return;

        setIdentity(prev => ({
            ...prev,
            personalityStyle: {
                ...prev.personalityStyle,
                ...(arch.formality !== undefined && { formality: arch.formality }),
                ...(arch.directness !== undefined && { directness: arch.directness }),
                ...(arch.warmth !== undefined && { warmth: arch.warmth }),
                ...(arch.humor !== undefined && { humor: arch.humor }),
                ...(arch.confidence !== undefined && { confidence: arch.confidence }),
            },
            // Also apply other traits if they exist in archetype later
        }));
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900" />
            </div>
        );
    }

    const tabs = [
        { id: 'identity', label: 'Kimlik', icon: Heart },
        { id: 'cognitive', label: 'Bilişsel', icon: Brain },
        { id: 'personality', label: 'Kişilik', icon: MessageCircle }
    ];

    return (
        <div className="space-y-6 max-w-4xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Kimlik Çekirdeği</h1>
                    <p className="text-slate-600 mt-1">
                        Zihinsel temsilini tanımlayan özellikler
                        {identity.version && <span className="text-sm text-slate-400 ml-2">(v{identity.version})</span>}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={analyzeDream}
                        disabled={dreaming}
                        className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                    >
                        {dreaming ? (
                            <div className="flex items-center gap-2">
                                <div className="animate-pulse h-2 w-2 bg-indigo-500 rounded-full" />
                                Rüyalar İnceleniyor...
                            </div>
                        ) : (
                            <>
                                <Moon className="h-4 w-4 mr-2" />
                                Rüya Gör (Neuroplasticity)
                            </>
                        )}
                    </Button>
                    <Button onClick={saveIdentity} loading={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        Kaydet
                    </Button>
                </div>
            </div>

            {/* Dream Result Alert */}
            {dreamResult && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-5 flex gap-4 text-sm text-indigo-900 shadow-sm">
                    <Sparkles className="h-5 w-5 text-indigo-500 shrink-0 mt-0.5" />
                    <div className="flex-1">
                        <h4 className="font-semibold mb-2">Nöroplastisite Analizi (Rüya Raporu)</h4>
                        <p className="text-indigo-700/80 mb-4 leading-relaxed bg-white/50 p-3 rounded-md border border-indigo-100/50">
                            {dreamResult.analysis}
                        </p>

                        {!dreamResult.applied && dreamResult.proposedChanges && Object.keys(dreamResult.proposedChanges).length > 0 && (
                            <div className="mb-4">
                                <h5 className="font-medium text-xs uppercase tracking-wider text-indigo-400 mb-2">Önerilen Değişimler</h5>
                                <div className="space-y-1">
                                    {Object.entries(dreamResult.proposedChanges).map(([key, val]) => (
                                        <div key={key} className="flex items-center gap-2 text-xs bg-white px-2 py-1 rounded border border-indigo-100 table shrink-0">
                                            <span className="font-mono text-indigo-400">{key}:</span>
                                            <span className="font-semibold text-indigo-600">
                                                {typeof val === 'object' ? JSON.stringify(val).substring(0, 30) + '...' : String(val)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                            {!dreamResult.applied && dreamResult.proposedChanges && Object.keys(dreamResult.proposedChanges).length > 0 ? (
                                <>
                                    <Button size="sm" onClick={applyDream} disabled={saving} className="bg-indigo-600 hover:bg-indigo-700 text-white border-none h-8">
                                        {saving ? 'Uygulanıyor...' : 'Değişimleri Onayla & Uygula'}
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setDreamResult(null)} className="text-indigo-500 hover:text-indigo-700 hover:bg-indigo-100 h-8">
                                        Reddet
                                    </Button>
                                </>
                            ) : (
                                dreamResult.applied ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                        ✓ Değişiklikler kimliğe işlendi (v{(identity.version || 0)})
                                    </span>
                                ) : (
                                    <span className="text-indigo-400 text-xs italic">Değişim önerilmedi.</span>
                                )
                            )}

                            {dreamResult.applied && (
                                <Button size="sm" variant="ghost" onClick={() => setDreamResult(null)} className="ml-auto text-indigo-400 hover:text-indigo-600 h-6 px-2">
                                    Kapat
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-200">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`flex items-center gap-2 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
                            ? 'border-slate-900 text-slate-900'
                            : 'border-transparent text-slate-500 hover:text-slate-700'
                            }`}
                    >
                        <tab.icon className="h-4 w-4" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Identity Tab */}
            {activeTab === 'identity' && (
                <div className="space-y-6">
                    {/* Values */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Heart className="h-5 w-5 text-rose-500" />
                                Temel Değerler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-500">Hayatına yön veren temel ilkeler</p>
                            <div className="flex flex-wrap gap-2">
                                {(identity.values || []).map((value, i) => (
                                    <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-full text-sm">
                                        {value}
                                        <button onClick={() => removeItem('values', i)} className="ml-1 hover:text-rose-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Yeni değer ekle..."
                                    value={newValue}
                                    onChange={(e) => setNewValue(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { addItem('values', newValue); setNewValue(''); } }}
                                />
                                <Button variant="outline" size="sm" onClick={() => { addItem('values', newValue); setNewValue(''); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Moral Boundaries */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Shield className="h-5 w-5 text-amber-500" />
                                Ahlaki Sınırlar
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-500">Asla aşılmayacak etik çizgiler</p>
                            <div className="flex flex-wrap gap-2">
                                {(identity.moralBoundaries || []).map((boundary, i) => (
                                    <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm">
                                        {boundary}
                                        <button onClick={() => removeItem('moralBoundaries', i)} className="ml-1 hover:text-amber-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Yeni sınır ekle..."
                                    value={newBoundary}
                                    onChange={(e) => setNewBoundary(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { addItem('moralBoundaries', newBoundary); setNewBoundary(''); } }}
                                />
                                <Button variant="outline" size="sm" onClick={() => { addItem('moralBoundaries', newBoundary); setNewBoundary(''); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Character Traits */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-5 w-5 text-indigo-500" />
                                Karakter Özellikleri
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-500">Kişiliği tanımlayan özellikler</p>
                            <div className="flex flex-wrap gap-2">
                                {(identity.characterTraits || []).map((trait, i) => (
                                    <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm">
                                        {trait}
                                        <button onClick={() => removeItem('characterTraits', i)} className="ml-1 hover:text-indigo-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Yeni özellik ekle..."
                                    value={newTrait}
                                    onChange={(e) => setNewTrait(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { addItem('characterTraits', newTrait); setNewTrait(''); } }}
                                />
                                <Button variant="outline" size="sm" onClick={() => { addItem('characterTraits', newTrait); setNewTrait(''); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Cognitive Tab */}
            {activeTab === 'cognitive' && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <Zap className="h-5 w-5 text-emerald-500" />
                            Bilişsel Profil
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <p className="text-sm text-slate-500">Düşünme ve karar alma karakteristiği</p>

                        <SliderItem
                            label="Sezgisellik"
                            value={identity.cognitiveStyle.system1Tendency}
                            onChange={(v) => updateCognitiveStyle('system1Tendency', v)}
                            leftLabel="Analitik"
                            rightLabel="Sezgisel"
                            color="emerald"
                        />

                        <SliderItem
                            label="Risk Toleransı"
                            value={identity.cognitiveStyle.riskTolerance}
                            onChange={(v) => updateCognitiveStyle('riskTolerance', v)}
                            leftLabel="Temkinli"
                            rightLabel="Maceracı"
                            color="amber"
                        />

                        <SliderItem
                            label="Duygusal Yoğunluk"
                            value={identity.cognitiveStyle.emotionalIntensity}
                            onChange={(v) => updateCognitiveStyle('emotionalIntensity', v)}
                            leftLabel="Stoik"
                            rightLabel="Duygusal"
                            color="rose"
                        />

                        <SliderItem
                            label="Belirsizlik Toleransı"
                            value={identity.cognitiveStyle.uncertaintyTolerance}
                            onChange={(v) => updateCognitiveStyle('uncertaintyTolerance', v)}
                            leftLabel="Netlik ister"
                            rightLabel="Belirsizliği kucaklar"
                            color="indigo"
                        />
                    </CardContent>
                </Card>
            )}


            {/* Personality Tab */}
            {activeTab === 'personality' && (
                <div className="space-y-6">
                    {/* Archetype Selector */}
                    <Card className="border-violet-100 bg-violet-50/30">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Sparkles className="h-5 w-5 text-violet-600" />
                                Kişilik Arketipi (Base Archetype)
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-slate-500 mb-4">
                                Temel bir kişilik şablonu seçerek karakteri hızlıca şekillendir.
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                {Object.keys(ARCHETYPES).map((arch) => (
                                    <button
                                        key={arch}
                                        onClick={() => applyArchetype(arch as ArchetypeType)}
                                        className="text-xs font-medium px-3 py-2 rounded-lg border border-violet-200 bg-white hover:bg-violet-100 hover:border-violet-300 transition-all text-left"
                                    >
                                        <div className="font-bold text-violet-700 mb-0.5">{arch}</div>
                                        <div className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
                                            {ARCHETYPES[arch as ArchetypeType].description}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <MessageCircle className="h-5 w-5 text-violet-500" />
                                Konuşma Tarzı
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-slate-500">Dil ve iletişim karakteristiği</p>

                            <SliderItem
                                label="Resmiyet"
                                value={identity.personalityStyle?.formality ?? 0.4}
                                onChange={(v) => updatePersonalityStyle('formality', v)}
                                leftLabel="Samimi"
                                rightLabel="Resmi"
                                color="slate"
                            />

                            <SliderItem
                                label="Doğrudanlık"
                                value={identity.personalityStyle?.directness ?? 0.6}
                                onChange={(v) => updatePersonalityStyle('directness', v)}
                                leftLabel="Dolaylı"
                                rightLabel="Direkt"
                                color="blue"
                            />

                            <SliderItem
                                label="Sıcaklık"
                                value={identity.personalityStyle?.warmth ?? 0.6}
                                onChange={(v) => updatePersonalityStyle('warmth', v)}
                                leftLabel="Mesafeli"
                                rightLabel="Sıcak"
                                color="orange"
                            />

                            <SliderItem
                                label="Mizah"
                                value={identity.personalityStyle?.humor ?? 0.3}
                                onChange={(v) => updatePersonalityStyle('humor', v)}
                                leftLabel="Ciddi"
                                rightLabel="Esprili"
                                color="pink"
                            />

                            <SliderItem
                                label="Güven"
                                value={identity.personalityStyle?.confidence ?? 0.5}
                                onChange={(v) => updatePersonalityStyle('confidence', v)}
                                leftLabel="Mütevazi"
                                rightLabel="Kendinden emin"
                                color="green"
                            />
                        </CardContent>
                    </Card>

                    {/* Voice Settings */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Volume2 className="h-5 w-5 text-sky-500" />
                                Ses Tonu (TTS)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <p className="text-sm text-slate-500">Sesli iletişim parametreleri</p>

                            <SliderItem
                                label="Perde (Pitch)"
                                value={(identity.voiceSettings?.pitch ?? 1.0) / 2} // Visualize 0-2 as 0-100%
                                onChange={(v) => updateVoiceStyle('pitch', v * 2)}
                                leftLabel="Kalın"
                                rightLabel="İnce"
                                color="sky"
                            />

                            <SliderItem
                                label="Hız (Rate)"
                                value={(identity.voiceSettings?.rate ?? 1.0) / 2} // Visualize 0-2 as 0-100%
                                onChange={(v) => updateVoiceStyle('rate', v * 2)}
                                leftLabel="Yavaş"
                                rightLabel="Hızlı"
                                color="cyan"
                            />
                        </CardContent>
                    </Card>

                    {/* Signature Phrases */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Quote className="h-5 w-5 text-fuchsia-500" />
                                İmza İfadeler
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-sm text-slate-500">Karakterin sık kullandığı kelime öbekleri</p>
                            <div className="flex flex-wrap gap-2">
                                {(identity.signaturePhrases || []).map((phrase, i) => (
                                    <div key={i} className="flex items-center gap-1 px-3 py-1.5 bg-fuchsia-50 text-fuchsia-700 rounded-full text-sm">
                                        {phrase}
                                        <button onClick={() => removeItem('signaturePhrases', i)} className="ml-1 hover:text-fuchsia-900">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="flex gap-2">
                                <Input
                                    placeholder="Yeni ifade ekle (örn: 'Açıkçası', 'Bence')..."
                                    value={newPhrase}
                                    onChange={(e) => setNewPhrase(e.target.value)}
                                    onKeyDown={(e) => { if (e.key === 'Enter') { addItem('signaturePhrases', newPhrase); setNewPhrase(''); } }}
                                />
                                <Button variant="outline" size="sm" onClick={() => { addItem('signaturePhrases', newPhrase); setNewPhrase(''); }}>
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}

interface SliderItemProps {
    label: string;
    value: number;
    onChange: (value: number) => void;
    leftLabel: string;
    rightLabel: string;
    color: string;
}

function SliderItem({ label, value, onChange, leftLabel, rightLabel, color }: SliderItemProps) {
    return (
        <div>
            <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-600">{label}</span>
                <span className="font-medium">{Math.round(value * 100)}%</span>
            </div>
            <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-3">
                <span className="text-xs text-slate-400 w-full md:w-24 text-left md:text-right">{leftLabel}</span>
                <input
                    type="range"
                    min="0"
                    max="100"
                    value={value * 100}
                    onChange={(e) => onChange(Number(e.target.value) / 100)}
                    className={`flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-${color}-500 w-full`}
                />
                <span className="text-xs text-slate-400 w-full md:w-24 text-right md:text-left">{rightLabel}</span>
            </div>
        </div>
    );
}
