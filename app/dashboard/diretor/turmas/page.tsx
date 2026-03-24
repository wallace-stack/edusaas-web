'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, BookOpen, Users, TrendingUp, CheckSquare } from 'lucide-react';

interface SchoolClass {
  id: number;
  name: string;
  year: number;
  shift?: string;
  totalStudents?: number;
  avgGrade?: number;
  avgAttendance?: string;
  teacher?: { name: string };
}

export default function DiretorTurmasPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ name: '', year: new Date().getFullYear().toString(), shift: 'morning' });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      const response = await api.get('/classes');
      setClasses(response.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.post('/classes', { ...form, year: Number(form.year) });
      setShowModal(false);
      setForm({ name: '', year: new Date().getFullYear().toString(), shift: 'morning' });
      loadClasses();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar turma');
    } finally {
      setSaving(false);
    }
  };

  const shiftLabel: Record<string, string> = {
    morning: 'Manhã',
    afternoon: 'Tarde',
    evening: 'Noite',
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
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600" />
            </button>
            <h1 className="font-bold text-[#1E3A5F]">Turmas</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={16} />
            Nova turma
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {classes.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
            <BookOpen size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">Nenhuma turma cadastrada ainda</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-4 text-sm text-[#F97316] hover:underline"
            >
              Criar primeira turma
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {classes.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-gray-100 p-6 hover:shadow-sm transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                    <BookOpen size={20} className="text-purple-600" />
                  </div>
                  {c.shift && (
                    <span className="text-xs px-2 py-1 bg-gray-50 text-gray-500 rounded-full">
                      {shiftLabel[c.shift] || c.shift}
                    </span>
                  )}
                </div>
                <h3 className="font-semibold text-[#1E3A5F] mb-1">{c.name}</h3>
                <p className="text-xs text-gray-400 mb-4">{c.year}</p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Users size={12} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-[#1E3A5F]">{c.totalStudents ?? '—'}</p>
                    <p className="text-xs text-gray-400">Alunos</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <TrendingUp size={12} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-[#1E3A5F]">{c.avgGrade ?? '—'}</p>
                    <p className="text-xs text-gray-400">Média</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckSquare size={12} className="text-gray-400" />
                    </div>
                    <p className="text-lg font-bold text-[#1E3A5F]">{c.avgAttendance ?? '—'}</p>
                    <p className="text-xs text-gray-400">Freq.</p>
                  </div>
                </div>

                {c.teacher && (
                  <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-gray-50">
                    Prof. {c.teacher.name}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] mb-4">Nova turma</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Nome da turma (ex: 1º A)"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <input
                value={form.year}
                onChange={(e) => setForm({ ...form, year: e.target.value })}
                type="number"
                placeholder="Ano letivo"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
              <select
                value={form.shift}
                onChange={(e) => setForm({ ...form, shift: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              >
                <option value="morning">Manhã</option>
                <option value="afternoon">Tarde</option>
                <option value="evening">Noite</option>
              </select>
              {error && <p className="text-red-500 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); setError(''); }}
                  className="flex-1 py-3 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
                >
                  {saving ? 'Criando...' : 'Criar turma'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
