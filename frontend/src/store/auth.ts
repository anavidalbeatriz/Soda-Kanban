import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (user: User, accessToken: string, refreshToken: string) => void;
  clearAuth: () => void;
  loadFromStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: !!localStorage.getItem("access_token"),
  setAuth: (user, accessToken, refreshToken) => {
    localStorage.setItem("access_token", accessToken);
    localStorage.setItem("refresh_token", refreshToken);
    localStorage.setItem("user", JSON.stringify(user));
    set({ user, isAuthenticated: true });
  },
  clearAuth: () => {
    localStorage.clear();
    set({ user: null, isAuthenticated: false });
  },
  loadFromStorage: () => {
    const raw = localStorage.getItem("user");
    if (raw) {
      set({ user: JSON.parse(raw), isAuthenticated: !!localStorage.getItem("access_token") });
    }
  },
}));
