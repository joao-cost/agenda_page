import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { User } from "../types";
import { fetchCurrentUser, login as loginRequest, register as registerRequest } from "../api/auth";

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;
  login: (credentials: { login: string; password: string }) => Promise<void>;
  register: (payload: {
    name: string;
    phone: string;
    vehicle: string;
    email: string;
    password: string;
  }) => Promise<void>;
  logout: () => void;
  checkSession: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>()(
  devtools((set) => ({
    user: null,
    isAuthenticated: false,
    loading: false,
    error: null,
    initialized: false,
    setUser(user) {
      set({ user, isAuthenticated: !!user, initialized: true });
    },
    async login(credentials) {
      set({ loading: true, error: null });
      try {
        const { token, user } = await loginRequest(credentials);
        localStorage.setItem("lavacar:token", token);
        set({ user, isAuthenticated: true, loading: false, initialized: true });
      } catch (error) {
        console.error(error);
        set({
          error: "Não foi possível entrar. Verifique suas credenciais.",
          loading: false,
          initialized: true
        });
        throw error;
      }
    },
    async register(payload) {
      set({ loading: true, error: null });
      try {
        const { token, user } = await registerRequest(payload);
        localStorage.setItem("lavacar:token", token);
        set({ user, isAuthenticated: true, loading: false, initialized: true });
      } catch (error) {
        console.error(error);
        set({
          error: "Não foi possível registrar. Tente novamente.",
          loading: false,
          initialized: true
        });
        throw error;
      }
    },
    logout() {
      localStorage.removeItem("lavacar:token");
      set({ user: null, isAuthenticated: false, initialized: true });
    },
    async checkSession() {
      set({ loading: true });
      const token = localStorage.getItem("lavacar:token");
      if (!token) {
        set({ user: null, isAuthenticated: false, initialized: true, loading: false });
        return;
      }
      try {
        const user = await fetchCurrentUser();
        set({ user, isAuthenticated: true, initialized: true, loading: false });
      } catch (error) {
        console.warn("Sessão expirada", error);
        localStorage.removeItem("lavacar:token");
        set({ user: null, isAuthenticated: false, initialized: true, loading: false });
      }
    }
  }))
);

