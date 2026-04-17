'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Check, X, Zap, Sparkles, Star, ArrowRight, Shield, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const faqItems = [
  { q: 'Posso cancelar a qualquer momento?', a: 'Sim, sem multa ou fidelidade. O cancelamento pode ser feito diretamente no painel, a qualquer hora.' },
  { q: 'O trial exige cartão de crédito?', a: 'Não. 14 dias grátis sem cartão. Você só é cobrado se decidir assinar um plano pago.' },
  { q: 'O que acontece após o trial?', a: 'Você escolhe um plano pago ou continua no Free com até 150 alunos. Nenhum dado é perdido.' },
  { q: 'Consigo migrar dados de outro sistema?', a: 'Sim. Nossa equipe apoia a migração de dados gratuitamente nos planos Pro e Premium.' },
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
    name: 'Free',
    price: 'Grátis',
    sub: 'Para sempre',
    desc: 'Para escolas pequenas começarem',
    featured: false,
    features: [
      { text: 'Até 150 alunos', included: true },
      { text: 'Lançamento de notas', included: true },
      { text: 'Controle de frequência', included: true },
      { text: 'Feed de avisos', included: true },
      { text: '1 imagem por post', included: true },
      { text: 'Gestão financeira', included: false },
      { text: 'Relatórios PDF', included: false },
      { text: 'Suporte prioritário', included: false },
    ],
    cta: 'Começar grátis',
    href: '/cadastro',
  },
  {
    name: 'Pro',
    price: '79',
    cent: ',90',
    sub: '/mês',
    desc: 'Para escolas em crescimento',
    featured: true,
    features: [
      { text: 'Até 350 alunos', included: true },
      { text: 'Lançamento de notas', included: true },
      { text: 'Controle de frequência', included: true },
      { text: 'Feed de avisos', included: true },
      { text: '2 imagens por post', included: true },
      { text: 'Gestão financeira', included: true },
      { text: 'Relatórios PDF', included: true },
      { text: 'Suporte prioritário', included: false },
    ],
    cta: 'Assinar Pro',
    href: '#',
  },
  {
    name: 'Premium',
    price: '149',
    cent: ',90',
    sub: '/mês',
    desc: 'Para escolas que querem tudo',
    featured: false,
    badge: 'Trial 14 dias grátis',
    features: [
      { text: 'Alunos ilimitados', included: true },
      { text: 'Lançamento de notas', included: true },
      { text: 'Controle de frequência', included: true },
      { text: 'Feed de avisos', included: true },
      { text: '5 imagens por post', included: true },
      { text: 'Gestão financeira', included: true },
      { text: 'Relatórios PDF', included: true },
      { text: 'Suporte prioritário', included: true },
    ],
    cta: 'Testar 14 dias grátis',
    href: '/cadastro',
  },
];

export default function PlanosPage() {
  const searchParams = useSearchParams();
  const trialExpired = searchParams.get('expired') === 'true';

  return (
    <div style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F1F5F9', display: 'flex', flexDirection: 'column' }}>
      <style>{`
        .glow-btn { box-shadow: 0 0 20px rgba(59,130,246,0.35); transition: box-shadow 0.2s, transform 0.2s; }
        .glow-btn:hover { box-shadow: 0 0 32px rgba(59,130,246,0.5); transform: translateY(-1px); }
        .grad-border { background: linear-gradient(135deg,#3B82F6,#8B5CF6); padding: 2px; border-radius: 20px; box-shadow: 0 0 32px rgba(59,130,246,0.2); }
      `}</style>

      <header style={{ background: 'rgba(10,10,15,0.85)', backdropFilter: 'blur(16px)', borderBottom: '1px solid rgba(255,255,255,0.06)', position: 'sticky', top: 0, zIndex: 50 }}>
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

      {trialExpired && (
        <div className="max-w-6xl mx-auto w-full px-6 pt-8">
          <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-red-500 text-xl shrink-0">⏰</span>
            <div>
              <p className="font-semibold text-red-700 dark:text-red-300">
                Seu período de teste encerrou
              </p>
              <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">
                Escolha um plano abaixo para continuar usando o EduSaaS e manter todos os seus dados.
              </p>
            </div>
          </div>
        </div>
      )}

      <section className="text-center px-6 pt-16 pb-10">
        <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
          <Sparkles size={11} /> Planos e preços
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold mb-3">O plano certo para sua escola</h1>
        <p className="text-base sm:text-lg max-w-lg mx-auto" style={{ color: '#94A3B8' }}>
          Comece com trial Premium de 14 dias. Sem cartão de crédito.
        </p>
      </section>

      <main className="flex-1 max-w-6xl mx-auto w-full px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-stretch">
          {plans.map(plan => {
            const inner = (
              <div className={`rounded-[18px] p-6 sm:p-8 flex flex-col h-full ${plan.featured ? '' : 'rounded-2xl border'}`}
                style={plan.featured ? { background: '#111118' } : { background: '#111118', borderColor: 'rgba(255,255,255,0.08)' }}>

                {plan.badge && (
                  <div className="mb-4">
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full text-white"
                      style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                      {plan.badge}
                    </span>
                  </div>
                )}

                <span className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={plan.featured
                    ? { background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }
                    : { color: '#64748B' }
                  }>
                  {plan.name}
                </span>

                <div className="flex items-end gap-0.5 mb-1">
                  {plan.price === 'Grátis' ? (
                    <span className="text-3xl sm:text-4xl font-extrabold">Grátis</span>
                  ) : (
                    <>
                      <span className="text-lg font-medium mb-1" style={{ color: '#64748B' }}>R$</span>
                      <span className="text-3xl sm:text-4xl font-extrabold">{plan.price}</span>
                      <span className="text-sm font-medium mb-1" style={{ color: '#64748B' }}>{plan.cent}</span>
                      <span className="text-sm mb-1 ml-0.5" style={{ color: '#64748B' }}>{plan.sub}</span>
                    </>
                  )}
                </div>
                <p className="text-sm mb-6" style={{ color: '#64748B' }}>{plan.desc}</p>

                <ul className="space-y-2.5 flex-1 mb-6">
                  {plan.features.map(f => (
                    <li key={f.text} className="flex items-center gap-3 text-sm"
                      style={{ color: f.included ? (plan.featured ? '#F1F5F9' : '#94A3B8') : '#334155' }}>
                      {f.included ? (
                        <Check size={14} style={{ color: plan.featured ? '#3B82F6' : '#64748B' }} strokeWidth={3} className="flex-shrink-0" />
                      ) : (
                        <X size={14} style={{ color: '#334155' }} strokeWidth={2} className="flex-shrink-0" />
                      )}
                      <span className={f.included ? '' : 'line-through'}>{f.text}</span>
                    </li>
                  ))}
                </ul>

                {plan.featured ? (
                  <button onClick={() => toast.info('Integração com pagamento em breve!')}
                    className="w-full py-3 rounded-xl font-bold text-sm text-white glow-btn flex items-center justify-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                    {plan.cta} <ArrowRight size={13} />
                  </button>
                ) : (
                  <Link href={plan.href}
                    className="w-full text-center py-3 rounded-xl border font-semibold text-sm transition-all flex items-center justify-center gap-1.5 hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,255,255,0.12)', color: '#F1F5F9' }}>
                    {plan.cta} <ArrowRight size={13} />
                  </Link>
                )}
              </div>
            );

            if (plan.featured) {
              return (
                <div key={plan.name} className="grad-border flex flex-col relative">
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                    <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white flex items-center gap-1.5"
                      style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
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
          <div className="flex flex-col">
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
