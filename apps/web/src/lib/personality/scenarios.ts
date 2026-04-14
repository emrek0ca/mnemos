// Kişilik Değerlendirme Senaryoları
// Her senaryo, birden fazla kişilik parametresini etkiler

export interface PersonalityImpact {
    // Big Five (OCEAN)
    openness?: number;
    conscientiousness?: number;
    extraversion?: number;
    agreeableness?: number;
    neuroticism?: number;
    // Cognitive Style
    decisionSpeed?: number;
    abstractThinking?: number;
    pastVsFuture?: number;
    detailOrientation?: number;
    // Personality Axes
    dominance?: number;
    empathy?: number;
    logicVsEmotion?: number;
    // Reaction Profile
    angerThreshold?: number;
    criticismResponse?: number;
    stressResponse?: number;
}

export interface ScenarioOption {
    id: string;
    label: string;
    description: string;
    impact: PersonalityImpact;
}

export interface PersonalityScenario {
    id: string;
    category: 'cognitive' | 'social' | 'emotional' | 'decision' | 'communication';
    iconName: 'brain' | 'users' | 'heart' | 'scale' | 'message-circle' | 'book-open' | 'zap' | 'shield' | 'clock' | 'mic';
    title: string;
    scenario: string;
    options: ScenarioOption[];
}

