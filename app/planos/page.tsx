'use client';

import Link from 'next/link';
import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Zap, Sparkles, ArrowRight, Shield, ChevronDown } from 'lucide-react';
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
    hasPrefix: false,
    desc: 'Para escolas que estão começando',
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
    isPro: false,
    proBar: false,
    borderCls: 'border-[#1E3A5F]/30',
    headerBg: 'bg-[#1E3A5F]',
    labelCls: 'text-blue-300',
    rsCls: 'text-blue-300',
    subtitleCls: 'text-blue-200',
    checkBg: 'bg-blue-900/30',
    checkCls: 'text-blue-300',
    btnCls: 'bg-[#1E3A5F] hover:bg-[#162d4a]',
  },
  {
    name: 'Pro',
    monthly: 197,
    annual: 158,
    saving: 473,
    hasPrefix: false,
    desc: 'Para escolas em crescimento',
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
    isPro: true,
    proBar: true,
    borderCls: 'border-indigo-500 ring-2 ring-indigo-500/30',
    headerBg: 'bg-[#1e1b4b]',
    labelCls: 'text-indigo-300',
    rsCls: 'text-indigo-300',
    subtitleCls: 'text-indigo-400',
    checkBg: 'bg-indigo-500/10',
    checkCls: 'text-indigo-500',
    btnCls: 'bg-indigo-600 hover:bg-indigo-700',
  },
  {
    name: 'Escola',
    monthly: 397,
    annual: 318,
    saving: 953,
    hasPrefix: false,
    desc: 'Para escolas consolidadas',
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
    isPro: false,
    proBar: false,
    borderCls: 'border-emerald-700/30',
    headerBg: 'bg-emerald-800',
    labelCls: 'text-emerald-300',
    rsCls: 'text-emerald-300',
    subtitleCls: 'text-emerald-200',
    checkBg: 'bg-emerald-500/10',
    checkCls: 'text-emerald-600 dark:text-emerald-400',
    btnCls: 'bg-emerald-700 hover:bg-emerald-800',
  },
  {
    name: 'Rede',
    monthly: 797,
    annual: 638,
    saving: 1913,
    hasPrefix: true,
    desc: 'Para redes com múltiplas unidades',
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
    isPro: false,
    proBar: false,
    borderCls: 'border-amber-600/30',
    headerBg: 'bg-gradient-to-br from-amber-800 to-amber-700',
    labelCls: 'text-amber-300',
    rsCls: 'text-amber-300',
    subtitleCls: 'text-amber-200',
    checkBg: 'bg-amber-500/10',
    checkCls: 'text-amber-600 dark:text-amber-400',
    btnCls: 'bg-gradient-to-r from-amber-700 to-amber-600 hover:from-amber-800 hover:to-amber-700',
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

            return (
              <div key={plan.name} className={`relative flex flex-col ${plan.name !== 'Rede' ? 'pt-3' : ''}`}>

                {/* Badge "14 dias grátis" flutuando acima do card (todos exceto Rede) */}
                {plan.name !== 'Rede' && (
                  <div className="absolute -top-0 left-1/2 -translate-x-1/2 z-10 bg-green-500 text-white text-[10px] font-semibold px-3 py-1 rounded-full whitespace-nowrap shadow-sm">
                    14 dias grátis
                  </div>
                )}

                <div className={`rounded-2xl overflow-hidden border ${plan.borderCls} flex flex-col flex-1`}>

                {/* Barra gradiente no topo do Pro */}
                {plan.proBar && (
                  <div className="h-0.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500" />
                )}

                {/* Header colorido */}
                <div className={`${plan.headerBg} p-5`}>
                  <div className="flex justify-between items-start">
                    <span className={`text-[10px] uppercase tracking-widest font-medium ${plan.labelCls}`}>
                      {plan.name}
                    </span>
                    {plan.isPro && (
                      <span className="text-[9px] bg-indigo-500 text-white px-2 py-0.5 rounded-full">
                        ⭐ Mais popular
                      </span>
                    )}
                  </div>

                  {/* Preço */}
                  <div className="mt-2">
                    {plan.hasPrefix && (
                      <p className={`text-[10px] ${plan.rsCls} mb-0.5`}>A partir de</p>
                    )}
                    <div className="flex items-baseline gap-0.5">
                      <span className={`text-xs ${plan.rsCls} self-end mb-1`}>R$</span>
                      <span className="text-4xl font-medium text-white leading-none">{price}</span>
                      <span className={`text-xs ${plan.rsCls} self-end mb-1`}>/mês</span>
                    </div>
                  </div>

                  <p className={`text-[11px] ${plan.subtitleCls} mt-1`}>{plan.desc}</p>
                </div>

                {/* Corpo */}
                <div className="p-5 bg-white dark:bg-gray-900 flex flex-col flex-1">
                  <ul className="space-y-2 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300">
                        <span className={`w-4 h-4 rounded-full ${plan.checkBg} flex items-center justify-center text-[9px] ${plan.checkCls} flex-shrink-0`}>
                          ✓
                        </span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {/* Rodapé com preço anual */}
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-[10px] text-gray-400">
                      Anual: <strong className="text-gray-600 dark:text-gray-300">R$ {plan.annual}/mês</strong>
                    </span>
                    <span className="text-[10px] text-green-600 bg-green-50 dark:bg-green-950 px-1.5 py-0.5 rounded">
                      -20%
                    </span>
                  </div>

                  {/* Botão */}
                  {plan.name === 'Rede' ? (
                    <button
                      onClick={() => toast.info('Entre em contato pelo WhatsApp ou e-mail!')}
                      className={`mt-3 w-full py-2.5 rounded-xl ${plan.btnCls} text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5`}
                    >
                      {plan.cta} <ArrowRight size={12} />
                    </button>
                  ) : plan.href === '#' ? (
                    <button
                      onClick={() => toast.info('Integração com pagamento em breve!')}
                      className={`mt-3 w-full py-2.5 rounded-xl ${plan.btnCls} text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5`}
                    >
                      {plan.cta} <ArrowRight size={12} />
                    </button>
                  ) : (
                    <Link
                      href={plan.href}
                      className={`mt-3 w-full text-center py-2.5 rounded-xl ${plan.btnCls} text-white text-xs font-medium transition-colors flex items-center justify-center gap-1.5`}
                    >
                      {plan.cta} <ArrowRight size={12} />
                    </Link>
                  )}
                </div>
                </div>
              </div>
            );
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
