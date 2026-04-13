'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, DollarSign, TrendingUp, AlertTriangle, Users, Search } from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Title,
} from 'chart.js';
import { Bar, Doughnut } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title);

interface FinancialData {
  totalStudents: number;
  mensalidadeUnitaria: number;
  totalEsperado: number;
  totalRecebido: number;
  totalInadimplente: number;
  adimplentes: number;
  inadimplentes: number;
  taxaAdimplencia: number;
  faturamentoMensal: { mes: string; recebido: number; esperado: number }[];
  students: { id: number; name: string; className: string; paymentStatus: string; valor: number }[];
}

function fmt(val: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
}

export default function DiretorFinanceiroPage() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<FinancialData | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/metrics/director/financial')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (!data) return null;

  const barData = {
    labels: data.faturamentoMensal.map(m => m.mes),
    datasets: [
      {
        label: 'Receita Recebida',
        data: data.faturamentoMensal.map(m => m.recebido),
        backgroundColor: '#6366f1',
        borderRadius: 6,
      },
      {
        label: 'Meta (Esperado)',
        data: data.faturamentoMensal.map(m => m.esperado),
        backgroundColor: 'rgba(99,102,241,0.15)',
        borderColor: '#6366f1',
        borderWidth: 2,
        borderDash: [5, 5],
        borderRadius: 6,
        type: 'bar' as const,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => ` ${fmt(ctx.raw)}`,
        },
      },
    },
    scales: {
      y: {
        ticks: { callback: (v: any) => fmt(Number(v)) },
        grid: { color: 'rgba(0,0,0,0.05)' },
      },
    },
  };

  const doughnutData = {
    labels: ['Adimplentes', 'Inadimplentes'],
    datasets: [{
      data: [data.adimplentes, data.inadimplentes],
      backgroundColor: ['#22c55e', '#ef4444'],
      borderWidth: 0,
    }],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 800 },
    cutout: '65%',
    plugins: {
      legend: { position: 'top' as const },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const pct = Math.round((ctx.raw / data.totalStudents) * 100);
            return ` ${ctx.raw} alunos (${pct}%)`;
          },
        },
      },
    },
  };

  const filteredStudents = data.students
    .filter(s => {
      const matchSearch = s.name.toLowerCase().includes(search.toLowerCase());
      const matchStatus = !statusFilter || s.paymentStatus === statusFilter;
      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (a.paymentStatus === b.paymentStatus) return a.name.localeCompare(b.name);
      return a.paymentStatus === 'Inadimplente' ? -1 : 1;
    });

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Financeiro</h1>
            <p className="text-xs text-gray-400 dark:text-gray-500">Visão geral da receita escolar</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Cards de resumo */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center mb-3">
              <DollarSign size={18} className="text-indigo-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Receita esperada</p>
            <p className="text-xl font-bold text-[#1E3A5F] dark:text-white">{fmt(data.totalEsperado)}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Receita recebida</p>
            <p className="text-xl font-bold text-green-600">{fmt(data.totalRecebido)}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle size={18} className="text-red-500" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Inadimplência</p>
            <p className="text-xl font-bold text-red-500">{fmt(data.totalInadimplente)}</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-3">
              <Users size={18} className="text-blue-600" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Taxa de adimplência</p>
            <p className="text-xl font-bold text-blue-600">{data.taxaAdimplencia}%</p>
          </div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Gráfico de barras */}
          <div className="lg:col-span-2 bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1E3A5F] dark:text-white mb-4">Faturamento Mensal</h2>
            <div style={{ height: 300 }}>
              <Bar data={barData} options={barOptions} />
            </div>
          </div>

          {/* Gráfico de rosca */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 border border-gray-100 dark:border-gray-800 shadow-sm">
            <h2 className="text-sm font-semibold text-[#1E3A5F] dark:text-white mb-4">Adimplência vs Inadimplência</h2>
            <div style={{ height: 250 }} className="relative">
              <Doughnut data={doughnutData} options={doughnutOptions} />
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="text-center">
                  <p className="text-2xl font-bold text-[#1E3A5F] dark:text-white">{data.taxaAdimplencia}%</p>
                  <p className="text-[10px] text-gray-400">em dia</p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-around text-center">
              <div>
                <p className="text-lg font-bold text-green-600">{data.adimplentes}</p>
                <p className="text-xs text-gray-400">Adimplentes</p>
              </div>
              <div>
                <p className="text-lg font-bold text-red-500">{data.inadimplentes}</p>
                <p className="text-xs text-gray-400">Inadimplentes</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabela de alunos */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-sm font-semibold text-[#1E3A5F] dark:text-white mb-3">Status Financeiro por Aluno</h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar por nome..."
                  className="w-full pl-8 pr-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                <option value="">Todos os status</option>
                <option value="Em dia">Em dia</option>
                <option value="Inadimplente">Inadimplente</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Nome</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 hidden sm:table-cell">Turma</th>
                  <th className="text-left px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Status</th>
                  <th className="text-right px-4 sm:px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filteredStudents.map(s => (
                  <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 sm:px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-[10px] font-bold">{s.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{s.className}</span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                        s.paymentStatus === 'Em dia'
                          ? 'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300'
                          : 'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300'
                      }`}>
                        {s.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-3.5 text-right">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{fmt(s.valor)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