export const PERSONALITY_SCENARIOS: PersonalityScenario[] = [
    // ========== BİLİŞSEL SENARYOLAR ==========
    {
        id: 'problem_solving',
        category: 'cognitive',
        iconName: 'brain',
        title: 'Problem Çözme',
        scenario: 'Karmaşık bir problemle karşılaştığında genellikle nasıl yaklaşırsın?',
        options: [
            {
                id: 'intuitive',
                label: 'Sezgisel',
                description: 'İlk içgüdüme güvenir, hızlı hareket ederim',
                impact: { decisionSpeed: 0.8, abstractThinking: 0.6, conscientiousness: 0.3 }
            },
            {
                id: 'analytical',
                label: 'Analitik',
                description: 'Sistematik analiz yapar, tüm seçenekleri değerlendiririm',
                impact: { decisionSpeed: 0.3, detailOrientation: 0.8, conscientiousness: 0.8 }
            },
            {
                id: 'creative',
                label: 'Yaratıcı',
                description: 'Alışılmadık çözümler arar, kalıpların dışına çıkarım',
                impact: { openness: 0.9, abstractThinking: 0.8, conscientiousness: 0.4 }
            },
            {
                id: 'collaborative',
                label: 'İşbirlikçi',
                description: 'Başkalarından fikir alır, birlikte çözeriz',
                impact: { extraversion: 0.7, agreeableness: 0.8, dominance: 0.3 }
            }
        ]
    },
    {
        id: 'learning_style',
        category: 'cognitive',
        iconName: 'book-open',
        title: 'Öğrenme Tarzı',
        scenario: 'Yeni bir konu öğrenirken tercih ettiğin yöntem:',
        options: [
            {
                id: 'theory_first',
                label: 'Önce Teori',
                description: 'Kavramları anla, sonra uygula',
                impact: { abstractThinking: 0.8, conscientiousness: 0.7, openness: 0.6 }
            },
            {
                id: 'hands_on',
                label: 'Uygulayarak',
                description: 'Deneyerek ve hata yaparak öğren',
                impact: { abstractThinking: 0.3, decisionSpeed: 0.7, openness: 0.7 }
            },
            {
                id: 'observing',
                label: 'Gözlemleyerek',
                description: 'Başkalarını izle, sonra kendim dene',
                impact: { extraversion: 0.3, conscientiousness: 0.6, neuroticism: 0.4 }
            },
            {
                id: 'discussing',
                label: 'Tartışarak',
                description: 'Konuşarak ve sorgulayarak öğren',
                impact: { extraversion: 0.8, agreeableness: 0.5, openness: 0.7 }
            }
        ]
    },

    // ========== SOSYAL SENARYOLAR ==========
    {
        id: 'social_gathering',
        category: 'social',
        iconName: 'users',
        title: 'Sosyal Ortam',
        scenario: 'Tanımadığın insanların olduğu bir toplantıya girdiğinde:',
        options: [
            {
                id: 'approach',
                label: 'Hemen Yaklaşırım',
                description: 'Kendimi tanıtır, sohbet başlatırım',
                impact: { extraversion: 0.9, dominance: 0.7, neuroticism: 0.2 }
            },
            {
                id: 'observe_first',
                label: 'Önce Gözlemlerim',
                description: 'Ortamı tanı, sonra doğru kişiye yaklaş',
                impact: { extraversion: 0.4, conscientiousness: 0.6, neuroticism: 0.4 }
            },
            {
                id: 'wait_approach',
                label: 'Yaklaşılmasını Beklerim',
                description: 'Birisi gelir, sohbet başlar',
                impact: { extraversion: 0.2, agreeableness: 0.7, dominance: 0.2 }
            },
            {
                id: 'avoid',
                label: 'Mümkünse Kaçınırım',
                description: 'Böyle ortamlar beni yoruyor',
                impact: { extraversion: 0.1, neuroticism: 0.6, stressResponse: 0.3 }
            }
        ]
    },
    {
        id: 'conflict_resolution',
        category: 'social',
        iconName: 'shield',
        title: 'Çatışma Yönetimi',
        scenario: 'Birisiyle fikir ayrılığına düştüğünde:',
        options: [
            {
                id: 'direct_confront',
                label: 'Direkt Yüzleşirim',
                description: 'Açık ve net şekilde görüşümü savunurum',
                impact: { dominance: 0.9, angerThreshold: 0.4, agreeableness: 0.3 }
            },
            {
                id: 'diplomatic',
                label: 'Diplomatik Olurum',
                description: 'Ortak nokta bulmaya çalışırım',
                impact: { agreeableness: 0.8, empathy: 0.7, dominance: 0.4 }
            },
            {
                id: 'yield',
                label: 'Geri Adım Atarım',
                description: 'İlişki daha önemli, pes ederim',
                impact: { agreeableness: 0.9, dominance: 0.1, neuroticism: 0.5 }
            },
            {
                id: 'avoid_conflict',
                label: 'Konuyu Değiştiririm',
                description: 'Çatışmadan uzak durmayı tercih ederim',
                impact: { agreeableness: 0.6, neuroticism: 0.6, stressResponse: 0.2 }
            }
        ]
    },

    // ========== DUYGUSAL SENARYOLAR ==========
    {
        id: 'under_stress',
        category: 'emotional',
        iconName: 'zap',
        title: 'Stres Altında',
        scenario: 'Yoğun stres altındayken nasıl tepki verirsin?',
        options: [
            {
                id: 'fight',
                label: 'Mücadele Ederim',
                description: 'Daha sert çalışır, problemi çözerim',
                impact: { stressResponse: 0.9, conscientiousness: 0.7, neuroticism: 0.3 }
            },
            {
                id: 'seek_support',
                label: 'Destek Ararım',
                description: 'Güvendiğim biriyle konuşurum',
                impact: { extraversion: 0.6, agreeableness: 0.7, neuroticism: 0.5 }
            },
            {
                id: 'withdraw',
                label: 'Geri Çekilirim',
                description: 'Yalnız kalıp sakinleşmeye çalışırım',
                impact: { extraversion: 0.2, stressResponse: 0.3, neuroticism: 0.6 }
            },
            {
                id: 'distract',
                label: 'Dikkatimi Dağıtırım',
                description: 'Başka bir şeyle meşgul olurum',
                impact: { conscientiousness: 0.3, openness: 0.5, neuroticism: 0.5 }
            }
        ]
    },
    {
        id: 'receiving_criticism',
        category: 'emotional',
        iconName: 'message-circle',
        title: 'Eleştiri Alma',
        scenario: 'Çalışman hakkında sert eleştiri aldığında ilk tepkin:',
        options: [
            {
                id: 'defend',
                label: 'Kendimi Savunurum',
                description: 'Neden öyle yaptığımı açıklarım',
                impact: { criticismResponse: 0.3, dominance: 0.7, neuroticism: 0.4 }
            },
            {
                id: 'accept',
                label: 'Kabul Ederim',
                description: 'Haklı olabilirler, düşünürüm',
                impact: { criticismResponse: 0.8, agreeableness: 0.8, openness: 0.6 }
            },
            {
                id: 'hurt',
                label: 'İncinirim Ama Sustum',
                description: 'Kötü hissederim ama belli etmem',
                impact: { criticismResponse: 0.4, neuroticism: 0.7, extraversion: 0.2 }
            },
            {
                id: 'analyze',
                label: 'Objektif Değerlendiririm',
                description: 'Duygusuz analiz yapar, geçerli mi bakarım',
                impact: { criticismResponse: 0.6, logicVsEmotion: 0.8, neuroticism: 0.2 }
            }
        ]
    },

    // ========== KARAR SENARYOLARI ==========
    {
        id: 'big_decision',
        category: 'decision',
        iconName: 'scale',
        title: 'Büyük Karar',
        scenario: 'Hayatını etkileyecek önemli bir karar alırken:',
        options: [
            {
                id: 'gut_feeling',
                label: 'İçime Doğana Göre',
                description: 'Mantık sınırlı, sezgilerime güvenirim',
                impact: { decisionSpeed: 0.8, logicVsEmotion: 0.2, openness: 0.6 }
            },
            {
                id: 'pros_cons',
                label: 'Artı-Eksi Listesi',
                description: 'Her şeyi yazarım, sistematik değerlendiririm',
                impact: { decisionSpeed: 0.3, logicVsEmotion: 0.9, conscientiousness: 0.9 }
            },
            {
                id: 'ask_others',
                label: 'Başkalarına Danışırım',
                description: 'Güvendiğim insanların fikrini alırım',
                impact: { extraversion: 0.6, agreeableness: 0.7, dominance: 0.3 }
            },
            {
                id: 'delay',
                label: 'Ertelerim',
                description: 'Zaman geçsin, netleşsin',
                impact: { decisionSpeed: 0.1, neuroticism: 0.6, conscientiousness: 0.3 }
            }
        ]
    },
    {
        id: 'time_focus',
        category: 'decision',
        iconName: 'clock',
        title: 'Zaman Odağı',
        scenario: 'Düşüncelerinde daha çok hangi zaman dilimi ağırlıklı?',
        options: [
            {
                id: 'past',
                label: 'Geçmiş',
                description: 'Deneyimler, anılar, öğrenilen dersler',
                impact: { pastVsFuture: 0.2, conscientiousness: 0.6, openness: 0.4 }
            },
            {
                id: 'present',
                label: 'Şu An',
                description: 'Bugünün tadını çıkar',
                impact: { pastVsFuture: 0.5, openness: 0.7, neuroticism: 0.3 }
            },
            {
                id: 'future',
                label: 'Gelecek',
                description: 'Hedefler, planlar, olasılıklar',
                impact: { pastVsFuture: 0.8, conscientiousness: 0.7, openness: 0.6 }
            },
            {
                id: 'mixed',
                label: 'Karışık',
                description: 'Duruma göre değişir',
                impact: { pastVsFuture: 0.5, abstractThinking: 0.6, openness: 0.5 }
            }
        ]
    },

    // ========== İLETİŞİM SENARYOLARI ==========
    {
        id: 'communication_style',
        category: 'communication',
        iconName: 'message-circle',
        title: 'İletişim Tarzı',
        scenario: 'Önemli bir konuyu anlatırken tercih ettiğin stil:',
        options: [
            {
                id: 'direct',
                label: 'Kısa ve Öz',
                description: 'Sadece gerekli bilgiyi ver',
                impact: { extraversion: 0.5, dominance: 0.7, detailOrientation: 0.3 }
            },
            {
                id: 'detailed',
                label: 'Detaylı',
                description: 'Bağlam ver, her şeyi açıkla',
                impact: { conscientiousness: 0.8, detailOrientation: 0.9, empathy: 0.6 }
            },
            {
                id: 'storytelling',
                label: 'Hikâyeleştirerek',
                description: 'Örnekler ve benzetmelerle anlat',
                impact: { openness: 0.8, extraversion: 0.7, abstractThinking: 0.6 }
            },
            {
                id: 'emotional',
                label: 'Duygusal',
                description: 'Hisleri ön plana çıkar',
                impact: { logicVsEmotion: 0.2, empathy: 0.9, agreeableness: 0.7 }
            }
        ]
    },
    {
        id: 'disagreement_expression',
        category: 'communication',
        iconName: 'mic',
        title: 'Katılmadığını Belirtme',
        scenario: 'Birinin fikriyle aynı düşünmediğinde:',
        options: [
            {
                id: 'say_directly',
                label: 'Açıkça Söylerim',
                description: 'Net ve dürüst olurum',
                impact: { dominance: 0.8, agreeableness: 0.3, angerThreshold: 0.5 }
            },
            {
                id: 'soften',
                label: 'Yumuşatarak Söylerim',
                description: '"Belki de..." diye başlarım',
                impact: { agreeableness: 0.8, empathy: 0.7, dominance: 0.4 }
            },
            {
                id: 'question',
                label: 'Soru Sorarım',
                description: 'Onların mantığını anlamaya çalışırım',
                impact: { openness: 0.7, empathy: 0.8, abstractThinking: 0.6 }
            },
            {
                id: 'stay_silent',
                label: 'Sessiz Kalırım',
                description: 'Değmez, kendi bildiğimi yaparım',
                impact: { extraversion: 0.2, agreeableness: 0.6, neuroticism: 0.4 }
            }
        ]
    }
];

// Kategori başına senaryo grupla
export const SCENARIOS_BY_CATEGORY = {
    cognitive: PERSONALITY_SCENARIOS.filter(s => s.category === 'cognitive'),
    social: PERSONALITY_SCENARIOS.filter(s => s.category === 'social'),
    emotional: PERSONALITY_SCENARIOS.filter(s => s.category === 'emotional'),
    decision: PERSONALITY_SCENARIOS.filter(s => s.category === 'decision'),
    communication: PERSONALITY_SCENARIOS.filter(s => s.category === 'communication'),
};

export const CATEGORY_INFO = {
    cognitive: { label: 'Bilişsel Stil', iconName: 'brain' as const },
    social: { label: 'Sosyal Etkileşim', iconName: 'users' as const },
    emotional: { label: 'Duygusal Tepkiler', iconName: 'heart' as const },
    decision: { label: 'Karar Alma', iconName: 'scale' as const },
    communication: { label: 'İletişim', iconName: 'message-circle' as const },
};
