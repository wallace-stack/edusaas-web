'use client';

import Link from 'next/link';
import { Inter } from 'next/font/google';
import { useState, useEffect, useRef } from 'react';
import {
  Menu, X, Zap, Check, ChevronDown, ChevronUp,
  BarChart3, Users, DollarSign, ClipboardList, CalendarCheck, ShieldCheck,
  Sparkles, School, UserPlus, Rocket, Quote, Star, ArrowRight,
} from 'lucide-react';

const inter = Inter({ subsets: ['latin'] });

/* ─── DADOS ──────────────────────────────────── */

const features = [
  { Icon: BarChart3,    title: 'Métricas em tempo real',    desc: 'Dashboards com indicadores da instituição atualizados automaticamente para cada perfil de acesso.' },
  { Icon: Users,        title: 'Gestão multi-perfil',        desc: 'Perfis separados para diretor, coordenador, professor e aluno — cada um vê exatamente o que precisa.' },
  { Icon: DollarSign,   title: 'Controle financeiro',        desc: 'Mensalidades, inadimplência e fluxo de caixa em um painel completo. Nunca perca um pagamento.' },
  { Icon: ClipboardList,title: 'Lançamento de notas',        desc: 'Professores lançam notas por turma, disciplina e bimestre de forma simples, rápida e rastreável.' },
  { Icon: CalendarCheck,title: 'Controle de frequência',     desc: 'Chamadas com status presente, ausente ou justificado. Histórico completo por aluno e turma.' },
  { Icon: ShieldCheck,  title: 'Segurança e confiabilidade', desc: 'Autenticação JWT, proteção de rotas por perfil, validação de dados e infraestrutura robusta.' },
];

const steps = [
  { Icon: School,   step: '01', title: 'Cadastre sua escola', desc: 'Crie sua conta em menos de 2 minutos. Preencha os dados da instituição e comece o trial.' },
  { Icon: UserPlus, step: '02', title: 'Convide sua equipe',  desc: 'Adicione diretores, coordenadores, professores e alunos. Cada um recebe acesso personalizado.' },
  { Icon: Rocket,   step: '03', title: 'Comece a usar',       desc: 'Lance notas, registre chamadas, acompanhe o financeiro. Tudo funcionando desde o primeiro dia.' },
];

const testimonials = [
  { initials: 'MA', color: '#3B82F6', name: 'Marcos Andrade',  role: 'Diretor',                  school: 'Colégio São Lucas — SP',  text: 'Reduzimos em 80% o tempo gasto com planilhas. A equipe adaptou rápido e o suporte é excelente.' },
  { initials: 'CF', color: '#8B5CF6', name: 'Cláudia Ferreira', role: 'Coordenadora Pedagógica', school: 'Instituto Educar — MG',    text: 'Ver as notas e frequências em tempo real mudou completamente nossa tomada de decisão pedagógica.' },
  { initials: 'RP', color: '#F97316', name: 'Roberto Pinheiro', role: 'Diretor Administrativo',  school: 'Escola Nova Era — RJ',    text: 'O módulo financeiro sozinho já pagou o investimento. Adimplência subiu 30% no primeiro trimestre.' },
];

const faqs = [
  { q: 'Preciso de cartão de crédito para o trial?',        a: 'Não. O trial de 14 dias é completamente gratuito e não exige nenhum dado de pagamento. Você só é cobrado se decidir continuar.' },
  { q: 'Quantos alunos posso cadastrar no plano Básico?',   a: 'O plano Básico permite até 50 alunos ativos. Para escolas maiores, o plano Pro oferece alunos ilimitados.' },
  { q: 'Como funciona o período de trial?',                 a: 'Ao criar sua conta, você tem acesso a todos os recursos por 14 dias. No final do trial, pode escolher um plano ou encerrar sem cobranças.' },
  { q: 'Posso cancelar quando quiser?',                     a: 'Sim. O cancelamento pode ser feito a qualquer momento diretamente pelo painel, sem multas ou burocracia.' },
  { q: 'Tem suporte em português?',                         a: 'Sim, nosso suporte é totalmente em português. Atendemos por e-mail e, no plano Pro, por chat com prioridade.' },
];

