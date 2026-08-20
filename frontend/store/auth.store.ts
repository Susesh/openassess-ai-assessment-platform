import { create } from "zustand";
import type { User } from "@/types/user.types";

type AuthState = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  setUser: (user: User | null) => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== "undefined" ? window.localStorage.getItem("openassess_token") : null,
  isAuthenticated: Boolean(typeof window !== "undefined" && window.localStorage.getItem("openassess_token")),
  login: (user, token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("openassess_token", token);
    }
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("openassess_token");
    }
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
}));
