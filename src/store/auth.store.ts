import { create } from "zustand";

export interface CurrentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  permissions: string[];
}

interface AuthState {
  user: CurrentUser | null;
  isLoading: boolean;
  setUser: (user: CurrentUser | null) => void;
  fetchCurrentUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  setUser: (user) => set({ user, isLoading: false }),

  fetchCurrentUser: async () => {
    set({ isLoading: true });
    try {
      const res = await fetch("/api/auth/me");
      if (!res.ok) {
        set({ user: null, isLoading: false });
        return;
      }
      const user = await res.json();
      set({ user, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  logout: async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    set({ user: null });
  },
}));