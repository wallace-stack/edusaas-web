'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import {
  ArrowLeft, Plus, BookOpen, Send, Edit3,
  Clock, Eye, CheckCircle, ChevronDown, ChevronUp, Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

// ── Tipos ──────────────────────────────────────────────────────────────────

interface SchoolClass  { id: number; name: string; }
interface Subject      { id: number; name: string; }

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
  schoolClass?: { name: string } | null;
  subject?: { name: string } | null;
  createdAt: string;
}

// ── Helpers ────────────────────────────────────────────────────────────────

const PERIOD_LABELS: Record<PeriodType, string> = {
  daily: 'Diário', weekly: 'Semanal', monthly: 'Mensal',
};

function StatusBadge({ plan }: { plan: TeachingPlan }) {
  if (plan.status === 'draft')
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"><Clock size={10} />Rascunho</span>;
  if (plan.status === 'sent')
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400"><Send size={10} />Enviado</span>;
  if (plan.status === 'read')
    return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-yellow-50 dark:bg-yellow-950 text-yellow-600 dark:text-yellow-400"><Eye size={10} />Visto{plan.readByUser ? ` por ${plan.readByUser.name.split(' ')[0]}` : ''}{plan.readAt ? ` em ${new Date(plan.readAt).toLocaleDateString('pt-BR')}` : ''}</span>;
  return <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"><CheckCircle size={10} />Revisado{plan.reviewedByUser ? ` por ${plan.reviewedByUser.name.split(' ')[0]}` : ''}</span>;
}

