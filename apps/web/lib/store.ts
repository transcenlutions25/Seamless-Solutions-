import { create } from 'zustand';

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
  };
}

interface AppState {
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
