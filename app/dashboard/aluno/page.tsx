'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { BookOpen, CheckSquare, DollarSign, Bell, LogOut, TrendingUp, AlertTriangle, Newspaper, ArrowLeft } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface Grade {
  id: number;
  value: number;
  type: string;
  description: string;
  subject: { name: string };
  createdAt: string;
}

interface AttendanceSummary {
  summary: { total: number; present: number; absent: number; percentage: number };
  status: string;
}

interface Tuition {
  id: number;
  amount: number;
  dueDate: string;
  status: string;
  reference: string;
}

export default function AlunoDashboard() {
  const router = useRouter();
  const user = getUser();
  const [grades, setGrades] = useState<Grade[]>([]);
  const [attendance, setAttendance] = useState<AttendanceSummary | null>(null);
  const [tuitions, setTuitions] = useState<Tuition[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'student') {
      router.push('/login');
      return;
    }
    loadData();
    api.get('/notifications/unread-count')
      .then(r => { const c = typeof r.data === 'number' ? r.data : r.data?.count || 0; setUnreadCount(c); })
      .catch(() => {});
  }, []);

  const loadData = async () => {
    try {
      const [gradesRes, attendanceRes, tuitionsRes] = await Promise.all([
        api.get('/grades/my-grades'),
        api.get('/attendance/my-attendance'),
        api.get('/finance/tuitions/my'),
      ]);
      setGrades(gradesRes.data.slice(0, 5));
      setAttendance(attendanceRes.data);
      setTuitions(tuitionsRes.data.filter((t: Tuition) => t.status !== 'paid').slice(0, 3));
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'text-green-600 bg-green-50 dark:bg-green-950';
      case 'overdue': return 'text-red-600 bg-red-50 dark:bg-red-950';
      default: return 'text-orange-600 bg-orange-50 dark:bg-orange-950';
    }
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'paid': return 'Pago';
      case 'overdue': return 'Vencido';
      default: return 'Pendente';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">E</span>
              </div>
              <span className="font-bold text-[#1E3A5F] dark:text-white">Walladm</span>
              <span className="text-gray-300 dark:text-gray-600 hidden sm:block">|</span>
              <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:block">Portal do Aluno</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/aluno/notificacoes')} className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button onClick={() => router.push('/dashboard/perfil')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{user?.name}</span>
            </button>
            <ThemeToggle />
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-xl font-bold text-[#1E3A5F] dark:text-white">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acompanhe seu desempenho escolar.</p>
        </div>

        {/* Cards de resumo */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-white">{grades.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Notas lançadas</p>
          </div>

          <div className={`rounded-2xl p-6 border ${attendance && attendance.summary.percentage < 75 ? 'bg-red-50 dark:bg-red-950 border-red-100 dark:border-red-800' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800'}`}>
            <div className="w-10 h-10 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center mb-4">
              <CheckSquare size={20} className="text-green-600" />
            </div>
            <p className={`text-3xl font-bold ${attendance && attendance.summary.percentage < 75 ? 'text-red-500' : 'text-[#1E3A5F] dark:text-white'}`}>
              {attendance?.summary.percentage || 0}%
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Frequência</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 rounded-xl flex items-center justify-center mb-4">
              <DollarSign size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-white">{tuitions.length}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Mensalidades pendentes</p>
          </div>
        </div>

        {/* Alerta de frequência */}
        {attendance && attendance.summary.percentage < 75 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">Frequência irregular!</p>
              <p className="text-xs text-red-500 dark:text-red-400">Sua frequência está abaixo de 75% — risco de reprovação.</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Últimas notas */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1E3A5F] dark:text-white">Últimas notas</h2>
              <button onClick={() => router.push('/dashboard/aluno/notas')} className="text-xs text-[#F97316] hover:underline">
                Ver todas
              </button>
            </div>
            {grades.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">Nenhuma nota lançada ainda</p>
            ) : (
              <div className="space-y-3">
                {grades.map((grade) => (
                  <div key={grade.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{grade.subject?.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{grade.description || grade.type}</p>
                    </div>
                    <span className={`text-lg font-bold ${Number(grade.value) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                      {Number(grade.value).toFixed(1)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Mensalidades pendentes */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[#1E3A5F] dark:text-white">Mensalidades</h2>
              <button onClick={() => router.push('/dashboard/aluno/financeiro')} className="text-xs text-[#F97316] hover:underline">
                Ver todas
              </button>
            </div>
            {tuitions.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-sm text-green-600 font-medium">✓ Tudo em dia!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {tuitions.map((tuition) => (
                  <div key={tuition.id} className="flex items-center justify-between py-2 border-b border-gray-50 dark:border-gray-800 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{tuition.reference || 'Mensalidade'}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Vence: {new Date(tuition.dueDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-700 dark:text-gray-200">R$ {Number(tuition.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor(tuition.status)}`}>
                        {statusLabel(tuition.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Menu rápido */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
          {[
            { label: 'Feed', icon: Newspaper, href: '/dashboard/feed', color: 'bg-sky-50 dark:bg-sky-950 text-sky-600' },
            { label: 'Minhas Notas', icon: BookOpen, href: '/dashboard/aluno/notas', color: 'bg-blue-50 dark:bg-blue-950 text-blue-600' },
            { label: 'Frequência', icon: CheckSquare, href: '/dashboard/aluno/frequencia', color: 'bg-green-50 dark:bg-green-950 text-green-600' },
            { label: 'Financeiro', icon: DollarSign, href: '/dashboard/aluno/financeiro', color: 'bg-orange-50 dark:bg-orange-950 text-orange-600' },
            { label: 'Avisos', icon: Bell, href: '/dashboard/aluno/avisos', color: 'bg-purple-50 dark:bg-purple-950 text-purple-600' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left"
            >
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                <item.icon size={20} />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</p>
            </button>
          ))}
        </div>

      </main>
    </div>
  );
}
