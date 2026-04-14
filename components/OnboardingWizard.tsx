'use client';

import { useState } from 'react';
import api from '@/app/lib/api';
import { Check, BookOpen, UserPlus, GraduationCap, X } from 'lucide-react';

interface Props {
  onClose: () => void;
}

type Step = 1 | 2 | 3;

const STEPS = [
  { id: 1, label: 'Turma',     icon: BookOpen },
  { id: 2, label: 'Professor', icon: UserPlus },
  { id: 3, label: 'Aluno',     icon: GraduationCap },
];

const inputCls =
  'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-400';

const btnPrimary =
  'w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

const btnSkip =
  'w-full py-2.5 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors';

export default function OnboardingWizard({ onClose }: Props) {
  const [step, setStep]         = useState<Step>(1);
  const [done, setDone]         = useState<Set<Step>>(new Set());
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  // Step 1 state
  const [className, setClassName] = useState('');
  const [classYear, setClassYear] = useState('2026');
  const [classPeriod, setClassPeriod] = useState('Manhã');
  const [createdClassId, setCreatedClassId] = useState<number | null>(null);

  // Step 2 state
  const [teacherName,  setTeacherName]  = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPass,  setTeacherPass]  = useState('');

  // Step 3 state
  const [studentName,  setStudentName]  = useState('');
  const [studentEmail, setStudentEmail] = useState('');

  const markDone = (s: Step) => setDone(prev => new Set(prev).add(s));

  const advance = () => {
    if (step < 3) setStep((step + 1) as Step);
    else onClose();
  };

  const skip = () => {
    setError('');
    advance();
  };

  // ── Step 1: criar turma ────────────────────────────────────────────────────
  const handleStep1 = async () => {
    if (!className.trim()) { setError('Informe o nome da turma.'); return; }
    setError(''); setLoading(true);
    try {
      const r = await api.post('/classes', {
        name: className.trim(),
        year: Number(classYear),
        period: classPeriod,
      });
      setCreatedClassId(r.data?.id ?? null);
      markDone(1);
      advance();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao criar turma.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: criar professor ────────────────────────────────────────────────
  const handleStep2 = async () => {
    if (!teacherName.trim() || !teacherEmail.trim() || !teacherPass.trim()) {
      setError('Preencha todos os campos.'); return;
    }
    if (teacherPass.length < 6) { setError('Senha mínima de 6 caracteres.'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/secretary/users', {
        name: teacherName.trim(),
        email: teacherEmail.trim(),
        password: teacherPass,
        role: 'teacher',
      });
      markDone(2);
      advance();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao adicionar professor.');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: matricular aluno ───────────────────────────────────────────────
  const handleStep3 = async () => {
    if (!studentName.trim() || !studentEmail.trim()) {
      setError('Preencha nome e e-mail do aluno.'); return;
    }
    setError(''); setLoading(true);
    try {
      await api.post('/secretary/students', {
        name: studentName.trim(),
        email: studentEmail.trim(),
        classId: createdClassId ?? undefined,
      });
      markDone(3);
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Erro ao matricular aluno.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}>

      {/* Card */}
      <div className="relative bg-white dark:bg-gray-900 rounded-3xl shadow-2xl w-full max-w-md
                      animate-in fade-in zoom-in-95 duration-300 overflow-hidden">

        {/* Botão fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-gray-400 hover:text-gray-600
                     dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors z-10"
          aria-label="Fechar"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-[#1E3A5F] to-indigo-700 px-6 pt-8 pb-6">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">E</span>
            </div>
            <div>
              <p className="text-white/70 text-xs uppercase tracking-widest">EduSaaS</p>
              <h2 className="text-white font-bold text-lg leading-tight">Bem-vindo! Vamos começar 🎉</h2>
            </div>
          </div>
          <p className="text-white/60 text-xs">Configure sua escola em 3 passos simples</p>

          {/* Progress bar */}
          <div className="mt-5">
            <div className="flex items-center gap-2">
              {STEPS.map((s, i) => {
                const isDone    = done.has(s.id as Step);
                const isCurrent = step === s.id;
                return (
                  <div key={s.id} className="flex items-center gap-2 flex-1 last:flex-none">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all
                      ${isDone    ? 'bg-green-400 text-white'
                      : isCurrent ? 'bg-white text-indigo-700'
                      :             'bg-white/20 text-white/60'}`}>
                      {isDone ? <Check size={14} /> : s.id}
                    </div>
                    <span className={`text-xs ${isCurrent ? 'text-white' : 'text-white/50'}`}>{s.label}</span>
                    {i < STEPS.length - 1 && (
                      <div className={`flex-1 h-px ${done.has(s.id as Step) ? 'bg-green-400' : 'bg-white/20'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {error && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800
                            text-red-600 dark:text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          {/* ── STEP 1 ── */}
          {step === 1 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-indigo-50 dark:bg-indigo-950 rounded-xl flex items-center justify-center">
                    <BookOpen size={18} className="text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Crie sua primeira turma</h3>
                    <p className="text-xs text-gray-400">Uma turma agrupa alunos por série e turno</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Nome da turma</label>
                    <input
                      className={inputCls}
                      placeholder="Ex: 1º Ano A, 9º Ano B"
                      value={className}
                      onChange={e => { setClassName(e.target.value); setError(''); }}
                      onKeyDown={e => e.key === 'Enter' && handleStep1()}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Ano letivo</label>
                      <input
                        type="number"
                        className={inputCls}
                        value={classYear}
                        onChange={e => setClassYear(e.target.value)}
                        min={2020} max={2040}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Turno</label>
                      <select className={inputCls} value={classPeriod} onChange={e => setClassPeriod(e.target.value)}>
                        <option>Manhã</option>
                        <option>Tarde</option>
                        <option>Noite</option>
                        <option>Integral</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              <button className={btnPrimary} onClick={handleStep1} disabled={loading}>
                {loading ? 'Criando...' : 'Criar turma e continuar →'}
              </button>
            </>
          )}

          {/* ── STEP 2 ── */}
          {step === 2 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-blue-50 dark:bg-blue-950 rounded-xl flex items-center justify-center">
                    <UserPlus size={18} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Adicione seu primeiro professor</h3>
                    <p className="text-xs text-gray-400">Ele receberá acesso ao sistema</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Nome completo</label>
                    <input className={inputCls} placeholder="Maria da Silva" value={teacherName}
                      onChange={e => { setTeacherName(e.target.value); setError(''); }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">E-mail</label>
                    <input type="email" className={inputCls} placeholder="professor@escola.com" value={teacherEmail}
                      onChange={e => { setTeacherEmail(e.target.value); setError(''); }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Senha de acesso</label>
                    <input type="password" className={inputCls} placeholder="Mínimo 6 caracteres" value={teacherPass}
                      onChange={e => { setTeacherPass(e.target.value); setError(''); }} />
                  </div>
                </div>
              </div>
              <button className={btnPrimary} onClick={handleStep2} disabled={loading}>
                {loading ? 'Adicionando...' : 'Adicionar professor e continuar →'}
              </button>
            </>
          )}

          {/* ── STEP 3 ── */}
          {step === 3 && (
            <>
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-9 h-9 bg-green-50 dark:bg-green-950 rounded-xl flex items-center justify-center">
                    <GraduationCap size={18} className="text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100">Matricule seu primeiro aluno</h3>
                    <p className="text-xs text-gray-400">
                      {createdClassId ? `Será matriculado na turma criada` : 'Dados básicos — complete o perfil depois'}
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">Nome completo</label>
                    <input className={inputCls} placeholder="João da Silva" value={studentName}
                      onChange={e => { setStudentName(e.target.value); setError(''); }} />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1 block">E-mail</label>
                    <input type="email" className={inputCls} placeholder="aluno@escola.com" value={studentEmail}
                      onChange={e => { setStudentEmail(e.target.value); setError(''); }} />
                  </div>
                </div>

                <p className="text-xs text-gray-400 dark:text-gray-500 mt-3">
                  O aluno receberá as credenciais de acesso por e-mail automaticamente.
                </p>
              </div>
              <button className={btnPrimary} onClick={handleStep3} disabled={loading}>
                {loading ? 'Matriculando...' : 'Concluir configuração ✓'}
              </button>
            </>
          )}

          {/* Skip */}
          <button className={btnSkip} onClick={skip} disabled={loading}>
            {step === 3 ? 'Pular e acessar o dashboard' : 'Pular por agora →'}
          </button>
        </div>
      </div>
    </div>
  );
}
