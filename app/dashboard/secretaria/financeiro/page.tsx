'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, DollarSign, AlertTriangle, Clock, X, Check } from 'lucide-react';
import { toast } from 'sonner';

interface PendingTuition {
  id: number;
  studentId: number;
  studentName: string;
  amount: number;
  dueDate: string;
  reference: string;
  status: 'pending' | 'overdue';
}

interface FinancialSummary {
  period: string;
  summary: {
    totalRevenue: number;
    totalPending: number;
    totalOverdue: number;
    balance: number;
    defaultRate: string;
  };
}

const PAYMENT_METHODS = [
  { value: 'pix',         label: 'PIX',      icon: '⚡' },
  { value: 'credit_card', label: 'Crédito',  icon: '💳' },
  { value: 'debit_card',  label: 'Débito',   icon: '🏦' },
  { value: 'cash',        label: 'Dinheiro', icon: '💵' },
  { value: 'bank_slip',   label: 'Boleto',   icon: '📄' },
  { value: 'other',       label: 'Outro',    icon: '•••' },
];

function fmt(v: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function fmtDate(d: string) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('pt-BR');
}

export default function SecretariaFinanceiroPage() {
  const router = useRouter();
  const user = getUser();

  const [summary, setSummary] = useState<FinancialSummary | null>(null);
  const [pending, setPending] = useState<PendingTuition[]>([]);
  const [loading, setLoading] = useState(true);

  // modal
  const [selected, setSelected] = useState<PendingTuition | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
  const [paidDate, setPaidDate] = useState(new Date().toISOString().split('T')[0]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    Promise.all([
      api.get('/secretary/financial'),
      api.get('/secretary/financial/pending'),
    ]).then(([s, p]) => {
      setSummary(s.data);
      setPending(p.data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  function openModal(t: PendingTuition) {
    setSelected(t);
    setPaymentMethod('');
    setPaymentNotes('');
    setPaidDate(new Date().toISOString().split('T')[0]);
  }

  function closeModal() {
    setSelected(null);
  }

  async function handlePay() {
    if (!selected) return;
    if (!paymentMethod) { toast.error('Selecione a forma de pagamento.'); return; }
    setSaving(true);
    try {
      await api.post('/secretary/financial/payment', {
        tuitionId: selected.id,
        paymentMethod,
        paymentNotes: paymentNotes || undefined,
        paidDate,
      });
      toast.success(`Pagamento de ${selected.studentName} registrado!`);
      setPending(prev => prev.filter(t => t.id !== selected.id));
      closeModal();
    } catch (e: any) {
      toast.error(e?.response?.data?.message ?? 'Erro ao registrar pagamento.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Financeiro</h1>
            {summary && <p className="text-xs text-gray-400">Período: {summary.period}</p>}
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-6 space-y-5">

        {/* Cards de resumo */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <DollarSign size={16} className="text-indigo-500 mb-2" />
              <p className="text-[10px] text-gray-400 mb-0.5">Recebido</p>
              <p className="text-base font-bold text-green-600">{fmt(summary.summary.totalRevenue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <Clock size={16} className="text-amber-500 mb-2" />
              <p className="text-[10px] text-gray-400 mb-0.5">Pendente</p>
              <p className="text-base font-bold text-amber-600">{fmt(summary.summary.totalPending)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <AlertTriangle size={16} className="text-red-500 mb-2" />
              <p className="text-[10px] text-gray-400 mb-0.5">Em atraso</p>
              <p className="text-base font-bold text-red-600">{fmt(summary.summary.totalOverdue)}</p>
            </div>
            <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
              <p className="text-[10px] text-gray-400 mb-0.5 mt-5">Inadimplência</p>
              <p className="text-base font-bold text-[#1E3A5F] dark:text-white">{summary.summary.defaultRate}</p>
            </div>
          </div>
        )}

        {/* Lista de mensalidades pendentes */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-[#1E3A5F] dark:text-white">
              Mensalidades pendentes / em atraso
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">{pending.length} lançamento(s)</p>
          </div>

          {pending.length === 0 ? (
            <div className="py-12 text-center">
              <Check size={32} className="text-green-400 mx-auto mb-2" />
              <p className="text-sm text-gray-400">Nenhuma mensalidade em aberto.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-50 dark:divide-gray-800">
              {pending.map(t => (
                <li key={t.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{t.studentName}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {t.reference || 'Sem referência'} · vence {fmtDate(t.dueDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4 flex-shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-gray-700 dark:text-gray-200">{fmt(t.amount)}</p>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                        t.status === 'overdue'
                          ? 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                          : 'bg-amber-50 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                      }`}>
                        {t.status === 'overdue' ? 'Em atraso' : 'Pendente'}
                      </span>
                    </div>
                    <button
                      onClick={() => openModal(t)}
                      className="px-3 py-1.5 rounded-xl bg-[#1E3A5F] text-white text-xs font-medium hover:bg-[#162d4a] transition-colors"
                    >
                      Pagar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>

      {/* Modal de pagamento */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <div>
                <p className="font-semibold text-[#1E3A5F] dark:text-white text-sm">Registrar pagamento</p>
                <p className="text-xs text-gray-400 mt-0.5">{selected.studentName} · {fmt(selected.amount)}</p>
              </div>
              <button onClick={closeModal} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Data do pagamento */}
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5 block">
                  Data do pagamento
                </label>
                <input
                  type="date"
                  value={paidDate}
                  onChange={e => setPaidDate(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Forma de pagamento */}
              <div>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1.5">Forma de pagamento</p>
                <div className="grid grid-cols-3 gap-2">
                  {PAYMENT_METHODS.map(m => (
                    <button
                      key={m.value}
                      type="button"
                      onClick={() => setPaymentMethod(m.value)}
                      className={`flex flex-col items-center gap-1 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                        paymentMethod === m.value
                          ? 'border-[#1E3A5F] bg-[#1E3A5F]/10 text-[#1E3A5F] dark:border-indigo-400 dark:bg-indigo-950 dark:text-indigo-300'
                          : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <span className="text-base">{m.icon}</span>
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Observações */}
              <div>
                <input
                  value={paymentNotes}
                  onChange={e => setPaymentNotes(e.target.value)}
                  placeholder="Observações (opcional)"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100"
                />
              </div>

              {/* Ações */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handlePay}
                  disabled={saving || !paymentMethod}
                  className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? 'Salvando…' : 'Confirmar pagamento'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
