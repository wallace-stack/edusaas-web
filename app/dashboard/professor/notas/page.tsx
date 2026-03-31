'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, AlertCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolClass { id: number; name: string; year: number; }
interface Subject { id: number; name: string; }
interface Student { id: number; name: string; }
interface GradeData {
  value: string;
  label: string;
  weight: string;
  error: string;
  touched: boolean;
}
interface StudentGrades {
  student: Student;
  instruments: [GradeData, GradeData, GradeData];
}

const emptyInstrument = (): GradeData => ({
  value: '', label: '', weight: '1', error: '', touched: false,
});

function LancarNotasPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const turmaIdParam = searchParams.get('turmaId');
  const user = getUser();
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [period, setPeriod] = useState(1);
  const [studentGrades, setStudentGrades] = useState<StudentGrades[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my')
      .then(r => {
        setClasses(r.data);
        if (turmaIdParam) setClassId(turmaIdParam);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (classId) {
      api.get(`/classes/${classId}/subjects`)
        .then(r => setSubjects(r.data))
        .catch(console.error);
      setSubjectId('');
      setStudentGrades([]);
    }
  }, [classId]);

  // Carrega alunos e notas existentes quando turma + disciplina selecionadas
  useEffect(() => {
    if (!classId || !subjectId) { setStudentGrades([]); return; }
    loadStudentsAndGrades();
  }, [classId, subjectId, period]);

  const loadStudentsAndGrades = async () => {
    setLoadingGrades(true);
    try {
      const [enrollRes, gradesRes] = await Promise.all([
        api.get(`/enrollments/class/${classId}`),
        api.get(`/grades/class/${classId}/subject/${subjectId}`),
      ]);

      const students: Student[] = enrollRes.data
        .map((e: any) => e.student)
        .filter(Boolean)
        .sort((a: Student, b: Student) => a.name.localeCompare(b.name));

      const grades: any[] = gradesRes.data;

      const mapped: StudentGrades[] = students.map(student => {
        const instruments: [GradeData, GradeData, GradeData] = [
          emptyInstrument(), emptyInstrument(), emptyInstrument(),
        ];

        // Preencher com notas existentes do bimestre selecionado
        grades
          .filter((g: any) => g.studentId === student.id && g.period === period)
          .forEach((g: any) => {
            const idx = (g.instrument || 1) - 1;
            if (idx >= 0 && idx <= 2) {
              instruments[idx] = {
                value: String(Number(g.value)),
                label: g.label || '',
                weight: String(Number(g.weight) || 1),
                error: '',
                touched: true,
              };
            }
          });

        return { student, instruments };
      });

      setStudentGrades(mapped);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingGrades(false);
    }
  };

  // Validação de nota
  const validateNote = (val: string): string => {
    if (val === '') return '';
    const cleaned = val.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(cleaned)) return 'Valor inválido';
    const n = parseFloat(cleaned);
    if (isNaN(n)) return 'Valor inválido';
    if (n < 0 || n > 10) return 'Entre 0 e 10';
    return '';
  };

  const updateInstrument = (studentIdx: number, instrIdx: number, field: keyof GradeData, value: string) => {
    setStudentGrades(prev => {
      const copy = [...prev];
      const s = { ...copy[studentIdx] };
      const instruments = [...s.instruments] as [GradeData, GradeData, GradeData];
      instruments[instrIdx] = { ...instruments[instrIdx], [field]: value };

      if (field === 'value') {
        instruments[instrIdx].touched = true;
        instruments[instrIdx].error = validateNote(value);
      }

      s.instruments = instruments;
      copy[studentIdx] = s;
      return copy;
    });
  };

  // Bloqueia caracteres não numéricos no input de nota
  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '.', ','];
    if (allowed.includes(e.key)) return;
    if (e.key >= '0' && e.key <= '9') return;
    e.preventDefault();
  };

  // Calcula média ponderada de um aluno
  const calcAverage = (instruments: GradeData[]): number | null => {
    let sum = 0, wt = 0;
    for (const inst of instruments) {
      if (inst.value === '' || inst.error) continue;
      const v = parseFloat(inst.value.replace(',', '.'));
      const w = parseFloat(inst.weight) || 1;
      if (isNaN(v)) continue;
      sum += v * w;
      wt += w;
    }
    return wt > 0 ? Math.round((sum / wt) * 10) / 10 : null;
  };

  // Progresso
  const totalSlots = studentGrades.length * 3;
  const filledSlots = studentGrades.reduce((acc, sg) =>
    acc + sg.instruments.filter(i => i.value !== '' && !i.error).length, 0);
  const progressPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;

  // Validação global
  const hasAnyNote = studentGrades.some(sg => sg.instruments.some(i => i.value !== '' && !i.error));
  const hasErrors = studentGrades.some(sg => sg.instruments.some(i => i.error !== ''));
  const canSave = hasAnyNote && !hasErrors && !saving;

  // Salvar
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    try {
      const grades: any[] = [];
      studentGrades.forEach(sg => {
        sg.instruments.forEach((inst, idx) => {
          if (inst.value === '' || inst.error) return;
          grades.push({
            studentId: sg.student.id,
            subjectId: Number(subjectId),
            classId: Number(classId),
            period,
            instrument: idx + 1,
            value: parseFloat(inst.value.replace(',', '.')),
            label: inst.label || undefined,
            weight: parseFloat(inst.weight) || 1,
          });
        });
      });

      await api.post('/grades/bulk', grades);
      toast.success('Notas salvas com sucesso!');
      // Recarrega para pegar IDs atualizados
      await loadStudentsAndGrades();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Erro ao salvar notas');
    } finally {
      setSaving(false);
    }
  };

  // Limpar
  const handleClear = () => {
    setStudentGrades(prev => prev.map(sg => ({
      ...sg,
      instruments: [emptyInstrument(), emptyInstrument(), emptyInstrument()],
    })));
  };

  const inputBase = "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors duration-200 bg-white dark:bg-gray-800";
  const inputNormal = `${inputBase} border-gray-200 dark:border-gray-700 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20`;
  const inputError = `${inputBase} border-red-400 dark:border-red-500 focus:border-red-500 focus:ring-2 focus:ring-red-500/20`;
  const inputSuccess = `${inputBase} border-green-400 dark:border-green-600 focus:border-green-500 focus:ring-2 focus:ring-green-500/20`;

  const getInputClass = (inst: GradeData) => {
    if (inst.error) return inputError;
    if (inst.value && inst.touched && !inst.error) return inputSuccess;
    return inputNormal;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Lançar notas</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select
            value={classId}
            onChange={e => setClassId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]"
          >
            <option value="">Selecione a turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select
            value={subjectId}
            onChange={e => setSubjectId(e.target.value)}
            disabled={!classId}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] disabled:opacity-50"
          >
            <option value="">Selecione a disciplina</option>
            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>

        {/* Pills de bimestre */}
        {classId && subjectId && (
          <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {[1, 2, 3, 4].map(b => (
              <button
                key={b}
                onClick={() => setPeriod(b)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  period === b
                    ? 'bg-[#1E3A5F] text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                }`}
              >
                {b}º Bim
              </button>
            ))}
          </div>
        )}

        {/* Barra de progresso */}
        {studentGrades.length > 0 && (
          <>
            <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full mb-1 overflow-hidden">
              <div
                className="h-full bg-[#1E3A5F] rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 dark:text-gray-500 text-right mb-4">
              {filledSlots} de {totalSlots} notas lançadas
            </p>
          </>
        )}

        {/* Estado vazio */}
        {(!classId || !subjectId) && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione turma e disciplina para lançar notas</p>
          </div>
        )}

        {/* Loading */}
        {loadingGrades && (
          <div className="flex justify-center py-10">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Cards dos alunos */}
        {!loadingGrades && studentGrades.length > 0 && (
          <div className="space-y-3">
            {studentGrades.map((sg, sIdx) => {
              const avg = calcAverage(sg.instruments);
              const hasStudentError = sg.instruments.some(i => i.error);
              const isComplete = sg.instruments.some(i => i.value && !i.error);

              return (
                <div
                  key={sg.student.id}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border transition-colors duration-300 overflow-hidden ${
                    hasStudentError
                      ? 'border-red-200 dark:border-red-900'
                      : isComplete
                      ? 'border-green-200 dark:border-green-900'
                      : 'border-gray-100 dark:border-gray-800'
                  }`}
                >
                  {/* Header do aluno */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">{sg.student.name.charAt(0)}</span>
                    </div>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{sg.student.name}</span>
                    <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${
                      avg === null
                        ? 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                        : avg >= 6
                        ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400'
                        : avg >= 5
                        ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400'
                        : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'
                    }`}>
                      {avg !== null ? avg.toFixed(1) : '—'}
                    </span>
                  </div>

                  {/* Grid de instrumentos */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50 dark:divide-gray-800 border-t border-gray-50 dark:border-gray-800">
                    {sg.instruments.map((inst, iIdx) => (
                      <div key={iIdx} className="p-3 space-y-2">
                        <p className="text-[10px] font-semibold text-[#1E3A5F] dark:text-blue-400 uppercase tracking-wider">
                          {iIdx + 1}º instrumento
                        </p>
                        <input
                          value={inst.label}
                          onChange={e => updateInstrument(sIdx, iIdx, 'label', e.target.value)}
                          placeholder="ex: Prova"
                          className={`${inputNormal} text-xs py-1.5`}
                        />
                        <div>
                          <input
                            value={inst.value}
                            onChange={e => updateInstrument(sIdx, iIdx, 'value', e.target.value)}
                            onKeyDown={handleNoteKeyDown}
                            placeholder="0.0"
                            inputMode="decimal"
                            maxLength={4}
                            className={`${getInputClass(inst)} text-center font-medium`}
                          />
                          {inst.error && (
                            <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1">
                              <AlertCircle size={10} />
                              {inst.error}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-gray-400">Peso</span>
                          <input
                            value={inst.weight}
                            onChange={e => updateInstrument(sIdx, iIdx, 'weight', e.target.value)}
                            className="w-10 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs text-center bg-white dark:bg-gray-800 dark:text-gray-300 outline-none focus:border-[#1E3A5F]"
                            inputMode="numeric"
                            maxLength={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Footer — média */}
                  <div className="px-4 py-2.5 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                    <span className="text-xs text-gray-400">Média do bimestre</span>
                    <span className={`text-lg font-medium ${
                      avg === null ? 'text-gray-300 dark:text-gray-600'
                        : avg >= 6 ? 'text-green-500'
                        : avg >= 5 ? 'text-yellow-500'
                        : 'text-red-500'
                    }`}>
                      {avg !== null ? avg.toFixed(1) : '—'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Sem alunos */}
        {!loadingGrades && classId && subjectId && studentGrades.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum aluno matriculado nesta turma</p>
          </div>
        )}

        {/* Ações */}
        {studentGrades.length > 0 && (
          <div className="mt-4 flex gap-3 items-center">
            <button
              onClick={handleSave}
              disabled={!canSave}
              className="bg-[#1E3A5F] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#162d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]"
            >
              {saving ? 'Salvando...' : 'Salvar notas'}
            </button>
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors"
            >
              Limpar
            </button>
          </div>
        )}

        {saveError && (
          <p className="text-red-500 text-sm mt-2 flex items-center gap-1">
            <AlertCircle size={14} /> {saveError}
          </p>
        )}

        {studentGrades.length > 0 && (
          <p className="text-[11px] text-gray-400 dark:text-gray-600 mt-3 leading-relaxed">
            Preencha ao menos 1 instrumento por aluno. Nome e peso são opcionais — sem peso definido, a média é simples.
            Apenas valores numéricos entre 0 e 10 são aceitos.
          </p>
        )}
      </main>
    </div>
  );
}

export default function LancarNotasPageWrapper() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <LancarNotasPage />
    </Suspense>
  );
}
