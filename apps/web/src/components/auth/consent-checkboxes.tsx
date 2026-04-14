'use client';

import { Checkbox } from '@/components/ui/checkbox';

// GDPR / AI Act uyumlu onay kapsamları
export const CONSENT_SCOPES = [
    {
        id: 'DATA_COLLECTION',
        label: 'Veri Toplama',
        description: 'Girdiğiniz bilgilerin toplanması ve işlenmesi',
        required: true,
    },
    {
        id: 'MEMORY_STORAGE',
        label: 'Hafıza Saklama',
        description: 'Konuşmalarınızın ve düşüncelerinizin saklanması',
        required: true,
    },
    {
        id: 'AI_PROCESSING',
        label: 'Yapay Zeka İşlemesi',
        description: 'Verilerinizin AI modelleri tarafından işlenmesi',
        required: true,
    },
    {
        id: 'ANALYTICS',
        label: 'Analitik',
        description: 'Anonim kullanım istatistikleri',
        required: false,
    },
] as const;

export type ConsentScope = typeof CONSENT_SCOPES[number]['id'];

interface ConsentCheckboxesProps {
    consents: Record<ConsentScope, boolean>;
    onChange: (scope: ConsentScope, checked: boolean) => void;
    error?: string;
}

export function ConsentCheckboxes({ consents, onChange, error }: ConsentCheckboxesProps) {
    const requiredScopes = CONSENT_SCOPES.filter(s => s.required);
    const allRequiredChecked = requiredScopes.every(s => consents[s.id]);

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-700">Onaylar</h3>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider">GDPR Uyumlu</span>
            </div>

            <div className="space-y-3 p-4 bg-slate-50 rounded-lg border border-slate-200">
                {CONSENT_SCOPES.map((scope) => (
                    <Checkbox
                        key={scope.id}
                        checked={consents[scope.id]}
                        onChange={(e) => onChange(scope.id, e.target.checked)}
                        label={
                            scope.required
                                ? `${scope.label} *`
                                : scope.label
                        }
                        description={scope.description}
                    />
                ))}
            </div>

            {error && (
                <p className="text-sm text-red-600">{error}</p>
            )}

            {!allRequiredChecked && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                    <span>⚠️</span>
                    Zorunlu onayları (*) kabul etmeniz gerekmektedir.
                </p>
            )}

            <p className="text-[10px] text-slate-400 leading-relaxed">
                Onaylarınızı istediğiniz zaman Ayarlar &gt; Gizlilik bölümünden güncelleyebilirsiniz.
                Detaylar için{' '}
                <a href="/privacy" className="text-indigo-600 hover:underline">Gizlilik Politikası</a>
                {' '}sayfamızı inceleyebilirsiniz.
            </p>
        </div>
    );
}

// Yardımcı fonksiyon: Tüm zorunlu onaylar verildi mi?
export function areRequiredConsentsGranted(consents: Record<ConsentScope, boolean>): boolean {
    return CONSENT_SCOPES
        .filter(s => s.required)
        .every(s => consents[s.id]);
}

// Varsayılan consent state
export function getDefaultConsents(): Record<ConsentScope, boolean> {
    return CONSENT_SCOPES.reduce((acc, scope) => {
        acc[scope.id] = false;
        return acc;
    }, {} as Record<ConsentScope, boolean>);
}
