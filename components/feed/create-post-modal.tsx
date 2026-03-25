'use client';

import { useEffect, useRef, useState } from 'react';
import api from '@/app/lib/api';
import { X, ImagePlus } from 'lucide-react';

interface CreatePostModalProps {
  userRole: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface SchoolClass {
  id: number;
  name: string;
}

const inputCls = "w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] dark:bg-gray-800 dark:text-gray-100";

export default function CreatePostModal({ userRole, onClose, onSuccess }: CreatePostModalProps) {
  const [form, setForm] = useState({
    title: '',
    content: '',
    type: userRole === 'teacher' ? 'class_message' : 'news',
    pinned: false,
    classId: '',
  });
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [images, setImages] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPin = userRole === 'director' || userRole === 'coordinator';
  const isTeacher = userRole === 'teacher';

  useEffect(() => {
    if (isTeacher) {
      api.get('/classes').then(r => setClasses(r.data)).catch(console.error);
    }
  }, [isTeacher]);

  const handleImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const combined = [...images, ...files].slice(0, 2);
    setImages(combined);
    setPreviews(combined.map(f => URL.createObjectURL(f)));
  };

  const removeImage = (index: number) => {
    const next = images.filter((_, i) => i !== index);
    setImages(next);
    setPreviews(next.map(f => URL.createObjectURL(f)));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isTeacher && !form.classId) {
      setError('Selecione a turma');
      return;
    }
    try {
      setSaving(true);
      setError('');
      const body: any = {
        title: form.title,
        content: form.content,
        type: form.type,
        pinned: canPin ? form.pinned : false,
      };
      if (form.classId) body.classId = Number(form.classId);

      const res = await api.post('/feed', body);
      const postId: number = res.data.id;

      if (images.length > 0) {
        const fd = new FormData();
        images.forEach(img => fd.append('images', img));
        await api.post(`/feed/${postId}/images`, fd);
      }

      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao publicar');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-[#1E3A5F] dark:text-white">Nova publicação</h2>
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
            placeholder="Escreva o conteúdo da publicação..."
            required
            rows={5}
            className={`${inputCls} resize-none`}
          />

          {/* Tipo — fixo para teacher */}
          {!isTeacher && (
            <select
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value })}
              className={inputCls}
            >
              <option value="news">Notícia</option>
              <option value="event">Evento</option>
              <option value="update">Atualização</option>
              <option value="class_message">Recado de Turma</option>
            </select>
          )}

          {/* Turma — obrigatório para teacher */}
          {isTeacher && (
            <select
              value={form.classId}
              onChange={e => setForm({ ...form, classId: e.target.value })}
              required
              className={inputCls}
            >
              <option value="">Selecione a turma *</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          )}

          {/* Fixar — só director/coordinator */}
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

          {/* Upload de imagens */}
          <div>
            <div className="flex items-center gap-3 mb-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={images.length >= 2}
                className="flex items-center gap-2 text-sm text-[#1E3A5F] dark:text-blue-400 border border-[#1E3A5F] dark:border-blue-400 px-3 py-2 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ImagePlus size={16} />
                Adicionar imagem {images.length > 0 && `(${images.length}/2)`}
              </button>
              <span className="text-xs text-gray-400 dark:text-gray-500">máx. 2 imagens</span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImages}
            />
            {previews.length > 0 && (
              <div className={`grid gap-2 ${previews.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
                {previews.map((src, i) => (
                  <div key={i} className="relative">
                    <img src={src} alt="" className="w-full h-36 object-cover rounded-xl" />
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

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
              {saving ? 'Publicando...' : 'Publicar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
