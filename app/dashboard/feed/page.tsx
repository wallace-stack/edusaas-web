'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '../../lib/auth';
import api from '../../lib/api';
import { Plus, Newspaper } from 'lucide-react';
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
      if (reset) {
        setPosts(data);
      } else {
        setPosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = data.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
      }
      setPage(p);
      setHasMore((p * 20) < total);
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
    setTimeout(() => {
      setPosts([]);
      loadFeed(1, true);
    }, 500);
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
          <button
            onClick={() => router.back()}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <img src="/logo.png" alt="Walladm" className="h-10 w-auto" />
          </button>

          <h1 className="font-semibold text-gray-600 dark:text-gray-300 text-sm">Feed de Notícias</h1>

          {canPost && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 bg-[#1E3A5F] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#162d4a] transition-colors"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Novo Post</span>
            </button>
          )}
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
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
              <Newspaper size={28} className="text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="font-medium text-lg text-gray-700 dark:text-gray-200 mb-1">Nenhuma publicação ainda</h3>
            <p className="text-sm text-gray-400 dark:text-gray-500 max-w-xs">
              Seja o primeiro a compartilhar algo com a escola.
            </p>
            {canPost && (
              <button
                onClick={() => setShowCreate(true)}
                className="mt-5 text-sm text-[#F97316] font-medium hover:underline"
              >
                Criar primeira publicação →
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
