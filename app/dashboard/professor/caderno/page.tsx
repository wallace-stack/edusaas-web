'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import {
  ArrowLeft, Plus, BookOpen, Send, Edit3, Clock, Eye,
  CheckCircle, ChevronDown, ChevronUp, X, Paperclip,
  FileText, Upload, Check, Users, Pencil, Gamepad2,
  Star, Tag, Loader2, ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════════════════

interface SchoolClass { id: number; name: string; mode?: 'regular' | 'infantil'; }
interface Subject     { id: number; name: string; }

type PlanStatus  = 'draft' | 'sent' | 'read' | 'reviewed';
type PeriodType  = 'daily' | 'weekly' | 'monthly';
type ModuleType  = 'infantil' | 'regular';

interface Attachment { id: string; url: string; type: string; size: number; }

interface TeachingPlan {
  id: number;
  moduleType: ModuleType;
  periodType: PeriodType;
  referenceDate?: string;
  weekStart?: string;
  weekEnd?: string;
  theme?: string;
  ageGroup?: string;
  gradeLevel?: string;
  content?: string;
  generalObjective?: string;
  bncFields?: { fields: string[]; codes: string[] };
  bnccSkills?: { codes: string[] };
  welcome?: string;
  mainActivity?: string;
  playActivity?: string;
  closure?: string;
  methodology?: string;
  assessment?: string;
  resources?: string;
  attachments?: Attachment[];
  status: PlanStatus;
  readAt?: string | null;
  readByUser?: { name: string } | null;
  reviewedAt?: string | null;
  reviewedByUser?: { name: string } | null;
  schoolClass?: { name: string } | null;
  subject?: { name: string } | null;
  createdAt: string;
}

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES BNCC
// ══════════════════════════════════════════════════════════════════════════════

const INFANTIL_FIELDS = [
  { code: 'EO', name: 'O Eu, o Outro e o Nós',                                       color: '#6366f1', bg: '#EEF2FF' },
  { code: 'CG', name: 'Corpo, Gestos e Movimentos',                                   color: '#f59e0b', bg: '#FFFBEB' },
  { code: 'TS', name: 'Traços, Sons, Cores e Formas',                                 color: '#ec4899', bg: '#FDF2F8' },
  { code: 'EF', name: 'Escuta, Fala, Pensamento e Imaginação',                        color: '#10b981', bg: '#ECFDF5' },
  { code: 'ET', name: 'Espaços, Tempos, Quantidades, Relações e Transformações',       color: '#3b82f6', bg: '#EFF6FF' },
];

const BNCC_CODES: Record<string, Record<string, string[]>> = {
  EI02: {
    EO: Array.from({ length: 6 }, (_, i) => `EI02EO0${i + 1}`),
    CG: Array.from({ length: 5 }, (_, i) => `EI02CG0${i + 1}`),
    TS: Array.from({ length: 3 }, (_, i) => `EI02TS0${i + 1}`),
    EF: Array.from({ length: 9 }, (_, i) => `EI02EF0${i + 1}`),
    ET: Array.from({ length: 6 }, (_, i) => `EI02ET0${i + 1}`),
  },
  EI03: {
    EO: Array.from({ length: 6 }, (_, i) => `EI03EO0${i + 1}`),
    CG: Array.from({ length: 5 }, (_, i) => `EI03CG0${i + 1}`),
    TS: Array.from({ length: 3 }, (_, i) => `EI03TS0${i + 1}`),
    EF: Array.from({ length: 9 }, (_, i) => `EI03EF0${i + 1}`),
    ET: Array.from({ length: 6 }, (_, i) => `EI03ET0${i + 1}`),
  },
};

function ageGroupToPrefix(ag: string): string {
  return ag === '3 a 4 anos' ? 'EI02' : 'EI03';
}

const AGE_GROUPS  = ['3 a 4 anos', '4 a 5 anos', '5 a 6 anos'];
const GRADE_LEVELS = ['1º ano EF', '2º ano EF', '3º ano EF', '4º ano EF',
  '5º ano EF', '6º ano EF', '7º ano EF', '8º ano EF', '9º ano EF',
  '1ª série EM', '2ª série EM', '3ª série EM'];

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function fmtDate(iso?: string) {
  if (!iso) return '';
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function getWeekBounds(date: string) {
  const d   = new Date(date + 'T12:00:00');
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const mon = new Date(d); mon.setDate(d.getDate() + diff);
  const fri = new Date(mon); fri.setDate(mon.getDate() + 4);
  return {
    weekStart: mon.toISOString().split('T')[0],
    weekEnd:   fri.toISOString().split('T')[0],
  };
}

function fmtSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} KB`
    : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function StatusBadge({ plan }: { plan: TeachingPlan }) {
  const configs: Record<PlanStatus, { label: string; cls: string }> = {
    draft:    { label: 'Rascunho', cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
    sent:     { label: 'Enviado',  cls: 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400' },
    read:     { label: plan.readByUser ? `Visto por ${plan.readByUser.name.split(' ')[0]}` : 'Lido',
                cls: 'bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400' },
    reviewed: { label: 'Revisado', cls: 'bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400' },
  };
  const c = configs[plan.status];
  return <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${c.cls}`}>{c.label}</span>;
}

