'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, Key, AlertTriangle, Loader2 } from 'lucide-react';

export default function AdminLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [secretKey, setSecretKey] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/admin/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, secretKey }),
            });

            const data = await res.json();

            if (!data.success) {
                setError(data.error || 'Giriş başarısız');
                return;
            }

            // Redirect to admin dashboard
            router.push('/admin');
            router.refresh();
        } catch (err) {
            setError('Bağlantı hatası');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 mb-4">
                        <Shield className="w-8 h-8 text-red-400" />
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Admin Paneli</h1>
                    <p className="text-slate-400 text-sm">
                        Güvenli giriş gerekli
                    </p>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
                        {/* Error Alert */}
                        {error && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                <span>{error}</span>
                            </div>
                        )}

                        {/* Email */}
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                E-posta
                            </label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                                placeholder="admin@example.com"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 flex items-center gap-2">
                                <Lock className="w-4 h-4" />
                                Şifre
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                                placeholder="••••••••••••"
                            />
                        </div>

                        {/* Secret Key */}
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400 flex items-center gap-2">
                                <Key className="w-4 h-4" />
                                Admin Gizli Anahtarı
                            </label>
                            <input
                                type="password"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-lg text-white placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 transition-colors"
                                placeholder="••••••••••••••••"
                            />
                            <p className="text-xs text-slate-500">
                                Sistem yöneticisinden alınan özel anahtar
                            </p>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 rounded-lg bg-gradient-to-r from-red-600 to-orange-600 text-white font-medium hover:from-red-500 hover:to-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Doğrulanıyor...
                                </>
                            ) : (
                                <>
                                    <Shield className="w-4 h-4" />
                                    Güvenli Giriş
                                </>
                            )}
                        </button>
                    </div>
                </form>

                {/* Security Notice */}
                <div className="mt-6 p-4 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="text-xs text-amber-400/80">
                            <p className="font-medium text-amber-400 mb-1">Güvenlik Uyarısı</p>
                            <ul className="space-y-1 list-disc list-inside">
                                <li>Tüm giriş denemeleri loglanmaktadır</li>
                                <li>5 başarısız denemeden sonra 15 dk bekleme</li>
                                <li>Sadece yetkili IP adreslerinden erişim</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
