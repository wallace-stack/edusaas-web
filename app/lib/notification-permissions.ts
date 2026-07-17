import type { User } from './auth';

export interface NotificationLike {
  type?: string;
  createdById?: number;
}

// Espelha a regra do backend (NotificationsService.assertCanModify), nesta ordem:
// 1) mensagem do sistema nunca pode ser tocada, por ninguém, nem diretor
// 2) autor sempre pode mexer no que criou, sem precisar de permissão
// 3) senão, exige a permissão moderar_avisos (DIRECTOR sempre tem via hasPermission)
export function canModifyNotification(
  n: NotificationLike,
  user: User | null,
  can: (key: string) => boolean,
): boolean {
  if (!user) return false;
  if (n.type === 'system_message') return false;
  if (n.createdById === user.id) return true;
  return can('moderar_avisos');
}
