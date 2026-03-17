'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { Users, AlertTriangle, LogOut, Bell, BookOpen, TrendingDown } from 'lucide-react';

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
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-bold text-[#1E3A5F]">EduSaaS</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Painel do Coordenador</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">{user?.name?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
            <button onClick={() => { clearAuth(); router.push('/login'); }} className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Olá, {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Monitore suas turmas e alunos.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totalStudents || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Total de alunos</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center mb-4">
              <TrendingDown size={20} className="text-red-600" />
            </div>
            <p className="text-3xl font-bold text-red-500">{data?.atRiskStudents || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Alunos em risco (média abaixo de 6)</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
              <AlertTriangle size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-orange-500">{data?.irregularAttendance || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Frequência irregular</p>
          </div>
        </div>

        {/* Alertas */}
        {data?.alerts.gradesAlert && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 mb-4">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-700">{data.alerts.gradesAlert}</p>
          </div>
        )}

        {data?.alerts.attendanceAlert && (
          <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-orange-500 flex-shrink-0" />
            <p className="text-sm text-orange-700">{data.alerts.attendanceAlert}</p>
          </div>
        )}

        {/* Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Alunos', icon: Users, href: '/dashboard/coordenador/alunos', color: 'bg-blue-50 text-blue-600' },
            { label: 'Turmas', icon: BookOpen, href: '/dashboard/coordenador/turmas', color: 'bg-purple-50 text-purple-600' },
            { label: 'Notificações', icon: Bell, href: '/dashboard/coordenador/notificacoes', color: 'bg-orange-50 text-orange-600' },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => router.push(item.href)}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-sm transition-all text-left"
            >
              <div className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}>
                <item.icon size={20} />
              </div>
              <p className="text-sm font-medium text-gray-700">{item.label}</p>
            </button>
          ))}
        </div>
      </main>
    </div>
  );
}