const STATUS_BORDER: Record<PlanStatus, string> = {
  draft:    'border-l-gray-300 dark:border-l-gray-600',
  sent:     'border-l-blue-400 dark:border-l-blue-500',
  read:     'border-l-yellow-400 dark:border-l-yellow-500',
  reviewed: 'border-l-green-400 dark:border-l-green-500',
};

// ══════════════════════════════════════════════════════════════════════════════
// ESTADO DO FORMULÁRIO
// ══════════════════════════════════════════════════════════════════════════════

const emptyForm = () => ({
  classId: '', subjectId: '', periodType: 'daily' as PeriodType,
  referenceDate: new Date().toISOString().split('T')[0],
  weekStart: '', weekEnd: '', theme: '',
  ageGroup: AGE_GROUPS[1], gradeLevel: '', moduleType: 'regular' as ModuleType,
  generalObjective: '',
  selectedBncFields: [] as string[], selectedBncCodes: [] as string[],
  bnccSkillCodes: [] as string[], skillInput: '',
  welcome: '', mainActivity: '', playActivity: '', closure: '',
  content: '', resources: '', methodology: '', assessment: '',
});

// ══════════════════════════════════════════════════════════════════════════════
// COMPONENTE STEPPER HEADER
// ══════════════════════════════════════════════════════════════════════════════

const STEPS = ['Identificação', 'BNCC', 'Desenvolvimento', 'Anexos'];

