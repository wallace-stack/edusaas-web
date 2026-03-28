'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../../lib/auth';
import api from '../../../../lib/api';
import { ArrowLeft } from 'lucide-react';

interface GradeRecord {
  id: number;
  value: number;
  type: string;
  description: string;
  bimestre?: number;
  student: { id: number; name: string };
  subject: { id: number; name: string };
  createdAt: string;
}

interface SchoolClass { id: number; name: string; }
interface Subject { id: number; name: string; }

export default function ProfessorNotasHistoricoPage() {
  const router = useRouter();
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [grades, setGrades] = useState<GradeRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [classFilter, setClassFilter] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('');
  const [bimestreFilter, setBimestreFilter] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my').then(r => setClasses(r.data)).catch(console.error).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (classFilter) {
      api.get(`/classes/${classFilter}/subjects`).then(r => setSubjects(r.data)).catch(console.error);
      setGrades([]);
      setSubjectFilter('');
    }
  }, [classFilter]);

  useEffect(() => {
    if (classFilter && subjectFilter && subjectFilter !== '') {
      setLoading(true);
      api.get(`/grades/class/${classFilter}/subject/${subjectFilter}`)
        .then(r => setGrades(r.data))
        .catch(console.error)
        .finally(() => setLoading(false));
    } else {
      setGrades([]);
    }
  }, [classFilter, subjectFilter]);

  const filtered = bimestreFilter
    ? grades.filter(g => String(g.bimestre) === bimestreFilter)
    : grades;

  // Agrupa por aluno
  const byStudent: Record<string, { name: string; grades: GradeRecord[] }> = {};
  filtered.forEach(g => {
    const key = String(g.student?.id);
    if (!byStudent[key]) byStudent[key] = { name: g.student?.name || '—', grades: [] };
    byStudent[key].grades.push(g);
  });

  const avg = (gs: GradeRecord[]) => {
    if (!gs.length) return null;
    return (gs.reduce((s, g) => s + Number(g.value), 0) / gs.length).toFixed(1);
  };

  const inputCls = "px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Boletim da Turma</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-2 mb-6">
          <select value={classFilter} onChange={e => setClassFilter(e.target.value)} className={inputCls}>
            <option value="">Selecione a turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)} disabled={!classFilter} className={`${inputCls} disabled:opacity-50`}>
            <option value="">Selecione a disciplina</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <select value={bimestreFilter} onChange={e => setBimestreFilter(e.target.value)} disabled={!subjectFilter} className={`${inputCls} disabled:opacity-50`}>
            <option value="">Todos os bimestres</option>
            <option value="1">1º Bimestre</option>
            <option value="2">2º Bimestre</option>
            <option value="3">3º Bimestre</option>
            <option value="4">4º Bimestre</option>
          </select>
        </div>

        {!classFilter || !subjectFilter ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione turma e disciplina para ver o boletim</p>
          </div>
        ) : Object.keys(byStudent).length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-8 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma nota lançada ainda</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {Object.values(byStudent)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(({ name, grades: sg }) => {
                  const media = avg(sg);
                  const aprovado = media != null && Number(media) >= 6;
                  return (
                    <div key={name} className="px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs font-bold">{name.charAt(0)}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {media != null && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${aprovado ? 'bg-green-50 dark:bg-green-950 text-green-700' : 'bg-red-50 dark:bg-red-950 text-red-700'}`}>
                              {aprovado ? 'Aprovado' : 'Recuperação'}
                            </span>
                          )}
                          <span className={`text-base font-bold ${media != null && Number(media) >= 6 ? 'text-green-600' : 'text-red-500'}`}>
                            {media ?? '—'}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 pl-9">
                        {sg.sort((a, b) => (a.bimestre ?? 0) - (b.bimestre ?? 0)).map(g => (
                          <div key={g.id} className="text-xs bg-gray-50 dark:bg-gray-800 rounded-lg px-2 py-1">
                            {g.bimestre ? `${g.bimestre}º Bim · ` : ''}{g.description || g.type}: <span className={`font-bold ${Number(g.value) >= 6 ? 'text-green-600' : 'text-red-500'}`}>{Number(g.value).toFixed(1)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
