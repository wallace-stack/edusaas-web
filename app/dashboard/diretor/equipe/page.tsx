'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Search, BookOpen, Users, Mail, Phone, Calendar, GraduationCap } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface TeamMember {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  createdAt?: string;
  subjects?: { subjectName: string; className: string | null }[];
}

const roleLabel: Record<string, string> = {
  teacher:     'Professor',
  coordinator: 'Coordenador',
  secretary:   'Administrativo',
  director:    'Diretor',
};

const roleColor: Record<string, string> = {
  teacher:     'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  coordinator: 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300',
  secretary:   'bg-teal-50 dark:bg-teal-950 text-teal-700 dark:text-teal-300',
  director:    'bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300',
};

const roleIcon: Record<string, any> = {
  teacher:     BookOpen,
  coordinator: Users,
  secretary:   Users,
  director:    GraduationCap,
};

export default function DiretorEquipePage() {
  const router = useRouter();
  const user   = getUser();

  const [members, setMembers]   = useState<TeamMember[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [roleFilter, setFilter] = useState<'all' | 'teacher' | 'coordinator'>('all');
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [sheetOpen, setSheet]   = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadTeam();
  }, []);

  const loadTeam = async () => {
    try {
      const [teachers, coordinators] = await Promise.all([
        api.get('/users?role=teacher'),
        api.get('/users?role=coordinator'),
      ]);
      const t: TeamMember[] = (teachers.data as any[]).map(m => ({ ...m, role: 'teacher' }));
      const c: TeamMember[] = (coordinators.data as any[]).map(m => ({ ...m, role: 'coordinator' }));
      setMembers([...t, ...c]);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openProfile = (m: TeamMember) => {
    setSelected(m);
    setSheet(true);
  };

  const filtered = members.filter(m => {
    const matchRole = roleFilter === 'all' || m.role === roleFilter;
    const matchSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.email.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const teachers     = members.filter(m => m.role === 'teacher');
  const coordinators = members.filter(m => m.role === 'coordinator');

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 sm:px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Equipe</h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 dark:text-gray-500">
            <span>{teachers.length} prof.</span>
            <span>·</span>
            <span>{coordinators.length} coord.</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
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
            {(['all', 'teacher', 'coordinator'] as const).map(r => (
              <button
                key={r}
                onClick={() => setFilter(r)}
                className={`px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                  roleFilter === r
                    ? 'bg-[#1E3A5F] text-white'
                    : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
                }`}
              >
                {r === 'all' ? 'Todos' : r === 'teacher' ? 'Professores' : 'Coordenadores'}
              </button>
            ))}
          </div>
        </div>

        {/* Lista */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
          {loading ? (
            <div className="p-8 flex justify-center">
              <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950 rounded-2xl flex items-center justify-center mb-4">
                <Users size={28} className="text-blue-400" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Nenhum membro encontrado.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {filtered.map(m => {
                const Icon = roleIcon[m.role] ?? Users;
                const subjectCount = m.subjects?.length ?? 0;
                const classes = m.subjects
                  ? [...new Set(m.subjects.map(s => s.className).filter(Boolean))]
                  : [];
                return (
                  <button
                    key={m.id}
                    onClick={() => openProfile(m)}
                    className="w-full flex items-center gap-4 px-4 sm:px-6 py-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${roleColor[m.role]}`}>
                      <span className="text-sm font-bold">{m.name.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{m.name}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{m.email}</p>
                      {m.role === 'teacher' && subjectCount > 0 && (
                        <p className="text-xs text-indigo-500 dark:text-indigo-400 mt-0.5">
                          {subjectCount} disciplina{subjectCount !== 1 ? 's' : ''}{classes.length > 0 ? ` · ${classes.join(', ')}` : ''}
                        </p>
                      )}
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${roleColor[m.role]}`}>
                      {roleLabel[m.role]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </main>

      {/* Sheet de perfil */}
      <Sheet open={sheetOpen} onOpenChange={setSheet}>
        <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto bg-white dark:bg-gray-900">
          {selected && (
            <>
              <SheetHeader className="pb-4 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${roleColor[selected.role]}`}>
                    {selected.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <SheetTitle className="text-base font-bold text-[#1E3A5F] dark:text-white text-left">
                      {selected.name}
                    </SheetTitle>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${roleColor[selected.role]}`}>
                      {roleLabel[selected.role]}
                    </span>
                  </div>
                </div>
                <SheetDescription className="sr-only">
                  Perfil de {selected.name}
                </SheetDescription>
              </SheetHeader>

              <div className="py-4 space-y-4">
                {/* Contato */}
                <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 space-y-2">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Contato</p>
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <Mail size={14} className="text-gray-400 flex-shrink-0" />
                    <span className="truncate">{selected.email}</span>
                  </div>
                  {selected.phone && (
                    <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <Phone size={14} className="text-gray-400 flex-shrink-0" />
                      <span>{selected.phone}</span>
                    </div>
                  )}
                  {selected.createdAt && (
                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                      <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                      <span>Desde {new Date(selected.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                    </div>
                  )}
                </div>

                {/* Disciplinas (professor) */}
                {selected.role === 'teacher' && (
                  <div>
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Disciplinas e Turmas</p>
                    {(selected.subjects?.length ?? 0) === 0 ? (
                      <p className="text-sm text-gray-400">Nenhuma disciplina atribuída.</p>
                    ) : (
                      <div className="space-y-2">
                        {selected.subjects!.map((s, i) => (
                          <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-800 rounded-xl px-4 py-2.5">
                            <div className="flex items-center gap-2">
                              <BookOpen size={14} className="text-indigo-500 flex-shrink-0" />
                              <span className="text-sm text-gray-700 dark:text-gray-300">{s.subjectName}</span>
                            </div>
                            {s.className && (
                              <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded-full">
                                {s.className}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Coordenador — sem dados extras por enquanto */}
                {selected.role === 'coordinator' && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-xl p-4">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      Coordenador responsável pela supervisão pedagógica da escola.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
