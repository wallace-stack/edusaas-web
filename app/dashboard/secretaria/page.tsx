'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import {
  Users, BookOpen, DollarSign, UserPlus,
  AlertTriangle, LogOut, Bell, Newspaper
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface DashboardData {
  totalStudents: number;
  totalClasses: number;
  totalDefaulters: number;
  enrollmentsThisMonth: number;
}

export default function SecretariaDashboard() {
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
    if (!user || user.role !== 'secretary') {
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
      const response = await api.get('/secretary/dashboard');
      setData(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
  <img src="/logo-icon.png" alt="Walladm" className="h-9 w-auto" />
  <span className="font-bold text-lg tracking-tight"><span className="text-[#1E3A5F] dark:text-white">Walla</span><span className="text-[#F5A623]">adm</span></span>
</div>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Painel da Secretaria</span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => router.push('/dashboard/secretaria/notificacoes')} className="relative p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300">
              <Bell size={20} />
              {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-[10px] text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
            </button>
            <button onClick={() => router.push('/dashboard/perfil')} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 bg-[#F97316] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{user?.name}</span>
            </button>
            <ThemeToggle />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Boas vindas */}
        <div className="mb-8">
          {user?.name ? (
            <h1 className="text-2xl font-bold text-[#1E3A5F] dark:text-white">
              {getSaudacao()}, {user.name.split(' ')[0]}!
            </h1>
          ) : (
            <div className="h-7 w-52 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          )}
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Secretária — aqui está o resumo da escola hoje.</p>
        </div>

        {/* Cards de métricas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-blue-600" />
              </div>
              <span className="text-xs text-green-500 font-medium bg-green-50 dark:bg-green-950 px-2 py-1 rounded-full">Ativos</span>
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-white">{data?.totalStudents ?? 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total de Alunos</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 dark:bg-purple-950 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-purple-600" />
              </div>
              <span className="text-xs text-blue-500 font-medium bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded-full">Ativas</span>
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-white">{data?.totalClasses ?? 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total de Turmas</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-500" />
              </div>
              {(data?.totalDefaulters ?? 0) > 0 && (
                <span className="text-xs text-red-500 font-medium bg-red-50 dark:bg-red-950 px-2 py-1 rounded-full">Atenção</span>
              )}
            </div>
            <p className="text-3xl font-bold text-red-500">{data?.totalDefaulters ?? 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Inadimplentes</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 rounded-xl flex items-center justify-center">
                <UserPlus size={20} className="text-[#F97316]" />
              </div>
              <span className="text-xs text-orange-500 font-medium bg-orange-50 dark:bg-orange-950 px-2 py-1 rounded-full">Este mês</span>
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-white">{data?.enrollmentsThisMonth ?? 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Matrículas do Mês</p>
          </div>
        </div>

        {/* Alerta de inadimplência */}
        {data && data.totalDefaulters > 0 && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-300">
                {data.totalDefaulters} aluno(s) com mensalidades em atraso
              </p>
              <p className="text-xs text-red-500 dark:text-red-400">Verifique o financeiro para mais detalhes</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/secretaria/financeiro')}
              className="ml-auto text-xs text-red-600 dark:text-red-400 font-medium hover:underline"
            >
              Ver detalhes
            </button>
          </div>
        )}

        {/* Links rápidos */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Feed', icon: Newspaper, href: '/dashboard/feed', color: 'bg-sky-50 dark:bg-sky-950 text-sky-600' },
            { label: 'Alunos', icon: Users, href: '/dashboard/secretaria/alunos', color: 'bg-blue-50 dark:bg-blue-950 text-blue-600' },
            { label: 'Turmas', icon: BookOpen, href: '/dashboard/secretaria/turmas', color: 'bg-purple-50 dark:bg-purple-950 text-purple-600' },
            { label: 'Financeiro', icon: DollarSign, href: '/dashboard/secretaria/financeiro', color: 'bg-emerald-50 dark:bg-emerald-950 text-emerald-600' },
            { label: 'Usuários', icon: UserPlus, href: '/dashboard/secretaria/usuarios', color: 'bg-orange-50 dark:bg-orange-950 text-[#F97316]' },
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
