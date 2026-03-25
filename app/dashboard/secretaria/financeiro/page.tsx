'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface Tuition {
  id: number;
  amount: number;
  dueDate: string;
  paidAt?: string;
  status: 'pago' | 'pendente' | 'vencido';
  reference: string;
  student?: { name: string };
}

const statusLabel: Record<string, string> = {
  pago: 'Pago',
  pendente: 'Pendente',
  vencido: 'Vencido',
};

const statusColor: Record<string, string> = {
  pago: 'bg-green-50 text-green-700',
  pendente: 'bg-orange-50 text-orange-700',
  vencido: 'bg-red-50 text-red-700',
};

export default function SecretariaFinanceiroPage() {
  const router = useRouter();
  const user = getUser();
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [showTuitionModal, setShowTuitionModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedTuition, setSelectedTuition] = useState<Tuition | null>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [tuitionForm, setTuitionForm] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    reference: '',
  });

  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'pix',
    paidAt: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadData();
  }, [statusFilter]);

  const loadData = async () => {
    try {
      const params = statusFilter ? `?status=${statusFilter}` : '';
      const [tuitionsRes, studentsRes] = await Promise.all([
        api.get(`/secretary/financial${params}`),
        api.get('/secretary/students'),
      ]);
      setTuitions(tuitionsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTuition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.post('/secretary/financial/tuition', {
        ...tuitionForm,
        studentId: Number(tuitionForm.studentId),
        amount: Number(tuitionForm.amount),
      });
      setShowTuitionModal(false);
      setTuitionForm({ studentId: '', amount: '', dueDate: '', reference: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao lançar mensalidade');
    } finally {
      setSaving(false);
    }
  };

  const handleRegisterPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTuition) return;
    try {
      setSaving(true);
      setError('');
      await api.post('/secretary/financial/payment', {
        tuitionId: selectedTuition.id,
        ...paymentForm,
      });
      setShowPaymentModal(false);
      setSelectedTuition(null);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar pagamento');
    } finally {
      setSaving(false);
    }
  };

  const openPaymentModal = (tuition: Tuition) => {
    setSelectedTuition(tuition);
    setError('');
    setShowPaymentModal(true);
  };

  const total = tuitions.length;
  const pagos = tuitions.filter(t => t.status === 'pago').length;
  const pendentes = tuitions.filter(t => t.status === 'pendente').length;
  const vencidos = tuitions.filter(t => t.status === 'vencido').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="font-bold text-[#1E3A5F]">Financeiro</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => { setError(''); setShowTuitionModal(true); }}
              className="flex items-center gap-2 border border-[#1E3A5F] text-[#1E3A5F] px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50 transition-colors"
            >
              <Plus size={16} />
              Lançar mensalidade
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Resumo rápido */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle size={18} className="text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1E3A5F]">{pagos}</p>
                <p className="text-xs text-gray-500">Pagas</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-orange-50 rounded-xl flex items-center justify-center">
                <Clock size={18} className="text-orange-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1E3A5F]">{pendentes}</p>
                <p className="text-xs text-gray-500">Pendentes</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-red-50 rounded-xl flex items-center justify-center">
                <AlertTriangle size={18} className="text-red-500" />
              </div>
              <div>
                <p className="text-xl font-bold text-red-500">{vencidos}</p>
                <p className="text-xs text-gray-500">Vencidas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filtro por status */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          {[
            { value: '', label: 'Todas' },
            { value: 'pago', label: 'Pagas' },
            { value: 'pendente', label: 'Pendentes' },
            { value: 'vencido', label: 'Vencidas' },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${statusFilter === opt.value ? 'bg-[#1E3A5F] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Tabela */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : tuitions.length === 0 ? (
            <div className="p-8 text-center text-gray-400 text-sm">Nenhuma mensalidade encontrada</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aluno</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Referência</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Vencimento</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tuitions.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">
                            {t.student?.name?.charAt(0).toUpperCase() ?? '?'}
                          </span>
                        </div>
                        <span className="text-sm font-medium text-gray-700">{t.student?.name ?? '—'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">{t.reference}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-[#1E3A5F]">
                        R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500">
                        {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusColor[t.status] ?? 'bg-gray-50 text-gray-600'}`}>
                        {statusLabel[t.status] ?? t.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {t.status !== 'pago' && (
                        <button
                          onClick={() => openPaymentModal(t)}
                          className="text-xs text-[#1E3A5F] font-medium hover:underline"
                        >
                          Registrar pagamento
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal lançar mensalidade */}
      {showTuitionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">Lançar mensalidade</h2>
            <form onSubmit={handleCreateTuition} className="space-y-3">
              <select
                value={tuitionForm.studentId}
                onChange={(e) => setTuitionForm({ ...tuitionForm, studentId: e.target.value })}
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                <option value="">Selecione o aluno</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              <input
                value={tuitionForm.amount}
                onChange={(e) => setTuitionForm({ ...tuitionForm, amount: e.target.value })}
                type="number"
                placeholder="Valor (R$)"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <input
                value={tuitionForm.dueDate}
                onChange={(e) => setTuitionForm({ ...tuitionForm, dueDate: e.target.value })}
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <input
                value={tuitionForm.reference}
                onChange={(e) => setTuitionForm({ ...tuitionForm, reference: e.target.value })}
                placeholder="Referência (ex: Março/2026)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowTuitionModal(false); setError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Lançando...' : 'Lançar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal registrar pagamento */}
      {showPaymentModal && selectedTuition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-1">Registrar pagamento</h2>
            <p className="text-sm text-gray-500 mb-4">
              {selectedTuition.student?.name} — {selectedTuition.reference} —{' '}
              R$ {Number(selectedTuition.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>
            <form onSubmit={handleRegisterPayment} className="space-y-3">
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentMethod: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                <option value="pix">PIX</option>
                <option value="dinheiro">Dinheiro</option>
                <option value="cartao">Cartão</option>
                <option value="boleto">Boleto</option>
                <option value="transferencia">Transferência</option>
              </select>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Data do pagamento</label>
                <input
                  value={paymentForm.paidAt}
                  onChange={(e) => setPaymentForm({ ...paymentForm, paidAt: e.target.value })}
                  type="date"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowPaymentModal(false); setError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Registrando...' : 'Confirmar pagamento'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
