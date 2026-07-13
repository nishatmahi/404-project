"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuthStore } from "@/store/auth-store";

type ProtectedRouteProps = {
  children: React.ReactNode;
  requireStaff?: boolean;
};

export function ProtectedRoute({ children, requireStaff = false }: ProtectedRouteProps) {
  const router = useRouter();
  const accessToken = useAuthStore((state) => state.accessToken);
  const user = useAuthStore((state) => state.user);
  const hydrate = useAuthStore((state) => state.hydrate);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.replace("/login");
      return;
    }

    if (isHydrated && accessToken && requireStaff && !user?.is_staff) {
      router.replace("/tasks");
    }
  }, [accessToken, isHydrated, requireStaff, router, user]);

  if (!isHydrated || !accessToken || (requireStaff && !user?.is_staff)) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">
          Checking access
        </p>
      </main>
    );
  }

  return <>{children}</>;
}
