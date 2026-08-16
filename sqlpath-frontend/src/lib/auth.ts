'use client';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('sqlpath_token');
}

export function getUser(): any | null {
  if (typeof window === 'undefined') return null;
  const u = localStorage.getItem('sqlpath_user');
  return u ? JSON.parse(u) : null;
}

export function saveAuth(token: string, user: any) {
  localStorage.setItem('sqlpath_token', token);
  localStorage.setItem('sqlpath_user', JSON.stringify(user));
}

export function clearAuth() {
  localStorage.removeItem('sqlpath_token');
  localStorage.removeItem('sqlpath_user');
}

export function isAuthenticated(): boolean {
  return !!getToken();
}
