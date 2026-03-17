import Cookies from 'js-cookie';

export interface User {
  id: number;
  name: string;
  email: string;
  role: 'director' | 'coordinator' | 'teacher' | 'student';
  schoolId: number;
}

export function getToken(): string | undefined {
  return Cookies.get('token');
}

export function getUser(): User | null {
  const user = Cookies.get('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  Cookies.set('token', token, { expires: 1 });
  Cookies.set('user', JSON.stringify(user), { expires: 1 });
}

export function clearAuth(): void {
  Cookies.remove('token');
  Cookies.remove('user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function getDashboardRoute(role: string): string {
  switch (role) {
    case 'director': return '/dashboard/diretor';
    case 'coordinator': return '/dashboard/coordenador';
    case 'teacher': return '/dashboard/professor';
    case 'student': return '/dashboard/aluno';
    default: return '/login';
  }
}