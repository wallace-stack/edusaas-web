'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import {
  ArrowLeft, Plus, Search, Trash2,
  ShieldCheck, Users, GraduationCap,
  ChevronLeft, ChevronRight,
} from 'lucide-react';

// ──────────────────────────────────────────────────────────────────────────────
// Tipos
// ──────────────────────────────────────────────────────────────────────────────

interface StaffUser {
  id: number;
  name: string;
  email: string;
  role: 'director' | 'coordinator' | 'secretary' | 'teacher';
  isActive: boolean;
  phone?: string;
}

interface StudentUser {
  id: number;
  name: string;
  email: string;
  role: 'student';
  isActive: boolean;
  classId: number | null;
  className: string | null;
  gradeAverage: number | null;
  attendanceRate: number | null;
  situation: 'APPROVED' | 'RECOVERY' | 'FAILED' | 'NO_GRADES';
}

interface SchoolClass {
  id: number;
  name: string;
}

// ──────────────────────────────────────────────────────────────────────────────
// Constantes de estilo
// ──────────────────────────────────────────────────────────────────────────────

const PAGE_SIZE = 50;

const ROLE_LABEL: Record<string, string> = {
  director: 'Diretor',
  coordinator: 'Coordenador',
  secretary: 'Administrativo',
  teacher: 'Professor',
};

const ROLE_COLOR: Record<string, string> = {
  director:    'bg-purple-50 dark:bg-purple-950 text-purple-700',
  coordinator: 'bg-blue-50   dark:bg-blue-950   text-blue-700',
  secretary:   'bg-indigo-50 dark:bg-indigo-950 text-indigo-700',
  teacher:     'bg-green-50  dark:bg-green-950  text-green-700',
};

const SITUATION_LABEL: Record<string, string> = {
  APPROVED: 'Aprovado',
  RECOVERY: 'Recuperação',
  FAILED:   'Reprovado',
  NO_GRADES:'Sem notas',
};

const SITUATION_COLOR: Record<string, string> = {
  APPROVED:  'bg-green-50  dark:bg-green-950  text-green-700',
  RECOVERY:  'bg-yellow-50 dark:bg-yellow-950 text-yellow-700',
  FAILED:    'bg-red-50    dark:bg-red-950    text-red-700',
  NO_GRADES: 'bg-gray-100  dark:bg-gray-800   text-gray-500',
};

const STAFF_CHIPS = [
  { value: 'coordinator', label: 'Coordenador' },
  { value: 'secretary',   label: 'Administrativo' },
  { value: 'teacher',     label: 'Professor' },
];

const INPUT_CLS =
  'w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100';

// ──────────────────────────────────────────────────────────────────────────────
// Componente principal
// ──────────────────────────────────────────────────────────────────────────────

