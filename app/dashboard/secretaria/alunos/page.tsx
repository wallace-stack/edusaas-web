'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, Search, X, ChevronRight, Upload } from 'lucide-react';
import { toast } from 'sonner';
import Cookies from 'js-cookie';
import ImportarAlunosCSV from '@/components/ImportarAlunosCSV';

interface Student {
  id: number;
  name: string;
  email: string;
  phone?: string;
  document?: string;
  address?: string;
  addressNumber?: string;
  complement?: string;
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
  const [showImport, setShowImport] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [turmaFilter, setTurmaFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [transferClassId, setTransferClassId] = useState('');
  const [transferring, setTransferring] = useState(false);
  const loadingRef = useRef(false);
  const [form, setForm] = useState({
    name: '', email: '', phone: '', birthDate: '', classId: '',
    address: '', addressNumber: '', complement: '', city: '', state: '', zipCode: '',
    guardianName: '', guardianPhone: '', guardianRelation: '',
  });

  useEffect(() => {
    console.log('USER:', getUser());
    console.log('TOKEN:', Cookies.get('token'));
    if (!user) { router.push('/login'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    try {
      const [studentsRes, classesRes] = await Promise.all([
        api.get('/secretary/students'),
        api.get('/secretary/classes'),
      ]);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
    } catch (err) { console.error(err); }
    finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

  const handleSelectStudent = (s: Student) => {
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
      toast.error(err.response?.data?.message || 'Erro ao matricular');
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
      setForm({ name: '', email: '', phone: '', birthDate: '', classId: '', address: '', addressNumber: '', complement: '', city: '', state: '', zipCode: '', guardianName: '', guardianPhone: '', guardianRelation: '' });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao matricular aluno');
    } finally { setSaving(false); }
  };

  const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Alunos</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImport(true)}
              className="flex items-center gap-1.5 border border-[#1E3A5F] text-[#1E3A5F] dark:border-indigo-400 dark:text-indigo-400 px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#1E3A5F]/5 transition-colors whitespace-nowrap"
            >
              <Upload size={14} />
              Importar CSV
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center gap-1.5 bg-[#1E3A5F] text-white px-3 py-2 rounded-xl text-xs font-medium hover:bg-[#162d4a] transition-colors whitespace-nowrap"
            >
              <Plus size={14} />
              Matricular aluno
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-2 mb-4">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nome ou email..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
            />
          </div>
          <div className="flex gap-2">
            <select
              value={turmaFilter}
              onChange={e => setTurmaFilter(e.target.value)}
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
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
              className="flex-1 sm:flex-none px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
            >
              <option value="">Todos os status</option>
              <option value="ok">Em dia</option>
              <option value="overdue">Inadimplente</option>
            </select>
          </div>
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
                        className="px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{s.name.charAt(0).toUpperCase()}</span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{s.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.email}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                          {(s as any).situation && (s as any).situation !== 'NO_GRADES' && (
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium hidden sm:inline ${
                              (s as any).situation === 'APPROVED' ? 'bg-green-50 dark:bg-green-950 text-green-700'
                              : (s as any).situation === 'RECOVERY' ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700'
                              : 'bg-red-50 dark:bg-red-950 text-red-700'
                            }`}>
                              {(s as any).situation === 'APPROVED' ? 'Aprovado' : (s as any).situation === 'RECOVERY' ? 'Recuperação' : 'Reprovado'}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            s.financialStatus === 'overdue'
                              ? 'bg-red-50 dark:bg-red-950 text-red-600'
                              : 'bg-green-50 dark:bg-green-950 text-green-600'
                          }`}>
                            {s.financialStatus === 'overdue' ? 'Inadimplente' : 'Em dia'}
                          </span>
                          <ChevronRight size={14} className="text-gray-300 dark:text-gray-600" />
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

      {/* Modal: Importar CSV */}
      {showImport && (
        <ImportarAlunosCSV
          onClose={() => setShowImport(false)}
          onSuccess={loadData}
        />
      )}

      {/* Modal: Matricular aluno */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-white">Matricular aluno</h2>
              <button onClick={() => { setShowModal(false); setError(''); }} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400"><X size={18} /></button>
            </div>
            <form onSubmit={handleCreate} className="p-4 space-y-3 overflow-x-hidden">
              {/* 1. Nome */}
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value.toUpperCase() })} placeholder="Nome completo" required className={inputCls} />
              {/* 2. Email */}
              <input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} type="email" placeholder="Email" required className={inputCls} />
              {/* 3. Telefone */}
              <div>
                <input
                  value={form.phone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setForm({ ...form, phone: digits });
                  }}
                  placeholder="Telefone (ex: 21999999999)"
                  required
                  inputMode="numeric"
                  className={inputCls}
                />
                <p className="text-xs text-gray-400 mt-1">Apenas números, DDD + número</p>
              </div>
              {/* 4. Data de nascimento */}
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

              {/* 5–8. Endereço */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2">Endereço</p>
              <div className="relative">
                <input
                  value={form.zipCode}
                  onChange={async e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 8);
                    setForm({ ...form, zipCode: digits });
                    if (digits.length === 8) {
                      try {
                        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
                        const data = await res.json();
                        if (!data.erro) {
                          setForm(prev => ({
                            ...prev,
                            zipCode: digits,
                            address: data.logradouro?.toUpperCase() || prev.address,
                            city: data.localidade?.toUpperCase() || prev.city,
                            state: data.uf?.toUpperCase() || prev.state,
                          }));
                        }
                      } catch {}
                    }
                  }}
                  placeholder="CEP (apenas números)"
                  inputMode="numeric"
                  maxLength={8}
                  className={inputCls}
                />
              </div>
              <input
                value={form.address}
                onChange={e => setForm({ ...form, address: e.target.value.toUpperCase() })}
                placeholder="Rua / Logradouro"
                required
                className={inputCls}
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.addressNumber}
                  onChange={e => setForm({ ...form, addressNumber: e.target.value })}
                  placeholder="Número *"
                  required
                  className={inputCls}
                />
                <input
                  value={form.complement}
                  onChange={e => setForm({ ...form, complement: e.target.value.toUpperCase() })}
                  placeholder="Complemento (apto, casa...)"
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <input
                  value={form.city}
                  onChange={e => setForm({ ...form, city: e.target.value.toUpperCase() })}
                  placeholder="Cidade"
                  required
                  className={inputCls}
                />
                <input
                  value={form.state}
                  onChange={e => setForm({ ...form, state: e.target.value.toUpperCase() })}
                  placeholder="Estado (ex: SP)"
                  required
                  maxLength={2}
                  className={inputCls}
                />
              </div>

              {/* 9–12. Responsável */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2">Responsável</p>
              <input
                value={form.guardianName}
                onChange={e => setForm({ ...form, guardianName: e.target.value.toUpperCase() })}
                placeholder="Nome do responsável"
                required
                className={inputCls}
              />
              <div>
                <input
                  value={form.guardianPhone}
                  onChange={e => {
                    const digits = e.target.value.replace(/\D/g, '').slice(0, 11);
                    setForm({ ...form, guardianPhone: digits });
                  }}
                  placeholder="Telefone do responsável"
                  required
                  inputMode="numeric"
                  className={inputCls}
                />
              </div>
              <select
                value={form.guardianRelation}
                onChange={e => setForm({ ...form, guardianRelation: e.target.value })}
                required
                className={`${inputCls} max-w-full`}
              >
                <option value="">Relação com o aluno *</option>
                <option value="pai">Pai</option>
                <option value="mae">Mãe</option>
                <option value="avo">Avô/Avó</option>
                <option value="tio">Tio/Tia</option>
                <option value="outro">Outro</option>
              </select>

              {/* 13–14. Acesso */}
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 pt-2">Acesso</p>
              <select value={form.classId} onChange={e => setForm({ ...form, classId: e.target.value })} required className={inputCls}>
                <option value="">Selecione a turma *</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} — {c.year}</option>)}
              </select>
              <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-xl">
                <span className="text-blue-600 text-lg">📧</span>
                <p className="text-xs text-blue-700 dark:text-blue-300">
                  As credenciais de acesso serão geradas automaticamente e enviadas para o email do aluno.
                </p>
              </div>
              {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3 pt-2 pb-4">
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
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <h2 className="text-base font-bold text-[#1E3A5F] dark:text-white">Dados do Aluno</h2>
              <button onClick={() => setSelectedStudent(null)} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400">
                <X size={18} />
              </button>
            </div>
            <div className="p-4 space-y-3">
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
                    {selectedStudent.addressNumber && `, ${selectedStudent.addressNumber}`}
                    {selectedStudent.complement && ` - ${selectedStudent.complement}`}
                    {selectedStudent.city && `, ${selectedStudent.city}`}
                    {selectedStudent.state && ` - ${selectedStudent.state}`}
                    {selectedStudent.zipCode && ` · CEP ${selectedStudent.zipCode}`}
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
