'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../../lib/auth';
import api from '../../../lib/api';
import { ArrowLeft, Plus, BookOpen, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SchoolClass { id: number; name: string; }
interface DiarioEntry { id: number; date: string; content: string; teacher?: { name: string }; createdAt: string; }

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export default function DiarioBordoPage() {
  const router = useRouter();
  const user = getUser();

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [classId, setClassId] = useState('');
  const [entries, setEntries] = useState<DiarioEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ date: new Date().toISOString().split('T')[0], content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    api.get('/classes/my')
      .then(r => setClasses(r.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!classId) { setEntries([]); return; }
    loadEntries();
  }, [classId]);

  const loadEntries = async () => {
    setLoadingEntries(true);
    try {
      const res = await api.get(`/infantil/diario?classId=${classId}`);
      setEntries(res.data);
    } catch { toast.error('Erro ao carregar diário'); }
    finally { setLoadingEntries(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classId || !form.content.trim()) return;
    setSaving(true);
    try {
      await api.post('/infantil/diario', { classId: Number(classId), date: form.date, content: form.content });
      toast.success('Registro salvo!');
      setForm({ date: new Date().toISOString().split('T')[0], content: '' });
      setShowForm(false);
      loadEntries();
    } catch { toast.error('Erro ao salvar'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Remover este registro?')) return;
    try {
      await api.delete(`/infantil/diario/${id}`);
      setEntries(prev => prev.filter(e => e.id !== id));
      toast.success('Registro removido');
    } catch { toast.error('Erro ao remover'); }
  };

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
              <h1 className="font-bold text-[#1E3A5F] dark:text-white text-base">Diário de Bordo</h1>
              <p className="text-[10px] text-purple-500 font-medium">🎨 Educação Infantil</p>
            </div>
          </div>
          {classId && (
            <button onClick={() => setShowForm(v => !v)}
              className="flex items-center gap-1.5 bg-purple-600 text-white px-3 py-2 rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors">
              <Plus size={15} />
              Novo registro
            </button>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {/* Seletor de turma */}
        <select value={classId} onChange={e => { setClassId(e.target.value); setShowForm(false); }}
          className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400">
          <option value="">Selecione a turma</option>
          {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        {/* Formulário novo registro */}
        {showForm && classId && (
          <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-900 rounded-2xl border border-purple-200 dark:border-purple-800 p-5 space-y-3">
            <p className="text-sm font-semibold text-[#1E3A5F] dark:text-white">Novo registro</p>
            <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} required
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400" />
            <textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} required
              rows={5} placeholder="O que aconteceu hoje na turma? Registre atividades, aprendizados, situações e observações..."
              className="w-full px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm bg-white dark:bg-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-400 resize-none" />
            <div className="flex gap-2">
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

        {/* Estado vazio */}
        {!classId && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <BookOpen size={36} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Selecione uma turma para ver o diário</p>
          </div>
        )}

        {/* Loading */}
        {loadingEntries && <div className="flex justify-center py-8"><div className="w-7 h-7 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>}

        {/* Lista de entradas */}
        {!loadingEntries && classId && entries.length === 0 && (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-10 text-center">
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhum registro ainda. Adicione o primeiro!</p>
          </div>
        )}

        {!loadingEntries && entries.map(entry => (
          <div key={entry.id} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5">
            <div className="flex items-start justify-between mb-2">
              <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 capitalize">
                {formatDate(entry.date)}
              </p>
              <button onClick={() => handleDelete(entry.id)} className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 transition-colors">
                <Trash2 size={14} />
              </button>
            </div>
            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap leading-relaxed">{entry.content}</p>
            {entry.teacher && (
              <p className="text-[10px] text-gray-400 dark:text-gray-600 mt-3">Prof. {entry.teacher.name}</p>
            )}
          </div>
        ))}
      </main>
    </div>
  );
}
