'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser, clearAuth } from '../../lib/auth';
import api from '../../lib/api';
import { Newspaper, Plus, LogOut } from 'lucide-react';
import FeedCard, { FeedPost } from '../../../components/feed/feed-card';
import CreatePostModal from '../../../components/feed/create-post-modal';
import EditPostModal from '../../../components/feed/edit-post-modal';

const TYPE_FILTERS = [
  { value: '', label: 'Todos' },
  { value: 'global', label: 'Escola' },
  { value: 'class_message', label: 'Turmas' },
];

export default function FeedPage() {
  const router = useRouter();
  const user = getUser();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editPost, setEditPost] = useState<FeedPost | null>(null);

  const canPost = user?.role !== 'student';

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    loadFeed(1, true);
  }, [typeFilter]);

  const loadFeed = async (p: number, reset = false) => {
    try {
      reset ? setLoading(true) : setLoadingMore(true);
      const params = new URLSearchParams({ page: String(p), limit: '20' });
      if (typeFilter) params.set('type', typeFilter);
      const res = await api.get(`/feed?${params}`);
      const data: FeedPost[] = res.data.data ?? res.data;
      const total: number = res.data.total ?? data.length;
      setPosts(prev => reset ? data : [...prev, ...data]);
      setPage(p);
      setHasMore((reset ? data.length : posts.length + data.length) < total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta publicação?')) return;
    try {
      await api.delete(`/feed/${id}`);
      setPosts(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleSuccess = () => {
    setShowCreate(false);
    setEditPost(null);
    loadFeed(1, true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#1E3A5F] dark:border-white border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-gray-950">

      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
              <Newspaper size={18} className="text-[#1E3A5F] dark:text-white" />
            </button>
            <h1 className="font-bold text-[#1E3A5F] dark:text-white">Feed de Notícias</h1>
          </div>
          <div className="flex items-center gap-3">
            {canPost && (
              <button
                onClick={() => setShowCreate(true)}
                className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
              >
                <Plus size={16} />
                <span className="hidden sm:inline">Novo Post</span>
              </button>
            )}
            <button
              onClick={() => { clearAuth(); router.push('/login'); }}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">

        {/* Filtros por tipo */}
        <div className="flex gap-1.5 mb-6 flex-wrap">
          {TYPE_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                typeFilter === f.value
                  ? 'bg-[#1E3A5F] text-white'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Lista de posts */}
        {posts.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-12 text-center">
            <Newspaper size={40} className="text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">Nenhuma publicação ainda</p>
            {canPost && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 text-sm text-[#F97316] hover:underline"
              >
                Criar primeira publicação
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <FeedCard
                key={post.id}
                post={post}
                currentUserId={user!.id}
                currentUserRole={user!.role}
                onEdit={setEditPost}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}

        {/* Carregar mais */}
        {hasMore && (
          <div className="mt-6 text-center">
            <button
              onClick={() => loadFeed(page + 1)}
              disabled={loadingMore}
              className="px-6 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {loadingMore ? 'Carregando...' : 'Carregar mais'}
            </button>
          </div>
        )}

      </main>

      {/* Modais */}
      {showCreate && user && (
        <CreatePostModal
          userRole={user.role}
          onClose={() => setShowCreate(false)}
          onSuccess={handleSuccess}
        />
      )}

      {editPost && user && (
        <EditPostModal
          post={editPost}
          currentUserRole={user.role}
          onClose={() => setEditPost(null)}
          onSuccess={handleSuccess}
        />
      )}
    </div>
  );
}