function StepperHeader({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {STEPS.map((label, i) => {
        const done    = i < current;
        const active  = i === current;
        return (
          <div key={i} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                done   ? 'bg-[#1E3A5F] text-white' :
                active ? 'bg-[#F5A623] text-white ring-4 ring-[#F5A623]/20' :
                         'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
              }`}>
                {done ? <Check size={14} /> : i + 1}
              </div>
              <span className={`text-[10px] font-medium hidden sm:block ${
                active ? 'text-[#F5A623]' : done ? 'text-[#1E3A5F] dark:text-white' : 'text-gray-400 dark:text-gray-500'
              }`}>{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 transition-all ${
                i < current ? 'bg-[#1E3A5F]' : 'bg-gray-200 dark:bg-gray-700'
              }`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA PRINCIPAL
// ══════════════════════════════════════════════════════════════════════════════

export default function CadernoPage() {
  const router = useRouter();
  const user   = getUser();

  // ── Estado global ──────────────────────────────────────────────────────────
  const [mode,     setMode]     = useState<'list' | 'new' | 'edit'>('list');
  const [plans,    setPlans]    = useState<TeachingPlan[]>([]);
  const [classes,  setClasses]  = useState<SchoolClass[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading,  setLoading]  = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filterStatus,   setFilterStatus]   = useState('');
  const [filterPeriod,   setFilterPeriod]   = useState('');

  // ── Estado do form ─────────────────────────────────────────────────────────
  const [step,      setStep]      = useState(0);
  const [form,      setForm]      = useState(emptyForm());
  const [editingId, setEditingId] = useState<number | null>(null);
  const [saving,    setSaving]    = useState(false);
  const [sending,   setSending]   = useState(false);

  // ── Anexos ──────────────────────────────────────────────────────────────────
  const [pendingFiles,     setPendingFiles]     = useState<File[]>([]);
  const [existingAttach,   setExistingAttach]   = useState<Attachment[]>([]);
  const [uploadingFiles,   setUploadingFiles]   = useState(false);
  const [removingFile,     setRemovingFile]     = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef  = useRef<HTMLDivElement>(null);

  // ── Carregar dados ─────────────────────────────────────────────────────────

  const loadPlans = useCallback(async () => {
    try {
      const r = await api.get('/teaching-plans/my');
      setPlans(r.data);
    } catch { toast.error('Erro ao carregar planejamentos'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (!user || user.role !== 'teacher') { router.push('/login'); return; }
    api.get('/classes/my').then(r => setClasses(r.data)).catch(console.error);
    loadPlans();
  }, []);

  useEffect(() => {
    if (!form.classId) { setSubjects([]); return; }
    api.get(`/classes/${form.classId}/subjects`).then(r => setSubjects(r.data)).catch(console.error);
    const cls = classes.find(c => String(c.id) === form.classId);
    if (cls) setForm(f => ({ ...f, moduleType: cls.mode === 'infantil' ? 'infantil' : 'regular' }));
  }, [form.classId, classes]);

  // ── Abrir form ─────────────────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm());
    setStep(0);
    setPendingFiles([]);
    setExistingAttach([]);
    setMode('new');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openEdit = (plan: TeachingPlan) => {
    setEditingId(plan.id);
    setForm({
      classId:           String(plan.schoolClass ? (classes.find(c => c.name === plan.schoolClass?.name)?.id ?? '') : ''),
      subjectId:         String(plan.subject     ? (subjects.find(s => s.name === plan.subject?.name)?.id    ?? '') : ''),
      periodType:        plan.periodType,
      referenceDate:     plan.referenceDate?.split('T')[0] ?? new Date().toISOString().split('T')[0],
      weekStart:         plan.weekStart?.split('T')[0] ?? '',
      weekEnd:           plan.weekEnd?.split('T')[0] ?? '',
      theme:             plan.theme ?? '',
      ageGroup:          plan.ageGroup ?? AGE_GROUPS[1],
      gradeLevel:        plan.gradeLevel ?? '',
      moduleType:        plan.moduleType,
      generalObjective:  plan.generalObjective ?? '',
      selectedBncFields: plan.bncFields?.fields ?? [],
      selectedBncCodes:  plan.bncFields?.codes  ?? [],
      bnccSkillCodes:    plan.bnccSkills?.codes  ?? [],
      skillInput:        '',
      welcome:           plan.welcome     ?? '',
      mainActivity:      plan.mainActivity ?? '',
      playActivity:      plan.playActivity ?? '',
      closure:           plan.closure     ?? '',
      content:           plan.content     ?? '',
      resources:         plan.resources   ?? '',
      methodology:       plan.methodology ?? '',
      assessment:        plan.assessment  ?? '',
    });
    setExistingAttach(plan.attachments ?? []);
    setPendingFiles([]);
    setStep(0);
    setMode('edit');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const canEditPlan = (plan: TeachingPlan) =>
    plan.status === 'draft' || (plan.status === 'sent' && !plan.readAt);

  // ── Salvar plano ───────────────────────────────────────────────────────────

  const buildPayload = () => ({
    classId:          form.classId   ? Number(form.classId)   : undefined,
    subjectId:        form.subjectId ? Number(form.subjectId) : undefined,
    moduleType:       form.moduleType,
    theme:            form.theme     || undefined,
    ageGroup:         form.moduleType === 'infantil' ? (form.ageGroup  || undefined) : undefined,
    gradeLevel:       form.moduleType === 'regular'  ? (form.gradeLevel || undefined) : undefined,
    periodType:       form.periodType,
    referenceDate:    form.periodType !== 'weekly'   ? (form.referenceDate || undefined) : undefined,
    weekStart:        form.periodType === 'weekly'   ? (form.weekStart || undefined) : undefined,
    weekEnd:          form.periodType === 'weekly'   ? (form.weekEnd   || undefined) : undefined,
    generalObjective: form.generalObjective || undefined,
    bncFields:        form.moduleType === 'infantil' && form.selectedBncFields.length
      ? { fields: form.selectedBncFields, codes: form.selectedBncCodes } : undefined,
    bnccSkills:       form.moduleType === 'regular'  && form.bnccSkillCodes.length
      ? { codes: form.bnccSkillCodes } : undefined,
    welcome:          form.moduleType === 'infantil' ? (form.welcome     || undefined) : undefined,
    mainActivity:     form.mainActivity || undefined,
    playActivity:     form.moduleType === 'infantil' ? (form.playActivity || undefined) : undefined,
    closure:          form.closure     || undefined,
    content:          form.moduleType === 'regular'  ? (form.content     || undefined) : undefined,
    resources:        form.resources   || undefined,
    methodology:      form.methodology || undefined,
    assessment:       form.assessment  || undefined,
  });

  const savePlan = async (): Promise<number> => {
    const payload = buildPayload();
    if (editingId) {
      await api.patch(`/teaching-plans/${editingId}`, payload);
      return editingId;
    } else {
      const r = await api.post('/teaching-plans', payload);
      return r.data.id;
    }
  };

  const uploadPendingFiles = async (planId: number) => {
    if (pendingFiles.length === 0) return;
    const fd = new FormData();
    pendingFiles.forEach(f => fd.append('files', f));
    await api.post(`/teaching-plans/${planId}/attachments`, fd, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const planId = await savePlan();
      await uploadPendingFiles(planId);
      toast.success('Rascunho salvo!');
      setMode('list');
      setEditingId(null);
      await loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleSendToManagement = async () => {
    setSending(true);
    try {
      const planId = await savePlan();
      await uploadPendingFiles(planId);
      await api.patch(`/teaching-plans/${planId}/send`);
      toast.success('Planejamento enviado para a gestão!');
      setMode('list');
      setEditingId(null);
      await loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar');
    } finally { setSending(false); }
  };

  const handleSendFromList = async (id: number) => {
    try {
      await api.patch(`/teaching-plans/${id}/send`);
      toast.success('Enviado para a gestão!');
      await loadPlans();
    } catch (err: any) { toast.error(err?.response?.data?.message || 'Erro'); }
  };

  // ── Anexos ─────────────────────────────────────────────────────────────────

  const handleFileDrop = (files: FileList | null) => {
    if (!files) return;
    const all = [...pendingFiles, ...Array.from(files)];
    const maxRemaining = 5 - existingAttach.length;
    if (all.length > maxRemaining) {
      toast.error(`Máximo de ${5 - existingAttach.length} arquivos novos`);
      return;
    }
    const valid: File[] = [];
    for (const f of Array.from(files)) {
      if (f.size > 5 * 1024 * 1024) { toast.error(`"${f.name}" excede 5 MB`); continue; }
      const ext = f.name.toLowerCase().split('.').pop();
      if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext ?? '')) {
        toast.error(`"${f.name}" não é um tipo permitido`);
        continue;
      }
      valid.push(f);
    }
    setPendingFiles(prev => [...prev, ...valid].slice(0, maxRemaining));
  };

  const removeExistingAttachment = async (attachment: Attachment) => {
    if (!editingId) {
      setExistingAttach(prev => prev.filter(a => a.id !== attachment.id));
      return;
    }
    setRemovingFile(attachment.id);
    try {
      await api.delete(`/teaching-plans/${editingId}/attachments/${attachment.id}`);
      setExistingAttach(prev => prev.filter(a => a.id !== attachment.id));
      toast.success('Anexo removido');
    } catch { toast.error('Erro ao remover'); }
    finally { setRemovingFile(null); }
  };

  // ── BNCC helpers ───────────────────────────────────────────────────────────

  const toggleBncField = (code: string) => {
    setForm(f => {
      const sel = f.selectedBncFields.includes(code)
        ? f.selectedBncFields.filter(c => c !== code)
        : [...f.selectedBncFields, code];
      // Remove codes de campos desmarcados
      const prefix = ageGroupToPrefix(f.ageGroup);
      const validCodes = f.selectedBncCodes.filter(c =>
        sel.some(fc => c.startsWith(`${prefix}${fc}`)),
      );
      return { ...f, selectedBncFields: sel, selectedBncCodes: validCodes };
    });
  };

  const toggleBncCode = (code: string) => {
    setForm(f => ({
      ...f,
      selectedBncCodes: f.selectedBncCodes.includes(code)
        ? f.selectedBncCodes.filter(c => c !== code)
        : [...f.selectedBncCodes, code],
    }));
  };

  const addSkillCode = () => {
    const code = form.skillInput.trim().toUpperCase();
    if (!code) return;
    if (!/^EF\d{2}[A-Z]{2}\d{2}$/.test(code) && !/^EM\d{2}[A-Z]{2}\d{3}$/.test(code)) {
      toast.error('Código inválido. Ex: EF01MA01');
      return;
    }
    if (form.bnccSkillCodes.includes(code)) { toast.error('Código já adicionado'); return; }
    setForm(f => ({ ...f, bnccSkillCodes: [...f.bnccSkillCodes, code], skillInput: '' }));
  };

  // ── Filtros da lista ────────────────────────────────────────────────────────

  const filteredPlans = plans.filter(p => {
    if (filterStatus && p.status !== filterStatus) return false;
    if (filterPeriod && p.periodType !== filterPeriod) return false;
    return true;
  });

  // ── Estilos base ───────────────────────────────────────────────────────────

  const inputCls = 'w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] focus:border-transparent transition-colors';
  const textareaCls = `${inputCls} resize-none leading-relaxed`;
  const labelCls = 'text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-1.5 block';
  const cardCls = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5';

  // ══════════════════════════════════════════════════════════════════════════════
  // ETAPAS DO FORMULÁRIO
  // ══════════════════════════════════════════════════════════════════════════════

  const renderStep0 = () => (
    <div className="space-y-5">
      {/* Turma */}
      <div className={cardCls}>
        <label className={labelCls}>Turma</label>
        <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value }))} className={inputCls}>
          <option value="">Selecionar turma...</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}{c.mode === 'infantil' ? ' 🎨' : ''}</option>)}
        </select>
      </div>

      {/* Período */}
      <div className={cardCls}>
        <label className={labelCls}>Período</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {(['daily', 'weekly', 'monthly'] as PeriodType[]).map(p => {
            const labels = { daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal' };
            const active = form.periodType === p;
            return (
              <button key={p} type="button" onClick={() => setForm(f => ({ ...f, periodType: p }))}
                className={`py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                  active ? 'border-[#1E3A5F] bg-[#1E3A5F] text-white' :
                           'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-[#1E3A5F]/40'
                }`}>
                {labels[p]}
              </button>
            );
          })}
        </div>

        {form.periodType === 'daily' && (
          <>
            <label className={labelCls}>Data da aula</label>
            <input type="date" value={form.referenceDate} onChange={e => setForm(f => ({ ...f, referenceDate: e.target.value }))} className={inputCls} />
          </>
        )}

        {form.periodType === 'weekly' && (
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Selecione qualquer dia da semana</label>
              <input type="date" value={form.referenceDate}
                onChange={e => {
                  const { weekStart, weekEnd } = getWeekBounds(e.target.value);
                  setForm(f => ({ ...f, referenceDate: e.target.value, weekStart, weekEnd }));
                }}
                className={inputCls} />
            </div>
            {form.weekStart && (
              <div className="flex gap-2 bg-blue-50 dark:bg-blue-950/30 rounded-xl px-3 py-2">
                <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  📅 Semana: {fmtDate(form.weekStart)} → {fmtDate(form.weekEnd)}
                </span>
              </div>
            )}
          </div>
        )}

        {form.periodType === 'monthly' && (
          <>
            <label className={labelCls}>Mês de referência</label>
            <input type="month" value={form.referenceDate.slice(0, 7)}
              onChange={e => setForm(f => ({ ...f, referenceDate: `${e.target.value}-01` }))}
              className={inputCls} />
          </>
        )}
      </div>

      {/* Tema */}
      <div className={cardCls}>
        <label className={labelCls}>Tema da aula</label>
        <input value={form.theme} onChange={e => setForm(f => ({ ...f, theme: e.target.value }))}
          placeholder="ex: Alimentação saudável, Frações, Meio ambiente..."
          className={inputCls} />
      </div>

      {/* Infantil: faixa etária */}
      {form.moduleType === 'infantil' && (
        <div className={cardCls}>
          <label className={labelCls}>Faixa etária</label>
          <div className="grid grid-cols-3 gap-2">
            {AGE_GROUPS.map(ag => (
              <button key={ag} type="button" onClick={() => setForm(f => ({ ...f, ageGroup: ag }))}
                className={`py-2.5 rounded-xl border-2 text-sm font-medium transition-all ${
                  form.ageGroup === ag
                    ? 'border-purple-500 bg-purple-500 text-white'
                    : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-purple-300'
                }`}>
                {ag}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Regular: componente + série */}
      {form.moduleType === 'regular' && (
        <div className={cardCls}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Componente curricular</label>
              <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} className={inputCls}>
                <option value="">Selecionar...</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ano / Série</label>
              <select value={form.gradeLevel} onChange={e => setForm(f => ({ ...f, gradeLevel: e.target.value }))} className={inputCls}>
                <option value="">Selecionar...</option>
                {GRADE_LEVELS.map(g => <option key={g} value={g}>{g}</option>)}
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep1 = () => {
    const prefix = ageGroupToPrefix(form.ageGroup);
    return (
      <div className="space-y-5">
        {form.moduleType === 'infantil' ? (
          <>
            <div className={cardCls}>
              <label className={labelCls}>Campos de Experiência (BNCC)</label>
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">Clique para selecionar os campos e depois marque os códigos desejados</p>
              <div className="space-y-3">
                {INFANTIL_FIELDS.map(field => {
                  const selected = form.selectedBncFields.includes(field.code);
                  const codes    = BNCC_CODES[prefix]?.[field.code] ?? [];
                  return (
                    <div key={field.code} className={`rounded-xl border-2 overflow-hidden transition-all ${selected ? 'border-[#1E3A5F]' : 'border-gray-100 dark:border-gray-800'}`}>
                      <button type="button" onClick={() => toggleBncField(field.code)}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50">
                        <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center" style={{ background: field.bg }}>
                          <span style={{ color: field.color, fontSize: 12, fontWeight: 700 }}>{field.code}</span>
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-200 flex-1">{field.name}</span>
                        {selected && <Check size={14} className="text-[#1E3A5F] dark:text-blue-400 flex-shrink-0" />}
                      </button>
                      {selected && codes.length > 0 && (
                        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
                          {codes.map(code => {
                            const on = form.selectedBncCodes.includes(code);
                            return (
                              <button key={code} type="button" onClick={() => toggleBncCode(code)}
                                className={`text-[11px] px-2 py-0.5 rounded-full font-mono font-medium border transition-all ${
                                  on ? 'bg-[#1E3A5F] text-white border-[#1E3A5F]' :
                                       'bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-gray-700 hover:border-[#1E3A5F]'
                                }`}>
                                {code}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        ) : (
          <div className={cardCls}>
            <label className={labelCls}>Habilidades BNCC</label>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-3">Digite o código da habilidade (ex: EF01MA01) e pressione Enter ou +</p>
            <div className="flex gap-2 mb-3">
              <input value={form.skillInput}
                onChange={e => setForm(f => ({ ...f, skillInput: e.target.value }))}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSkillCode())}
                placeholder="EF01MA01"
                className={`${inputCls} font-mono uppercase`} />
              <button type="button" onClick={addSkillCode}
                className="px-4 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors flex-shrink-0">
                <Plus size={16} />
              </button>
            </div>
            {form.bnccSkillCodes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {form.bnccSkillCodes.map(code => (
                  <span key={code} className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 rounded-full bg-[#1E3A5F] text-white font-mono font-medium">
                    {code}
                    <button type="button" onClick={() => setForm(f => ({ ...f, bnccSkillCodes: f.bnccSkillCodes.filter(c => c !== code) }))}>
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Objetivo geral — ambos */}
        <div className={cardCls}>
          <label className={labelCls}>Objetivo Geral</label>
          <textarea value={form.generalObjective} rows={4}
            onChange={e => setForm(f => ({ ...f, generalObjective: e.target.value }))}
            placeholder="Descreva o objetivo geral do planejamento..."
            className={textareaCls} />
        </div>
      </div>
    );
  };

  const renderStep2 = () => (
    <div className="space-y-5">
      {form.moduleType === 'infantil' ? (
        <>
          {/* 4 cards de desenvolvimento infantil */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { key: 'welcome',      label: 'Acolhida',           icon: Users,   color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-950/30' },
              { key: 'mainActivity', label: 'Atividade Principal', icon: Pencil,  color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-950/30' },
              { key: 'playActivity', label: 'Brincadeira',        icon: Gamepad2, color: 'text-pink-500',  bg: 'bg-pink-50 dark:bg-pink-950/30' },
              { key: 'closure',      label: 'Encerramento',       icon: Star,    color: 'text-yellow-500', bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
            ].map(({ key, label, icon: Icon, color, bg }) => {
              const val = (form as any)[key] as string;
              const hasContent = val.trim().length > 0;
              return (
                <div key={key} className={`rounded-2xl border-2 overflow-hidden transition-all ${hasContent ? 'border-[#1E3A5F]/30' : 'border-gray-100 dark:border-gray-800'}`}>
                  <div className={`flex items-center gap-2 px-4 py-3 ${bg}`}>
                    <Icon size={16} className={color} />
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">{label}</span>
                    {hasContent && <Check size={12} className="text-green-500 ml-auto" />}
                  </div>
                  <div className="p-3">
                    <textarea
                      value={val}
                      onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                      rows={4}
                      placeholder={`Descreva a ${label.toLowerCase()}...`}
                      className={textareaCls}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <>
          <div className={cardCls}>
            <label className={labelCls}>Conteúdo da aula</label>
            <textarea value={form.content} rows={8}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              placeholder="Descreva o conteúdo, atividades e sequência didática da aula..."
              className={textareaCls} />
          </div>
          <div className={cardCls}>
            <label className={labelCls}>Recursos didáticos</label>
            <textarea value={form.resources} rows={3}
              onChange={e => setForm(f => ({ ...f, resources: e.target.value }))}
              placeholder="Materiais, tecnologias, espaços necessários..."
              className={textareaCls} />
          </div>
        </>
      )}

      {/* Atividade principal (regular também pode ter) */}
      {form.moduleType === 'regular' && (
        <div className={cardCls}>
          <label className={labelCls}>Atividade Principal</label>
          <textarea value={form.mainActivity} rows={4}
            onChange={e => setForm(f => ({ ...f, mainActivity: e.target.value }))}
            placeholder="Atividade principal da aula..."
            className={textareaCls} />
        </div>
      )}

      {/* Metodologia + Avaliação — ambos */}
      <div className={`${cardCls} space-y-4`}>
        <div>
          <label className={labelCls}>Metodologia</label>
          <textarea value={form.methodology} rows={3}
            onChange={e => setForm(f => ({ ...f, methodology: e.target.value }))}
            placeholder="Abordagem metodológica utilizada..."
            className={textareaCls} />
        </div>
        <div>
          <label className={labelCls}>Avaliação</label>
          <textarea value={form.assessment} rows={3}
            onChange={e => setForm(f => ({ ...f, assessment: e.target.value }))}
            placeholder="Como será avaliada a aprendizagem..."
            className={textareaCls} />
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => {
    const totalFiles   = existingAttach.length + pendingFiles.length;
    const remaining    = 5 - totalFiles;

    return (
      <div className="space-y-5">
        {/* Drop zone */}
        <div
          ref={dropZoneRef}
          onClick={() => remaining > 0 && fileInputRef.current?.click()}
          onDragOver={e => { e.preventDefault(); dropZoneRef.current?.classList.add('border-[#1E3A5F]'); }}
          onDragLeave={() => dropZoneRef.current?.classList.remove('border-[#1E3A5F]')}
          onDrop={e => { e.preventDefault(); dropZoneRef.current?.classList.remove('border-[#1E3A5F]'); handleFileDrop(e.dataTransfer.files); }}
          className={`border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
            remaining > 0
              ? 'cursor-pointer hover:border-[#1E3A5F] hover:bg-blue-50/30 dark:hover:bg-blue-950/10 border-gray-200 dark:border-gray-700'
              : 'border-gray-100 dark:border-gray-800 opacity-50 cursor-not-allowed'
          }`}
        >
          <Upload size={28} className="text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {remaining > 0
              ? 'Clique ou arraste arquivos aqui'
              : 'Limite de 5 arquivos atingido'}
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">JPG, PNG, PDF · máx 5 MB cada</p>
          <p className="text-xs text-[#1E3A5F] dark:text-blue-400 font-medium mt-2">{totalFiles}/5 arquivos</p>
        </div>
        <input ref={fileInputRef} type="file" multiple accept=".jpg,.jpeg,.png,.pdf"
          onChange={e => handleFileDrop(e.target.files)} className="hidden" />

        {/* Anexos existentes */}
        {existingAttach.length > 0 && (
          <div className={cardCls}>
            <label className={labelCls}>Anexos salvos</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {existingAttach.map(a => (
                <div key={a.id} className="relative group rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 aspect-square">
                  {a.type.startsWith('image') ? (
                    <img src={a.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex flex-col items-center justify-center gap-1">
                      <FileText size={20} className="text-red-500" />
                      <span className="text-[10px] text-red-500 font-medium">PDF</span>
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button onClick={() => removeExistingAttachment(a)} disabled={removingFile === a.id}
                      className="p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors">
                      {removingFile === a.id ? <Loader2 size={12} className="animate-spin" /> : <X size={12} />}
                    </button>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5">
                    <p className="text-[9px] text-white text-center">{fmtSize(a.size)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Arquivos pendentes (ainda não enviados) */}
        {pendingFiles.length > 0 && (
          <div className={cardCls}>
            <label className={labelCls}>Novos arquivos (serão enviados ao salvar)</label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {pendingFiles.map((f, i) => {
                const isPdf = f.name.toLowerCase().endsWith('.pdf');
                return (
                  <div key={i} className="relative group rounded-xl overflow-hidden border-2 border-[#F5A623]/50 aspect-square">
                    {!isPdf ? (
                      <img src={URL.createObjectURL(f)} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex flex-col items-center justify-center gap-1">
                        <FileText size={20} className="text-red-500" />
                        <span className="text-[9px] text-red-500 font-medium text-center px-1 line-clamp-2">{f.name}</span>
                      </div>
                    )}
                    <button onClick={() => setPendingFiles(prev => prev.filter((_, j) => j !== i))}
                      className="absolute top-1 right-1 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                      <X size={10} />
                    </button>
                    <div className="absolute bottom-0 inset-x-0 bg-black/50 px-1 py-0.5">
                      <p className="text-[9px] text-white text-center">{fmtSize(f.size)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Ações finais */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <button onClick={handleSaveDraft} disabled={saving || sending}
            className="flex-1 py-3 rounded-xl border-2 border-[#1E3A5F] text-[#1E3A5F] dark:text-blue-300 dark:border-blue-400 text-sm font-semibold hover:bg-[#1E3A5F]/5 disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin" /> : <BookOpen size={15} />}
            {saving ? 'Salvando...' : 'Salvar rascunho'}
          </button>
          <button onClick={handleSendToManagement} disabled={saving || sending}
            className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] disabled:opacity-40 transition-colors flex items-center justify-center gap-2">
            {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
            {sending ? 'Enviando...' : 'Enviar para gestão'}
          </button>
        </div>
      </div>
    );
  };

  const renderStepContent = () => {
    switch (step) {
      case 0: return renderStep0();
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      default: return null;
    }
  };

  // ══════════════════════════════════════════════════════════════════════════════
  // LOADING
  // ══════════════════════════════════════════════════════════════════════════════

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  // ══════════════════════════════════════════════════════════════════════════════
  // FORMULÁRIO (new / edit)
  // ══════════════════════════════════════════════════════════════════════════════

  if (mode === 'new' || mode === 'edit') {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-2xl mx-auto flex items-center gap-3">
            <button onClick={() => setMode('list')} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">
                {mode === 'new' ? 'Novo Planejamento' : 'Editar Planejamento'}
              </h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500 capitalize">
                {form.moduleType === 'infantil' ? '🎨 Educação Infantil' : '📚 Ensino Regular'}
              </p>
            </div>
          </div>
        </header>

        <main className="max-w-2xl mx-auto px-4 py-6">
          <StepperHeader current={step} />
          {renderStepContent()}

          {/* Nav anterior / próximo */}
          {step < 3 && (
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <button onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                  ← Voltar
                </button>
              )}
              <button onClick={() => setStep(s => s + 1)}
                className={`py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors flex items-center justify-center gap-2 ${step === 0 ? 'w-full' : 'flex-1'}`}>
                Próximo →
              </button>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LISTA DE PLANEJAMENTOS
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Caderno de Planejamento</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{plans.length} registro{plans.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={openNew}
            className="flex items-center gap-1.5 bg-[#1E3A5F] text-white px-3 py-2 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors">
            <Plus size={15} />
            Novo
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Filtros */}
        {plans.length > 0 && (
          <div className="flex gap-2 flex-wrap">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
              <option value="">Todos os status</option>
              <option value="draft">Rascunho</option>
              <option value="sent">Enviado</option>
              <option value="read">Lido</option>
              <option value="reviewed">Revisado</option>
            </select>
            <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
              className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]">
              <option value="">Todos os períodos</option>
              <option value="daily">Diário</option>
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensal</option>
            </select>
          </div>
        )}

        {/* Estado vazio */}
        {filteredPlans.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="w-16 h-16 bg-[#1E3A5F]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-[#1E3A5F]/40 dark:text-blue-400/40" />
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">
              {filterStatus || filterPeriod ? 'Nenhum planejamento com esses filtros.' : 'Ainda não há planejamentos.'}
            </p>
            {!filterStatus && !filterPeriod && (
              <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-[#162d4a] transition-colors">
                <Plus size={14} /> Criar primeiro planejamento
              </button>
            )}
          </div>
        )}

        {/* Cards */}
        {filteredPlans.map(plan => (
          <div key={plan.id}
            className={`bg-white dark:bg-gray-900 rounded-2xl border border-r-0 border-t-0 border-b-0 border-l-4 ${STATUS_BORDER[plan.status]} border-r border-t border-b border-gray-100 dark:border-gray-800 overflow-hidden`}>
            <button onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
              className="w-full flex items-start gap-3 px-5 py-4 text-left hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <StatusBadge plan={plan} />
                  {plan.moduleType === 'infantil' && (
                    <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full">🎨 Infantil</span>
                  )}
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {plan.periodType === 'weekly' && plan.weekStart
                      ? `${fmtDate(plan.weekStart)} – ${fmtDate(plan.weekEnd)}`
                      : fmtDate(plan.referenceDate)}
                  </span>
                </div>
                {plan.schoolClass && (
                  <p className="text-xs font-medium text-[#1E3A5F] dark:text-blue-300 mb-0.5">{plan.schoolClass.name}</p>
                )}
                {plan.theme && (
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-1.5">
                    <Tag size={12} className="text-gray-400" />{plan.theme}
                  </p>
                )}
                {/* Miniaturas de anexos */}
                {plan.attachments && plan.attachments.length > 0 && (
                  <div className="flex gap-1 mt-2">
                    {plan.attachments.slice(0, 4).map(a => (
                      <div key={a.id} className="w-7 h-7 rounded-md overflow-hidden border border-gray-100 dark:border-gray-700 flex-shrink-0">
                        {a.type.startsWith('image') ? (
                          <img src={a.url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                            <FileText size={10} className="text-red-400" />
                          </div>
                        )}
                      </div>
                    ))}
                    {plan.attachments.length > 4 && (
                      <div className="w-7 h-7 rounded-md bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-[9px] font-bold text-gray-500 dark:text-gray-400">
                        +{plan.attachments.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="text-gray-400 flex-shrink-0 mt-0.5">
                {expanded === plan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {expanded === plan.id && (
              <div className="px-5 pb-5 border-t border-gray-50 dark:border-gray-800">
                {plan.generalObjective && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Objetivo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{plan.generalObjective}</p>
                  </div>
                )}
                {plan.content && (
                  <div className="mt-4">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Conteúdo</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap leading-relaxed line-clamp-6">{plan.content}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  {canEditPlan(plan) && (
                    <button onClick={() => openEdit(plan)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                      <Edit3 size={13} /> Editar
                    </button>
                  )}
                  {plan.status === 'draft' && (
                    <button onClick={() => handleSendFromList(plan.id)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E3A5F] text-white text-sm font-semibold hover:bg-[#162d4a] transition-colors">
                      <Send size={13} /> Enviar para gestão
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
