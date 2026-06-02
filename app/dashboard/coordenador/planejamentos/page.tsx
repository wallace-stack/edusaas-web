'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import {
  ArrowLeft, BookOpen, Eye, CheckCircle, Clock, Send,
  Filter, X, FileText, ChevronLeft, Tag,
  Users, Pencil, Gamepad2, Star, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

// ══════════════════════════════════════════════════════════════════════════════
// TIPOS
// ══════════════════════════════════════════════════════════════════════════════

type PlanStatus = 'draft' | 'sent' | 'read' | 'reviewed';
type PeriodType = 'daily' | 'weekly' | 'monthly';
type ModuleType = 'infantil' | 'regular';

interface Attachment  { id: string; url: string; type: string; size: number; }
interface BncFields   { fields: string[]; codes: string[]; }
interface BnccSkills  { codes: string[]; }

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
  bncFields?: BncFields;
  bnccSkills?: BnccSkills;
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
  teacher?: { name: string } | null;
  schoolClass?: { name: string } | null;
  subject?: { name: string } | null;
  createdAt: string;
}

interface FilterTeacher { id: number; name: string; }
interface FilterClass   { id: number; name: string; }

// ══════════════════════════════════════════════════════════════════════════════
// CONSTANTES BNCC
// ══════════════════════════════════════════════════════════════════════════════

const FIELD_META: Record<string, { name: string; color: string; bg: string }> = {
  EO: { name: 'O Eu, o Outro e o Nós',                                     color: '#6366f1', bg: '#EEF2FF' },
  CG: { name: 'Corpo, Gestos e Movimentos',                                 color: '#f59e0b', bg: '#FFFBEB' },
  TS: { name: 'Traços, Sons, Cores e Formas',                               color: '#ec4899', bg: '#FDF2F8' },
  EF: { name: 'Escuta, Fala, Pensamento e Imaginação',                      color: '#10b981', bg: '#ECFDF5' },
  ET: { name: 'Espaços, Tempos, Quantidades, Relações e Transformações',     color: '#3b82f6', bg: '#EFF6FF' },
};

// ══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ══════════════════════════════════════════════════════════════════════════════

function fmtDate(iso?: string | null, withTime = false) {
  if (!iso) return '—';
  const d = new Date(iso);
  if (withTime) return d.toLocaleString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function fmtSize(bytes: number) {
  return bytes < 1024 * 1024 ? `${(bytes / 1024).toFixed(0)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function planDate(plan: TeachingPlan) {
  if (plan.periodType === 'weekly' && plan.weekStart && plan.weekEnd)
    return `${fmtDate(plan.weekStart)} → ${fmtDate(plan.weekEnd)}`;
  return fmtDate(plan.referenceDate);
}

const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal',
};

// ── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ status, pulse = false }: { status: PlanStatus; pulse?: boolean }) {
  const cfg: Record<PlanStatus, { label: string; cls: string }> = {
    draft:    { label: 'Rascunho',  cls: 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400' },
    sent:     { label: 'Não lido',  cls: 'bg-red-50 dark:bg-red-950/60 text-red-600 dark:text-red-400' },
    read:     { label: 'Lido',      cls: 'bg-yellow-50 dark:bg-yellow-950/60 text-yellow-600 dark:text-yellow-400' },
    reviewed: { label: 'Revisado',  cls: 'bg-green-50 dark:bg-green-950/60 text-green-600 dark:text-green-400' },
  };
  const c = cfg[status];
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${c.cls}`}>
      {status === 'sent' && pulse && (
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
      )}
      {c.label}
    </span>
  );
}

const STATUS_BORDER: Record<PlanStatus, string> = {
  draft:    'border-l-gray-300 dark:border-l-gray-600',
  sent:     'border-l-red-400 dark:border-l-red-500',
  read:     'border-l-yellow-400 dark:border-l-yellow-500',
  reviewed: 'border-l-green-400 dark:border-l-green-500',
};

// ── Linha do tempo ───────────────────────────────────────────────────────────

