'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import {
  ArrowLeft, BookOpen, Eye, CheckCircle, Clock, Send,
  ChevronDown, ChevronUp, Filter, X,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Tipos ──────────────────────────────────────────────────────────────────

type PlanStatus = 'draft' | 'sent' | 'read' | 'reviewed';
type PeriodType = 'daily' | 'weekly' | 'monthly';

interface TeachingPlan {
  id: number;
  referenceDate: string;
  periodType: PeriodType;
  content: string;
  status: PlanStatus;
  readAt: string | null;
  readByUser?: { name: string } | null;
  reviewedAt: string | null;
  reviewedByUser?: { name: string } | null;
  teacher?: { name: string } | null;
  schoolClass?: { name: string } | null;
  subject?: { name: string } | null;
  createdAt: string;
}

interface FilterTeacher { id: number; name: string; }
interface FilterClass   { id: number; name: string; }

// ── Helpers ────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal',
};

function StatusBadge({ status }: { status: PlanStatus }) {
  if (status === 'draft')
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"><Clock size={10} />Rascunho</span>;
  if (status === 'sent')
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400"><Send size={10} />Não lido</span>;
  if (status === 'read')
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"><Eye size={10} />Lido</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"><CheckCircle size={10} />Revisado</span>;
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Componente principal ───────────────────────────────────────────────────

export default function PlanejamentosGestaoPage() {
  const router = useRouter();
  const user   = getUser();

  const [plans,          setPlans]          = useState<TeachingPlan[]>([]);
  const [teachers,       setTeachers]       = useState<FilterTeacher[]>([]);
  const [classes,        setClasses]        = useState<FilterClass[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [expanded,       setExpanded]       = useState<number | null>(null);
  const [reviewing,      setReviewing]      = useState<number | null>(null);
  const [showFilters,    setShowFilters]    = useState(false);

  const [filterTeacher,  setFilterTeacher]  = useState('');
  const [filterClass,    setFilterClass]    = useState('');
  const [filterDate,     setFilterDate]     = useState('');
  const [filterStatus,   setFilterStatus]   = useState('');

  const MANAGEMENT_ROLES = ['coordinator', 'director', 'secretary'];

  // ── Carregar dados ──────────────────────────────────────────────────────

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (filterTeacher) p.set('teacherId', filterTeacher);
    if (filterClass)   p.set('classId',   filterClass);
    if (filterDate)    p.set('date',      filterDate);
    if (filterStatus)  p.set('status',    filterStatus);
    return p.toString();
  }, [filterTeacher, filterClass, filterDate, filterStatus]);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const qs = buildQuery();
      const r = await api.get(`/teaching-plans${qs ? `?${qs}` : ''}`);
      setPlans(r.data);
    } catch { toast.error('Erro ao carregar planejamentos'); }
    finally { setLoading(false); }
  }, [buildQuery]);

  useEffect(() => {
    if (!user || !MANAGEMENT_ROLES.includes(user.role)) { router.push('/login'); return; }

    // Carrega listas para filtros
    api.get('/secretary/teachers').then(r => setTeachers(r.data)).catch(() => {});
    api.get('/classes').then(r => setClasses(r.data)).catch(() => {});

    loadPlans();
  }, []);

  // Re-carrega ao mudar filtros
  useEffect(() => { loadPlans(); }, [filterTeacher, filterClass, filterDate, filterStatus]);

  // ── Abrir planejamento (auto-marca lido) ─────────────────────────────────

  const openPlan = async (plan: TeachingPlan) => {
    const isOpen = expanded === plan.id;
    setExpanded(isOpen ? null : plan.id);

    if (!isOpen && plan.status === 'sent') {
      try {
        const r = await api.get(`/teaching-plans/${plan.id}`);
        // Atualiza localmente após marcação de lido
        setPlans(prev => prev.map(p => p.id === plan.id ? { ...p, ...r.data } : p));
      } catch { /* silently fail */ }
    }
  };

  // ── Revisar ──────────────────────────────────────────────────────────────

  const handleReview = async (id: number) => {
    setReviewing(id);
    try {
      const r = await api.patch(`/teaching-plans/${id}/review`);
      setPlans(prev => prev.map(p => p.id === id ? { ...p, ...r.data } : p));
      toast.success('Planejamento marcado como revisado!');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao revisar');
    } finally { setReviewing(null); }
  };

  // ── Clear filtros ─────────────────────────────────────────────────────────

  const hasFilters = filterTeacher || filterClass || filterDate || filterStatus;
  const clearFilters = () => {
    setFilterTeacher(''); setFilterClass(''); setFilterDate(''); setFilterStatus('');
  };

  // ── Estilos ──────────────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  // ── Contadores de status ─────────────────────────────────────────────────

  const unread   = plans.filter(p => p.status === 'sent').length;
  const read     = plans.filter(p => p.status === 'read').length;
  const reviewed = plans.filter(p => p.status === 'reviewed').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Planejamentos</h1>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">{plans.length} registro{plans.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <button
            onClick={() => setShowFilters(v => !v)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${showFilters || hasFilters ? 'bg-[#1E3A5F] text-white' : 'border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
          >
            <Filter size={14} />
            Filtros
            {hasFilters && <span className="w-4 h-4 bg-white/20 rounded-full text-[10px] flex items-center justify-center font-bold">!</span>}
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-4">

        {/* Resumo de status */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Não lidos', value: unread,   color: 'text-red-600 dark:text-red-400',    bg: 'bg-red-50 dark:bg-red-950' },
            { label: 'Lidos',     value: read,     color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-50 dark:bg-yellow-950' },
            { label: 'Revisados', value: reviewed, color: 'text-green-600 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-950' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-2xl p-3 text-center`}>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Painel de filtros */}
        {showFilters && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-[#1E3A5F] dark:text-white">Filtrar por</p>
              {hasFilters && (
                <button onClick={clearFilters} className="flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition-colors">
                  <X size={12} /> Limpar filtros
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Professor</label>
                <select value={filterTeacher} onChange={e => setFilterTeacher(e.target.value)} className={inputCls}>
                  <option value="">Todos</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Turma</label>
                <select value={filterClass} onChange={e => setFilterClass(e.target.value)} className={inputCls}>
                  <option value="">Todas</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data</label>
                <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Status</label>
                <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls}>
                  <option value="">Todos</option>
                  <option value="draft">Rascunho</option>
                  <option value="sent">Não lido</option>
                  <option value="read">Lido</option>
                  <option value="reviewed">Revisado</option>
                </select>
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
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <BookOpen size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum planejamento encontrado.</p>
            {hasFilters && <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Tente remover os filtros.</p>}
          </div>
        )}

        {/* Cards */}
        {!loading && plans.map(plan => (
          <div
            key={plan.id}
            className={`bg-white dark:bg-gray-900 rounded-2xl border overflow-hidden transition-colors ${plan.status === 'sent' ? 'border-red-200 dark:border-red-900' : 'border-gray-100 dark:border-gray-800'}`}
          >
            <button
              onClick={() => openPlan(plan)}
              className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <StatusBadge status={plan.status} />
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {formatDate(plan.referenceDate)} · {PERIOD_LABELS[plan.periodType]}
                  </span>
                </div>
                <p className="text-sm font-medium text-[#1E3A5F] dark:text-blue-300">
                  {plan.teacher?.name ?? 'Professor'}
                </p>
                {(plan.schoolClass || plan.subject) && (
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {[plan.schoolClass?.name, plan.subject?.name].filter(Boolean).join(' — ')}
                  </p>
                )}
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 line-clamp-2 leading-relaxed">
                  {plan.content}
                </p>
              </div>
              <div className="ml-3 flex-shrink-0 text-gray-400">
                {expanded === plan.id ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </div>
            </button>

            {/* Detalhe */}
            {expanded === plan.id && (
              <div className="px-5 pb-5 border-t border-gray-50 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-4">
                  {plan.content}
                </p>

                {/* Metadados de leitura/revisão */}
                <div className="mt-4 space-y-1">
                  {plan.readAt && plan.readByUser && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <Eye size={11} />
                      Lido por <span className="font-medium">{plan.readByUser.name}</span> em {new Date(plan.readAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                  {plan.reviewedAt && plan.reviewedByUser && (
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 flex items-center gap-1">
                      <CheckCircle size={11} />
                      Revisado por <span className="font-medium">{plan.reviewedByUser.name}</span> em {new Date(plan.reviewedAt).toLocaleString('pt-BR')}
                    </p>
                  )}
                </div>

                {/* Botão revisar */}
                {plan.status !== 'reviewed' && plan.status !== 'draft' && (
                  <button
                    onClick={() => handleReview(plan.id)}
                    disabled={reviewing === plan.id}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    <CheckCircle size={15} />
                    {reviewing === plan.id ? 'Marcando...' : 'Marcar como revisado'}
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
