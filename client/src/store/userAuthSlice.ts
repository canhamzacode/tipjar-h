import type { User } from '../types';
import type { StateCreator } from 'zustand';

export type AuthState = {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setIsAuthenticated: (isAuthenticated: boolean) => void;
};

export const createAuthSlice: StateCreator<AuthState> = (set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user: AuthState['user']) => set({ user }),
  setIsAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
});
