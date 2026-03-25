'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { Users, AlertTriangle, LogOut, Bell, BookOpen, TrendingDown, Newspaper } from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface CoordinatorData {
  totalStudents: number;
  atRiskStudents: number;
  irregularAttendance: number;
  alerts: {
    gradesAlert: string | null;
    attendanceAlert: string | null;
  };
}

export default function CoordenadorDashboard() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<CoordinatorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'coordinator') {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/metrics/coordinator');
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
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-bold text-[#1E3A5F] dark:text-white">EduSaaS</span>
            <span className="text-gray-300 dark:text-gray-600">|</span>
            <span className="text-sm text-gray-500 dark:text-gray-400">Painel do Coordenador</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block">{user?.name}</span>
            </div>
            <ThemeToggle />
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F] dark:text-white">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Monitore suas turmas e alunos.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F] dark:text-white">{data?.totalStudents || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total de alunos</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 bg-red-50 dark:bg-red-950 rounded-xl flex items-center justify-center mb-4">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-500">{data?.atRiskStudents || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Alunos em risco (média abaixo de 6)</p>
          </div>

          <div className="bg-white dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
            <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-500">{data?.irregularAttendance || 0}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Frequência irregular</p>
          </div>
        </div>

        {/* Alertas */}
        {data?.alerts.gradesAlert && (
          <div className="bg-red-50 dark:bg-red-950 border border-red-100 dark:border-red-800 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-red-500 dark:text-red-400 flex-shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{data.alerts.gradesAlert}</p>
          </div>
        )}

        {data?.alerts.attendanceAlert && (
          <div className="bg-orange-50 dark:bg-orange-950 border border-orange-100 dark:border-orange-800 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700 dark:text-orange-300">{data.alerts.attendanceAlert}</p>
          </div>
        )}

        {/* Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Feed', icon: Newspaper, href: '/dashboard/feed', color: 'bg-sky-50 dark:bg-sky-950 text-sky-600' },
            { label: 'Alunos', icon: Users, href: '/dashboard/coordenador/alunos', color: 'bg-blue-50 dark:bg-blue-950 text-blue-600' },
            { label: 'Turmas', icon: BookOpen, href: '/dashboard/coordenador/turmas', color: 'bg-purple-50 dark:bg-purple-950 text-purple-600' },
            { label: 'Notificações', icon: Bell, href: '/dashboard/coordenador/notificacoes', color: 'bg-orange-50 dark:bg-orange-950 text-orange-600' },
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
