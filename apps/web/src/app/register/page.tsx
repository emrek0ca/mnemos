'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui';
import { Brain, ArrowLeft, Shield } from 'lucide-react';
import {
    ConsentCheckboxes,
    getDefaultConsents,
    areRequiredConsentsGranted,
    type ConsentScope
} from '@/components/auth/consent-checkboxes';

export default function RegisterPage() {
    const router = useRouter();
    const [step, setStep] = useState<'info' | 'consent'>('info');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [consents, setConsents] = useState<Record<ConsentScope, boolean>>(getDefaultConsents());
    const [consentError, setConsentError] = useState('');

    const handleConsentChange = (scope: ConsentScope, checked: boolean) => {
        setConsents(prev => ({ ...prev, [scope]: checked }));
        setConsentError('');
    };

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Şifreler eşleşmiyor');
            return;
        }

        if (formData.password.length < 8) {
            setError('Şifre en az 8 karakter olmalıdır');
            return;
        }

        // Move to consent step
        setStep('consent');
    };

    const handleFinalSubmit = async () => {
        if (!areRequiredConsentsGranted(consents)) {
            setConsentError('Zorunlu onayları kabul etmeniz gerekmektedir.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    consents: Object.entries(consents)
                        .filter(([, granted]) => granted)
                        .map(([scope]) => scope)
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Kayıt başarısız');
            }

            router.push('/login?registered=true&setupPersonality=true');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Bir hata oluştu');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Back link */}
                <Link
                    href={step === 'consent' ? '#' : '/'}
                    onClick={(e) => {
                        if (step === 'consent') {
                            e.preventDefault();
                            setStep('info');
                        }
                    }}
                    className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 mb-8"
                >
                    <ArrowLeft className="h-4 w-4" />
                    {step === 'consent' ? 'Bilgilere Dön' : 'Ana Sayfa'}
                </Link>

                <Card className="shadow-xl">
                    <CardHeader className="text-center pb-2">
                        <div className="flex justify-center mb-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600">
                                {step === 'info' ? (
                                    <Brain className="h-7 w-7 text-white" />
                                ) : (
                                    <Shield className="h-7 w-7 text-white" />
                                )}
                            </div>
                        </div>
                        <CardTitle className="text-2xl">
                            {step === 'info' ? 'Profil Oluştur' : 'Onaylar'}
                        </CardTitle>
                        <CardDescription>
                            {step === 'info'
                                ? 'Dijital hafıza yolculuğuna başla'
                                : 'Verilerinizin nasıl kullanılacağını onaylayın'}
                        </CardDescription>

                        {/* Step indicator */}
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <div className={`h-2 w-8 rounded-full transition-colors ${step === 'info' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                            <div className={`h-2 w-8 rounded-full transition-colors ${step === 'consent' ? 'bg-indigo-600' : 'bg-slate-200'}`} />
                        </div>
                    </CardHeader>

                    <CardContent>
                        {error && (
                            <div className="p-3 rounded-lg bg-red-50 text-red-700 text-sm mb-4">
                                {error}
                            </div>
                        )}

                        {step === 'info' ? (
                            <form onSubmit={handleInfoSubmit} className="space-y-4">
                                <Input
                                    label="Ad Soyad"
                                    type="text"
                                    placeholder="Adınız"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                />

                                <Input
                                    label="E-posta"
                                    type="email"
                                    placeholder="ornek@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    required
                                />

                                <Input
                                    label="Şifre"
                                    type="password"
                                    placeholder="••••••••"
                                    helperText="En az 8 karakter"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    required
                                />

                                <Input
                                    label="Şifre Tekrar"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    required
                                />

                                <Button
                                    type="submit"
                                    className="w-full"
                                    size="lg"
                                >
                                    Devam Et
                                </Button>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <ConsentCheckboxes
                                    consents={consents}
                                    onChange={handleConsentChange}
                                    error={consentError}
                                />

                                <div className="flex gap-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setStep('info')}
                                        className="flex-1"
                                    >
                                        Geri
                                    </Button>
                                    <Button
                                        onClick={handleFinalSubmit}
                                        loading={loading}
                                        disabled={!areRequiredConsentsGranted(consents)}
                                        className="flex-1"
                                    >
                                        Hesap Oluştur
                                    </Button>
                                </div>
                            </div>
                        )}

                        <div className="mt-6 text-center">
                            <p className="text-sm text-slate-600">
                                Zaten hesabınız var mı?{' '}
                                <Link href="/login" className="font-medium text-indigo-600 hover:text-indigo-700">
                                    Giriş Yap
                                </Link>
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
