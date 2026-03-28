'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, Search, X, Eye, EyeOff, ChevronRight } from 'lucide-react';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  guardianName?: string;
  guardianPhone?: string;
  guardianRelation?: string;
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
  const [showPassword, setShowPassword] = useState(false);
  const [turmaFilter, setTurmaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transferClassId, setTransferClassId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', password: '', phone: '', birthDate: '', classId: '',
    document: '',
    address: '', city: '', state: '', zipCode: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
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

  const handleSelectStudent = (s: Student) => {
    console.log('SELECTED STUDENT:', JSON.stringify(s));
    setSelectedStudent(s);
    setTransferClassId('');
  };

  const handleTransfer = async () => {
    if (!selectedStudent || !transferClassId) return;
    try {
      setTransferring(true);
      await api.post('/enrollments/transfer', {
        studentId: selectedStudent.id,
        newClassId: Number(transferClassId),
      });
      setSelectedStudent(null);
      setTransferClassId('');
      loadData();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Erro ao matricular');
    } finally {
      setTransferring(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      const body = {
        ...form,
        classId: form.classId ? Number(form.classId) : undefined,
        birthDate: form.birthDate ? new Date(form.birthDate).toISOString() : undefined,
      };
      await api.post('/secretary/students', body);
      setShowModal(false);
      setForm({ name: '', email: '', password: '', phone: '', birthDate: '', classId: '', document: '', address: '', city: '', state: '', zipCode: '', guardianName: '', guardianPhone: '', guardianRelation: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao matricular aluno');
    } finally { setSaving(false); }
  };

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
        {/* Filtros */}
        <div className="flex gap-3 mb-6 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <select
            value={turmaFilter}
            onChange={e => setTurmaFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            <option value="">Todas as turmas</option>
            <option value="sem-turma">Sem turma</option>
            {classes.map(c => (
              <option key={c.id} value={String(c.id)}>{c.name}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            <option value="">Todos os status</option>
            <option value="ok">Em dia</option>
            <option value="overdue">Inadimplente</option>
          </select>
        </div>

        {/* Lista agrupada por turma */}
        {loading ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin mx-auto"></div>
          </div>
        ) : (() => {
          const filtered = students.filter(s => {
            const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
              s.email.toLowerCase().includes(search.toLowerCase());
            const matchTurma = !turmaFilter ||
              (turmaFilter === 'sem-turma' ? !s.classId : String(s.classId) === turmaFilter);
            const matchStatus = !statusFilter || s.financialStatus === statusFilter;
            return matchSearch && matchTurma && matchStatus;
          });

          const groups: Record<string, { label: string; students: Student[] }> = {};
          filtered.forEach(s => {
            const key = s.classId ? String(s.classId) : 'sem-turma';
            const label = s.class?.name ?? 'Sem turma';
            if (!groups[key]) groups[key] = { label, students: [] };
            groups[key].students.push(s);
          });

          Object.values(groups).forEach(g => {
            g.students.sort((a, b) => a.name.localeCompare(b.name));
          });

          const sortedGroups = Object.entries(groups).sort(([, a], [, b]) =>
            a.label.localeCompare(b.label)
          );

          if (filtered.length === 0) {
            return (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum aluno encontrado</p>
              </div>
            );
          }

          return (
            <div className="space-y-6">
              {sortedGroups.map(([key, group]) => (
                <div key={key} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
                  <div className="px-6 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#1E3A5F] dark:text-white">{group.label}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{group.students.length} aluno{group.students.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="divide-y divide-gray-50 dark:divide-gray-800">
                    {group.students.map(s => (
                      <div
                        key={s.id}
                        onClick={() => handleSelectStudent(s)}
                        className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{s.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200">{s.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{s.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                            s.financialStatus === 'overdue'
                              ? 'bg-red-50 dark:bg-red-950 text-red-600'
                              : 'bg-green-50 dark:bg-green-950 text-green-600'
                          }`}>
                            {s.financialStatus === 'overdue' ? 'Inadimplente' : 'Em dia'}
                          </span>
                          <ChevronRight size={16} className="text-gray-300 dark:text-gray-600" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          );
        })()}
      </main>

      {/* Modal: Matricular aluno */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white mb-4">Matricular aluno</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value.toUpperCase() })} placeholder="Nome completo" required className={inputCls} />
              <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" required className={inputCls} />
              <div>
                <div className="relative">
                  <input
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Senha de acesso"
                    required
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
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
                <input
                  value={form.birthDate}
                  onChange={e => setForm({ ...form, birthDate: e.target.value })}
                  type="date"
                  max={new Date().toISOString().split('T')[0]}
                  className={inputCls}
                />
              </div>

              {/* Documento */}
              <input
                value={form.document}
                onChange={e => setForm({ ...form, document: e.target.value })}
                placeholder="CPF (opcional)"
                className={inputCls}
              />

              {/* Endereço */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pt-2">Endereço</p>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value.toUpperCase() })}
                placeholder="Rua e número"
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value.toUpperCase() })}
                  placeholder="Cidade"
                  className={inputCls}
                />
                <input
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value })}
                  placeholder="Estado (ex: SP)"
                  maxLength={2}
                  className={inputCls}
                />
              </div>
              <input
                value={form.zipCode}
                onChange={e => setForm({ ...form, zipCode: e.target.value })}
                placeholder="CEP (ex: 12345-678)"
                className={inputCls}
              />

              {/* Responsável */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase pt-2">Responsável</p>
              <input
                value={form.guardianName}
                onChange={e => setForm({ ...form, guardianName: e.target.value.toUpperCase() })}
                placeholder="Nome do responsável"
                className={inputCls}
              />
              <input
                value={form.guardianPhone}
                onChange={e => setForm({ ...form, guardianPhone: e.target.value })}
                placeholder="Telefone do responsável"
                className={inputCls}
              />
              <select
                value={form.guardianRelation}
                onChange={e => setForm({ ...form, guardianRelation: e.target.value })}
                className={inputCls}
              >
                <option value="">Relação com o aluno</option>
                <option value="pai">Pai</option>
                <option value="mãe">Mãe</option>
                <option value="avô">Avô</option>
                <option value="avó">Avó</option>
                <option value="tio">Tio/Tia</option>
                <option value="outro">Outro</option>
              </select>

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
              {selectedStudent?.address && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Endereço</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    {selectedStudent.address}
                    {selectedStudent.city && `, ${selectedStudent.city}`}
                    {selectedStudent.state && ` - ${selectedStudent.state}`}
                  </p>
                </div>
              )}
              {selectedStudent?.guardianName && (
                <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                  <p className="text-xs text-gray-400 mb-0.5">Responsável</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200">{selectedStudent.guardianName}</p>
                  {selectedStudent.guardianPhone && (
                    <p className="text-xs text-gray-400">{selectedStudent.guardianPhone} · {selectedStudent.guardianRelation}</p>
                  )}
                </div>
              )}
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-0.5">Turma atual</p>
                <p className="text-sm text-gray-700 dark:text-gray-200">{selectedStudent.class?.name ?? 'Não matriculado'}</p>
              </div>
              <div className="px-3 py-2 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-xs text-gray-400 mb-2">
                  {selectedStudent?.class ? 'Transferir para outra turma' : 'Matricular em uma turma'}
                </p>
                <select
                  value={transferClassId}
                  onChange={e => setTransferClassId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-700 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] mb-2"
                >
                  <option value="">Selecione a turma</option>
                  {classes.map(c => (
                    <option key={c.id} value={c.id}>{c.name} — {c.year}</option>
                  ))}
                </select>
                <button
                  onClick={handleTransfer}
                  disabled={!transferClassId || transferring}
                  className="w-full py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                >
                  {transferring ? 'Salvando...' : selectedStudent?.class ? 'Confirmar transferência' : 'Matricular nesta turma'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
