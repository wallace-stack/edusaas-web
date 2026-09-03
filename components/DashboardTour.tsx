'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export interface TourStep {
  icon: React.ElementType;
  title: string;
  description: string;
  color: string;
}

interface Props {
  greeting: string;
  steps: TourStep[];
  onClose: () => void;
}

/**
 * Tour guiado de primeiro login (professor/coordenador/aluno) — orientação, não
 * criação de dado, ao contrário do wizard do diretor (OnboardingWizard.tsx), que
 * cria turma/professor/aluno de verdade porque é o diretor quem monta a escola.
 * Compartilhado entre os três papéis, conteúdo (steps) vem de cada dashboard.
 */
export default function DashboardTour({ greeting, steps, onClose }: Props) {
  const [step, setStep] = useState(0);
  const current = steps[step];
  const isLast = step === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}>
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-sm
                      animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600
                     dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-8 pb-2 text-center">
          <p className="text-[11px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">
            {greeting}
          </p>
          <div className={`w-14 h-14 ${current.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
            <current.icon size={26} />
          </div>
          <h2 className="font-bold text-[#1E3A5F] dark:text-white text-lg mb-2">{current.title}</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{current.description}</p>
        </div>

        <div className="flex items-center justify-center gap-1.5 py-5">
          {steps.map((_, i) => (
            <div key={i} className={`h-1.5 rounded-full transition-all ${
              i === step ? 'w-6 bg-[#1E3A5F] dark:bg-white' : 'w-1.5 bg-gray-200 dark:bg-gray-700'
            }`} />
          ))}
        </div>

        <div className="px-6 pb-6 space-y-2">
          <button
            onClick={() => { if (isLast) onClose(); else setStep(s => s + 1); }}
            className="w-full py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors"
          >
            {isLast ? 'Concluir' : 'Próximo'}
          </button>
          {!isLast && (
            <button onClick={onClose} className="w-full py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              Pular
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
