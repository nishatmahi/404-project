"use client";

import { create } from "zustand";

import { api } from "@/lib/api";
import type { User } from "@/types";

type AuthState = {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  isHydrated: boolean;
  hydrate: () => Promise<void>;
  login: (email: string, password: string) => Promise<User>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  refreshToken: null,
  user: null,
  isHydrated: false,

  hydrate: () => {
    if (typeof window === "undefined") {
      return Promise.resolve();
    }

    const accessToken = window.localStorage.getItem("accessToken");
    const refreshToken = window.localStorage.getItem("refreshToken");
    const storedUser = window.localStorage.getItem("user");

    set({
      accessToken,
      refreshToken,
      user: storedUser ? (JSON.parse(storedUser) as User) : null,
      isHydrated: false,
    });

    return api
      .get<User>("/auth/me/")
      .then((response) => {
        window.localStorage.setItem("user", JSON.stringify(response.data));
        set({ user: response.data, isHydrated: true });
      })
      .catch(() => {
        window.localStorage.removeItem("accessToken");
        window.localStorage.removeItem("refreshToken");
        window.localStorage.removeItem("user");
        set({ accessToken: null, refreshToken: null, user: null, isHydrated: true });
      });
  },

  login: async (email, password) => {
    const response = await api.post("/auth/login/", { email, password });
    const { access, refresh, user } = response.data;

    window.localStorage.setItem("accessToken", access);
    window.localStorage.setItem("refreshToken", refresh);
    window.localStorage.setItem("user", JSON.stringify(user));
    set({ accessToken: access, refreshToken: refresh, user });
    return user;
  },

  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("accessToken");
      window.localStorage.removeItem("refreshToken");
      window.localStorage.removeItem("user");
    }
    set({ accessToken: null, refreshToken: null, user: null });
  },
}));
