import type { User } from '../types';
import type { StateCreator } from 'zustand';

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
  setAuthLoading: (loading: boolean) => void;
  clearAuth: () => void;
};

export const createAuthSlice: StateCreator<AuthState> = (set, get) => ({
  user: null,
  isAuthenticated: false,
  isAuthLoading: false,
  setUser: (user: AuthState['user']) => {
    const currentUser = get().user;
    if (currentUser !== user) {
      set({ user });
    }
  },
  setIsAuthenticated: (isAuthenticated) => {
    const currentAuth = get().isAuthenticated;
    if (currentAuth !== isAuthenticated) {
      set({ isAuthenticated });
    }
  },
  setAuthLoading: (isAuthLoading) => {
    const currentLoading = get().isAuthLoading;
    if (currentLoading !== isAuthLoading) {
      set({ isAuthLoading });
    }
  },
  clearAuth: () => set({ user: null, isAuthenticated: false, isAuthLoading: false }),
});
