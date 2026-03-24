'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Menu, X, Zap } from 'lucide-react';

const features = [
  {
    emoji: '📊',
    title: 'Métricas em tempo real',
    description: 'Acompanhe indicadores da instituição com dashboards atualizados automaticamente.',
  },
  {
    emoji: '👥',
    title: 'Gestão de usuários',
    description: 'Perfis separados para diretor, coordenador, professor e aluno — cada um com seu painel.',
  },
  {
    emoji: '💰',
    title: 'Controle financeiro',
    description: 'Mensalidades, inadimplência e fluxo de caixa em um único lugar.',
  },
  {
    emoji: '📝',
    title: 'Lançamento de notas',
    description: 'Professores lançam notas por turma, disciplina e bimestre de forma simples e rápida.',
  },
  {
    emoji: '📅',
    title: 'Controle de frequência',
    description: 'Registre chamadas com status presente, ausente ou justificado e visualize o histórico.',
  },
  {
    emoji: '🔒',
    title: 'Segurança e confiabilidade',
    description: 'Autenticação JWT, proteção de rotas por perfil e dados sempre íntegros.',
  },
];

const basicFeatures = ['Até 50 alunos', 'Lançamento de notas', 'Controle de frequência', '1 turma', 'Suporte por e-mail'];
const proFeatures = ['Alunos ilimitados', 'Gestão financeira completa', 'Relatórios e exportações', 'Suporte prioritário', 'Turmas ilimitadas', 'Múltiplos professores'];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F0F4F8] font-sans">

      {/* ── NAVBAR ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-[#1E3A5F] text-lg">EduSaaS</span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm text-gray-500 hover:text-[#1E3A5F] transition-colors">Funcionalidades</a>
            <a href="#planos" className="text-sm text-gray-500 hover:text-[#1E3A5F] transition-colors">Planos</a>
            <a href="#contato" className="text-sm text-gray-500 hover:text-[#1E3A5F] transition-colors">Contato</a>
          </nav>

          {/* Desktop CTAs */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-[#1E3A5F] hover:underline">
              Entrar
            </Link>
            <Link
              href="/cadastro"
              className="text-sm font-semibold bg-[#F97316] text-white px-5 py-2.5 rounded-xl hover:bg-[#e86305] transition-colors"
            >
              Começar grátis
            </Link>
          </div>

          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-2 text-gray-500 hover:text-[#1E3A5F]"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {/* Mobile nav */}
        {menuOpen && (
          <div className="md:hidden bg-white border-t border-gray-100 px-6 py-4 flex flex-col gap-4">
            <a href="#funcionalidades" onClick={() => setMenuOpen(false)} className="text-sm text-gray-600">Funcionalidades</a>
            <a href="#planos" onClick={() => setMenuOpen(false)} className="text-sm text-gray-600">Planos</a>
            <a href="#contato" onClick={() => setMenuOpen(false)} className="text-sm text-gray-600">Contato</a>
            <hr className="border-gray-100" />
            <Link href="/login" className="text-sm font-medium text-[#1E3A5F]">Entrar</Link>
            <Link href="/cadastro" className="text-sm font-semibold bg-[#F97316] text-white px-5 py-2.5 rounded-xl text-center hover:bg-[#e86305] transition-colors">
              Começar grátis
            </Link>
          </div>
        )}
      </header>

      {/* ── HERO ── */}
      <section className="bg-white">
        <div className="max-w-4xl mx-auto px-6 py-24 text-center">
          <span className="inline-block text-xs font-semibold bg-orange-50 text-[#F97316] px-4 py-1.5 rounded-full mb-6 border border-orange-100">
            Plataforma educacional SaaS
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[#1E3A5F] leading-tight mb-6">
            Gerencie sua escola<br />
            <span className="text-[#F97316]">de forma inteligente</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Uma plataforma completa para diretores, coordenadores, professores e alunos — tudo integrado, simples e seguro.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link
              href="/cadastro"
              className="bg-[#F97316] text-white font-bold px-8 py-4 rounded-2xl text-base hover:bg-[#e86305] transition-colors shadow-lg shadow-orange-200"
            >
              Começar 14 dias grátis
            </Link>
            <Link
              href="/login"
              className="text-[#1E3A5F] font-medium text-sm hover:underline"
            >
              Já tenho conta →
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4">
            ✓ Sem cartão de crédito &nbsp;·&nbsp; ✓ Cancelamento a qualquer momento
          </p>
        </div>
      </section>

      {/* ── FUNCIONALIDADES ── */}
      <section id="funcionalidades" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">Tudo que sua escola precisa</h2>
            <p className="text-gray-500 max-w-md mx-auto">Módulos integrados para cada perfil, com interface intuitiva e dados em tempo real.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <span className="text-3xl mb-4 block">{f.emoji}</span>
                <h3 className="font-semibold text-[#1E3A5F] mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANOS ── */}
      <section id="planos" className="py-20 px-6 bg-white">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-[#1E3A5F] mb-3">Planos simples e transparentes</h2>
            <p className="text-gray-500">Comece grátis, escale quando precisar.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">

            {/* Básico */}
            <div className="rounded-2xl border border-gray-200 p-8 flex flex-col">
              <div className="mb-6">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Básico</span>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-bold text-[#1E3A5F]">Grátis</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">14 dias de trial — sem cartão</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {basicFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-600">
                    <span className="text-gray-400">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/cadastro"
                className="w-full text-center py-3 rounded-xl border-2 border-[#1E3A5F] text-[#1E3A5F] font-semibold text-sm hover:bg-[#1E3A5F] hover:text-white transition-colors"
              >
                Começar grátis
              </Link>
            </div>

            {/* Pro */}
            <div className="rounded-2xl border-2 border-[#F97316] p-8 flex flex-col relative shadow-lg shadow-orange-100">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[#F97316] text-white text-xs font-bold px-4 py-1.5 rounded-full">
                  ⭐ Mais popular
                </span>
              </div>
              <div className="mb-6">
                <span className="text-xs font-semibold text-[#F97316] uppercase tracking-widest">Pro</span>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-lg font-medium text-gray-400 mb-1">R$</span>
                  <span className="text-4xl font-bold text-[#1E3A5F]">97</span>
                  <span className="text-gray-400 mb-1">/mês</span>
                </div>
                <p className="text-sm text-gray-400 mt-1">Tudo que sua escola precisa</p>
              </div>
              <ul className="space-y-3 flex-1 mb-8">
                {proFeatures.map((item) => (
                  <li key={item} className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                    <span className="text-[#F97316]">✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/planos"
                className="w-full text-center py-3 rounded-xl bg-[#F97316] text-white font-semibold text-sm hover:bg-[#e86305] transition-colors shadow-md shadow-orange-200"
              >
                Assinar agora
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CONTATO / CTA FINAL ── */}
      <section id="contato" className="py-20 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-[#1E3A5F] mb-4">Pronto para começar?</h2>
          <p className="text-gray-500 mb-8">Crie sua conta em menos de 2 minutos e experimente grátis por 14 dias.</p>
          <Link
            href="/cadastro"
            className="inline-block bg-[#1E3A5F] text-white font-bold px-10 py-4 rounded-2xl text-base hover:bg-[#162d4a] transition-colors"
          >
            Criar minha conta
          </Link>
          <p className="text-xs text-gray-400 mt-4">Tem alguma dúvida? Fale com a gente pelo suporte.</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1E3A5F] text-white px-6 py-10">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-white/10 rounded-lg flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-white">EduSaaS</span>
            <span className="text-white/40 text-sm ml-2">© 2025</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/login" className="text-white/60 text-sm hover:text-white transition-colors">Entrar</Link>
            <Link href="/cadastro" className="text-white/60 text-sm hover:text-white transition-colors">Cadastrar</Link>
            <Link href="/planos" className="text-white/60 text-sm hover:text-white transition-colors">Planos</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