function formatDate(iso: string) {
  return new Date(iso + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── Componente principal ───────────────────────────────────────────────────

export default function CadernoPage() {
  const router  = useRouter();
  const user    = getUser();

  const [plans,      setPlans]      = useState<TeachingPlan[]>([]);
  const [classes,    setClasses]    = useState<SchoolClass[]>([]);
  const [subjects,   setSubjects]   = useState<Subject[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [expanded,   setExpanded]   = useState<number | null>(null);
  const [showForm,   setShowForm]   = useState(false);
  const [editingId,  setEditingId]  = useState<number | null>(null);
  const [saving,     setSaving]     = useState(false);
  const [sending,    setSending]    = useState<number | null>(null);

  const emptyForm = {
    classId: '', subjectId: '', referenceDate: new Date().toISOString().split('T')[0],
    periodType: 'daily' as PeriodType, content: '',
  };
  const [form, setForm] = useState(emptyForm);

  // ── Carregar dados ──────────────────────────────────────────────────────

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
  }, [form.classId]);

  // ── Ações ───────────────────────────────────────────────────────────────

  const openNew = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const openEdit = (plan: TeachingPlan) => {
    setEditingId(plan.id);
    setForm({
      classId:       String(plan.schoolClass ? (classes.find(c => c.name === plan.schoolClass?.name)?.id ?? '') : ''),
      subjectId:     String(plan.subject     ? (subjects.find(s => s.name === plan.subject?.name)?.id  ?? '') : ''),
      referenceDate: plan.referenceDate.split('T')[0],
      periodType:    plan.periodType,
      content:       plan.content,
    });
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent, asSend = false) => {
    e.preventDefault();
    if (!form.content.trim()) { toast.error('O conteúdo é obrigatório'); return; }
    setSaving(true);
    try {
      const payload = {
        classId:       form.classId   ? Number(form.classId)   : undefined,
        subjectId:     form.subjectId ? Number(form.subjectId) : undefined,
        referenceDate: form.referenceDate,
        periodType:    form.periodType,
        content:       form.content,
      };

      let newId = editingId;
      if (editingId) {
        await api.patch(`/teaching-plans/${editingId}`, payload);
      } else {
        const r = await api.post('/teaching-plans', payload);
        newId = r.data.id;
      }

      if (asSend && newId) {
        await api.patch(`/teaching-plans/${newId}/send`);
        toast.success('Planejamento enviado para a gestão!');
      } else {
        toast.success(editingId ? 'Planejamento atualizado!' : 'Rascunho salvo!');
      }

      setShowForm(false);
      setEditingId(null);
      setForm(emptyForm);
      await loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao salvar');
    } finally { setSaving(false); }
  };

  const handleSend = async (id: number) => {
    setSending(id);
    try {
      await api.patch(`/teaching-plans/${id}/send`);
      toast.success('Planejamento enviado para a gestão!');
      await loadPlans();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Erro ao enviar');
    } finally { setSending(null); }
  };

  const canEdit = (plan: TeachingPlan) =>
    plan.status === 'draft' || (plan.status === 'sent' && !plan.readAt);

  // ── Estilos ──────────────────────────────────────────────────────────────

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F]";

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">

      {/* Header */}
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
          <button
            onClick={openNew}
            className="flex items-center gap-1.5 bg-[#1E3A5F] text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
          >
            <Plus size={15} />
            Novo
          </button>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">

        {/* Formulário */}
        {showForm && (
          <form
            onSubmit={e => handleSubmit(e, false)}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-[#1E3A5F]/20 dark:border-blue-900 p-5 space-y-3"
          >
            <p className="text-sm font-semibold text-[#1E3A5F] dark:text-white flex items-center gap-2">
              <BookOpen size={16} />
              {editingId ? 'Editar planejamento' : 'Novo planejamento'}
            </p>

            {/* Turma + Disciplina */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Turma</label>
                <select value={form.classId} onChange={e => setForm(f => ({ ...f, classId: e.target.value, subjectId: '' }))} className={inputCls}>
                  <option value="">Selecionar...</option>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Disciplina</label>
                <select value={form.subjectId} onChange={e => setForm(f => ({ ...f, subjectId: e.target.value }))} disabled={!form.classId} className={`${inputCls} disabled:opacity-50`}>
                  <option value="">Selecionar...</option>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
            </div>

            {/* Data + Período */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Data de referência *</label>
                <input type="date" value={form.referenceDate} onChange={e => setForm(f => ({ ...f, referenceDate: e.target.value }))} required className={inputCls} />
              </div>
              <div>
                <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Período</label>
                <select value={form.periodType} onChange={e => setForm(f => ({ ...f, periodType: e.target.value as PeriodType }))} className={inputCls}>
                  <option value="daily">Diário</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensal</option>
                </select>
              </div>
            </div>

            {/* Conteúdo */}
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Conteúdo do planejamento *</label>
              <textarea
                value={form.content}
                onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
                required
                rows={8}
                placeholder="Descreva o planejamento da aula: objetivos, atividades, recursos, avaliação..."
                className={`${inputCls} resize-none leading-relaxed`}
              />
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-200 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                {saving ? 'Salvando...' : 'Salvar rascunho'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={e => handleSubmit(e as any, true)}
                className="flex-1 py-2.5 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors flex items-center justify-center gap-1.5"
              >
                <Send size={14} />
                {saving ? 'Enviando...' : 'Enviar para gestão'}
              </button>
            </div>
          </form>
        )}

        {/* Lista vazia */}
        {!loading && plans.length === 0 && !showForm && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <BookOpen size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum planejamento ainda.</p>
            <p className="text-gray-300 dark:text-gray-600 text-xs mt-1">Clique em "Novo" para começar.</p>
          </div>
        )}

        {/* Cards de planejamento */}
        {plans.map(plan => (
          <div
            key={plan.id}
            className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden"
          >
            {/* Cabeçalho do card */}
            <button
              onClick={() => setExpanded(expanded === plan.id ? null : plan.id)}
              className="w-full flex items-start justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1.5">
                  <StatusBadge plan={plan} />
                  <span className="text-[11px] text-gray-400 dark:text-gray-500">
                    {formatDate(plan.referenceDate)} · {PERIOD_LABELS[plan.periodType]}
                  </span>
                </div>
                {(plan.schoolClass || plan.subject) && (
                  <p className="text-xs text-[#1E3A5F] dark:text-blue-400 font-medium">
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

            {/* Detalhes expandidos */}
            {expanded === plan.id && (
              <div className="px-5 pb-5 border-t border-gray-50 dark:border-gray-800">
                <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed mt-4">
                  {plan.content}
                </p>
                <div className="flex gap-2 mt-4">
                  {canEdit(plan) && (
                    <button
                      onClick={() => openEdit(plan)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <Edit3 size={14} />
                      Editar
                    </button>
                  )}
                  {plan.status === 'draft' && (
                    <button
                      onClick={() => handleSend(plan.id)}
                      disabled={sending === plan.id}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50 transition-colors"
                    >
                      <Send size={14} />
                      {sending === plan.id ? 'Enviando...' : 'Enviar para gestão'}
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