export default function UsuariosPage() {
  const router      = useRouter();
  const currentUser = getUser();

  // Abas
  const [activeTab, setActiveTab] = useState<'funcionarios' | 'alunos'>('funcionarios');

  // Dados
  const [staff,          setStaff]          = useState<StaffUser[]>([]);
  const [students,       setStudents]       = useState<StudentUser[]>([]);
  const [classes,        setClasses]        = useState<SchoolClass[]>([]);
  const [loadingStaff,   setLoadingStaff]   = useState(true);
  const [loadingStudents,setLoadingStudents] = useState(false);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // Filtros
  const [search,      setSearch]      = useState('');
  const [roleFilter,  setRoleFilter]  = useState('');
  const [classFilter, setClassFilter] = useState('');

  // Paginação (alunos)
  const [page, setPage] = useState(1);

  // Modal
  const [showModal,  setShowModal]  = useState(false);
  const [staffForm,  setStaffForm]  = useState({ name: '', email: '', password: '', role: 'coordinator' });
  const [studentForm,setStudentForm]= useState({ name: '', email: '', password: '' });
  const [saving,     setSaving]     = useState(false);
  const [formError,  setFormError]  = useState('');

  // ── Carregamento inicial ───────────────────────────────────────────────────

  useEffect(() => {
    if (!currentUser) { router.push('/login'); return; }
    loadStaff();
    loadClasses();
  }, []);

  // Carrega alunos ao entrar na aba pela primeira vez
  useEffect(() => {
    if (activeTab === 'alunos' && !studentsLoaded) loadStudents();
    // Limpa busca e filtros ao trocar de aba
    setSearch('');
    setRoleFilter('');
    setClassFilter('');
    setPage(1);
  }, [activeTab]);

  // Reseta página ao mudar filtros
  useEffect(() => { setPage(1); }, [search, classFilter]);

  const loadStaff = async () => {
    setLoadingStaff(true);
    try {
      const { data } = await api.get('/users');
      setStaff(
        (data as any[])
          .filter(u => u.role !== 'student')
          .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      );
    } catch (err) { console.error(err); }
    finally { setLoadingStaff(false); }
  };

  const loadStudents = async () => {
    setLoadingStudents(true);
    try {
      const { data } = await api.get('/users?role=student');
      setStudents(
        (data as any[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      );
      setStudentsLoaded(true);
    } catch (err) { console.error(err); }
    finally { setLoadingStudents(false); }
  };

  const loadClasses = async () => {
    try {
      const { data } = await api.get('/classes');
      setClasses(
        (data as any[]).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
      );
    } catch (err) { console.error(err); }
  };

  // ── Filtros derivados ──────────────────────────────────────────────────────

  const filteredStaff = useMemo(() => {
    const q = search.toLowerCase();
    return staff.filter(u => {
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole   = !roleFilter || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [staff, search, roleFilter]);

  const filteredStudents = useMemo(() => {
    const q = search.toLowerCase();
    return students.filter(u => {
      const matchesSearch = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesClass  = !classFilter || String(u.classId) === classFilter;
      return matchesSearch && matchesClass;
    });
  }, [students, search, classFilter]);

  const totalPages       = Math.ceil(filteredStudents.length / PAGE_SIZE);
  const paginatedStudents = filteredStudents.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // ── Ações ─────────────────────────────────────────────────────────────────

  const handleDelete = async (id: number, isStudent: boolean) => {
    if (!confirm('Desativar este usuário?')) return;
    try {
      await api.delete(`/users/${id}`);
      if (isStudent) setStudents(prev => prev.filter(u => u.id !== id));
      else           setStaff(prev => prev.filter(u => u.id !== id));
    } catch (err) { console.error(err); }
  };

  const openModal = () => {
    setFormError('');
    setStaffForm({ name: '', email: '', password: '', role: 'coordinator' });
    setStudentForm({ name: '', email: '', password: '' });
    setShowModal(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      await api.post('/users', staffForm);
      setShowModal(false);
      loadStaff();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erro ao criar funcionário');
    } finally { setSaving(false); }
  };

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setFormError('');
    try {
      await api.post('/users', { ...studentForm, role: 'student' });
      setShowModal(false);
      setStudentsLoaded(false);
      loadStudents();
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Erro ao criar aluno');
    } finally { setSaving(false); }
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">

      {/* Header ────────────────────────────────────────────────────────────── */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            >
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Usuários</h1>
          </div>
          <button
            onClick={openModal}
            className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={16} />
            {activeTab === 'alunos' ? 'Novo aluno' : 'Novo funcionário'}
          </button>
        </div>
      </header>

      {/* Abas ───────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          <TabButton
            active={activeTab === 'funcionarios'}
            onClick={() => setActiveTab('funcionarios')}
            icon={<Users size={15} />}
            label="Funcionários"
            count={staff.length || undefined}
          />
          <TabButton
            active={activeTab === 'alunos'}
            onClick={() => setActiveTab('alunos')}
            icon={<GraduationCap size={15} />}
            label="Alunos"
            count={studentsLoaded ? students.length : undefined}
          />
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-6 py-8">

        {/* Busca — sempre visível ─────────────────────────────────────────── */}
        <div className="relative mb-4">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={
              activeTab === 'funcionarios'
                ? 'Buscar funcionário por nome ou email...'
                : 'Buscar aluno por nome ou email...'
            }
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100"
          />
        </div>

        {/* ── Aba Funcionários ──────────────────────────────────────────────── */}
        {activeTab === 'funcionarios' && (
          <>
            {/* Chips de role */}
            <div className="flex flex-wrap gap-2 mb-5">
              <Chip
                label="Todos"
                active={roleFilter === ''}
                onClick={() => setRoleFilter('')}
              />
              {STAFF_CHIPS.map(chip => (
                <Chip
                  key={chip.value}
                  label={chip.label}
                  active={roleFilter === chip.value}
                  onClick={() => setRoleFilter(prev => prev === chip.value ? '' : chip.value)}
                />
              ))}
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {loadingStaff ? (
                <Spinner />
              ) : filteredStaff.length === 0 ? (
                <Empty text="Nenhum funcionário encontrado" />
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <TH>Nome</TH>
                      <TH className="hidden sm:table-cell">Email</TH>
                      <TH>Papel</TH>
                      <TH className="hidden sm:table-cell">Status</TH>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {filteredStaff.map(u => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/diretor/usuarios/${u.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{u.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLOR[u.role]}`}>
                            {ROLE_LABEL[u.role]}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <ActiveBadge active={u.isActive} />
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 justify-end">
                            {/* Atalho para permissões — oculto para director */}
                            {u.role !== 'director' && (
                              <button
                                title="Gerenciar permissões"
                                onClick={e => {
                                  e.stopPropagation();
                                  router.push(`/dashboard/diretor/usuarios/${u.id}?tab=permissoes`);
                                }}
                                className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-[#1E3A5F] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                              >
                                <ShieldCheck size={16} />
                              </button>
                            )}
                            <button
                              title="Desativar usuário"
                              onClick={e => { e.stopPropagation(); handleDelete(u.id, false); }}
                              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}

        {/* ── Aba Alunos ────────────────────────────────────────────────────── */}
        {activeTab === 'alunos' && (
          <>
            {/* Filtro por turma */}
            <div className="mb-5">
              <select
                value={classFilter}
                onChange={e => setClassFilter(e.target.value)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-white dark:bg-gray-800 dark:text-gray-100 w-full sm:w-56"
              >
                <option value="">Todas as turmas</option>
                {classes.map(c => (
                  <option key={c.id} value={String(c.id)}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              {loadingStudents ? (
                <Spinner />
              ) : paginatedStudents.length === 0 ? (
                <Empty text="Nenhum aluno encontrado" />
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700">
                    <tr>
                      <TH>Nome</TH>
                      <TH className="hidden sm:table-cell">Turma</TH>
                      <TH className="hidden md:table-cell">Situação</TH>
                      <TH className="hidden sm:table-cell">Status</TH>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                    {paginatedStudents.map(u => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                        onClick={() => router.push(`/dashboard/diretor/usuarios/${u.id}`)}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <Avatar name={u.name} color="bg-orange-400" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{u.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          {u.className ? (
                            <span className="text-sm text-gray-600 dark:text-gray-300">{u.className}</span>
                          ) : (
                            <span className="text-sm italic text-gray-300 dark:text-gray-600">Sem turma</span>
                          )}
                        </td>
                        <td className="px-6 py-4 hidden md:table-cell">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${SITUATION_COLOR[u.situation] ?? ''}`}>
                            {SITUATION_LABEL[u.situation] ?? u.situation}
                          </span>
                        </td>
                        <td className="px-6 py-4 hidden sm:table-cell">
                          <ActiveBadge active={u.isActive} />
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            title="Desativar aluno"
                            onClick={e => { e.stopPropagation(); handleDelete(u.id, true); }}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {filteredStudents.length} alunos · página {page} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronLeft size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-40 transition-colors"
                  >
                    <ChevronRight size={16} className="text-gray-600 dark:text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* Modal criar usuário ─────────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6">
            <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white mb-4">
              {activeTab === 'alunos' ? 'Novo aluno' : 'Novo funcionário'}
            </h2>

            {activeTab === 'alunos' ? (
              <form onSubmit={handleCreateStudent} className="space-y-3">
                <input
                  value={studentForm.name}
                  onChange={e => setStudentForm({ ...studentForm, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                  className={INPUT_CLS}
                />
                <input
                  value={studentForm.email}
                  onChange={e => setStudentForm({ ...studentForm, email: e.target.value })}
                  type="email"
                  placeholder="Email"
                  required
                  className={INPUT_CLS}
                />
                <input
                  value={studentForm.password}
                  onChange={e => setStudentForm({ ...studentForm, password: e.target.value })}
                  type="password"
                  placeholder="Senha"
                  required
                  className={INPUT_CLS}
                />
                {formError && <p className="text-red-500 dark:text-red-400 text-xs">{formError}</p>}
                <ModalActions onCancel={() => setShowModal(false)} saving={saving} label="Criar aluno" />
              </form>
            ) : (
              <form onSubmit={handleCreateStaff} className="space-y-3">
                <input
                  value={staffForm.name}
                  onChange={e => setStaffForm({ ...staffForm, name: e.target.value })}
                  placeholder="Nome completo"
                  required
                  className={INPUT_CLS}
                />
                <input
                  value={staffForm.email}
                  onChange={e => setStaffForm({ ...staffForm, email: e.target.value })}
                  type="email"
                  placeholder="Email"
                  required
                  className={INPUT_CLS}
                />
                <input
                  value={staffForm.password}
                  onChange={e => setStaffForm({ ...staffForm, password: e.target.value })}
                  type="password"
                  placeholder="Senha"
                  required
                  className={INPUT_CLS}
                />
                <select
                  value={staffForm.role}
                  onChange={e => setStaffForm({ ...staffForm, role: e.target.value })}
                  className={INPUT_CLS}
                >
                  <option value="coordinator">Coordenador</option>
                  <option value="secretary">Administrativo</option>
                  <option value="teacher">Professor</option>
                </select>
                {formError && <p className="text-red-500 dark:text-red-400 text-xs">{formError}</p>}
                <ModalActions onCancel={() => setShowModal(false)} saving={saving} label="Criar funcionário" />
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Sub-componentes
// ──────────────────────────────────────────────────────────────────────────────

function TabButton({
  active, onClick, icon, label, count,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
        active
          ? 'border-[#1E3A5F] text-[#1E3A5F] dark:border-blue-400 dark:text-blue-400'
          : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
      }`}
    >
      {icon}
      {label}
      {count !== undefined && (
        <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 px-1.5 py-0.5 rounded-full">
          {count}
        </span>
      )}
    </button>
  );
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
        active
          ? 'bg-[#1E3A5F] text-white'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
      }`}
    >
      {label}
    </button>
  );
}

function TH({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
  return (
    <th className={`text-left px-6 py-3 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase ${className}`}>
      {children}
    </th>
  );
}

function Avatar({ name, color = 'bg-[#1E3A5F]' }: { name: string; color?: string }) {
  return (
    <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center flex-shrink-0`}>
      <span className="text-white text-xs font-bold">{name.charAt(0).toUpperCase()}</span>
    </div>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  return (
    <span className={`text-xs px-2 py-1 rounded-full font-medium ${
      active
        ? 'bg-green-50 dark:bg-green-950 text-green-700'
        : 'bg-red-50 dark:bg-red-950 text-red-700'
    }`}>
      {active ? 'Ativo' : 'Inativo'}
    </span>
  );
}

function Spinner() {
  return (
    <div className="p-8 text-center">
      <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin mx-auto" />
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return (
    <div className="p-8 text-center text-gray-400 dark:text-gray-500 text-sm">{text}</div>
  );
}

function ModalActions({
  onCancel, saving, label,
}: {
  onCancel: () => void;
  saving: boolean;
  label: string;
}) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="button"
        onClick={onCancel}
        className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
      >
        Cancelar
      </button>
      <button
        type="submit"
        disabled={saving}
        className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
      >
        {saving ? 'Salvando...' : label}
      </button>
    </div>
  );
}
