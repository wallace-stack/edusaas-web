'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { BookOpen, Users, ClipboardList, LogOut, CheckSquare } from 'lucide-react';

interface TeacherData {
  totalGradesLaunched: number;
  avgGrade: number;
  totalAttendanceRecords: number;
  avgAttendance: string;
}

export default function ProfessorDashboard() {
  const router = useRouter();
  const user = getUser();
  const [data, setData] = useState<TeacherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || user.role !== 'teacher') {
      router.push('/login');
      return;
    }
    loadDashboard();
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
            <span className="text-sm text-gray-500">Painel do Professor</span>
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
          <h1 className="text-2xl font-bold text-[#1E3A5F]">Olá, Prof. {user?.name?.split(' ')[0]}! 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Gerencie suas turmas e lançamentos.</p>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
              <ClipboardList size={20} className="text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totalGradesLaunched || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Notas lançadas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center mb-4">
              <BookOpen size={20} className="text-green-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.avgGrade || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Média das notas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
              <CheckSquare size={20} className="text-purple-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.totalAttendanceRecords || 0}</p>
            <p className="text-sm text-gray-500 mt-1">Chamadas registradas</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
              <Users size={20} className="text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-[#1E3A5F]">{data?.avgAttendance || '0%'}</p>
            <p className="text-sm text-gray-500 mt-1">Frequência média</p>
          </div>
        </div>

        {/* Menu */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {[
            { label: 'Lançar Notas', icon: ClipboardList, href: '/dashboard/professor/notas', color: 'bg-blue-50 text-blue-600' },
            { label: 'Registrar Chamada', icon: CheckSquare, href: '/dashboard/professor/chamada', color: 'bg-green-50 text-green-600' },
            { label: 'Minhas Turmas', icon: BookOpen, href: '/dashboard/professor/turmas', color: 'bg-purple-50 text-purple-600' },
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