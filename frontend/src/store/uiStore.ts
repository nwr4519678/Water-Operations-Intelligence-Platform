// src/store/uiStore.ts
import { create } from 'zustand';
import { ToastItem } from '../types/ui';

interface UiState {
  globalSearchOpen: boolean;
  setGlobalSearchOpen: (open: boolean) => void;
  activeDrawerId: string | null;
  setActiveDrawerId: (id: string | null) => void;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id' | 'timestamp'>) => void;
  removeToast: (id: string) => void;
  mapLanguage: 'en' | 'ar';
  setMapLanguage: (lang: 'en' | 'ar') => void;
}

export const useUiStore = create<UiState>((set) => ({
  globalSearchOpen: false,
  setGlobalSearchOpen: (open) => set({ globalSearchOpen: open }),
  activeDrawerId: null,
  setActiveDrawerId: (id) => set({ activeDrawerId: id }),
  toasts: [],
  addToast: (t) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newToast: ToastItem = {
      ...t,
      id,
      timestamp: new Date().toISOString()
    };
    set((state) => ({ toasts: [...state.toasts, newToast] }));

    setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((item) => item.id !== id) }));
    }, t.duration || 5000);
  },
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
  mapLanguage: 'en',
  setMapLanguage: (lang) => set({ mapLanguage: lang })
}));
