import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './authStore';

export function AuthGuard({ children, loginPath = '/login' }: { children: ReactNode; loginPath?: string }) {
  return useAuth() ? children : <Navigate replace to={loginPath} />;
}
