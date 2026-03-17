'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import {
  Users, GraduationCap, BookOpen, DollarSign,
  TrendingUp, AlertTriangle, LogOut, Bell, Menu
} from 'lucide-react';

interface DashboardData {
  people: { totalStudents: number; totalTeachers: number; totalCoordinators: number };
  academic: { avgGrade: number; avgAttendance: string; totalGrades: number };
  financial: { totalRevenue: number; totalOverdueTuitions: number; defaultRate: string };
}

export default function DiretorDashboard() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'director') {
      router.push('/login');
      return;
    }
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/metrics/director');
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-[#1E3A5F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 text-sm">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">

      {/* Header */}
      <header className="bg-white border-b border-gray-100 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#1E3A5F] rounded-lg flex items-center justify-center">
              <span className="text-white text-sm font-bold">E</span>
            </div>
            <span className="font-bold text-[#1E3A5F]">EduSaaS</span>
            <span className="text-gray-300">|</span>
            <span className="text-sm text-gray-500">Painel do Diretor</span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-400 hover:text-gray-600">
              <Bell size={20} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">
                  {user?.name?.charAt(0).toUpperCase()}
                </span>
              </div>
              <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-red-500 transition-colors"
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
          <h1 className="text-2xl font-bold text-[#1E3A5F]">
            Bom dia, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">Aqui está o resumo da sua escola hoje.</p>
        </div>

        {/* Cards de pessoas */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <GraduationCap size={20} className="text-blue-600" />
              </div>
              <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-full">Ativos</span>
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.people.totalStudents || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Alunos</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <BookOpen size={20} className="text-purple-600" />
              </div>
              <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-full">Ativos</span>
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.people.totalTeachers || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Professores</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center">
                <Users size={20} className="text-orange-600" />
              </div>
              <span className="text-xs text-green-500 font-medium bg-green-50 px-2 py-1 rounded-full">Ativos</span>
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.people.totalCoordinators || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Coordenadores</p>
          </div>
        </div>

        {/* Cards acadêmicos e financeiros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <TrendingUp size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.academic.avgGrade || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Média geral das notas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.academic.avgAttendance || '0%'}</p>
            <p className="text-sm text-gray-500 mt-1">Frequência média</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center mb-4">
              <DollarSign size={20} className="text-emerald-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">
              R$ {data?.financial.totalRevenue?.toLocaleString('pt-BR', { minimumFractionDigits: 2 }) || '0,00'}
            </p>
            <p className="text-sm text-gray-500 mt-1">Receita total</p>
          </div>
        </div>

        {/* Alerta de inadimplência */}
        {data && data.financial.totalOverdueTuitions > 0 && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <AlertTriangle size={20} className="text-red-500 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-red-700">
                {data.financial.totalOverdueTuitions} mensalidade(s) em atraso
              </p>
              <p className="text-xs text-red-500">Taxa de inadimplência: {data.financial.defaultRate}</p>
            </div>
            <button
              onClick={() => router.push('/dashboard/diretor/financeiro')}
              className="ml-auto text-xs text-red-600 font-medium hover:underline"
            >
              Ver detalhes
            </button>
          </div>
        )}

        {/* Menu de navegação */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Usuários', icon: Users, href: '/dashboard/diretor/usuarios', color: 'bg-blue-50 text-blue-600' },
            { label: 'Turmas', icon: BookOpen, href: '/dashboard/diretor/turmas', color: 'bg-purple-50 text-purple-600' },
            { label: 'Financeiro', icon: DollarSign, href: '/dashboard/diretor/financeiro', color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Notificações', icon: Bell, href: '/dashboard/diretor/notificacoes', color: 'bg-orange-50 text-orange-600' },
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