"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/auth-store";

export default function RootPage() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!isHydrated) return;
    if (accessToken) {
      router.replace("/home");
    } else {
      router.replace("/login");
    }
  }, [isHydrated, accessToken, router]);

  return (
    <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
      <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Loading workspace…</p>
    </main>
  );
}
