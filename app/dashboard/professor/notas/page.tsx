'use client';

import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolClass {
  id: number;
  name: string;
  year: number;
  mode?: 'regular' | 'infantil';
  infantilConfig?: {
    useConceito:     boolean;
    useParecer:      boolean;
    useDiarioBordo:  boolean;
    usePlanejamento: boolean;
  } | null;
}
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

interface InfantilStudentData {
  student: Student;
  conceito: string;
  parecer: string;
  recordId: number | null;
}

const CONCEITO_OPTIONS = [
  { value: '',                   label: 'Selecionar...' },
  { value: 'desenvolvido',       label: 'Desenvolvido' },
  { value: 'em_desenvolvimento', label: 'Em desenvolvimento' },
  { value: 'nao_desenvolvido',   label: 'Não desenvolvido' },
];

const CONCEITO_COLORS: Record<string, string> = {
  desenvolvido:       'bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300',
  em_desenvolvimento: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300',
  nao_desenvolvido:   'bg-red-50 dark:bg-red-950 text-red-700 dark:text-red-300',
};

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
  const [loading, setLoading] = useState(true);
  const [loadingGrades, setLoadingGrades] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  // Regular mode
  const [studentGrades, setStudentGrades] = useState<StudentGrades[]>([]);

  // Infantil mode
  const [infantilStudents, setInfantilStudents] = useState<InfantilStudentData[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);

  const selectedClass = classes.find(c => String(c.id) === classId);
  const isInfantil = selectedClass?.mode === 'infantil';
  const cfg = selectedClass?.infantilConfig;

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
    if (turmaIdParam && classes.length > 0) setClassId(turmaIdParam);
  }, [turmaIdParam, classes]);

  useEffect(() => {
    if (classId) {
      api.get(`/classes/${classId}/subjects`)
        .then(r => setSubjects(r.data))
        .catch(console.error);
      setSubjectId('');
      setStudentGrades([]);
      setInfantilStudents([]);
    }
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    if (isInfantil) {
      loadInfantilData();
    } else {
      if (!subjectId) { setStudentGrades([]); return; }
      loadStudentsAndGrades();
    }
  }, [classId, subjectId, period, isInfantil]);

  // ─── Regular ──────────────────────────────────────────────────────────────

  const loadStudentsAndGrades = async () => {
    setLoadingGrades(true);
    try {
      const [enrollRes, gradesRes] = await Promise.all([
        api.get(`/enrollments/class/${classId}`),
        api.get(`/grades/class/${classId}/subject/${subjectId}`),
      ]);
      const students: Student[] = enrollRes.data
        .map((e: any) => e.student).filter(Boolean)
        .sort((a: Student, b: Student) => a.name.localeCompare(b.name));

      const grades: any[] = gradesRes.data;
      const mapped: StudentGrades[] = students.map(student => {
        const instruments: [GradeData, GradeData, GradeData] = [emptyInstrument(), emptyInstrument(), emptyInstrument()];
        grades.filter((g: any) => g.studentId === student.id && g.period === period).forEach((g: any) => {
          const idx = (g.instrument || 1) - 1;
          if (idx >= 0 && idx <= 2) {
            instruments[idx] = { value: String(Number(g.value)), label: g.label || '', weight: String(Number(g.weight) || 1), error: '', touched: true };
          }
        });
        return { student, instruments };
      });
      setStudentGrades(mapped);
    } catch (err) { console.error(err); }
    finally { setLoadingGrades(false); }
  };

  const validateNote = (val: string): string => {
    if (val === '') return '';
    const cleaned = val.replace(',', '.');
    if (!/^\d*\.?\d*$/.test(cleaned)) return 'Valor inválido';
    const n = parseFloat(cleaned);
    if (isNaN(n) || n < 0 || n > 10) return 'Entre 0 e 10';
    return '';
  };

  const updateInstrument = (studentIdx: number, instrIdx: number, field: keyof GradeData, value: string) => {
    setStudentGrades(prev => {
      const copy = [...prev];
      const s = { ...copy[studentIdx] };
      const instruments = [...s.instruments] as [GradeData, GradeData, GradeData];
      instruments[instrIdx] = { ...instruments[instrIdx], [field]: value };
      if (field === 'value') { instruments[instrIdx].touched = true; instruments[instrIdx].error = validateNote(value); }
      s.instruments = instruments;
      copy[studentIdx] = s;
      return copy;
    });
  };

  const handleNoteKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', '.', ','];
    if (allowed.includes(e.key) || (e.key >= '0' && e.key <= '9')) return;
    e.preventDefault();
  };

  const calcAverage = (instruments: GradeData[]): number | null => {
    let sum = 0, wt = 0;
    for (const inst of instruments) {
      if (inst.value === '' || inst.error) continue;
      const v = parseFloat(inst.value.replace(',', '.')), w = parseFloat(inst.weight) || 1;
      if (isNaN(v)) continue;
      sum += v * w; wt += w;
    }
    return wt > 0 ? Math.round((sum / wt) * 10) / 10 : null;
  };

  const totalSlots = studentGrades.length * 3;
  const filledSlots = studentGrades.reduce((acc, sg) => acc + sg.instruments.filter(i => i.value !== '' && !i.error).length, 0);
  const progressPct = totalSlots > 0 ? Math.round((filledSlots / totalSlots) * 100) : 0;
  const hasAnyNote = studentGrades.some(sg => sg.instruments.some(i => i.value !== '' && !i.error));
  const hasErrors = studentGrades.some(sg => sg.instruments.some(i => i.error !== ''));
  const canSave = hasAnyNote && !hasErrors && !saving;

  const handleSave = async () => {
    setSaving(true); setSaveError('');
    try {
      const grades: any[] = [];
      studentGrades.forEach(sg => {
        sg.instruments.forEach((inst, idx) => {
          if (inst.value === '' || inst.error) return;
          grades.push({ studentId: sg.student.id, subjectId: Number(subjectId), classId: Number(classId), period, instrument: idx + 1, value: parseFloat(inst.value.replace(',', '.')), label: inst.label || undefined, weight: parseFloat(inst.weight) || 1 });
        });
      });
      await api.post('/grades/bulk', grades);
      toast.success('Notas salvas com sucesso!');
      await loadStudentsAndGrades();
    } catch (err: any) {
      setSaveError(err.response?.data?.message || 'Erro ao salvar notas');
    } finally { setSaving(false); }
  };

  // ─── Infantil ─────────────────────────────────────────────────────────────

  const loadInfantilData = async () => {
    setLoadingGrades(true);
    try {
      const [enrollRes, recordsRes] = await Promise.all([
        api.get(`/enrollments/class/${classId}`),
        api.get(`/infantil/records?classId=${classId}&period=${period}`),
      ]);
      const students: Student[] = enrollRes.data
        .map((e: any) => e.student).filter(Boolean)
        .sort((a: Student, b: Student) => a.name.localeCompare(b.name));

      const records: any[] = recordsRes.data;
      const mapped: InfantilStudentData[] = students.map(s => {
        const rec = records.find((r: any) => r.studentId === s.id && (!subjectId || String(r.subjectId) === subjectId));
        return { student: s, conceito: rec?.conceito ?? '', parecer: rec?.parecer ?? '', recordId: rec?.id ?? null };
      });
      setInfantilStudents(mapped);

      // Tutorial primeira vez
      const key = `infantil-tutorial-${classId}`;
      if (!localStorage.getItem(key)) { setShowTutorial(true); localStorage.setItem(key, '1'); }
    } catch (err) { console.error(err); }
    finally { setLoadingGrades(false); }
  };

  const updateInfantilField = (idx: number, field: 'conceito' | 'parecer', value: string) => {
    setInfantilStudents(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleSaveInfantilStudent = async (idx: number) => {
    const item = infantilStudents[idx];
    setSaving(true);
    try {
      await api.post('/infantil/records', {
        studentId: item.student.id,
        classId: Number(classId),
        subjectId: subjectId ? Number(subjectId) : undefined,
        period,
        conceito: item.conceito || null,
        parecer: item.parecer || null,
      });
      toast.success(`Salvo: ${item.student.name}`);
    } catch {
      toast.error('Erro ao salvar');
    } finally { setSaving(false); }
  };

  const inputBase = "w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors duration-200 bg-white dark:bg-gray-800 dark:text-gray-100";
  const inputNormal = `${inputBase} border-gray-200 dark:border-gray-700 focus:border-[#1E3A5F] focus:ring-2 focus:ring-[#1E3A5F]/20`;
  const inputError = `${inputBase} border-red-400 dark:border-red-500 focus:border-red-500`;
  const inputSuccess = `${inputBase} border-green-400 dark:border-green-600 focus:border-green-500`;
  const getInputClass = (inst: GradeData) => inst.error ? inputError : (inst.value && inst.touched ? inputSuccess : inputNormal);

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      {/* Tutorial modal — infantil */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-2xl max-w-sm w-full p-6">
            <p className="text-2xl mb-2">🎨</p>
            <h2 className="font-bold text-[#1E3A5F] dark:text-white text-lg mb-3">Turma de Educação Infantil</h2>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Nesta turma você avalia por <strong>conceito</strong> e pode adicionar um <strong>parecer descritivo</strong> por aluno.</p>
            <ul className="text-sm text-gray-500 dark:text-gray-400 space-y-1 mb-4 list-disc list-inside">
              <li><strong>Desenvolvido</strong> — aluno atingiu os objetivos</li>
              <li><strong>Em desenvolvimento</strong> — em progresso</li>
              <li><strong>Não desenvolvido</strong> — necessita atenção</li>
            </ul>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Salve individualmente por aluno. Não há notas numéricas neste modo.</p>
            <button onClick={() => setShowTutorial(false)} className="w-full py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a]">
              Entendido!
            </button>
          </div>
        </div>
      )}

      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-2">
          <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
            <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">
              {isInfantil ? 'Avaliação Infantil' : 'Lançar notas'}
            </h1>
            {isInfantil && <p className="text-[10px] text-purple-500 font-medium">🎨 Modo Educação Infantil</p>}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-6">
        {/* Filtros */}
        <div className="flex flex-wrap gap-2 mb-4">
          <select value={classId} onChange={e => setClassId(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
            <option value="">Selecione a turma</option>
            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          {(!isInfantil || (cfg?.useConceito || cfg?.useParecer)) && (
            <select value={subjectId} onChange={e => setSubjectId(e.target.value)} disabled={!classId}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] disabled:opacity-50">
              <option value="">Disciplina (opcional)</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          )}
        </div>

        {/* Pills de bimestre */}
        {classId && (
          <div className="flex gap-1 mb-4 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
            {[1, 2, 3, 4].map(b => (
              <button key={b} onClick={() => setPeriod(b)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${period === b ? 'bg-[#1E3A5F] text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}>
                {b}º Bim
              </button>
            ))}
          </div>
        )}

        {/* ─── Modo Infantil ─────────────────────────────────────────────── */}
        {isInfantil && (
          <>
            {loadingGrades && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" /></div>}

            {!loadingGrades && infantilStudents.length === 0 && classId && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum aluno matriculado nesta turma</p>
              </div>
            )}

            {!loadingGrades && infantilStudents.length > 0 && (
              <div className="space-y-3">
                {infantilStudents.map((item, idx) => (
                  <div key={item.student.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">{item.student.name.charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{item.student.name}</span>
                      {item.conceito && (
                        <span className={`ml-auto text-[10px] px-2 py-0.5 rounded-full font-medium ${CONCEITO_COLORS[item.conceito] ?? ''}`}>
                          {CONCEITO_OPTIONS.find(o => o.value === item.conceito)?.label}
                        </span>
                      )}
                    </div>

                    <div className="space-y-3">
                      {(cfg?.useConceito !== false) && (
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Conceito</label>
                          <select value={item.conceito} onChange={e => updateInfantilField(idx, 'conceito', e.target.value)}
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
                            {CONCEITO_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                          </select>
                        </div>
                      )}
                      {(cfg?.useParecer !== false) && (
                        <div>
                          <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Parecer descritivo</label>
                          <textarea value={item.parecer} onChange={e => updateInfantilField(idx, 'parecer', e.target.value)}
                            rows={3} placeholder="Descreva o desenvolvimento do aluno neste bimestre..."
                            className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
                        </div>
                      )}
                    </div>

                    <button onClick={() => handleSaveInfantilStudent(idx)} disabled={saving}
                      className="mt-3 w-full py-2 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors">
                      {saving ? 'Salvando...' : 'Salvar'}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ─── Modo Regular ──────────────────────────────────────────────── */}
        {!isInfantil && (
          <>
            {classId && subjectId && (
              <>
                {studentGrades.length > 0 && (
                  <>
                    <div className="h-1 bg-gray-200 dark:bg-gray-800 rounded-full mb-1 overflow-hidden">
                      <div className="h-full bg-[#1E3A5F] rounded-full transition-all duration-500 ease-out" style={{ width: `${progressPct}%` }} />
                    </div>
                    <p className="text-xs text-gray-400 dark:text-gray-500 text-right mb-4">{filledSlots} de {totalSlots} notas lançadas</p>
                  </>
                )}
              </>
            )}

            {(!classId || !subjectId) && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione turma e disciplina para lançar notas</p>
              </div>
            )}

            {loadingGrades && <div className="flex justify-center py-10"><div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" /></div>}

            {!loadingGrades && studentGrades.length > 0 && (
              <div className="space-y-3">
                {studentGrades.map((sg, sIdx) => {
                  const avg = calcAverage(sg.instruments);
                  const hasStudentError = sg.instruments.some(i => i.error);
                  const isComplete = sg.instruments.some(i => i.value && !i.error);
                  return (
                    <div key={sg.student.id} className={`bg-white dark:bg-gray-900 rounded-2xl border transition-colors duration-300 overflow-hidden ${hasStudentError ? 'border-red-200 dark:border-red-900' : isComplete ? 'border-green-200 dark:border-green-900' : 'border-gray-100 dark:border-gray-800'}`}>
                      <div className="px-4 py-3 flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white text-xs font-bold">{sg.student.name.charAt(0)}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{sg.student.name}</span>
                        <span className={`ml-auto text-xs font-medium px-3 py-1 rounded-full ${avg === null ? 'bg-gray-100 dark:bg-gray-800 text-gray-400' : avg >= 6 ? 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' : avg >= 5 ? 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' : 'bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400'}`}>
                          {avg !== null ? avg.toFixed(1) : '—'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-gray-50 dark:divide-gray-800 border-t border-gray-50 dark:border-gray-800">
                        {sg.instruments.map((inst, iIdx) => (
                          <div key={iIdx} className="p-3 space-y-2">
                            <p className="text-[10px] font-semibold text-[#1E3A5F] dark:text-blue-400 uppercase tracking-wider">{iIdx + 1}º instrumento</p>
                            <input value={inst.label} onChange={e => updateInstrument(sIdx, iIdx, 'label', e.target.value)} placeholder="ex: Prova" className={`${inputNormal} text-xs py-1.5`} />
                            <div>
                              <input value={inst.value} onChange={e => updateInstrument(sIdx, iIdx, 'value', e.target.value)} onKeyDown={handleNoteKeyDown} placeholder="0.0" inputMode="decimal" maxLength={4} className={`${getInputClass(inst)} text-center font-medium`} />
                              {inst.error && <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1"><AlertCircle size={10} />{inst.error}</p>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] text-gray-400">Peso</span>
                              <input value={inst.weight} onChange={e => updateInstrument(sIdx, iIdx, 'weight', e.target.value)} className="w-10 px-2 py-1 rounded-md border border-gray-200 dark:border-gray-700 text-xs text-center bg-white dark:bg-gray-800 dark:text-gray-300 outline-none focus:border-[#1E3A5F]" inputMode="numeric" maxLength={2} />
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-2.5 border-t border-gray-50 dark:border-gray-800 flex justify-between items-center">
                        <span className="text-xs text-gray-400">Média do bimestre</span>
                        <span className={`text-lg font-medium ${avg === null ? 'text-gray-300 dark:text-gray-600' : avg >= 6 ? 'text-green-500' : avg >= 5 ? 'text-yellow-500' : 'text-red-500'}`}>{avg !== null ? avg.toFixed(1) : '—'}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loadingGrades && classId && subjectId && studentGrades.length === 0 && (
              <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
                <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum aluno matriculado nesta turma</p>
              </div>
            )}

            {studentGrades.length > 0 && (
              <div className="mt-4 flex gap-3 items-center">
                <button onClick={handleSave} disabled={!canSave} className="bg-[#1E3A5F] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#162d4a] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 active:scale-[0.98]">
                  {saving ? 'Salvando...' : 'Salvar notas'}
                </button>
                <button onClick={() => setStudentGrades(prev => prev.map(sg => ({ ...sg, instruments: [emptyInstrument(), emptyInstrument(), emptyInstrument()] })))}
                  className="px-4 py-2.5 rounded-xl text-sm text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
                  Limpar
                </button>
              </div>
            )}
            {saveError && <p className="text-red-500 text-sm mt-2 flex items-center gap-1"><AlertCircle size={14} /> {saveError}</p>}
          </>
        )}
      </main>
    </div>
  );
}

export default function LancarNotasPageWrapper() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center"><div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" /></div>}>
      <LancarNotasPage />
    </Suspense>
  );
}
