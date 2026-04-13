'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import {
  Users, GraduationCap, BookOpen, DollarSign,
  TrendingUp, AlertTriangle, LogOut, Bell, Newspaper,
  ClipboardList, UserCog, CheckSquare
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardData {
  people: { totalStudents: number; totalTeachers: number; totalCoordinators: number };
  academic: { avgGrade: number; avgAttendance: string; totalGrades: number; totalAttendanceRecords: number };
  financial: { totalRevenue: number; totalOverdueTuitions: number; defaultRate: string; totalPaidTuitions: number };
}

export default function DiretorDashboard() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  const getSaudacao = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Bom dia';
    if (h < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  useEffect(() => {
    if (!user || user.role !== 'director') { router.push('/login'); return; }
    api.get('/metrics/director')
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

  const attNum = parseInt(data?.academic.avgAttendance || '0');
  const avgGrade = data?.academic.avgGrade || 0;

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
            <span className="text-sm text-gray-500 dark:text-gray-400 hidden sm:inline">Painel do Diretor</span>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/dashboard/diretor/notificacoes')} className="relative p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
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
          {user?.name ? (
            <h1 className="text-xl sm:text-2xl font-bold text-[#1E3A5F] dark:text-white">
              {getSaudacao()}, {user.name.split(' ')[0]}!
            </h1>
          ) : (
            <div className="h-7 w-52 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Resumo geral da sua escola.</p>
        </div>

        {/* Pessoas */}
        <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-4">
          {[
            { value: data?.people.totalStudents || 0, label: 'Alunos', icon: GraduationCap, color: 'bg-blue-50 dark:bg-blue-950 text-blue-600' },
            { value: data?.people.totalTeachers || 0, label: 'Professores', icon: BookOpen, color: 'bg-purple-50 dark:bg-purple-950 text-purple-600' },
            { value: data?.people.totalCoordinators || 0, label: 'Coordenadores', icon: Users, color: 'bg-orange-50 dark:bg-orange-950 text-orange-600' },
          ].map(c => (
            <div key={c.label} className="bg-white dark:bg-gray-900 rounded-2xl p-3 sm:p-6 border border-gray-100 dark:border-gray-800 hover:opacity-80 transition-opacity duration-200">
              <div className={`w-8 h-8 sm:w-10 sm:h-10 ${c.color} rounded-xl flex items-center justify-center mb-2 sm:mb-3`}>
                <c.icon size={16} className="sm:hidden" />
                <c.icon size={18} className="hidden sm:block" />
              </div>
              <p className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] dark:text-white">{c.value}</p>
              <p className="text-[11px] sm:text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Acadêmico + Financeiro */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp size={18} className="text-green-600" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${avgGrade >= 6 ? 'text-green-600' : avgGrade >= 5 ? 'text-orange-500' : 'text-red-500'}`}>
              {avgGrade}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Média geral</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-3">
              <CheckSquare size={18} className="text-blue-600" />
            </div>
            <p className={`text-2xl sm:text-3xl font-bold ${attNum >= 75 ? 'text-green-600' : attNum >= 60 ? 'text-orange-500' : 'text-red-500'}`}>
              {data?.academic.avgAttendance || '0%'}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Frequência média</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 bg-emerald-50 dark:bg-emerald-950 rounded-xl flex items-center justify-center mb-3">
              <DollarSign size={18} className="text-emerald-600" />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 leading-snug">Em breve</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Módulo financeiro</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-9 h-9 bg-gray-50 dark:bg-gray-800 rounded-xl flex items-center justify-center mb-3">
              <ClipboardList size={18} className="text-gray-500" />
            </div>
            <p className="text-2xl sm:text-3xl font-bold text-[#1E3A5F] dark:text-white">
              {(data?.academic.totalGrades || 0) + (data?.academic.totalAttendanceRecords || 0)}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">Lançamentos totais</p>
          </div>
        </div>

        {/* Alertas acadêmicos */}
        {data && attNum < 75 && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-orange-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">
                Frequência média abaixo de 75% ({data.academic.avgAttendance})
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/diretor/alunos?filtro=baixa-frequencia')}
              className="text-xs text-orange-600 dark:text-orange-400 font-medium hover:underline flex-shrink-0">
              Ver alunos
            </button>
          </div>
        )}
        {data && avgGrade < 6 && (
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-100 dark:border-yellow-800 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-yellow-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
                Média geral abaixo de 6.0 ({avgGrade}) — alunos em risco acadêmico
              </p>
            </div>
            <button
              onClick={() => router.push('/dashboard/diretor/alunos?filtro=risco-academico')}
              className="text-xs text-yellow-600 dark:text-yellow-400 font-medium hover:underline flex-shrink-0">
              Ver alunos
            </button>
          </div>
        )}
        {data && data.financial.totalOverdueTuitions > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <AlertTriangle size={18} className="text-red-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {data.financial.totalOverdueTuitions} mensalidade(s) em atraso ({data.financial.defaultRate})
              </p>
            </div>
            <button onClick={() => router.push('/dashboard/diretor/financeiro')}
              className="text-xs text-red-600 dark:text-red-400 font-medium hover:underline flex-shrink-0">
              Ver detalhes
            </button>
          </div>
        )}

        {/* Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          {[
            { label: 'Feed',        icon: Newspaper,  href: '/dashboard/feed',                    color: 'bg-sky-50 dark:bg-sky-950 text-sky-600',         hint: 'Mural da escola' },
            { label: 'Secretaria',  icon: UserCog,    href: '/dashboard/secretaria/alunos',        color: 'bg-teal-50 dark:bg-teal-950 text-teal-600',      hint: 'Gestão administrativa' },
            { label: 'Usuários',    icon: Users,      href: '/dashboard/diretor/usuarios',         color: 'bg-blue-50 dark:bg-blue-950 text-blue-600',      hint: 'Equipe e acessos' },
            { label: 'Turmas',      icon: BookOpen,   href: '/dashboard/diretor/turmas',           color: 'bg-purple-50 dark:bg-purple-950 text-purple-600',hint: 'Turmas e disciplinas' },
            { label: 'Financeiro',  icon: DollarSign, href: '/dashboard/diretor/financeiro',       color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600', hint: 'Em breve' },
            { label: 'Avisos',      icon: Bell,       href: '/dashboard/diretor/notificacoes',     color: 'bg-orange-50 dark:bg-orange-950 text-orange-600',hint: 'Avisos institucionais' },
          ].map(item => (
            <button key={item.label} onClick={() => router.push(item.href)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 sm:p-5 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm hover:scale-[1.02] hover:opacity-80 active:scale-[0.98] transition-all duration-200 text-left">
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
