'use client';

import { useState } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import api from '@/app/lib/api';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { clearAuth } from '@/app/lib/auth';

interface Props {
  onClose: () => void;
}

const MOTIVOS = [
  'Preço muito alto',
  'Não uso todas as funcionalidades',
  'Encontrei outro sistema',
  'Escola fechou ou pausou atividades',
  'Problemas técnicos',
  'Outro motivo',
];

export default function CancelarPlano({ onClose }: Props) {
  const router = useRouter();
  const [step, setStep] = useState<'confirm' | 'reason' | 'done'>('confirm');
  const [reason, setReason] = useState('');
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await api.post('/schools/cancel', { reason });
      setStep('done');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Erro ao cancelar plano');
    } finally {
      setCancelling(false);
    }
  };

  const handleFinish = () => {
    clearAuth();
    router.push('/planos');
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" />
            <h2 className="font-bold text-gray-900 dark:text-white text-sm">Cancelar plano</h2>
          </div>
          {step !== 'done' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={18} />
            </button>
          )}
        </div>

        <div className="p-6">
          {step === 'confirm' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Tem certeza que deseja cancelar seu plano? Após o cancelamento:
              </p>
              <ul className="space-y-2 text-sm text-gray-500 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                  Todos os usuários perderão acesso imediatamente
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-400 shrink-0 mt-0.5">✗</span>
                  Os dados ficam salvos por 30 dias
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 shrink-0 mt-0.5">✓</span>
                  Você pode reativar a qualquer momento escolhendo um plano
                </li>
              </ul>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                >
                  Manter plano
                </button>
                <button
                  onClick={() => setStep('reason')}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors"
                >
                  Continuar cancelamento
                </button>
              </div>
            </div>
          )}

          {step === 'reason' && (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Pode nos dizer o motivo? Sua resposta nos ajuda a melhorar.
              </p>
              <div className="space-y-2">
                {MOTIVOS.map(m => (
                  <button
                    key={m}
                    onClick={() => setReason(m)}
                    className={`w-full text-left px-4 py-2.5 rounded-xl border text-sm transition-colors ${
                      reason === m
                        ? 'border-red-400 bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                        : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep('confirm')}
                  className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400"
                >
                  Voltar
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium disabled:opacity-50 transition-colors"
                >
                  {cancelling ? 'Cancelando...' : 'Confirmar cancelamento'}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
                <span className="text-3xl">😔</span>
              </div>
              <div>
                <p className="font-semibold text-gray-800 dark:text-white">Plano cancelado</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Sentiremos sua falta. Seus dados ficam salvos por 30 dias.
                </p>
              </div>
              <button
                onClick={handleFinish}
                className="w-full py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] transition-colors"
              >
                Escolher novo plano
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
