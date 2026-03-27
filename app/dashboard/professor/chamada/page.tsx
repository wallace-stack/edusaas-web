'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, CheckCircle, XCircle, MinusCircle } from 'lucide-react';

interface SchoolClass { id: number; name: string; year: number; }
interface Subject { id: number; name: string; }
interface Student { id: number; name: string; }
interface AttendanceItem { studentId: number; status: 'present' | 'absent' | 'justified'; }

export default function ChamadaPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [attendances, setAttendances] = useState<AttendanceItem[]>([]);
  const [form, setForm] = useState({
    classId: '',
    subjectId: '',
    date: new Date().toISOString().split('T')[0],
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
      const response = await api.get('/classes/my');
      setClasses(response.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const loadSubjectsAndStudents = async (classId: number) => {
    try {
      const [subjectsRes, studentsRes] = await Promise.all([
        api.get(`/classes/${classId}/subjects`),
        api.get(`/enrollments/class/${classId}`),
      ]);
      setSubjects(subjectsRes.data);
      const studentList = studentsRes.data
        .map((e: any) => e.student)
        .filter(Boolean);
      setStudents(studentList);
      setAttendances(studentList.map((s: Student) => ({ studentId: s.id, status: 'present' as const })));
    } catch (err) { console.error(err); }
  };

  const toggleStatus = (studentId: number, status: 'present' | 'absent' | 'justified') => {
    setAttendances(prev => prev.map(a => a.studentId === studentId ? { ...a, status } : a));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.post('/attendance/bulk', {
        date: form.date,
        subjectId: Number(form.subjectId),
        classId: Number(form.classId),
        attendances,
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao registrar chamada');
    } finally { setSaving(false); }
  };

  const presentCount = attendances.filter(a => a.status === 'present').length;
  const absentCount = attendances.filter(a => a.status === 'absent').length;

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
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white">Registrar Chamada</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {success && (
          <div className="bg-green-50 dark:bg-green-950 border border-green-100 dark:border-green-800 rounded-2xl p-4 flex items-center gap-3 mb-6">
            <CheckCircle size={20} className="text-green-500" />
            <p className="text-sm text-green-700 dark:text-green-300 font-medium">Chamada registrada com sucesso!</p>
          </div>
        )}

        {/* Configuração da chamada */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 mb-6">
          <h2 className="font-semibold text-[#1E3A5F] dark:text-white mb-4">Configurar chamada</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Turma</label>
              <select
                value={form.classId}
                onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: '' })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Selecione</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Disciplina</label>
              <select
                value={form.subjectId}
                onChange={(e) => setForm({ ...form, subjectId: e.target.value })}
                disabled={!form.classId}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] disabled:opacity-50 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Selecione</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Data</label>
              <input
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                type="date"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100"
              />
            </div>
          </div>
        </div>

        {/* Lista de alunos */}
        {students.length > 0 && (
          <form onSubmit={handleSubmit}>
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden mb-4">
              <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">{students.length} alunos</span>
                <div className="flex gap-4">
                  <span className="text-sm text-green-600 font-medium">✓ {presentCount} presentes</span>
                  <span className="text-sm text-red-500 font-medium">✗ {absentCount} ausentes</span>
                </div>
              </div>
              <div className="divide-y divide-gray-50 dark:divide-gray-800">
                {students.map((student) => {
                  const attendance = attendances.find(a => a.studentId === student.id);
                  return (
                    <div key={student.id} className="px-6 py-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                          <span className="text-white text-xs font-bold">{student.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{student.name}</span>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'present')}
                          className={`p-2 rounded-xl transition-colors ${attendance?.status === 'present' ? 'bg-green-100 dark:bg-green-900 text-green-600' : 'text-gray-300 dark:text-gray-600 hover:text-green-500'}`}
                          title="Presente"
                        >
                          <CheckCircle size={22} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'absent')}
                          className={`p-2 rounded-xl transition-colors ${attendance?.status === 'absent' ? 'bg-red-100 dark:bg-red-900 text-red-600' : 'text-gray-300 dark:text-gray-600 hover:text-red-500'}`}
                          title="Ausente"
                        >
                          <XCircle size={22} />
                        </button>
                        <button
                          type="button"
                          onClick={() => toggleStatus(student.id, 'justified')}
                          className={`p-2 rounded-xl transition-colors ${attendance?.status === 'justified' ? 'bg-orange-100 dark:bg-orange-900 text-orange-600' : 'text-gray-300 dark:text-gray-600 hover:text-orange-500'}`}
                          title="Justificado"
                        >
                          <MinusCircle size={22} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</p>}

            <button
              type="submit"
              disabled={saving || !form.classId || !form.subjectId}
              className="w-full bg-[#1E3A5F] text-white py-3 rounded-xl font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
            >
              {saving ? 'Salvando...' : 'Salvar chamada'}
            </button>
          </form>
        )}

        {form.classId && students.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum aluno encontrado nesta turma</p>
          </div>
        )}

      </main>
    </div>
  );
}
