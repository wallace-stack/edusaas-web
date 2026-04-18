'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, Zap, Sparkles, Star, ArrowRight, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const faqItems = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa ou fidelidade. O cancelamento pode ser feito diretamente no painel, a qualquer hora.' },
  { q: 'O trial exige cartão de crédito?', a: 'Não. 14 dias grátis sem cartão. Você só é cobrado se decidir assinar um plano pago.' },
  { q: 'O que acontece após o trial?', a: 'Você escolhe um plano pago para continuar. Nenhum dado é perdido.' },
  { q: 'Consigo migrar dados de outro sistema?', a: 'Sim. Nossa equipe apoia a migração de dados gratuitamente nos planos Escola e Rede.' },
];

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border transition-colors"
      style={{ background: open ? '#111118' : 'transparent', borderColor: open ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <span className="text-sm font-medium" style={{ color: '#F1F5F9' }}>{q}</span>
        <ChevronDown size={16} className={`flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} style={{ color: open ? '#3B82F6' : '#64748B' }} />
      </div>
      {open && (
        <div className="px-5 pb-4">
          <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{a}</p>
        </div>
      )}
    </button>
  );
}

const plans = [
  {
    name: 'Starter',
    monthly: 97,
    annual: 78,
    saving: 233,
    prefix: '',
    desc: 'Para escolas que estão começando',
    featured: false,
    features: [
      'Até 150 alunos',
      'Lançamento de notas e frequência',
      'Dashboard diretor e coordenador',
      'Wizard de onboarding',
      'Suporte por e-mail',
      'Trial 14 dias grátis',
    ],
    cta: 'Começar grátis',
    href: '/cadastro',
    borderColor: '#1E3A5F',
    accentBg: '#1E3A5F',
    accentHover: '#162d4a',
    accentCheck: '#3B82F6',
    cardBg: '#111118',
    isGradientBtn: false,
  },
  {
    name: 'Pro',
    monthly: 197,
    annual: 158,
    saving: 473,
    prefix: '',
    desc: 'Para escolas em crescimento',
    featured: true,
    features: [
      'Até 500 alunos',
      'Tudo do Starter',
      'Módulo financeiro com gráficos',
      'Relatórios avançados Chart.js',
      'Drawer de alunos com dados pessoais',
      'Suporte prioritário por WhatsApp',
    ],
    cta: 'Assinar Pro',
    href: '#',
    borderColor: '#6366F1',
    accentBg: 'linear-gradient(135deg,#4F46E5,#7C3AED)',
    accentHover: '',
    accentCheck: '#818CF8',
    cardBg: 'rgba(49,46,129,0.18)',
    isGradientBtn: true,
  },
  {
    name: 'Escola',
    monthly: 397,
    annual: 318,
    saving: 953,
    prefix: '',
    desc: 'Para escolas consolidadas',
    featured: false,
    features: [
      'Até 1.000 alunos',
      'Tudo do Pro',
      'Importação de alunos via CSV',
      'Relatórios para secretaria de educação',
      'Múltiplos coordenadores',
      'Suporte via chat em horário comercial',
    ],
    cta: 'Assinar Escola',
    href: '#',
    borderColor: '#059669',
    accentBg: '#059669',
    accentHover: '#047857',
    accentCheck: '#34D399',
    cardBg: '#111118',
    isGradientBtn: false,
  },
  {
    name: 'Rede',
    monthly: 797,
    annual: 638,
    saving: 1913,
    prefix: 'A partir de ',
    desc: 'Para redes com múltiplas unidades',
    featured: false,
    features: [
      'Múltiplas unidades',
      'Painel centralizado (em breve)',
      'Tudo do plano Escola',
      'Treinamento da equipe incluído',
      'SLA 99% garantido',
      'Gerente de conta dedicado',
    ],
    cta: 'Falar com especialista',
    href: '#',
    borderColor: '#F59E0B',
    accentBg: 'linear-gradient(135deg,#F59E0B,#EA580C)',
    accentHover: '',
    accentCheck: '#FCD34D',
    cardBg: '#111118',
    isGradientBtn: true,
  },
];

function PlanosContent() {
  const searchParams = useSearchParams();
  const trialExpired = searchParams.get('expired') === 'true';
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly');

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <style>{`
      `}</style>

      {trialExpired && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-600 text-white px-4 py-3 flex items-center justify-center gap-3">
          <span className="text-lg">⏰</span>
          <p className="text-sm font-medium">
            Seu período de teste encerrou. Escolha um plano abaixo para continuar.
          </p>
        </div>
      )}

      <header
        style={{
          background: 'rgba(10,10,15,0.85)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'sticky',
          top: trialExpired ? '44px' : 0,
          zIndex: 40,
        }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              <Zap size={15} className="text-white" />
            </div>
            <span className="font-bold text-base" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduSaaS
            </span>
          </Link>
          <Link href="/login" className="text-sm flex items-center gap-1" style={{ color: '#94A3B8' }}>
            Já tenho conta <ArrowRight size={13} />
          </Link>
        </div>
      </header>

      <section className={`text-center px-6 pb-8 ${trialExpired ? 'pt-20' : 'pt-16'}`}>
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
          <Sparkles size={11} /> Planos e preços
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">O plano certo para sua escola</h1>
        <p className="text-base sm:text-lg max-w-lg mx-auto mb-8" style={{ color: '#94A3B8' }}>
          14 dias grátis no Starter. Sem cartão de crédito.
        </p>

        {/* Toggle mensal / anual */}
        <div className="inline-flex items-center rounded-xl p-1 gap-1" style={{ background: '#111118', border: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            onClick={() => setBilling('monthly')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
            style={billing === 'monthly'
              ? { background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: '#fff' }
              : { color: '#64748B' }}
          >
            Mensal
          </button>
          <button
            onClick={() => setBilling('annual')}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2"
            style={billing === 'annual'
              ? { background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)', color: '#fff' }
              : { color: '#64748B' }}
          >
            Anual
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
              style={billing === 'annual'
                ? { background: 'rgba(255,255,255,0.2)', color: '#fff' }
                : { background: 'rgba(34,197,94,0.15)', color: '#22c55e' }}>
              20% OFF
            </span>
          </button>
        </div>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 items-stretch">
          {plans.map(plan => {
            const price = billing === 'annual' ? plan.annual : plan.monthly;

            const inner = (
              <div
                className="rounded-[18px] p-6 flex flex-col h-full border"
                style={{
                  background: plan.cardBg,
                  borderColor: plan.featured ? 'transparent' : plan.borderColor + '66',
                }}
              >
                {/* Accent strip no topo */}
                <div
                  className="w-8 h-1 rounded-full mb-4"
                  style={{ background: plan.accentBg }}
                />

                <span
                  className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ color: plan.accentCheck }}
                >
                  {plan.name}
                </span>

                <div className="flex items-end gap-0.5 mb-1">
                  <span className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>R$</span>
                  <span className="text-3xl font-extrabold">
                    {plan.prefix}{price}
                  </span>
                  <span className="text-sm mb-1 ml-0.5" style={{ color: '#64748B' }}>/mês</span>
                </div>

                {billing === 'annual' && (
                  <p className="text-xs mb-1" style={{ color: '#22c55e' }}>
                    Economize R$ {plan.saving}/ano
                  </p>
                )}

                <p className="text-sm mb-5" style={{ color: '#64748B' }}>{plan.desc}</p>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-start gap-3 text-sm" style={{ color: '#94A3B8' }}>
                      <Check size={14} style={{ color: plan.accentCheck, flexShrink: 0, marginTop: 2 }} strokeWidth={3} />
                      {f}
                    </li>
                  ))}
                </ul>

                {plan.name === 'Rede' ? (
                  <button
                    onClick={() => toast.info('Entre em contato pelo WhatsApp ou e-mail!')}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{ background: plan.accentBg }}
                  >
                    {plan.cta} <ArrowRight size={13} />
                  </button>
                ) : plan.href === '#' ? (
                  <button
                    onClick={() => toast.info('Integração com pagamento em breve!')}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{ background: plan.accentBg }}
                  >
                    {plan.cta} <ArrowRight size={13} />
                  </button>
                ) : (
                  <Link
                    href={plan.href}
                    className="w-full text-center py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center gap-1.5 transition-opacity hover:opacity-90"
                    style={{ background: plan.accentBg }}
                  >
                    {plan.cta} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            );

            if (plan.featured) {
              return (
                <div key={plan.name} className="flex flex-col relative" style={{ padding: 2, borderRadius: 20, background: plan.accentBg, boxShadow: '0 0 32px rgba(99,102,241,0.25)' }}>
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white flex items-center gap-1.5"
                      style={{ background: plan.accentBg }}>
                      <Star size={11} fill="currentColor" /> Mais popular
                    </span>
                  </div>
                  {inner}
                </div>
              );
            }
            return <div key={plan.name}>{inner}</div>;
          })}
        </div>

        <div className="mt-10 text-center">
          <div className="inline-flex items-center gap-2 text-sm" style={{ color: '#475569' }}>
            <Shield size={14} />
            Cancele a qualquer momento. Sem multa, sem burocracia.
          </div>
        </div>

        {/* FAQ */}
        <div className="mt-16 max-w-2xl mx-auto">
          <h3 className="text-xl font-bold text-center mb-8">Perguntas frequentes</h3>
          <div className="flex flex-col gap-2">
            {faqItems.map(f => <FaqRow key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>

        <p className="text-center text-sm mt-10" style={{ color: '#475569' }}>
          Já tem uma conta?{' '}
          <Link href="/login" className="font-medium hover:underline" style={{ color: '#60A5FA' }}>Entrar</Link>
        </p>
      </main>

      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              <Zap size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              EduSaaS
            </span>
          </Link>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-sm hover:text-gray-300 transition-colors" style={{ color: '#475569' }}>Entrar</Link>
            <Link href="/cadastro" className="text-sm hover:text-gray-300 transition-colors" style={{ color: '#475569' }}>Cadastrar</Link>
          </div>
          <p className="text-xs" style={{ color: '#334155' }}>© 2026 EduSaaS</p>
        </div>
      </footer>
    </div>
  );
}

export default function PlanosPage() {
  return (
    <Suspense fallback={null}>
      <PlanosContent />
    </Suspense>
  );
}
