"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ImageIcon, ListTodo, LogOut } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";

export default function HomePage() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const logout = useAuthStore((state) => state.logout);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const user = useAuthStore((state) => state.user);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // If not logged in after hydration, send to login
  useEffect(() => {
    if (isHydrated && !accessToken) {
      router.replace("/login");
    }
  }, [isHydrated, accessToken, router]);

  // Show nothing while checking auth
  if (!isHydrated || !accessToken) {
    return (
      <main className="grid min-h-screen place-items-center bg-slate-950 text-slate-100">
        <p className="text-sm uppercase tracking-[0.2em] text-cyan-200">Loading...</p>
      </main>
    );
  }

  const displayName = user?.first_name || user?.email || "there";

  return (
    <main className="min-h-screen bg-[#f6f4ef]">
      {/* Top bar */}
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center justify-between px-4 sm:px-6">
          <span className="text-lg font-semibold text-slate-950">404 Project</span>
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="inline-flex h-9 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700 transition"
          >
            <LogOut size={16} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </header>

      {/* Hero greeting */}
      <section className="mx-auto max-w-5xl px-4 py-14 sm:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">
          Welcome back
        </p>
        <h1 className="mt-2 text-4xl font-semibold text-slate-950">
          Hello, {displayName} 👋
        </h1>
        <p className="mt-3 text-base text-slate-500">
          Where would you like to go today?
        </p>

        {/* App cards */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {/* Tasks card */}
          <Link
            href="/tasks"
            id="nav-tasks"
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-teal-500 hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-teal-50 text-teal-700 transition group-hover:bg-teal-700 group-hover:text-white">
              <ListTodo size={24} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">Tasks</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Manage your daily Kanban board. Add tasks, drag them between columns, filter by date, and stay organised.
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-teal-700 transition group-hover:gap-2">
              Open Tasks →
            </span>
          </Link>

          {/* Annotator card */}
          <Link
            href="/annotate"
            id="nav-annotate"
            className="group flex flex-col rounded-xl border border-slate-200 bg-white p-7 shadow-sm transition hover:border-violet-500 hover:shadow-md"
          >
            <div className="grid h-12 w-12 place-items-center rounded-lg bg-violet-50 text-violet-700 transition group-hover:bg-violet-700 group-hover:text-white">
              <ImageIcon size={24} aria-hidden="true" />
            </div>
            <h2 className="mt-5 text-xl font-semibold text-slate-950">Annotator</h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Upload images, scroll through your gallery, and draw polygon annotations. Saved automatically to the backend.
            </p>
            <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-violet-700 transition group-hover:gap-2">
              Open Annotator →
            </span>
          </Link>
        </div>
      </section>
    </main>
  );
}
