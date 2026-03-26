'use client';

import { Pencil, Trash2, Pin } from 'lucide-react';

export interface FeedPost {
  id: string;
  title: string;
  content: string;
  type: 'global' | 'class_message';
  pinned: boolean;
  images?: string[];
  authorId: number;
  author?: { id: number; name: string; role: string } | null;
  schoolClass?: { name: string };
  createdAt: string;
}

interface FeedCardProps {
  post: FeedPost;
  currentUserId: number;
  currentUserRole: string;
  onEdit: (post: FeedPost) => void;
  onDelete: (id: string) => void;
}

const typeLabel: Record<string, string> = {
  global: 'Escola',
  class_message: 'Recado de Turma',
};

const typeColor: Record<string, string> = {
  global: 'bg-blue-50 dark:bg-blue-950 text-blue-700',
  class_message: 'bg-purple-50 dark:bg-purple-950 text-purple-700',
};

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'agora mesmo';
  if (diff < 3600) {
    const m = Math.floor(diff / 60);
    return `há ${m} minuto${m > 1 ? 's' : ''}`;
  }
  if (diff < 86400) {
    const h = Math.floor(diff / 3600);
    return `há ${h} hora${h > 1 ? 's' : ''}`;
  }
  if (diff < 604800) {
    const d = Math.floor(diff / 86400);
    return `há ${d} dia${d > 1 ? 's' : ''}`;
  }
  return new Date(dateStr).toLocaleDateString('pt-BR');
}

export default function FeedCard({ post, currentUserId, currentUserRole, onEdit, onDelete }: FeedCardProps) {
  const canEditDelete =
    post.author?.id === currentUserId ||
    post.authorId === currentUserId ||
    currentUserRole === 'director';

  const truncated =
    post.content.length > 300
      ? post.content.slice(0, 300) + '…'
      : post.content;

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-2xl border p-6 transition-shadow hover:shadow-sm ${post.pinned ? 'border-[#F97316]/40' : 'border-gray-100 dark:border-gray-800'}`}>

      {/* Topo: avatar + meta + ações */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 bg-[#1E3A5F] rounded-full flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-bold">
              {(post.author?.name ?? 'U').charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">{post.author?.name ?? 'Usuário'}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">{timeAgo(post.createdAt)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {post.pinned && (
            <span className="flex items-center gap-1 text-xs font-medium text-[#F97316] bg-orange-50 dark:bg-orange-950 px-2 py-0.5 rounded-full">
              <Pin size={11} />
              Fixado
            </span>
          )}
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${typeColor[post.type] ?? 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
            {typeLabel[post.type] ?? post.type}
          </span>
          {post.schoolClass && (
            <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-50 dark:bg-gray-800 px-2 py-0.5 rounded-full hidden sm:inline">
              {post.schoolClass.name}
            </span>
          )}
        </div>
      </div>

      {/* Título */}
      <h3 className="font-semibold text-[#1E3A5F] dark:text-white mb-2 leading-snug">{post.title}</h3>

      {/* Conteúdo truncado */}
      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-line">{truncated}</p>

      {/* Imagens */}
      {post.images && post.images.length > 0 && (
        <div className={`mt-4 grid gap-2 ${post.images.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {post.images.map((url, i) => (
            <img
              key={i}
              src={url}
              alt={`Imagem ${i + 1}`}
              className="w-full h-48 object-cover rounded-xl"
            />
          ))}
        </div>
      )}

      {/* Botões editar/deletar */}
      {canEditDelete && (
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-gray-50 dark:border-gray-800">
          <button
            onClick={() => onEdit(post)}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-[#1E3A5F] dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Pencil size={13} />
            Editar
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 px-3 py-1.5 rounded-lg transition-colors"
          >
            <Trash2 size={13} />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}