function StatusTimeline({ plan }: { plan: TeachingPlan }) {
  const steps = [
    { label: 'Enviado',  at: plan.createdAt,  by: plan.teacher?.name,        always: true },
    { label: 'Lido',     at: plan.readAt,     by: plan.readByUser?.name,     always: false },
    { label: 'Revisado', at: plan.reviewedAt, by: plan.reviewedByUser?.name, always: false },
  ];
  return (
    <div className="flex items-start gap-0">
      {steps.filter(s => s.always || s.at).map((s, i, arr) => (
        <div key={i} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.at ? 'bg-[#1E3A5F] text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-400'}`}>
              {i + 1}
            </div>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 mt-1 text-center">{s.label}</p>
            {s.at && <p className="text-[9px] text-gray-400 dark:text-gray-500 text-center">{fmtDate(s.at as string, true)}</p>}
            {s.by && <p className="text-[9px] text-[#1E3A5F] dark:text-blue-400 text-center font-medium">{s.by.split(' ')[0]}</p>}
          </div>
          {i < arr.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 mb-8 ${s.at ? 'bg-[#1E3A5F]' : 'bg-gray-200 dark:bg-gray-700'}`} />
          )}
        </div>
      ))}
    </div>
  );
}

// ── Seção de conteúdo ────────────────────────────────────────────────────────

