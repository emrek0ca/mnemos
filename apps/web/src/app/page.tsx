'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui';
import { ArrowRight } from 'lucide-react';

// Neural node component for the animated visualization
function NeuralNode({ x, y, delay, size = 4 }: { x: number; y: number; delay: number; size?: number }) {
  return (
    <circle
      cx={x}
      cy={y}
      r={size}
      className="fill-slate-300"
      style={{
        animation: `pulse 3s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Neural connection line
function NeuralConnection({ x1, y1, x2, y2, delay }: { x1: number; y1: number; x2: number; y2: number; delay: number }) {
  return (
    <line
      x1={x1}
      y1={y1}
      x2={x2}
      y2={y2}
      className="stroke-slate-200"
      strokeWidth="1"
      style={{
        animation: `lineGlow 4s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  );
}

// Floating memory fragment
function MemoryFragment({ children, delay, x, y }: { children: React.ReactNode; delay: number; x: number; y: number }) {
  return (
    <div
      className="absolute text-xs text-slate-400 font-mono opacity-0"
      style={{
        left: `${x}%`,
        top: `${y}%`,
        animation: `fadeFloat 8s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

export default function LandingPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate neural network nodes
  const nodes = [
    { x: 200, y: 150 }, { x: 350, y: 100 }, { x: 500, y: 180 },
    { x: 650, y: 120 }, { x: 800, y: 160 }, { x: 280, y: 280 },
    { x: 450, y: 300 }, { x: 600, y: 250 }, { x: 750, y: 300 },
    { x: 150, y: 350 }, { x: 320, y: 400 }, { x: 520, y: 420 },
    { x: 700, y: 380 }, { x: 850, y: 420 },
  ];

  // Generate connections between nearby nodes
  const connections = [
    { from: 0, to: 1 }, { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 3, to: 4 },
    { from: 0, to: 5 }, { from: 5, to: 6 }, { from: 6, to: 7 }, { from: 7, to: 8 },
    { from: 5, to: 9 }, { from: 9, to: 10 }, { from: 10, to: 11 }, { from: 11, to: 12 },
    { from: 12, to: 13 }, { from: 1, to: 6 }, { from: 2, to: 7 }, { from: 6, to: 11 },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      {/* CSS Animations */}
      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.5); }
        }
        @keyframes lineGlow {
          0%, 100% { opacity: 0.1; stroke-width: 1; }
          50% { opacity: 0.4; stroke-width: 2; }
        }
        @keyframes fadeFloat {
          0%, 100% { opacity: 0; transform: translateY(0); }
          10%, 90% { opacity: 0.6; }
          50% { transform: translateY(-20px); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(40px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes expandLine {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes typewriter {
          from { width: 0; }
          to { width: 100%; }
        }
        .animate-slide-up {
          animation: slideUp 0.8s ease-out forwards;
        }
        .animate-slide-up-delay-1 {
          animation: slideUp 0.8s ease-out 0.2s forwards;
          opacity: 0;
        }
        .animate-slide-up-delay-2 {
          animation: slideUp 0.8s ease-out 0.4s forwards;
          opacity: 0;
        }
        .animate-slide-up-delay-3 {
          animation: slideUp 0.8s ease-out 0.6s forwards;
          opacity: 0;
        }
      `}</style>

      {/* Neural Network Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg
          className="w-full h-full"
          viewBox="0 0 1000 500"
          preserveAspectRatio="xMidYMid slice"
          style={{ opacity: mounted ? 1 : 0, transition: 'opacity 1s ease-in' }}
        >
          {/* Connections */}
          {connections.map((conn, i) => (
            <NeuralConnection
              key={`conn-${i}`}
              x1={nodes[conn.from].x}
              y1={nodes[conn.from].y}
              x2={nodes[conn.to].x}
              y2={nodes[conn.to].y}
              delay={i * 0.3}
            />
          ))}
          {/* Nodes */}
          {nodes.map((node, i) => (
            <NeuralNode
              key={`node-${i}`}
              x={node.x}
              y={node.y}
              delay={i * 0.2}
              size={i % 3 === 0 ? 6 : 4}
            />
          ))}
        </svg>
      </div>

      {/* Floating Memory Fragments */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <MemoryFragment x={10} y={20} delay={0}>memory.store()</MemoryFragment>
        <MemoryFragment x={75} y={15} delay={2}>identity.preserve()</MemoryFragment>
        <MemoryFragment x={5} y={60} delay={4}>recall.trigger()</MemoryFragment>
        <MemoryFragment x={85} y={55} delay={1}>cognition.trace()</MemoryFragment>
        <MemoryFragment x={15} y={85} delay={3}>time.stamp()</MemoryFragment>
        <MemoryFragment x={70} y={80} delay={5}>thought.log()</MemoryFragment>
      </div>

      {/* Header */}
      <header className="relative z-10">
        <nav className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center">
              <span className="text-white font-bold text-lg">M</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-slate-900">MNEMOS</span>
          </div>
          <Link href="/login">
            <Button variant="outline" size="sm">Giriş</Button>
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 max-w-4xl mx-auto px-6 pt-24 pb-32">
        {/* Overline */}
        <div className={`text-sm font-mono text-slate-500 mb-6 ${mounted ? 'animate-slide-up' : ''}`}>
          Cognitive Preservation System
        </div>

        {/* Main Headline */}
        <h1 className={`text-5xl md:text-7xl font-bold text-slate-900 leading-[1.1] tracking-tight ${mounted ? 'animate-slide-up-delay-1' : ''}`}>
          Zihinsel
          <br />
          <span className="relative inline-block">
            Süreklilik
            <span className="absolute -bottom-2 left-0 w-full h-1 bg-slate-900 origin-left"
              style={{ animation: mounted ? 'expandLine 0.8s ease-out 0.8s forwards' : 'none', transform: 'scaleX(0)' }}
            />
          </span>
        </h1>

        {/* Description */}
        <p className={`mt-12 text-xl text-slate-600 max-w-2xl leading-relaxed ${mounted ? 'animate-slide-up-delay-2' : ''}`}>
          MNEMOS bir yapay zeka değildir.
          Bir insanın düşünme biçimini, hatırlama örüntülerini ve karar alma karakterini
          <span className="text-slate-900 font-medium"> zaman içinde bozulmadan muhafaza etmek</span> için
          tasarlanmış kişisel bir sistemdir.
        </p>

        {/* Quote */}
        <blockquote className={`mt-12 pl-6 border-l-2 border-slate-300 ${mounted ? 'animate-slide-up-delay-3' : ''}`}>
          <p className="text-lg text-slate-500 italic">
            "Bu sistem, zaman geçse bile, aynı uyarana aynı zihinsel refleksle karşılık veriyor mu?"
          </p>
          <footer className="mt-2 text-sm text-slate-400">— Tek başarı ölçütü</footer>
        </blockquote>

        {/* CTA */}
        <div className={`mt-16 flex gap-4 ${mounted ? 'animate-slide-up-delay-3' : ''}`}>
          <Link href="/login">
            <Button size="lg" className="bg-slate-900 hover:bg-slate-800 px-8">
              Bağ Kur
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>

        {/* Principles Grid */}
        <div className={`mt-32 grid md:grid-cols-3 gap-8 ${mounted ? 'animate-slide-up-delay-3' : ''}`}>
          <div className="group">
            <div className="text-5xl font-light text-slate-200 group-hover:text-slate-400 transition-colors">01</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Temaşa</h3>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">
              Seni izleyen bir çift göz değil,
              seni anlayan bir zihin.
            </p>
          </div>
          <div className="group">
            <div className="text-5xl font-light text-slate-200 group-hover:text-slate-400 transition-colors">02</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Süreklilik</h3>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">
              Kopuk konuşmalar yok.
              Tek, uzun ve derin bir anlatı var.
            </p>
          </div>
          <div className="group">
            <div className="text-5xl font-light text-slate-200 group-hover:text-slate-400 transition-colors">03</div>
            <h3 className="mt-4 text-lg font-semibold text-slate-900">Yansıma</h3>
            <p className="mt-2 text-slate-500 text-sm leading-relaxed">
              Sen değiştikçe değişen,
              seninle büyüyen bir hafıza.
            </p>
          </div>
        </div>

        {/* Pricing/Continuity Section */}
        <div className={`mt-32 max-w-2xl mx-auto ${mounted ? 'animate-slide-up-delay-3' : ''}`}>
          <h2 className="text-3xl font-bold text-slate-900 text-center mb-12">Süreklilik Modeli</h2>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Monthly */}
            <a href="https://mnemos.lemonsqueezy.com/buy/variant_monthly_placeholder" className="block group">
              <div className="p-8 rounded-2xl border border-slate-200 hover:border-slate-300 hover:shadow-lg transition-all bg-white relative">
                <div className="text-sm text-slate-500 mb-2">Aylık Döngü</div>
                <div className="text-3xl font-bold text-slate-900 mb-4">149 TL</div>
                <p className="text-slate-600 text-sm leading-relaxed mb-6">
                  Kısa vadeli hafıza koruması ve temel süreklilik. Dilediğin an durabilirsin.
                </p>
                <div className="flex items-center text-slate-900 font-medium group-hover:translate-x-1 transition-transform">
                  Başlat <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </a>

            {/* Yearly */}
            <a href="https://mnemos.lemonsqueezy.com/buy/variant_yearly_placeholder" className="block group">
              <div className="p-8 rounded-2xl border border-indigo-100 bg-indigo-50/30 hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-500/10 transition-all relative">
                <div className="absolute top-4 right-4 bg-indigo-100 text-indigo-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wide">
                  Önerilen
                </div>
                <div className="text-sm text-indigo-900/60 mb-2">Yıllık Bağ</div>
                <div className="text-3xl font-bold text-indigo-900 mb-4">1299 TL</div>
                <p className="text-indigo-900/70 text-sm leading-relaxed mb-6">
                  Tam bilişsel yedekleme, rüya modu ve derinlemesine kimlik analizi.
                </p>
                <div className="flex items-center text-indigo-900 font-medium group-hover:translate-x-1 transition-transform">
                  Bağ Kur <ArrowRight className="ml-2 w-4 h-4" />
                </div>
              </div>
            </a>
          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-100">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <p className="text-sm text-slate-400 text-center">
            Bu bir ürün değildir. <span className="text-slate-600">Bu bir hafıza deneyidir.</span>
          </p>
        </div>
      </footer>
    </div>
  );
}
