'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { BookOpen, Users, ClipboardList, LogOut, CheckSquare, Newspaper, Bell } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend } from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Filler, Tooltip, Legend);

interface TeacherData {
  totalGrades: number;
  avgGrade: number;
  totalAttendance: number;
  avgAttendance: number | string;
  totalGradesLaunched?: number;
  totalAttendanceRecords?: number;
  classAttendance?: { className: string; avgRate: number }[];
  subjectAvgGrades?: { subjectName: string; avgGrade: number }[];
}

export default function ProfessorDashboard() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const getSaudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/login');
      return;
    }
    loadDashboard();
    api.get('/notifications/unread-count')
      .then(r => { const c = typeof r.data === 'number' ? r.data : r.data?.count || 0; setUnreadCount(c); })
      .catch(() => {});
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/metrics/teacher');
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
                      <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <img src="/logo-icon.png" alt="Walladm" className="h-9 w-auto" />
            <span className="font-bold text-lg tracking-tight"><span className="text-[#1E3A5F] dark:text-white">Walla</span><span className="text-[#F5A623]">adm</span></span>
          </Link>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Painel do Professor</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/professor/notificacoes')} className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-8">
          {user?.name ? (
            <h1 className="text-2xl font-bold text-[#1E3A5F] dark:text-white">{getSaudacao()}, Prof. {user.name.split(' ')[0]}!</h1>
          ) : (
            <div className="h-7 w-52 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Gerencie suas turmas e lançamentos.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8">
          {[
            {
              value: data?.totalGrades ?? data?.totalGradesLaunched ?? 0,
              label: 'Notas lançadas',
              icon: ClipboardList,
              color: 'bg-blue-50 dark:bg-blue-950 text-blue-600',
              href: '/dashboard/professor/notas/historico',
            },
            {
              value: data?.avgGrade != null ? Number(data.avgGrade).toFixed(2) : '—',
              label: 'Média das notas',
              icon: BookOpen,
              color: 'bg-green-50 dark:bg-green-950 text-green-600',
              href: '/dashboard/professor/notas/historico',
            },
            {
              value: data?.totalAttendance ?? data?.totalAttendanceRecords ?? 0,
              label: 'Chamadas registradas',
              icon: CheckSquare,
              color: 'bg-purple-50 dark:bg-purple-950 text-purple-600',
              href: '/dashboard/professor/chamada/historico',
            },
            {
              value: data?.avgAttendance != null
                ? (String(data.avgAttendance).includes('%')
                  ? data.avgAttendance
                  : `${data.avgAttendance}%`)
                : '0%',
              label: 'Frequência média',
              icon: Users,
              color: 'bg-orange-50 dark:bg-orange-950 text-orange-600',
              href: '/dashboard/professor/chamada/historico',
            },
          ].map(card => (
            <button
              key={card.label}
              onClick={() => router.push(card.href)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 text-left"
            >
              <div className={`w-9 h-9 sm:w-10 sm:h-10 ${card.color} rounded-xl flex items-center justify-center mb-3`}>
                <card.icon size={18} />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] dark:text-white">{card.value}</p>
              <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">{card.label}</p>
            </button>
          ))}
        </div>

        {/* Mini gráficos clicáveis */}
        {data && ((data.classAttendance?.length ?? 0) > 0 || (data.subjectAvgGrades?.length ?? 0) > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-6">
            {/* Frequência das Turmas */}
            {(data.classAttendance?.length ?? 0) > 0 && (
              <button
                onClick={() => router.push('/dashboard/professor/chamada/historico')}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left cursor-pointer hover:opacity-90 hover:shadow-sm transition-all"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Frequência — clique para detalhes
                </p>
                <div style={{ height: 180 }}>
                  <Bar
                    data={{
                      labels: data.classAttendance!.map(c => c.className),
                      datasets: [{
                        label: 'Frequência %',
                        data: data.classAttendance!.map(c => c.avgRate),
                        backgroundColor: data.classAttendance!.map(c => c.avgRate >= 75 ? '#22c55e' : '#ef4444'),
                        borderWidth: 0,
                        borderRadius: 6,
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false, animation: { duration: 700 },
                      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` ${ctx.raw}%` } } },
                      scales: { y: { min: 0, max: 100, ticks: { callback: (v: any) => `${v}%`, font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } },
                    }}
                  />
                </div>
              </button>
            )}

            {/* Médias por Disciplina */}
            {(data.subjectAvgGrades?.length ?? 0) > 0 && (
              <button
                onClick={() => router.push('/dashboard/professor/notas')}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 text-left cursor-pointer hover:opacity-90 hover:shadow-sm transition-all"
              >
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-3">
                  Notas — clique para detalhes
                </p>
                <div style={{ height: 180 }}>
                  <Line
                    data={{
                      labels: data.subjectAvgGrades!.map(s => s.subjectName),
                      datasets: [{
                        label: 'Média',
                        data: data.subjectAvgGrades!.map(s => s.avgGrade),
                        borderColor: '#6366f1',
                        backgroundColor: 'rgba(99,102,241,0.12)',
                        fill: true,
                        tension: 0.4,
                        pointRadius: 4,
                        borderWidth: 2,
                      }],
                    }}
                    options={{
                      responsive: true, maintainAspectRatio: false, animation: { duration: 700 },
                      plugins: { legend: { display: false }, tooltip: { callbacks: { label: (ctx: any) => ` Média: ${ctx.raw}` } } },
                      scales: { y: { min: 0, max: 10, ticks: { font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.05)' } }, x: { grid: { display: false }, ticks: { font: { size: 10 } } } },
                    }}
                  />
                </div>
              </button>
            )}
          </div>
        )}

        {/* Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Feed',              icon: Newspaper,     href: '/dashboard/feed',                       color: 'bg-sky-50 dark:bg-sky-950 text-sky-600',        hint: 'Mural da escola' },
            { label: 'Lançar Notas',      icon: ClipboardList, href: '/dashboard/professor/notas',            color: 'bg-blue-50 dark:bg-blue-950 text-blue-600',     hint: 'Notas por turma' },
            { label: 'Registrar Chamada', icon: CheckSquare,   href: '/dashboard/professor/chamada',          color: 'bg-green-50 dark:bg-green-950 text-green-600',  hint: 'Frequência diária' },
            { label: 'Minhas Turmas',     icon: BookOpen,      href: '/dashboard/professor/turmas',           color: 'bg-purple-50 dark:bg-purple-950 text-purple-600',hint: 'Turmas e disciplinas' },
            { label: 'Avisos da Turma',   icon: Bell,          href: '/dashboard/professor/notificacoes',     color: 'bg-orange-50 dark:bg-orange-950 text-orange-600',hint: 'Avisos institucionais' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm hover:scale-[1.02] active:scale-[0.98] transition-all duration-150 text-left"
            >
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                <item.icon size={20} />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{item.hint}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
