// src/store/authStore.ts
import { create } from 'zustand';
import { UserSession } from '../types/api';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  currentUser: UserSession | null;
  isAuthenticated: boolean;
  setAuth: (accessToken: string, refreshToken: string, user?: Partial<UserSession>) => void;
  clearAuth: () => void;
}

const initialToken = localStorage.getItem('wt_access_token');
const initialRefresh = localStorage.getItem('wt_refresh_token');
const storedUserJson = localStorage.getItem('wt_user_session');
let initialUser: UserSession | null = null;
if (storedUserJson) {
  try {
    initialUser = JSON.parse(storedUserJson);
  } catch {
    initialUser = null;
  }
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: initialToken,
  refreshToken: initialRefresh,
  currentUser: initialUser,
  isAuthenticated: Boolean(initialToken),

  setAuth: (accessToken, refreshToken, user) => {
    localStorage.setItem('wt_access_token', accessToken);
    localStorage.setItem('wt_refresh_token', refreshToken);
    set((state) => {
      const updatedUser = user
        ? ({ ...state.currentUser, ...user } as UserSession)
        : state.currentUser;
      if (updatedUser) {
        localStorage.setItem('wt_user_session', JSON.stringify(updatedUser));
      }
      return {
        accessToken,
        refreshToken,
        isAuthenticated: true,
        currentUser: updatedUser,
      };
    });
  },

  clearAuth: () => {
    localStorage.removeItem('wt_access_token');
    localStorage.removeItem('wt_refresh_token');
    localStorage.removeItem('wt_user_session');
    set({
      accessToken: null,
      refreshToken: null,
      currentUser: null,
      isAuthenticated: false,
    });
  },
}));