const basicFeats = ['Até 50 alunos', 'Lançamento de notas', 'Controle de frequência', '1 turma', 'Suporte por e-mail'];
const proFeats   = ['Alunos ilimitados', 'Gestão financeira completa', 'Relatórios e exportações', 'Suporte prioritário', 'Turmas ilimitadas', 'Múltiplos professores', 'Acesso via API'];

/* ─── HOOK FADE-IN ───────────────────────────── */

function useFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

/* ─── MOCK DASHBOARD ─────────────────────────── */

function MockDashboard() {
  return (
    <div className="w-full max-w-2xl mx-auto rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60" style={{ background: '#111118' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-white/5" style={{ background: '#0D0D14' }}>
        <span className="w-3 h-3 rounded-full bg-red-500/70" />
        <span className="w-3 h-3 rounded-full bg-yellow-500/70" />
        <span className="w-3 h-3 rounded-full bg-green-500/70" />
        <span className="ml-3 text-xs text-white/30 font-mono">dashboard · EduSaaS</span>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'Alunos',       value: '348',     color: '#3B82F6' },
            { label: 'Frequência',   value: '92%',     color: '#22C55E' },
            { label: 'Mensalidades', value: 'R$ 42k',  color: '#8B5CF6' },
          ].map((s) => (
            <div key={s.label} className="rounded-xl p-3 border border-white/5" style={{ background: '#0D0D14' }}>
              <p className="text-xs mb-1" style={{ color: '#64748B' }}>{s.label}</p>
              <p className="text-lg font-bold" style={{ color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl p-4 border border-white/5 mb-4" style={{ background: '#0D0D14' }}>
          <p className="text-xs mb-3" style={{ color: '#64748B' }}>Notas por bimestre</p>
          <div className="flex items-end gap-2 h-16">
            {[65, 80, 72, 88, 75, 90, 68, 85].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, background: i % 2 === 0 ? 'rgba(59,130,246,0.6)' : 'rgba(139,92,246,0.6)' }} />
            ))}
          </div>
        </div>
        <div className="rounded-xl border border-white/5" style={{ background: '#0D0D14' }}>
          {[
            { name: 'Ana Clara Silva', status: 'Presente', color: '#22C55E' },
            { name: 'Bruno Mendes',    status: 'Ausente',  color: '#EF4444' },
            { name: 'Carla Souza',     status: 'Presente', color: '#22C55E' },
          ].map((s) => (
            <div key={s.name} className="flex items-center justify-between px-4 py-2.5 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'rgba(99,102,241,0.2)', color: '#818CF8' }}>
                  {s.name[0]}
                </div>
                <span className="text-xs" style={{ color: '#94A3B8' }}>{s.name}</span>
              </div>
              <span className="text-xs font-medium" style={{ color: s.color }}>{s.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── FAQ ITEM ───────────────────────────────── */

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <button
      onClick={() => setOpen(!open)}
      className="w-full text-left rounded-2xl border transition-colors"
      style={{ background: open ? '#111118' : 'transparent', borderColor: open ? 'rgba(59,130,246,0.3)' : 'rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-center justify-between px-6 py-5">
        <span className="font-medium text-sm" style={{ color: '#F1F5F9' }}>{q}</span>
        <span style={{ transition: 'transform 0.2s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)', display: 'flex' }}>
          <ChevronDown size={16} style={{ color: open ? '#3B82F6' : '#64748B' }} />
        </span>
      </div>
      {open && (
        <div className="px-6 pb-5">
          <p className="text-sm leading-relaxed" style={{ color: '#94A3B8' }}>{a}</p>
        </div>
      )}
    </button>
  );
}

/* ─── PAGE ───────────────────────────────────── */

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  const heroRef  = useFadeIn();
  const featRef  = useFadeIn();
  const stepsRef = useFadeIn();
  const testiRef = useFadeIn();
  const planosRef = useFadeIn();
  const faqRef   = useFadeIn();
  const ctaRef   = useFadeIn();

  const fadeStyle: React.CSSProperties = { opacity: 0, transform: 'translateY(24px)', transition: 'opacity 0.6s ease, transform 0.6s ease' };

  return (
    <div className={inter.className} style={{ background: '#0A0A0F', minHeight: '100vh', color: '#F1F5F9' }}>

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50%       { background-position: 100% 50%; }
        }
        .badge-anim { background: linear-gradient(270deg,#3B82F6,#8B5CF6,#3B82F6); background-size: 200% 200%; animation: gradient-x 4s ease infinite; }
        .card-hover { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .card-hover:hover { transform: translateY(-4px); box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
        .glow-btn { box-shadow: 0 0 20px rgba(59,130,246,0.35); transition: box-shadow 0.2s ease, transform 0.2s ease; }
        .glow-btn:hover { box-shadow: 0 0 32px rgba(59,130,246,0.5); transform: translateY(-1px); }
        .gradient-border { background: linear-gradient(135deg,#3B82F6,#8B5CF6); padding: 1.5px; border-radius: 20px; }
      `}</style>

      {/* ── NAVBAR ── */}
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

          <nav className="hidden md:flex items-center gap-7">
            {['#funcionalidades', '#planos', '#contato'].map((href, i) => (
              <a key={href} href={href} className="text-sm transition-colors" style={{ color: '#94A3B8' }}
                onMouseOver={e => (e.currentTarget.style.color = '#F1F5F9')}
                onMouseOut={e => (e.currentTarget.style.color = '#94A3B8')}>
                {['Funcionalidades', 'Planos', 'Contato'][i]}
              </a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm px-4 py-2 rounded-xl border font-medium transition-colors"
              style={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.color = '#F1F5F9'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.color = '#94A3B8'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}>
              Entrar
            </Link>
            <Link href="/cadastro" className="text-sm px-4 py-2 rounded-xl font-semibold text-white glow-btn flex items-center gap-1.5"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              Começar grátis <ArrowRight size={14} />
            </Link>
          </div>

          <button className="md:hidden p-2" style={{ color: '#94A3B8' }} onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden px-6 py-5 flex flex-col gap-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            {[['#funcionalidades', 'Funcionalidades'], ['#planos', 'Planos'], ['#contato', 'Contato']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMenuOpen(false)} className="text-sm" style={{ color: '#94A3B8' }}>{label}</a>
            ))}
            <div className="flex flex-col gap-2 pt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              <Link href="/login" className="text-sm py-2.5 text-center rounded-xl border" style={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)' }}>Entrar</Link>
              <Link href="/cadastro" className="text-sm py-2.5 text-center rounded-xl font-semibold text-white" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>Começar grátis</Link>
            </div>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="pt-20 pb-24 px-6">
        <div ref={heroRef} style={fadeStyle} className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 text-xs font-semibold text-white badge-anim">
            <Sparkles size={12} />
            Plataforma Educacional SaaS
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-tight mb-6 tracking-tight">
            Gerencie sua escola<br />
            <span style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              de forma inteligente
            </span>
          </h1>

          <p className="text-base sm:text-lg max-w-xl mx-auto mb-10 leading-relaxed" style={{ color: '#94A3B8' }}>
            Uma plataforma completa para diretores, coordenadores, professores e alunos. Tudo integrado, seguro e pronto para usar.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link href="/cadastro" className="px-8 py-4 rounded-2xl font-bold text-white text-base glow-btn flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              Começar 14 dias grátis <ArrowRight size={16} />
            </Link>
            <Link href="/planos" className="px-8 py-4 rounded-2xl font-medium text-sm border transition-colors flex items-center justify-center gap-1"
              style={{ color: '#94A3B8', borderColor: 'rgba(255,255,255,0.1)', background: 'transparent' }}
              onMouseOver={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.2)'; (e.currentTarget as HTMLElement).style.color = '#F1F5F9'; }}
              onMouseOut={e => { (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; (e.currentTarget as HTMLElement).style.color = '#94A3B8'; }}>
              Ver planos <ArrowRight size={14} />
            </Link>
          </div>

          <p className="text-xs flex items-center justify-center gap-3 flex-wrap" style={{ color: '#475569' }}>
            <span className="flex items-center gap-1"><Check size={12} /> Sem cartão de crédito</span>
            <span className="flex items-center gap-1"><Check size={12} /> 14 dias grátis</span>
            <span className="flex items-center gap-1"><Check size={12} /> Cancelamento fácil</span>
          </p>

          <div className="mt-16"><MockDashboard /></div>
        </div>
      </section>

      {/* ── FAIXA TECNOLOGIA ── */}
      <section style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0D0D14' }}>
        <div className="max-w-5xl mx-auto px-6 py-8 text-center">
          <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
            Construído com tecnologia de ponta para máxima segurança e conforto
          </p>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-24 px-6">
        <div ref={featRef} style={fadeStyle} className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tudo que sua escola precisa</h2>
            <p className="max-w-md mx-auto" style={{ color: '#94A3B8' }}>Módulos integrados para cada perfil, com dados em tempo real e interface intuitiva.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {features.map((f) => (
              <div key={f.title} className="card-hover rounded-2xl p-6 border"
                style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
                  style={{ background: 'rgba(59,130,246,0.1)' }}>
                  <f.Icon size={20} style={{ color: '#3B82F6' }} />
                </div>
                <h3 className="font-semibold mb-2 text-sm">{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── COMO FUNCIONA ── */}
      <section className="py-24 px-6" style={{ background: '#0D0D14' }}>
        <div ref={stepsRef} style={fadeStyle} className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Como funciona</h2>
            <p style={{ color: '#94A3B8' }}>Três passos simples para transformar sua gestão escolar.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-10 left-1/3 right-1/3 h-px" style={{ background: 'linear-gradient(90deg,#3B82F6,#8B5CF6)' }} />
            {steps.map((s) => (
              <div key={s.step} className="text-center">
                <div className="relative inline-flex mb-5">
                  <div className="w-20 h-20 rounded-2xl flex items-center justify-center border"
                    style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.08)' }}>
                    <s.Icon size={32} style={{ color: '#3B82F6' }} />
                  </div>
                  <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                    {s.step.slice(1)}
                  </span>
                </div>
                <h3 className="font-semibold mb-2">{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748B' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── DEPOIMENTOS ── */}
      <section className="py-24 px-6">
        <div ref={testiRef} style={fadeStyle} className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">O que dizem os diretores</h2>
            <p style={{ color: '#94A3B8' }}>Instituições que transformaram sua gestão com o EduSaaS.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {testimonials.map((t) => (
              <div key={t.name} className="card-hover rounded-2xl p-6 border flex flex-col gap-4"
                style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.07)' }}>
                <Quote size={20} style={{ color: 'rgba(59,130,246,0.4)' }} />
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#94A3B8' }}>{t.text}</p>
                <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                    style={{ background: t.color }}>
                    {t.initials}
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{t.name}</p>
                    <p className="text-xs" style={{ color: '#64748B' }}>{t.role} · {t.school}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="py-24 px-6" style={{ background: '#0D0D14' }}>
        <div ref={planosRef} style={fadeStyle} className="max-w-4xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Planos simples e transparentes</h2>
            <p style={{ color: '#94A3B8' }}>Comece grátis, escale quando precisar. Sem surpresas.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">

            <div className="rounded-2xl border p-8 flex flex-col" style={{ background: '#111118', borderColor: 'rgba(255,255,255,0.08)' }}>
              <span className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: '#64748B' }}>Básico</span>
              <div className="flex items-end gap-1 mb-1"><span className="text-4xl font-extrabold">Grátis</span></div>
              <p className="text-sm mb-8" style={{ color: '#64748B' }}>14 dias de trial — sem cartão</p>
              <ul className="space-y-3 flex-1 mb-8">
                {basicFeats.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm" style={{ color: '#94A3B8' }}>
                    <Check size={14} style={{ color: '#64748B' }} strokeWidth={3} />{f}
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

            <div className="gradient-border flex flex-col" style={{ position: 'relative' }}>
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
                <span className="text-xs font-bold px-4 py-1.5 rounded-full text-white flex items-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                  <Star size={11} fill="currentColor" /> Mais popular
                </span>
              </div>
              <div className="rounded-[18px] p-8 flex flex-col h-full" style={{ background: '#111118' }}>
                <span className="text-xs font-semibold uppercase tracking-widest mb-3"
                  style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Pro</span>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-lg font-medium mb-1" style={{ color: '#64748B' }}>R$</span>
                  <span className="text-4xl font-extrabold">97</span>
                  <span className="text-sm mb-1 ml-0.5" style={{ color: '#64748B' }}>/mês</span>
                </div>
                <p className="text-sm mb-8" style={{ color: '#64748B' }}>Tudo que sua escola precisa</p>
                <ul className="space-y-3 flex-1 mb-8">
                  {proFeats.map((f) => (
                    <li key={f} className="flex items-center gap-3 text-sm font-medium">
                      <Check size={14} style={{ color: '#3B82F6' }} strokeWidth={3} />{f}
                    </li>
                  ))}
                </ul>
                <Link href="/planos" className="w-full text-center py-3 rounded-xl font-bold text-sm text-white glow-btn flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                  Assinar agora <ArrowRight size={14} />
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="py-24 px-6">
        <div ref={faqRef} style={fadeStyle} className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Perguntas frequentes</h2>
            <p style={{ color: '#94A3B8' }}>Tudo que você precisa saber antes de começar.</p>
          </div>
          <div className="flex flex-col gap-2">
            {faqs.map((f) => <FaqItem key={f.q} q={f.q} a={f.a} />)}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section id="contato" className="py-24 px-6" style={{ background: '#0D0D14' }}>
        <div ref={ctaRef} style={fadeStyle} className="max-w-2xl mx-auto text-center">
          <div className="rounded-3xl border p-12"
            style={{ background: 'linear-gradient(135deg,rgba(59,130,246,0.08),rgba(139,92,246,0.08))', borderColor: 'rgba(59,130,246,0.2)' }}>
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-4">Pronto para começar?</h2>
            <p className="mb-8 leading-relaxed" style={{ color: '#94A3B8' }}>
              Crie sua conta em menos de 2 minutos e experimente todos os recursos gratuitamente por 14 dias.
            </p>
            <Link href="/cadastro" className="inline-flex items-center gap-2 px-10 py-4 rounded-2xl font-bold text-white text-base glow-btn"
              style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
              Criar minha conta gratuitamente <ArrowRight size={18} />
            </Link>
            <p className="text-xs mt-4" style={{ color: '#475569' }}>Sem cartão de crédito · Suporte em português</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-8 mb-10">
            <div className="sm:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-3">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#3B82F6,#8B5CF6)' }}>
                  <Zap size={13} className="text-white" />
                </div>
                <span className="font-bold" style={{ background: 'linear-gradient(90deg,#60A5FA,#A78BFA)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>EduSaaS</span>
              </Link>
              <p className="text-sm leading-relaxed max-w-xs" style={{ color: '#475569' }}>
                Plataforma SaaS para gestão educacional. Simples, completo e seguro.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Produto</p>
              <div className="flex flex-col gap-2">
                {[['#funcionalidades', 'Funcionalidades'], ['#planos', 'Planos'], ['/cadastro', 'Cadastrar']].map(([href, label]) => (
                  <a key={href} href={href} className="text-sm transition-colors" style={{ color: '#64748B' }}
                    onMouseOver={e => (e.currentTarget.style.color = '#94A3B8')}
                    onMouseOut={e => (e.currentTarget.style.color = '#64748B')}>{label}</a>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-4" style={{ color: '#475569' }}>Acesso</p>
              <div className="flex flex-col gap-2">
                {[['/login', 'Entrar'], ['/recuperar-senha', 'Recuperar senha'], ['/planos', 'Ver planos']].map(([href, label]) => (
                  <Link key={href} href={href} className="text-sm transition-colors" style={{ color: '#64748B' }}
                    onMouseOver={e => (e.currentTarget as HTMLElement).style.color = '#94A3B8'}
                    onMouseOut={e => (e.currentTarget as HTMLElement).style.color = '#64748B'}>{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-between pt-8" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <p className="text-xs" style={{ color: '#334155' }}>© 2025 EduSaaS. Todos os direitos reservados.</p>
            <p className="text-xs mt-2 sm:mt-0" style={{ color: '#334155' }}>Construído com Next.js · Hospedado na Vercel</p>
          </div>
        </div>
      </footer>

    </div>
  );
}
