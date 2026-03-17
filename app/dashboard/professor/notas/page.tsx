'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, CheckCircle } from 'lucide-react';

interface SchoolClass {
  id: number;
  name: string;
  year: number;
}

interface Subject {
  id: number;
  name: string;
}

interface Student {
  id: number;
  name: string;
}

export default function LancarNotasPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [success, setSuccess] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    studentId: '',
    value: '',
    type: 'exam',
    period: '1',
    description: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadClasses();
  }, []);

  useEffect(() => {
    if (form.classId) loadSubjectsAndStudents(Number(form.classId));
  }, [form.classId]);

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

  const loadSubjectsAndStudents = async (classId: number) => {
    try {
      const [subjectsRes, studentsRes] = await Promise.all([
        api.get(`/classes/${classId}/subjects`),
        api.get('/users?role=student'),
      ]);
      setSubjects(subjectsRes.data);
      setStudents(studentsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.post('/grades', {
        ...form,
        classId: Number(form.classId),
        subjectId: Number(form.subjectId),
        studentId: Number(form.studentId),
        value: Number(form.value),
        period: Number(form.period),
      });
      setSuccess(true);
      setForm({ classId: form.classId, subjectId: form.subjectId, studentId: '', value: '', type: 'exam', period: form.period, description: '' });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao lançar nota');
    } finally {
      setSaving(false);
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
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="font-bold text-[#1E3A5F]">Lançar Notas</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {success && (
          <div className="bg-green-50 border border-green-100 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <CheckCircle size={20} className="text-green-500" />
            <p className="text-sm text-green-700 font-medium">Nota lançada com sucesso!</p>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <h2 className="font-semibold text-[#1E3A5F] mb-6">Dados da avaliação</h2>

          <form onSubmit={handleSubmit} className="space-y-4">

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                <select
                  value={form.classId}
                  onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: '', studentId: '' })}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  <option value="">Selecione a turma</option>
                  {classes.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} — {c.year}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Disciplina</label>
                <select
                  value={form.subjectId}
                  onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                  required
                  disabled={!form.classId}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] disabled:opacity-50"
                >
                  <option value="">Selecione a disciplina</option>
                  {subjects.map((s) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Aluno</label>
              <select
                value={form.studentId}
                onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                required
                disabled={!form.classId}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] disabled:opacity-50"
              >
                <option value="">Selecione o aluno</option>
                {students.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nota (0-10)</label>
                <input
                  value={form.value}
                  onChange={(e) => setForm({ ...form, value: e.target.value })}
                  type="number"
                  min="0"
                  max="10"
                  step="0.1"
                  required
                  placeholder="Ex: 8.5"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  <option value="exam">Prova</option>
                  <option value="assignment">Trabalho</option>
                  <option value="quiz">Quiz</option>
                  <option value="final">Final</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Bimestre</label>
                <select
                  value={form.period}
                  onChange={(e) => setForm({ ...form, period: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
                >
                  <option value="1">1º Bimestre</option>
                  <option value="2">2º Bimestre</option>
                  <option value="3">3º Bimestre</option>
                  <option value="4">4º Bimestre</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição (opcional)</label>
              <input
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Prova do 1º bimestre"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
              />
            </div>

            {error && <p className="text-red-500 text-sm">{error}</p>}

            <button
              type="submit"
              disabled={saving}
              className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Lançando...' : 'Lançar nota'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}