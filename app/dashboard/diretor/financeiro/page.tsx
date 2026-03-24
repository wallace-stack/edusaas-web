'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, DollarSign, AlertTriangle, TrendingUp, TrendingDown, CheckCircle } from 'lucide-react';

interface Tuition {
  id: number;
  amount: number;
  dueDate: string;
  status: string;
  reference: string;
  student?: { name: string };
}

interface Defaulter {
  id: number;
  student: string;
  amount: number;
  dueDate: string;
  reference: string;
  daysOverdue: number;
}

interface Report {
  period: string;
  summary: {
    totalRevenue: number;
    totalPending: number;
    totalOverdue: number;
    totalExpenses: number;
    balance: number;
    defaultRate: string;
  };
}

interface CashFlow {
  id: number;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  date: string;
}

export default function FinanceiroPage() {
  const router = useRouter();
  const user = getUser();
  const [report, setReport] = useState<Report | null>(null);
  const [defaulters, setDefaulters] = useState<Defaulter[]>([]);
  const [cashflows, setCashflows] = useState<CashFlow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showCashFlowModal, setShowCashFlowModal] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'resumo' | 'inadimplentes' | 'fluxo'>('resumo');

  const [tuitionForm, setTuitionForm] = useState({
    studentId: '',
    amount: '',
    dueDate: '',
    reference: '',
  });

  const [cashFlowForm, setCashFlowForm] = useState({
    type: 'expense',
    category: 'other',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reportRes, defaultersRes, studentsRes, cashflowRes] = await Promise.all([
        api.get(`/finance/report?month=${currentMonth}&year=${currentYear}`),
        api.get('/finance/defaulters'),
        api.get('/users?role=student'),
        api.get('/finance/cashflow'),
      ]);
      setReport(reportRes.data);
      setDefaulters(defaultersRes.data);
      setStudents(studentsRes.data);
      setCashflows(cashflowRes.data);
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
      await api.post('/finance/tuitions', {
        ...tuitionForm,
        studentId: Number(tuitionForm.studentId),
        amount: Number(tuitionForm.amount),
      });
      setShowModal(false);
      setTuitionForm({ studentId: '', amount: '', dueDate: '', reference: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar mensalidade');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.post('/finance/cashflow', {
        ...cashFlowForm,
        amount: Number(cashFlowForm.amount),
      });
      setShowCashFlowModal(false);
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao lançar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

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
              onClick={() => setShowCashFlowModal(true)}
              className="flex items-center gap-2 border border-[#1E3A5F] text-[#1E3A5F] px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-50"
            >
              <Plus size={16} />
              Lançamento
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a]"
            >
              <Plus size={16} />
              Mensalidade
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white rounded-xl p-1 border border-gray-100 w-fit">
          {(['resumo', 'inadimplentes', 'fluxo'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${activeTab === tab ? 'bg-[#1E3A5F] text-white' : 'text-gray-500 hover:text-gray-700'}`}
            >
              {tab === 'resumo' ? 'Resumo' : tab === 'inadimplentes' ? 'Inadimplentes' : 'Fluxo de Caixa'}
            </button>
          ))}
        </div>

        {/* Resumo */}
        {activeTab === 'resumo' && report && (
          <div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingUp size={20} className="text-green-600" />
                </div>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  R$ {report.summary.totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Receita total</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                  <TrendingDown size={20} className="text-red-600" />
                </div>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  R$ {report.summary.totalExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Total de despesas</p>
              </div>

              <div className={`rounded-2xl p-6 border ${report.summary.balance >= 0 ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center mb-4">
                  <DollarSign size={20} className={report.summary.balance >= 0 ? 'text-green-600' : 'text-red-600'} />
                </div>
                <p className={`text-2xl font-bold ${report.summary.balance >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  R$ {report.summary.balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Saldo do mês</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
                  <AlertTriangle size={20} className="text-orange-600" />
                </div>
                <p className="text-2xl font-bold text-orange-500">
                  R$ {report.summary.totalOverdue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Em atraso</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                  <CheckCircle size={20} className="text-blue-600" />
                </div>
                <p className="text-2xl font-bold text-[#1E3A5F]">
                  R$ {report.summary.totalPending.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
                <p className="text-sm text-gray-500 mt-1">Pendente</p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
                  <AlertTriangle size={20} className="text-red-600" />
                </div>
                <p className="text-2xl font-bold text-red-500">{report.summary.defaultRate}</p>
                <p className="text-sm text-gray-500 mt-1">Taxa de inadimplência</p>
              </div>
            </div>
          </div>
        )}

        {/* Inadimplentes */}
        {activeTab === 'inadimplentes' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {defaulters.length === 0 ? (
              <div className="p-8 text-center">
                <CheckCircle size={40} className="text-green-500 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Nenhum inadimplente!</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Aluno</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Referência</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Dias em atraso</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {defaulters.map((d) => (
                    <tr key={d.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                            <span className="text-red-600 text-xs font-bold">{d.student?.charAt(0).toUpperCase()}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700">{d.student}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-500">{d.reference}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-red-600">
                          R$ {Number(d.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-xs px-2 py-1 bg-red-50 text-red-700 rounded-full font-medium">
                          {d.daysOverdue} dias
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Fluxo de caixa */}
        {activeTab === 'fluxo' && (
          <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
            {cashflows.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-400 text-sm">Nenhum lançamento registrado.</p>
                <p className="text-xs text-gray-400 mt-1">Use o botão "Lançamento" para registrar entradas e saídas.</p>
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Data</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Descrição</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tipo</th>
                    <th className="text-right px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Valor</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cashflows.map((cf) => (
                    <tr key={cf.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500">
                          {new Date(cf.date).toLocaleDateString('pt-BR')}
                        </span>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <span className="text-sm text-gray-700">{cf.description}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${cf.type === 'income' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {cf.type === 'income' ? 'Entrada' : 'Saída'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className={`text-sm font-bold ${cf.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                          {cf.type === 'expense' ? '- ' : '+ '}
                          R$ {Number(cf.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

      </main>

      {/* Modal mensalidade */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">Nova mensalidade</h2>
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
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal fluxo de caixa */}
      {showCashFlowModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">Novo lançamento</h2>
            <form onSubmit={handleCreateCashFlow} className="space-y-3">
              <select
                value={cashFlowForm.type}
                onChange={(e) => setCashFlowForm({ ...cashFlowForm, type: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                <option value="income">Entrada</option>
                <option value="expense">Saída</option>
              </select>
              <select
                value={cashFlowForm.category}
                onChange={(e) => setCashFlowForm({ ...cashFlowForm, category: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                <option value="tuition">Mensalidade</option>
                <option value="salary">Salário</option>
                <option value="maintenance">Manutenção</option>
                <option value="supplies">Material</option>
                <option value="other">Outros</option>
              </select>
              <input
                value={cashFlowForm.amount}
                onChange={(e) => setCashFlowForm({ ...cashFlowForm, amount: e.target.value })}
                type="number"
                placeholder="Valor (R$)"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <input
                value={cashFlowForm.description}
                onChange={(e) => setCashFlowForm({ ...cashFlowForm, description: e.target.value })}
                placeholder="Descrição"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <input
                value={cashFlowForm.date}
                onChange={(e) => setCashFlowForm({ ...cashFlowForm, date: e.target.value })}
                type="date"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowCashFlowModal(false)} className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium disabled:opacity-50">
                  {saving ? 'Salvando...' : 'Lançar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}