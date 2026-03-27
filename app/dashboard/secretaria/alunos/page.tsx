'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, Search, X } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  class?: { id: number; name: string } | null;
  classId?: number | null;
  financialStatus: string;
  overdueCount: number;
}

const financialStatusLabel: Record<string, string> = {
  ok: 'Em dia',
  overdue: 'Inadimplente',
  pago: 'Em dia',
  pendente: 'Pendente',
  vencido: 'Inadimplente',
};

const financialStatusColor: Record<string, string> = {
  ok: 'bg-green-50 dark:bg-green-950 text-green-700',
  overdue: 'bg-red-50 dark:bg-red-950 text-red-700',
  pago: 'bg-green-50 dark:bg-green-950 text-green-700',
  pendente: 'bg-orange-50 dark:bg-orange-950 text-orange-700',
  vencido: 'bg-red-50 dark:bg-red-950 text-red-700',
};

export default function SecretariaAlunosPage() {
  const router = useRouter();
  const user = getUser();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', birthDate: '', classId: '',
  });

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/secretary/students'),
        api.get('/secretary/classes'),
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.post('/secretary/students', {
        ...form,
        classId: form.classId ? Number(form.classId) : undefined,
      });
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '', birthDate: '', classId: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao matricular aluno');
    } finally { setSaving(false); }
  };

  const filtered = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Alunos</h1>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={16} />
            Matricular aluno
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative mb-6">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou email..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">Nenhum aluno encontrado</div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Nome</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden sm:table-cell">Email</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase hidden md:table-cell">Turma</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase">Status Financeiro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                {filtered.map((s) => (
                  <tr key={s.id} onClick={() => setSelectedStudent(s)} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{s.name.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 hidden sm:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{s.email}</span>
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="text-sm text-gray-500 dark:text-gray-400">{s.class?.name ?? '—'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${financialStatusColor[s.financialStatus] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                        {financialStatusLabel[s.financialStatus] ?? s.financialStatus}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* Modal: Matricular aluno */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white mb-4">Matricular aluno</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" required className={inputCls} />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" required className={inputCls} />
              <div>
                <input value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} type="password" placeholder="Senha de acesso" required className={inputCls} />
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Mínimo 8 caracteres, uma letra maiúscula e um número.
                </p>
              </div>
              <div>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Telefone (ex: 11987654321)"
                  required
                  maxLength={11}
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Apenas números, 10 ou 11 dígitos</p>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data de nascimento</label>
                <input value={form.birthDate} onChange={(e) => setForm({ ...form, birthDate: e.target.value })} type="date" className={inputCls} />
              </div>
              <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} required className={inputCls}>
                <option value="">Selecione a turma *</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.year}</option>)}
              </select>
              {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50">
                  {saving ? 'Matriculando...' : 'Matricular'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Detalhes do aluno */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white">Dados do Aluno</h2>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <div className="w-10 h-10 bg-[#1E3A5F] rounded-full flex items-center justify-center">
                  <span className="text-white font-bold">{selectedStudent.name.charAt(0).toUpperCase()}</span>
                </div>
                <div>
                  <p className="font-semibold text-gray-800 dark:text-gray-100">{selectedStudent.name}</p>
                  <p className="text-xs text-gray-400">{selectedStudent.email}</p>
                </div>
              </div>
              {selectedStudent.phone && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Telefone</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{selectedStudent.phone}</p>
                </div>
              )}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-0.5">Turma atual</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{selectedStudent.class?.name ?? 'Não matriculado'}</p>
              </div>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-1">Transferir para turma</p>
                <select
                  className={inputCls}
                  onChange={async (e) => {
                    if (!e.target.value) return;
                    try {
                      await api.post(`/enrollment/transfer`, {
                        studentId: selectedStudent.id,
                        newClassId: Number(e.target.value),
                      });
                      setSelectedStudent(null);
                      loadData();
                    } catch (err: any) {
                      alert(err.response?.data?.message || 'Erro ao transferir');
                    }
                  }}
                >
                  <option value="">Selecione nova turma</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.year}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
