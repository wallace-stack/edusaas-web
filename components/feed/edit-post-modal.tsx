'use client';

import { useState } from 'react';
import api from '@/app/lib/api';
import { X } from 'lucide-react';
import { FeedPost } from './feed-card';

interface EditPostModalProps {
  post: FeedPost;
  currentUserRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

export default function EditPostModal({ post, currentUserRole, onClose, onSuccess }: EditPostModalProps) {
  const [form, setForm] = useState({
    title: post.title,
    content: post.content,
    type: post.type,
    pinned: post.pinned,
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const canPin = currentUserRole === 'director' || currentUserRole === 'coordinator';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      await api.patch(`/feed/${post.id}`, {
        title: form.title,
        content: form.content,
        type: form.type,
        pinned: canPin ? form.pinned : post.pinned,
      });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao editar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white">Editar publicação</h2>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg text-gray-400 dark:text-gray-500">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="Título"
            required
            className={inputCls}
          />

          <textarea
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Conteúdo"
            required
            rows={5}
            className={`${inputCls} resize-none`}
          />

          {currentUserRole !== 'teacher' && (
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as FeedPost['type'] })}
              className={inputCls}
            >
              <option value="global">Escola inteira</option>
              <option value="class_message">Recado de Turma</option>
            </select>
          )}

          {canPin && (
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.pinned}
                onChange={e => setForm({ ...form, pinned: e.target.checked })}
                className="w-4 h-4 accent-[#1E3A5F] rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Fixar publicação no topo</span>
            </label>
          )}

          {error && <p className="text-red-500 dark:text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 rounded-xl bg-[#1E3A5F] text-white text-sm font-medium hover:bg-[#162d4a] disabled:opacity-50"
            >
              {saving ? 'Salvando...' : 'Salvar alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
