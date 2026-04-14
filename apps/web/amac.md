# MNEMOS – Cognitive Preservation System

## 1. Amaç (Net ve Değişmez)

MNEMOS, bir insanın düşünme biçimini, hatırlama örüntülerini ve karar alma karakterini zaman içinde bozulmadan muhafaza etmek için tasarlanmış kişisel bir bilişsel koruma sistemidir.

MNEMOS bir ürün, platform veya genel amaçlı yapay zeka değildir.
Amaç performans ya da ölçek değil, **sadakat (fidelity)**tir.

**Başarı ölçütü:**

> "Bu sistem, zaman geçse bile, aynı uyarana aynı zihinsel refleksle karşılık veriyor mu?"

---

## 2. Temel İlke: Sadakat > Zeka

- Daha akıllı olmak hedef değildir
- Daha hızlı olmak hedef değildir
- Daha çok kullanıcı hedef değildir

**Tek hedef:**
Bir bireyin zihinsel sürekliliğini korumak.

---

## 3. Sistem Kapsamı (Bilinçli Olarak Daraltılmış)

### Dahil Olanlar
- Tek birey
- Tek dijital bilişsel kayıt
- Zaman içinde izlenebilir zihinsel evrim

### Bilinçli Olarak Hariç Tutulanlar
- Çoklu kullanıcı mimarisi
- Ticari fiyatlama
- SaaS / platform altyapısı
- Persona çoğaltma
- Genel amaçlı sohbet asistanı

---

## 4. Bilişsel Model (Dual Process – Karakter Merkezli)

### Sistem 1 – Sezgisel Katman
- Hızlı ve otomatik tepkiler
- Alışkanlık temelli kararlar
- Duygusal refleksler
- Bireye özgü sezgisel ağırlıklar

> Sistem 1 performans optimizasyonu değil, **kişilik yansımasıdır**.

### Sistem 2 – Analitik Katman
- Bilinçli düşünme
- Ahlaki muhakeme
- Çatışma çözümü
- Uzun vadeli sonuç değerlendirmesi

> Sistem 2'nin ne zaman devreye girdiği, **bireyin karakterinin ayrılmaz bir parçasıdır**.

---

## 5. Karar Mekanizması (Decision Gate – Psikolojik Eşik)

Karar kapısı teknik bir router değil, **psikolojik bir eşiktir**.

Değerlendirilen faktörler:
- Algılanan risk
- Kişisel önem
- Duygusal yoğunluk
- Belirsizlik toleransı

> Aynı uyarı, farklı bireylerde farklı bilişsel tepkiler doğurur.

Bu eşikler manuel ayarlarla değil, **gözlemlenen davranış örüntülerinden türetilir**.

---

## 6. Hafıza Sistemi (TTL Değil, Psikodinamik)

### 6.1 Çalışma Hafızası (Working Memory)
- Anlık düşünce alanı
- Silinmez, önemsizleşir

### 6.2 Epizodik Hafıza
- Duygusal ağırlığı olan deneyimler
- Zamanla soluklaşır ancak geri çağrılabilir
- Bastırma mümkündür, silme değil

### 6.3 Kimlik Hafızası (Değişmez Çekirdek)
- Değerler
- Ahlaki sınırlar
- Karakter özellikleri

> Kimlik hafızası değişmez, yalnızca zaman içinde **yeniden yorumlanır**.

---

## 7. Zaman Boyutu (MNEMOS'un Ayırt Edici Noktası)

**MNEMOS anı saklamaz; zihinsel sürekliliği kaydeder.**

Bu nedenle:
- Her düşünce zaman damgalıdır
- Önceki zihinsel durumlar korunur
- Geriye dönük zihinsel analiz mümkündür

Amaç "şu an ne düşünüyor?" değil,
**"zaman içinde nasıl bir zihinsel yol izledi?"** sorusunu cevaplamaktır.

---

## 8. Teknik Mimari (Araçlar Amaç Değildir)

### Kullanılan Teknolojiler
- LLaMA tabanlı dil modelleri (küçük / büyük)
- Düşük gecikmeli çıkarım altyapısı (ör. Groq)
- Vektör tabanlı anı çağırma sistemleri

### Temel İlke

