'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, ClipboardList, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolClass { id: number; name: string; }
interface Planejamento {
  id: number; date: string;
  objetivos: string; atividades: string;
  recursos?: string; observacoes?: string;
  teacher?: { name: string };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

const emptyForm = { date: new Date().toISOString().split('T')[0], objetivos: '', atividades: '', recursos: '', observacoes: '' };

export default function PlanejamentoDiarioPage() {
  const router = useRouter();
  const user = getUser();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState('');
  const [items, setItems] = useState<Planejamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my')
      .then(r => setClasses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!classId) { setItems([]); return; }
    loadItems();
  }, [classId]);

  const loadItems = async () => {
    setLoadingItems(true);
    try {
      const res = await api.get(`/infantil/planejamento?classId=${classId}`);
      setItems(res.data);
    } catch { toast.error('Erro ao carregar planejamentos'); }
    finally { setLoadingItems(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId) return;
    setSaving(true);
    try {
      await api.post('/infantil/planejamento', {
        classId: Number(classId),
        date: form.date,
        objetivos: form.objetivos,
        atividades: form.atividades,
        recursos: form.recursos || undefined,
        observacoes: form.observacoes || undefined,
      });
      toast.success('Planejamento salvo!');
      setForm(emptyForm);
      setShowForm(false);
      loadItems();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este planejamento?')) return;
    try {
      await api.delete(`/infantil/planejamento/${id}`);
      setItems(prev => prev.filter(p => p.id !== id));
      toast.success('Planejamento removido');
    } catch { toast.error('Erro ao remover'); }
  };

  const inputCls = "w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400";
  const textareaCls = `${inputCls} resize-none`;

  if (loading) return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <ArrowLeft size={18} className="text-gray-600 dark:text-gray-400" />
            </button>
            <div>
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Planejamento Diário</h1>
              <p className="text-[10px] text-purple-500 font-medium">🎨 Educação Infantil</p>
            </div>
          </div>
          {classId && (
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
              <Plus size={15} />
              Novo
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <select value={classId} onChange={e => { setClassId(e.target.value); setShowForm(false); }}
          className={inputCls}>
          <option value="">Selecione a turma</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Formulário */}
        {showForm && classId && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800 p-5 space-y-3">
            <p className="text-sm font-semibold text-[#1E3A5F] dark:text-white">Novo planejamento</p>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required className={inputCls} />

            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Objetivos *</label>
              <textarea value={form.objetivos} onChange={e => setForm(f => ({ ...f, objetivos: e.target.value }))} required rows={3} placeholder="O que os alunos vão aprender ou desenvolver?" className={textareaCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Atividades *</label>
              <textarea value={form.atividades} onChange={e => setForm(f => ({ ...f, atividades: e.target.value }))} required rows={3} placeholder="Descreva as atividades previstas para o dia..." className={textareaCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Recursos <span className="text-gray-300">(opcional)</span></label>
              <textarea value={form.recursos} onChange={e => setForm(f => ({ ...f, recursos: e.target.value }))} rows={2} placeholder="Materiais, espaços, equipamentos..." className={textareaCls} />
            </div>
            <div>
              <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Observações <span className="text-gray-300">(opcional)</span></label>
              <textarea value={form.observacoes} onChange={e => setForm(f => ({ ...f, observacoes: e.target.value }))} rows={2} placeholder="Alguma observação adicional..." className={textareaCls} />
            </div>

            <div className="flex gap-2 pt-1">
              <button type="button" onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800">
                Cancelar
              </button>
              <button type="submit" disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50">
                {saving ? 'Salvando...' : 'Salvar'}
              </button>
            </div>
          </form>
        )}

        {!classId && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <ClipboardList size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione uma turma para ver o planejamento</p>
          </div>
        )}

        {loadingItems && <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}

        {!loadingItems && classId && items.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum planejamento ainda. Adicione o primeiro!</p>
          </div>
        )}

        {!loadingItems && items.map(item => (
          <div key={item.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 overflow-hidden">
            <button onClick={() => setExpanded(expanded === item.id ? null : item.id)}
              className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              <div>
                <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 capitalize mb-0.5">{formatDate(item.date)}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-1">{item.objetivos}</p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={e => { e.stopPropagation(); handleDelete(item.id); }} className="p-1.5 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                  <Trash2 size={14} />
                </button>
                {expanded === item.id ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </div>
            </button>

            {expanded === item.id && (
              <div className="px-5 pb-5 space-y-3 border-t border-gray-50 dark:border-gray-800">
                <Section title="Objetivos" content={item.objetivos} />
                <Section title="Atividades" content={item.atividades} />
                {item.recursos && <Section title="Recursos" content={item.recursos} />}
                {item.observacoes && <Section title="Observações" content={item.observacoes} />}
                {item.teacher && <p className="text-[10px] text-gray-400 dark:text-gray-600 pt-1">Prof. {item.teacher.name}</p>}
              </div>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}

function Section({ title, content }: { title: string; content: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider mb-1">{title}</p>
      <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{content}</p>
    </div>
  );
}
