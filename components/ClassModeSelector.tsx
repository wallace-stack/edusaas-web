'use client';

import { GraduationCap, Baby } from 'lucide-react';

export interface InfantilConfig {
  useConceito: boolean;
  useParecer: boolean;
  useDiarioBordo: boolean;
  usePlanejamento: boolean;
}

// Padrão único pros quatro pontos de entrada que ativam modo infantil (onboarding,
// criar turma do diretor/secretaria, gerenciar turma da secretaria): os 4 recursos
// ligados — são o que define o módulo infantil, desligado mostra só um pedaço do
// produto pra quem acabou de comprar. Espelha DEFAULT_INFANTIL_CONFIG do backend
// (class.entity.ts); front não importa do backend, mas o valor precisa ser igual.
export const DEFAULT_INFANTIL_CONFIG: InfantilConfig = {
  useConceito: true,
  useParecer: true,
  useDiarioBordo: true,
  usePlanejamento: true,
};

const FEATURES = [
  { key: 'useConceito', label: 'Avaliação por conceito', desc: 'Desenvolvido / Em desenvolvimento / Não desenvolvido' },
  { key: 'useParecer', label: 'Parecer descritivo', desc: 'Texto livre por aluno por bimestre' },
  { key: 'useDiarioBordo', label: 'Diário de bordo', desc: 'Registro diário do que aconteceu na turma' },
  { key: 'usePlanejamento', label: 'Planejamento diário', desc: 'Objetivos, atividades e recursos do dia' },
] as const;

interface Props {
  mode: 'regular' | 'infantil';
  onModeChange: (mode: 'regular' | 'infantil') => void;
  infantilConfig: InfantilConfig;
  onInfantilConfigChange: (cfg: InfantilConfig) => void;
}

export default function ClassModeSelector({ mode, onModeChange, infantilConfig, onInfantilConfigChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['regular', 'infantil'] as const).map(m => (
          <button
            key={m}
            type="button"
            onClick={() => onModeChange(m)}
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-3 rounded-xl text-sm font-medium leading-none border-2 whitespace-nowrap transition-all ${
              mode === m
                ? m === 'infantil'
                  ? 'border-purple-500 bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300'
                  : 'border-[#1E3A5F] bg-blue-50 dark:bg-blue-950 text-[#1E3A5F] dark:text-blue-300'
                : 'border-gray-200 dark:border-gray-700 text-gray-400 hover:border-gray-300'
            }`}
          >
            {m === 'regular' ? <GraduationCap size={16} className="shrink-0" /> : <Baby size={16} className="shrink-0" />}
            {m === 'regular' ? 'Regular' : 'Infantil'}
          </button>
        ))}
      </div>

      {mode === 'infantil' && (
        <div className="bg-purple-50 dark:bg-purple-950/40 rounded-2xl p-4 space-y-3">
          <p className="text-xs font-semibold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-1">Recursos ativos</p>
          {FEATURES.map(({ key, label, desc }) => (
            <label key={key} className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={infantilConfig[key]}
                onChange={e => onInfantilConfigChange({ ...infantilConfig, [key]: e.target.checked })}
                className="mt-0.5 w-4 h-4 accent-purple-600 flex-shrink-0"
              />
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{label}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500">{desc}</p>
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