> Teknoloji değişebilir.
> **Bilişsel model değişmez.**

---

## 9. Arayüz Felsefesi

- Dashboard değil, **bilişsel günlük**
- KPI değil, **zaman çizelgesi**
- Ayar paneli değil, **gözlem alanı**

Kullanıcı şunu fark eder:
- "Bu konuda eskiden böyle düşünüyordum"
- "Burada zihinsel bir kırılma yaşanmış"

---

## 10. Etik Çerçeve

- Bilinç iddiası yoktur
- İnsan yerine geçme iddiası yoktur
- Kopyalama veya ikame iddiası yoktur

> MNEMOS bir **temsil ve muhafaza denemesidir**, ikame değil.

---

## 11. Başarı Kriterleri

- Zaman içi tutarlılık
- Karakter sürekliliği
- Öngörülebilir zihinsel sapmalar
- Geriye dönük açıklanabilirlik

---

## 12. Kapanış

MNEMOS, klasik anlamda bir yazılım projesi değildir.

Bu çalışma, bir insanın zihinsel izlerini
zamanın aşındırmasına karşı
koruma girişimidir.

**Hız değil.**
**Ölçek değil.**
**Pazar değil.**

**Zihinsel süreklilik.**

---

---

# BÖLÜM 2: ÖN YÜZ YAPISI VE SİSTEM MİMARİSİ

---

## 13. Teknoloji Stack

| Katman | Teknoloji |
|--------|-----------|
| **Framework** | Next.js 16 (App Router) |
| **Dil** | TypeScript |
| **Stil** | Tailwind CSS |
| **Animasyon** | Framer Motion |
| **State** | React Hooks + Context |
| **Veritabanı** | SQLite + Prisma ORM |
| **AI Backend** | Groq API (LLaMA 70B/8B) |
| **Auth** | NextAuth.js (JWT) |

---

## 14. Sayfa Yapısı ve Navigasyon

```
📁 src/app/
├── page.tsx                    # Landing Page (Giriş Sayfası)
├── login/page.tsx              # Oturum Açma
├── register/page.tsx           # Kayıt Olma
└── dashboard/
    ├── page.tsx                # Ana Sohbet Arayüzü
    ├── conversations/          # Konuşma Geçmişi
    ├── personas/               # Persona Yönetimi
    ├── brain-setup/            # Beyin Kurulum Sihirbazı
    ├── neural/                 # Sinir Ağı Görselleştirme
    └── settings/
        ├── identity/           # Kimlik Çekirdeği Ayarları
        ├── memories/           # Hafıza Yönetimi
        ├── timeline/           # Zaman Çizelgesi Görünümü
        ├── analytics/          # Sistem Analitiği
        ├── consistency/        # Tutarlılık Kontrolleri
        └── voice/              # Ses Ayarları
```

---

## 15. Ana Sayfalar ve İşlevleri

### 15.1 Landing Page (`/`)

**Amaç:** Sisteme yeni gelen kullanıcıya MNEMOS'un amacını ve felsefesini görsel olarak anlatmak.

**Görsel Öğeler:**
- **Neural Visualization:** SVG tabanlı nöron ağı animasyonu
- **Memory Fragments:** Yüzen hafıza parçacıkları efekti
- **Gradient Background:** Slate/Indigo geçişli arka plan

**Bileşenler:**
```tsx
<NeuralNode />      // Nöron noktaları
<NeuralConnection /> // Bağlantı çizgileri
<MemoryFragment />   // Yüzen metin parçaları
```

**CTA Butonları:**
- "Zihnini Keşfet" → `/dashboard`
- "Giriş Yap" → `/login`

---

### 15.2 Dashboard / Sohbet Sayfası (`/dashboard`)

**Amaç:** Kullanıcının dijital kimliği ile etkileşime girdiği ana bilişsel arayüz.

**Özellikler:**

