'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { Check, Zap } from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

const basicFeatures = [
  'Até 50 alunos',
  'Lançamento de notas',
  'Controle de frequência',
  '1 turma',
  'Suporte por e-mail',
];

const proFeatures = [
  'Alunos ilimitados',
  'Gestão financeira completa',
  'Relatórios e exportações',
  'Suporte prioritário',
  'Lançamento de notas',
  'Controle de frequência',
  'Turmas ilimitadas',
  'Múltiplos professores',
];

export default function PlanosPage() {
  return (
    <div className={inter.className} style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>

      <style>{`
        .glow-btn {
          box-shadow: 0 0 20px rgba(59,130,246,0.35);
          transition: box-shadow 0.2s ease, transform 0.2s ease;
        }
        .glow-btn:hover {
          box-shadow: 0 0 32px rgba(59,130,246,0.5);
          transform: translateY(-1px);
        }
        .gradient-border {
          background: linear-gradient(135deg, #3B82F6, #8B5CF6);
          padding: 1.5px;
          border-radius: 20px;
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <header style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-bold text-base" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduSaaS
            </span>
          </Link>
          <Link href="/login" className="text-sm transition-colors" style={{ color: '#94A3B8' }}
            onMouseOver={e => (e.currentTarget as HTMLElement).style.color = '#F1F5F9'}
            onMouseOut={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}>
            Já tenho conta →
          </Link>
        </div>
      </header>

      {/* ── HERO ── */}
      <section className="text-center px-6 pt-16 pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">Escolha seu plano</h1>
        <p className="text-base sm:text-lg max-w-md mx-auto" style={{ color: '#94A3B8' }}>
          Continue gerenciando sua escola sem interrupções
        </p>
      </section>

      {/* ── CARDS ── */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">

          {/* Básico */}
          <div className="rounded-2xl border p-8 flex flex-col" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.08)' }}>
            <span className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Básico</span>
            <div className="flex items-end gap-1 mb-1">
              <span className="text-4xl font-extrabold">Grátis</span>
            </div>
            <p className="text-sm mb-8" style={{ color: '#64748B' }}>14 dias de trial — sem cartão</p>

            <ul className="space-y-3 flex-1 mb-8">
              {basicFeatures.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#94A3B8' }}>
                  <Check size={14} style={{ color: '#64748B' }} strokeWidth={3} className="flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Link href="/cadastro" className="w-full text-center py-3 rounded-xl border font-semibold text-sm transition-colors"
              style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.background = 'transparent'}>
              Começar grátis
            </Link>
          </div>

          {/* Pro — gradient border */}
          <div className="gradient-border flex flex-col relative">
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
              <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                ⭐ Mais popular
              </span>
            </div>
            <div className="rounded-[18px] p-8 flex flex-col h-full" style={{ background: '#111118' }}>
              <span className="text-xs font-semibold uppercase tracking-widest mb-3"
                style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                Pro
              </span>
              <div className="flex items-end gap-1 mb-1">
                <span className="text-lg font-medium mb-1" style={{ color: '#64748B' }}>R$</span>
                <span className="text-4xl font-extrabold">97</span>
                <span className="text-sm mb-1 ml-0.5" style={{ color: '#64748B' }}>/mês</span>
              </div>
              <p className="text-sm mb-8" style={{ color: '#64748B' }}>Tudo que sua escola precisa</p>

              <ul className="space-y-3 flex-1 mb-8">
                {proFeatures.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm font-medium">
                    <Check size={14} style={{ color: '#3B82F6' }} strokeWidth={3} className="flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>

              <button onClick={() => alert('Em breve!')}
                className="w-full py-3 rounded-xl font-bold text-sm text-white glow-btn"
                style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                Assinar agora
              </button>
            </div>
          </div>

        </div>

        <p className="text-center text-sm mt-10" style={{ color: '#475569' }}>
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#60A5FA' }}>
            Entrar
          </Link>
        </p>
      </main>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduSaaS
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm transition-colors" style={{ color: '#475569' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.color = '#475569'}>Entrar</Link>
            <Link href="/cadastro" className="text-sm transition-colors" style={{ color: '#475569' }}
              onMouseOver={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
              onMouseOut={e => (e.currentTarget as HTMLElement).style.color = '#475569'}>Cadastrar</Link>
          </div>
          <p className="text-xs" style={{ color: '#334155' }}>© 2025 EduSaaS</p>
        </div>
      </footer>

    </div>
  );
}