function Section({ title, content, icon: Icon }: { title: string; content?: string | null; icon?: any }) {
  if (!content?.trim()) return null;
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
        {Icon && <Icon size={10} />}{title}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PÁGINA
// ══════════════════════════════════════════════════════════════════════════════

export default function PlanejamentosGestaoPage() {
  const router = useRouter();
  const user   = getUser();

  const MANAGEMENT_ROLES = ['coordinator', 'director', 'secretary'];

  const [plans,        setPlans]        = useState<TeachingPlan[]>([]);
  const [teachers,     setTeachers]     = useState<FilterTeacher[]>([]);
  const [classes,      setClasses]      = useState<FilterClass[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [detail,       setDetail]       = useState<TeachingPlan | null>(null);
  const [reviewing,    setReviewing]    = useState(false);
  const [showFilters,  setShowFilters]  = useState(false);
  const [lightbox,     setLightbox]     = useState<string | null>(null);

  // Filtros
  const [fTeacher, setFTeacher] = useState('');
  const [fClass,   setFClass]   = useState('');
  const [fDate,    setFDate]    = useState('');
  const [fStatus,  setFStatus]  = useState('');
  const [fPeriod,  setFPeriod]  = useState('');

  // ── Carregar dados ─────────────────────────────────────────────────────────

  const buildQs = useCallback(() => {
    const p = new URLSearchParams();
    if (fTeacher) p.set('teacherId', fTeacher);
    if (fClass)   p.set('classId',   fClass);
    if (fDate)    p.set('date',      fDate);
    if (fStatus)  p.set('status',    fStatus);
    if (fPeriod)  p.set('periodType', fPeriod);
    return p.toString();
  }, [fTeacher, fClass, fDate, fStatus, fPeriod]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQs();
      const r  = await api.get(`/teaching-plans${qs ? `?${qs}` : ''}`);
      setPlans(r.data);
    } catch { toast.error('Erro ao carregar planejamentos'); }
    finally { setLoading(false); }
  }, [buildQs]);

  useEffect(() => {
    if (!user || !MANAGEMENT_ROLES.includes(user.role)) { router.push('/login'); return; }
    api.get('/secretary/teachers').then(r => setTeachers(r.data)).catch(() => {});
    api.get('/classes').then(r => setClasses(r.data)).catch(() => {});
    load();
  }, []);

  useEffect(() => { load(); }, [fTeacher, fClass, fDate, fStatus, fPeriod]);

  // ── Abrir plano (auto-marca lido) ──────────────────────────────────────────

  const openDetail = async (plan: TeachingPlan) => {
    setDetail(plan);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (plan.status === 'sent') {
      try {
        const r = await api.get(`/teaching-plans/${plan.id}`);
        setDetail(r.data);
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, ...r.data } : p));
      } catch { /* silently */ }
    }
  };

  // ── Revisar ────────────────────────────────────────────────────────────────

  const handleReview = async () => {
    if (!detail) return;
    setReviewing(true);
    try {
      const r = await api.patch(`/teaching-plans/${detail.id}/review`);
      setDetail(r.data);
      setPlans(prev => prev.map(p => p.id === detail.id ? { ...p, ...r.data } : p));
      toast.success('Marcado como revisado!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao revisar');
    } finally { setReviewing(false); }
  };

  // ── Contadores ─────────────────────────────────────────────────────────────

  const counts = {
    total:    plans.length,
    unread:   plans.filter(p => p.status === 'sent').length,
    read:     plans.filter(p => p.status === 'read').length,
    reviewed: plans.filter(p => p.status === 'reviewed').length,
  };

  const hasFilters = fTeacher || fClass || fDate || fStatus || fPeriod;
  const inputCls = 'w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]';

  // ══════════════════════════════════════════════════════════════════════════════
  // VISTA DE DETALHE
  // ══════════════════════════════════════════════════════════════════════════════

  if (detail) {
    const cardCls = 'bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5';
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
        {/* Lightbox */}
        {lightbox && (
          <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setLightbox(null)}>
            <img src={lightbox} alt="" className="max-w-full max-h-full rounded-xl object-contain" />
            <button className="absolute top-4 right-4 p-2 bg-white/10 rounded-full text-white hover:bg-white/20">
              <X size={20} />
            </button>
          </div>
        )}

        <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-10">
          <div className="max-w-3xl mx-auto flex items-center gap-3">
            <button onClick={() => setDetail(null)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ChevronLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base truncate">
                {detail.theme ?? 'Planejamento sem tema'}
              </h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {detail.teacher?.name} · {detail.schoolClass?.name}
              </p>
            </div>
            <StatusBadge status={detail.status} />
          </div>
        </header>

        <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {/* Linha do tempo */}
          <div className={cardCls}>
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Linha do tempo</p>
            <StatusTimeline plan={detail} />
          </div>

          {/* Info geral */}
          <div className={cardCls}>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {[
                { label: 'Período', value: `${PERIOD_LABELS[detail.periodType]} — ${planDate(detail)}` },
                { label: 'Turma',   value: detail.schoolClass?.name },
                { label: 'Módulo',  value: detail.moduleType === 'infantil' ? '🎨 Educação Infantil' : '📚 Ensino Regular' },
                ...(detail.ageGroup  ? [{ label: 'Faixa etária',       value: detail.ageGroup }]  : []),
                ...(detail.gradeLevel ? [{ label: 'Ano / Série',       value: detail.gradeLevel }] : []),
                ...(detail.subject?.name ? [{ label: 'Componente',      value: detail.subject.name }] : []),
              ].filter(i => i.value).map(item => (
                <div key={item.label}>
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{item.label}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-200 font-medium mt-0.5">{item.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* BNCC */}
          {(detail.bncFields?.fields?.length || detail.bncFields?.codes?.length || detail.bnccSkills?.codes?.length) ? (
            <div className={cardCls}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3">BNCC</p>
              {detail.bncFields?.fields?.length ? (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {detail.bncFields.fields.map(fc => {
                      const m = FIELD_META[fc];
                      return m ? (
                        <span key={fc} className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full"
                          style={{ background: m.bg, color: m.color }}>
                          <span className="font-mono">{fc}</span> — {m.name}
                        </span>
                      ) : null;
                    })}
                  </div>
                  {detail.bncFields.codes?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {detail.bncFields.codes.map(c => (
                        <span key={c} className="text-[11px] px-2 py-0.5 rounded-full bg-[#1E3A5F] text-white font-mono font-medium">{c}</span>
                      ))}
                    </div>
                  )}
                </>
              ) : null}
              {detail.bnccSkills?.codes?.length ? (
                <div className="flex flex-wrap gap-1.5">
                  {detail.bnccSkills.codes.map(c => (
                    <span key={c} className="text-[11px] px-2.5 py-0.5 rounded-full bg-[#1E3A5F] text-white font-mono font-medium">{c}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Objetivo Geral */}
          {detail.generalObjective && (
            <div className={cardCls}>
              <Section title="Objetivo Geral" content={detail.generalObjective} />
            </div>
          )}

          {/* Desenvolvimento */}
          {(detail.welcome || detail.mainActivity || detail.playActivity || detail.closure || detail.content) && (
            <div className={cardCls}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-4">Desenvolvimento</p>
              <div className="space-y-4">
                {detail.moduleType === 'infantil' ? (
                  <>
                    {[
                      { title: 'Acolhida',           content: detail.welcome,      icon: Users },
                      { title: 'Atividade Principal', content: detail.mainActivity, icon: Pencil },
                      { title: 'Brincadeira',         content: detail.playActivity, icon: Gamepad2 },
                      { title: 'Encerramento',        content: detail.closure,      icon: Star },
                    ].map(s => <Section key={s.title} {...s} />)}
                  </>
                ) : (
                  <>
                    <Section title="Conteúdo" content={detail.content} />
                    <Section title="Atividade Principal" content={detail.mainActivity} />
                  </>
                )}
              </div>
            </div>
          )}

          {/* Recursos, Metodologia, Avaliação */}
          {(detail.resources || detail.methodology || detail.assessment) && (
            <div className={cardCls}>
              <div className="space-y-4">
                <Section title="Recursos Didáticos" content={detail.resources} />
                <Section title="Metodologia" content={detail.methodology} />
                <Section title="Avaliação" content={detail.assessment} />
              </div>
            </div>
          )}

          {/* Galeria de anexos */}
          {detail.attachments && detail.attachments.length > 0 && (
            <div className={cardCls}>
              <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <Paperclip size={10} /> Anexos ({detail.attachments.length})
              </p>
              <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                {detail.attachments.map(a => (
                  <div key={a.id}
                    className="rounded-xl overflow-hidden border border-gray-100 dark:border-gray-800 aspect-square cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => a.type.startsWith('image') ? setLightbox(a.url) : window.open(a.url, '_blank')}>
                    {a.type.startsWith('image') ? (
                      <img src={a.url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex flex-col items-center justify-center gap-1 p-2">
                        <FileText size={20} className="text-red-500" />
                        <span className="text-[9px] text-red-500 font-medium text-center">PDF</span>
                        <span className="text-[8px] text-gray-400">{fmtSize(a.size)}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botão revisar */}
          {detail.status !== 'reviewed' && detail.status !== 'draft' && (
            <button onClick={handleReview} disabled={reviewing}
              className="w-full py-4 rounded-2xl bg-green-600 hover:bg-green-700 text-white font-bold text-sm disabled:opacity-50 transition-colors flex items-center justify-center gap-2">
              {reviewing ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
              {reviewing ? 'Marcando como revisado...' : 'Marcar como revisado'}
            </button>
          )}

          {detail.status === 'reviewed' && detail.reviewedByUser && (
            <div className="bg-green-50 dark:bg-green-950/30 rounded-2xl border border-green-200 dark:border-green-800 px-5 py-4 flex items-center gap-3">
              <CheckCircle size={18} className="text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Revisado</p>
                <p className="text-xs text-green-600 dark:text-green-500">
                  Por {detail.reviewedByUser.name} em {fmtDate(detail.reviewedAt, true)}
                </p>
              </div>
            </div>
          )}
        </main>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════════════════
  // LISTA
  // ══════════════════════════════════════════════════════════════════════════════

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Planejamentos</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{counts.total} registro{counts.total !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilters || hasFilters
                ? 'bg-[#1E3A5F] text-white'
                : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}>
            <Filter size={14} />
            Filtros
            {hasFilters && <span className="w-4 h-4 rounded-full bg-[#F5A623] text-white text-[9px] font-bold flex items-center justify-center">!</span>}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Contadores */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Total',    value: counts.total,    cls: 'text-[#1E3A5F] dark:text-blue-300',        bg: 'bg-blue-50 dark:bg-blue-950/30' },
            { label: 'Não lidos', value: counts.unread,  cls: 'text-red-600 dark:text-red-400',            bg: 'bg-red-50 dark:bg-red-950/30' },
            { label: 'Lidos',    value: counts.read,     cls: 'text-yellow-600 dark:text-yellow-400',      bg: 'bg-yellow-50 dark:bg-yellow-950/30' },
            { label: 'Revisados',value: counts.reviewed, cls: 'text-green-600 dark:text-green-400',        bg: 'bg-green-50 dark:bg-green-950/30' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.cls}`}>{s.value}</p>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1E3A5F] dark:text-white">Filtrar por</p>
              {hasFilters && (
                <button onClick={() => { setFTeacher(''); setFClass(''); setFDate(''); setFStatus(''); setFPeriod(''); }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <X size={12} /> Limpar
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">Professor</label>
                <select value={fTeacher} onChange={e => setFTeacher(e.target.value)} className={inputCls}>
                  <option value="">Todos</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">Turma</label>
                <select value={fClass} onChange={e => setFClass(e.target.value)} className={inputCls}>
                  <option value="">Todas</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">Status</label>
                <select value={fStatus} onChange={e => setFStatus(e.target.value)} className={inputCls}>
                  <option value="">Todos</option>
                  <option value="sent">Não lido</option>
                  <option value="read">Lido</option>
                  <option value="reviewed">Revisado</option>
                  <option value="draft">Rascunho</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">Período</label>
                <select value={fPeriod} onChange={e => setFPeriod(e.target.value)} className={inputCls}>
                  <option value="">Todos</option>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-semibold text-gray-400 uppercase mb-1 block">Data</label>
                <input type="date" value={fDate} onChange={e => setFDate(e.target.value)} className={inputCls} />
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Lista vazia */}
        {!loading && plans.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center">
            <div className="w-16 h-16 bg-[#1E3A5F]/8 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <BookOpen size={28} className="text-[#1E3A5F]/40" />
            </div>
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum planejamento encontrado.</p>
            {hasFilters && <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Tente remover os filtros.</p>}
          </div>
        )}

        {/* Cards */}
        {!loading && plans.map(plan => (
          <button key={plan.id} onClick={() => openDetail(plan)}
            className={`w-full text-left bg-white dark:bg-gray-900 rounded-2xl border-t border-r border-b border-l-4 ${STATUS_BORDER[plan.status]} border-t-gray-100 border-r-gray-100 border-b-gray-100 dark:border-t-gray-800 dark:border-r-gray-800 dark:border-b-gray-800 overflow-hidden hover:shadow-sm hover:scale-[1.005] transition-all duration-150`}>
            <div className="flex items-start gap-3 px-5 py-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <StatusBadge status={plan.status} pulse={plan.status === 'sent'} />
                  {plan.moduleType === 'infantil' && (
                    <span className="text-[10px] font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/30 px-2 py-0.5 rounded-full">🎨 Infantil</span>
                  )}
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {PERIOD_LABELS[plan.periodType]} · {planDate(plan)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-[#1E3A5F] dark:text-blue-300 truncate">
                  {plan.teacher?.name ?? 'Professor'}
                </p>
                {plan.schoolClass && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">{plan.schoolClass.name}</p>
                )}
                {plan.theme && (
                  <p className="text-sm text-gray-700 dark:text-gray-200 mt-1 flex items-center gap-1.5">
                    <Tag size={11} className="text-gray-400" />{plan.theme}
                  </p>
                )}
                {/* Preview chips BNCC */}
                {plan.bncFields?.fields?.length ? (
                  <div className="flex gap-1 mt-2 flex-wrap">
                    {plan.bncFields.fields.slice(0, 3).map(fc => {
                      const m = FIELD_META[fc];
                      return m ? (
                        <span key={fc} className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold"
                          style={{ background: m.bg, color: m.color }}>{fc}</span>
                      ) : null;
                    })}
                    {plan.bncFields.codes?.length > 0 && (
                      <span className="text-[10px] text-gray-400 dark:text-gray-500">{plan.bncFields.codes.length} código{plan.bncFields.codes.length !== 1 ? 's' : ''}</span>
                    )}
                  </div>
                ) : null}
                {plan.bnccSkills?.codes?.length ? (
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {plan.bnccSkills.codes.slice(0, 4).map(c => (
                      <span key={c} className="text-[10px] px-1.5 py-0.5 rounded bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-blue-950/30 dark:text-blue-400 font-mono font-medium">{c}</span>
                    ))}
                    {plan.bnccSkills.codes.length > 4 && (
                      <span className="text-[10px] text-gray-400">+{plan.bnccSkills.codes.length - 4}</span>
                    )}
                  </div>
                ) : null}
              </div>
              {/* Thumb de anexo */}
              {plan.attachments && plan.attachments.length > 0 && (
                <div className="w-10 h-10 rounded-lg overflow-hidden border border-gray-100 dark:border-gray-800 flex-shrink-0">
                  {plan.attachments[0].type.startsWith('image') ? (
                    <img src={plan.attachments[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
                      <FileText size={14} className="text-red-400" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </button>
        ))}
      </main>
    </div>
  );
}