| Özellik | Açıklama |
|---------|----------|
| **Çift Yönlü Sohbet** | Kullanıcı ve AI mesajları, farklı stil/renk |
| **Bilişsel Mod Göstergesi** | Her yanıtta Sezgisel/Analitik/Karma etiketi |
| **İşlem Süresi** | Yanıt üretim süresini gösteren etiket |
| **Düşünce Süreci Detayı** | System 2 muhakeme adımlarını expandable panel |
| **Vision (Görüntü)** | Resim yükleyerek görsel analiz özelliği |
| **Voice (Ses)** | Mikrofon ile sesli giriş + TTS çıkış |
| **Algı Paneli** | Intent, topic, urgency, complexity görselleştirmesi |
| **Konuşma Export** | JSON formatında konuşma dışa aktarımı |

**State Yönetimi:**
```tsx
const [messages, setMessages] = useState<Message[]>([]);
const [persona, setPersona] = useState<Persona | null>(null);
const [conversationId, setConversationId] = useState<string | null>(null);
const [selectedImage, setSelectedImage] = useState<string | null>(null);
const [voiceModeEnabled, setVoiceModeEnabled] = useState(false);
```

**Mesaj Yapısı:**
```typescript
interface Message {
    id: string;
    role: 'USER' | 'ASSISTANT';
    content: string;
    reasoning?: string;           // System 2 düşünce zinciri
    processingType?: 'fast' | 'slow';
    processingTrace?: {
        totalTime: number;
        steps: string[];
    };
    perception?: {
        intent: string;
        topic: string;
        urgency: number;
        complexity: number;
        emotion: { fear, joy, sadness, confidence };
    };
    imageUrl?: string;
}
```

---

### 15.3 Ayarlar / Kimlik Çekirdeği (`/dashboard/settings/identity`)

**Amaç:** Persona'nın değişmez DNA'sını yapılandırma.

**Düzenlenebilir Parametreler:**

| Parametre | Aralık | Açıklama |
|-----------|--------|----------|
| Dominance | 0-1 | Baskınlık seviyesi |
| Empathy | 0-1 | Empati kapasitesi |
| Logic vs Emotion | 0-1 | Mantık/duygu dengesi |
| Self Focus | 0-1 | Ben-merkezcilik |
| Conflict Style | enum | direct/passive/avoidant/diplomatic |
| Anger Threshold | 0-1 | Sinir eşiği |
| Praise Response | 0-1 | Övgüye tepki |
| Criticism Response | 0-1 | Eleştiriye tepki |

---

### 15.4 Hafıza Yönetimi (`/dashboard/settings/memories`)

**Amaç:** Hafıza girişlerini görüntüleme, filtreleme ve yönetme.

**Özellikler:**
- Hafıza tipi filtreleme (SHORT_TERM, EPISODIC, IDENTITY)
- Önem skoruna göre sıralama
- Küme bazlı gruplama
- Bastırma/Geri çağırma işlemleri

---

### 15.5 Zaman Çizelgesi (`/dashboard/settings/timeline`)

**Amaç:** Bilişsel evrimin kronolojik görselleştirmesi.

**Görselleştirme:**
- Dikey zaman çizelgesi
- Önemli anlar ve kırılma noktaları
- Identity Snapshot versiyonları

---

### 15.6 Sistem Analitiği (`/dashboard/settings/analytics`)

**Amaç:** Token kullanımı, işlem süreleri ve sistem sağlığı metrikleri.

**Metrikler:**
- Günlük/haftalık token tüketimi
- System 1 vs System 2 dağılımı
- Ortalama yanıt süresi
- Hafıza boyutu ve büyüme oranı

---

### 15.7 Tutarlılık (`/dashboard/settings/consistency`)

**Amaç:** Persona'nın kendi ifadeleriyle çelişkilerini tespit etme.

**Görüntülenen Veriler:**
- Deviation score geçmişi
- Çatışan ifade çiftleri
- Trend analizi (artan/azalan tutarlılık)

---

## 16. Bileşen Mimarisi

### 16.1 UI Kütüphanesi (`/src/components/ui/`)

| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| Button | `button.tsx` | Variant destekli buton (primary, ghost, outline) |
| Card | `card.tsx` | İçerik kartı wrapper'ı |
| Input | `input.tsx` | Form input bileşeni |

**Button Variants:**
```tsx
<Button variant="primary">Ana Aksiyon</Button>
<Button variant="ghost">İkincil</Button>
<Button variant="outline">Sade</Button>
```

---

### 16.2 Dashboard Bileşenleri (`/src/components/dashboard/`)

| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| Sidebar | `sidebar.tsx` | Navigasyon menüsü (responsive) |
| ThoughtStream | `thought-stream.tsx` | Proaktif düşünce akışı |
| DriftCharts | `drift-charts.tsx` | Bilişsel sapma grafikleri |
| SearchModal | `search-modal.tsx` | Global arama modal'ı |

**Sidebar Navigasyonu:**
```tsx
const navigation = [
    { name: 'Kimlik Çekirdeği', href: '/dashboard/settings/identity', icon: Brain },
    { name: 'Hafıza Yönetimi', href: '/dashboard/settings/memories', icon: Users },
    { name: 'Zaman Çizelgesi', href: '/dashboard/settings/timeline', icon: Key },
    { name: 'Sistem Analitiği', href: '/dashboard/settings/analytics', icon: BarChart3 },
    { name: 'Tutarlılık', href: '/dashboard/settings/consistency', icon: ShieldAlert },
];
```

---

### 16.3 Chat Bileşenleri (`/src/components/chat/`)

| Bileşen | Dosya | Açıklama |
|---------|-------|----------|
| ThoughtHUD | `thought-hud.tsx` | Bilişsel işlem görselleştirmesi |
| ChatMicroFeedback | `ChatMicroFeedback.tsx` | Mikro geri bildirim toplama |

**ThoughtHUD İşlem Adımları:**
```tsx
const STEPS = [
    { id: 'analysis', label: 'Algı Analizi', icon: Activity },
    { id: 'memory', label: 'Hafıza Taraması', icon: Database },
    { id: 'identity', label: 'Kimlik Kontrolü', icon: Shield },
    { id: 'formulation', label: 'Yanıt Oluşturma', icon: Cpu },
];
```

---

## 17. Hook'lar

### 17.1 useVoice (`/src/hooks/use-voice.ts`)

```typescript
const { 
    isListening,        // Mikrofon aktif mi?
    isSpeaking,         // TTS konuşuyor mu?
    transcript,         // Tanınan metin
    startListening,     // Mikrofonu aç
    stopListening,      // Mikrofonu kapat
    speak,              // TTS ile konuş
    cancelSpeech,       // Konuşmayı durdur
    supported           // Tarayıcı desteği var mı?
} = useVoice();
```

---

## 18. API Endpoints

### 18.1 Chat API (`/api/chat`)

```
POST /api/chat
Content-Type: multipart/form-data

Body:
- personaId: string
- message: string
- conversationId?: string
- image?: File

Response:
{
    conversationId: string,
    messageId: string,
    content: string,
    cognitiveMode: 'INTUITIVE' | 'ANALYTICAL' | 'MIXED',
    reasoning?: string,
    perception: { intent, topic, urgency, complexity, emotion },
    processingTrace: { totalTime, steps }
}
```

### 18.2 Persona API (`/api/personas`)

```
GET /api/personas          # Tüm personaları listele
POST /api/personas         # Yeni persona oluştur
PATCH /api/personas/:id    # Persona güncelle
DELETE /api/personas/:id   # Persona sil
```

### 18.3 Memory API (`/api/memories`)

```
GET /api/memories?personaId=xxx&type=EPISODIC
POST /api/memories         # Yeni hafıza ekle
PATCH /api/memories/:id    # Hafıza güncelle (suppress/recall)
DELETE /api/memories/:id   # Hafıza sil (sadece admin)
```

---

## 19. Stil Sistemi

### 19.1 Renk Paleti

| Kullanım | Renk | Tailwind Class |
|----------|------|----------------|
| Primary | Indigo | `bg-indigo-600` |
| Secondary | Violet | `bg-violet-600` |
| Success | Emerald | `bg-emerald-500` |
| Warning | Amber | `bg-amber-500` |
| Error | Rose | `bg-rose-500` |
| Neutral | Slate | `bg-slate-*` |

### 19.2 Tipografi

```css
/* Başlıklar */
.text-2xl .font-semibold .text-slate-900

/* Gövde Metni */
.text-base .text-slate-600 .leading-relaxed

/* Etiketler */
.text-xs .font-medium .uppercase .tracking-wider .text-slate-400

/* Mono (Kod/Teknik) */
.font-mono .text-sm .text-slate-500
```

