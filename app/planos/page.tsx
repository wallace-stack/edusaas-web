'use client';

import Link from 'next/link';
import { Check, Zap, Star } from 'lucide-react';

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
    <div className="min-h-screen bg-[#F0F4F8] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <Zap size={16} className="text-white" />
            </div>
            <span className="font-bold text-[#1E3A5F] text-lg">EduSaaS</span>
          </Link>
          <Link
            href="/login"
            className="text-sm text-gray-500 hover:text-[#1E3A5F] transition-colors"
          >
            Já tenho conta →
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="text-center px-6 pt-16 pb-12">
        <h1 className="text-3xl sm:text-4xl font-bold text-[#1E3A5F] mb-3">
          Escolha seu plano
        </h1>
        <p className="text-gray-500 text-base sm:text-lg max-w-md mx-auto">
          Continue gerenciando sua escola sem interrupções
        </p>
      </section>

      {/* Cards */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-6 pb-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-stretch">

          {/* Plano Básico */}
          <div className="bg-white rounded-2xl border border-gray-200 p-8 flex flex-col">
            <div className="mb-6">
              <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Básico</span>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-4xl font-bold text-[#1E3A5F]">Grátis</span>
              </div>
              <p className="text-sm text-gray-400 mt-1">14 dias de trial — sem cartão</p>
            </div>

            <ul className="space-y-3 flex-1 mb-8">
              {basicFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-gray-500" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-gray-600">{feature}</span>
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

          {/* Plano Pro */}
          <div className="bg-white rounded-2xl border-2 border-[#F97316] p-8 flex flex-col relative shadow-lg shadow-orange-100">
            {/* Badge */}
            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
              <span className="bg-[#F97316] text-white text-xs font-bold px-4 py-1.5 rounded-full flex items-center gap-1.5">
                <Star size={11} fill="white" />
                Mais popular
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
              {proFeatures.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <Check size={11} className="text-[#F97316]" strokeWidth={3} />
                  </div>
                  <span className="text-sm text-gray-700 font-medium">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => alert('Em breve!')}
              className="w-full py-3 rounded-xl bg-[#F97316] text-white font-semibold text-sm hover:bg-[#e86305] transition-colors shadow-md shadow-orange-200"
            >
              Assinar agora
            </button>
          </div>

        </div>

        {/* Footer link */}
        <p className="text-center text-sm text-gray-400 mt-10">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-[#1E3A5F] font-medium hover:underline">
            Entrar
          </Link>
        </p>
      </main>

    </div>
  );
}
