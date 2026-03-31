'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { Users, AlertTriangle, LogOut, Bell, BookOpen, TrendingDown, Newspaper, ClipboardList, UserCog } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface CoordinatorData {
  totalStudents: number;
  atRiskStudents: number;
  irregularAttendance: number;
  alerts: { gradesAlert: string | null; attendanceAlert: string | null };
}

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Bom dia';
  if (h < 18) return 'Boa tarde';
  return 'Boa noite';
};

export default function CoordenadorDashboard() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<CoordinatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user || user.role !== 'coordinator') { router.push('/login'); return; }
    api.get('/metrics/coordinator')
      .then(r => setData(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
    api.get('/notifications/unread-count')
      .then(r => { const c = typeof r.data === 'number' ? r.data : r.data?.count || 0; setUnreadCount(c); })
      .catch(() => {});
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const riskPct = data && data.totalStudents > 0
    ? Math.round((data.atRiskStudents / data.totalStudents) * 100) : 0;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-bold text-[#1E3A5F] dark:text-white">EduSaaS</span>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Coordenação</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/coordenador/notificacoes')} className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="text-gray-400 hover:text-red-500 transition-colors">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6">
          <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] dark:text-white">
            {getGreeting()}, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Acompanhamento pedagógico da escola.</p>
        </div>

        {/* Cards principais */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-3">
              <Users size={18} className="text-blue-600" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] dark:text-white">{data?.totalStudents || 0}</p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Alunos ativos</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center mb-3">
              <TrendingDown size={18} className="text-red-600" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${(data?.atRiskStudents || 0) > 0 ? 'text-red-500' : 'text-green-600'}`}>
              {data?.atRiskStudents || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Em risco acadêmico</p>
            {riskPct > 0 && (
              <p className="text-[10px] text-red-400 mt-0.5">{riskPct}% dos alunos</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-orange-50 dark:bg-orange-950 rounded-xl flex items-center justify-center mb-3">
              <AlertTriangle size={18} className="text-orange-600" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${(data?.irregularAttendance || 0) > 0 ? 'text-orange-500' : 'text-green-600'}`}>
              {data?.irregularAttendance || 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Frequência irregular</p>
          </div>
        </div>

        {/* Alertas */}
        {data?.alerts.gradesAlert && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 mb-3">
            <AlertTriangle size={16} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300 flex-1">{data.alerts.gradesAlert}</p>
            <button onClick={() => router.push('/dashboard/coordenador/alunos')}
              className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline flex-shrink-0">
              Ver alunos
            </button>
          </div>
        )}
        {data?.alerts.attendanceAlert && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <AlertTriangle size={16} className="text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300 flex-1">{data.alerts.attendanceAlert}</p>
            <button onClick={() => router.push('/dashboard/coordenador/alunos')}
              className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline flex-shrink-0">
              Ver alunos
            </button>
          </div>
        )}

        {/* Tudo ok */}
        {data && !data.alerts.gradesAlert && !data.alerts.attendanceAlert && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
              <span className="text-white text-xs">✓</span>
            </div>
            <p className="text-sm text-green-700 dark:text-green-300">Todos os alunos com notas e frequência regulares.</p>
          </div>
        )}

        {/* Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          {[
            { label: 'Feed', icon: Newspaper, href: '/dashboard/feed', color: 'bg-sky-50 dark:bg-sky-950 text-sky-600', hint: 'Mural de avisos' },
            { label: 'Alunos', icon: Users, href: '/dashboard/coordenador/alunos', color: 'bg-blue-50 dark:bg-blue-950 text-blue-600', hint: 'Acompanhar desempenho' },
            { label: 'Turmas', icon: BookOpen, href: '/dashboard/coordenador/turmas', color: 'bg-purple-50 dark:bg-purple-950 text-purple-600', hint: 'Turmas e professores' },
            { label: 'Avisos', icon: Bell, href: '/dashboard/coordenador/notificacoes', color: 'bg-orange-50 dark:bg-orange-950 text-orange-600', hint: 'Comunicados' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-sm transition-all text-left group">
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                <item.icon size={20} />
              </div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.label}</p>
              <p className="text-[11px] text-gray-400 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">{item.hint}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}