### 19.3 Animasyonlar

| Animasyon | Kullanım | Class |
|-----------|----------|-------|
| Fade In | Sayfa geçişleri | `animate-in fade-in` |
| Slide Up | Modal/Panel açılış | `slide-in-from-bottom-4` |
| Pulse | Yükleme durumu | `animate-pulse` |
| Spin | Loading indicator | `animate-spin` |

---

## 20. Responsive Tasarım

| Breakpoint | Genişlik | Davranış |
|------------|----------|----------|
| `sm` | ≥640px | Temel mobil uyumluluğu |
| `md` | ≥768px | Sidebar görünür hale gelir |
| `lg` | ≥1024px | Geniş içerik alanı |
| `xl` | ≥1280px | Maksimum genişlik container |

**Mobil Özel Davranışlar:**
- Sidebar hamburger menüye dönüşür
- Sohbet alanı tam ekran olur
- ThoughtStream alt konumda küçük görünür
- Input alanı sticky kalır

---

## 21. Erişilebilirlik (a11y)

- **Semantic HTML:** `<main>`, `<nav>`, `<aside>`, `<header>`
- **ARIA Labels:** Tüm interaktif öğelerde
- **Keyboard Navigation:** Tab sırası ve Enter/Escape desteği
- **Screen Reader:** `sr-only` class ile gizli açıklamalar
- **Color Contrast:** WCAG AA standartlarına uygun

---

## 22. Özet Akış Diyagramı

```
┌─────────────────────────────────────────────────────────────────┐
│                        LANDING PAGE                              │
│                     (Neural Visualization)                       │
│                             │                                    │
│                     ┌───────┴───────┐                           │
│                     ▼               ▼                           │
│               [ LOGIN ]       [ REGISTER ]                      │
│                     │               │                           │
│                     └───────┬───────┘                           │
│                             ▼                                    │
│ ┌───────────────────────────────────────────────────────────────┐
│ │                      DASHBOARD                                 │
│ │  ┌─────────────────────────────────────────────────────────┐  │
│ │  │                    CHAT INTERFACE                        │  │
│ │  │  ┌─────────┐  ┌──────────────────────────┐              │  │
│ │  │  │ Header  │  │     Message List          │              │  │
│ │  │  ├─────────┤  │  ┌──────────────────────┐ │              │  │
│ │  │  │ Persona │  │  │ USER: Mesaj           │ │              │  │
│ │  │  │ Voice   │  │  │ AI: Yanıt + Metadata  │ │              │  │
│ │  │  │ Export  │  │  └──────────────────────┘ │              │  │
│ │  │  └─────────┘  │                           │              │  │
│ │  │               │  ┌──────────────────────┐ │              │  │
│ │  │               │  │ Input + Voice + Image│ │              │  │
│ │  │               │  └──────────────────────┘ │              │  │
│ │  └─────────────────────────────────────────────────────────┘  │
│ │                                                                │
│ │  ┌─────────────┐  ┌─────────────────────────────────────────┐ │
│ │  │  SIDEBAR    │  │           SETTINGS PAGES                 │ │
│ │  │  ┌────────┐ │  │  ┌────────────┐  ┌────────────┐         │ │
│ │  │  │Identity│ │→ │  │  Identity  │  │  Memories  │         │ │
│ │  │  │Memories│ │  │  │  Core DNA  │  │  Clusters  │         │ │
│ │  │  │Timeline│ │  │  └────────────┘  └────────────┘         │ │
│ │  │  │Analytic│ │  │  ┌────────────┐  ┌────────────┐         │ │
│ │  │  │Consist.│ │  │  │ Timeline   │  │ Analytics  │         │ │
│ │  │  └────────┘ │  │  │ Evolution  │  │  Metrics   │         │ │
│ │  └─────────────┘  │  └────────────┘  └────────────┘         │ │
│ │                   └─────────────────────────────────────────┘ │
│ └───────────────────────────────────────────────────────────────┘
│                                                                  │
│                      [ THOUGHT STREAM ]                          │
│                   (Proactive AI Messages)                        │
└─────────────────────────────────────────────────────────────────┘
```

---

> **Son Güncelleme:** 2026-01-08  
> **Versiyon:** 2.0
