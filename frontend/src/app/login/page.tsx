"use client";

import { FormEvent, Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LockKeyhole } from "lucide-react";
import Link from "next/link";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], style: ["italic"] });

import { useAuthStore } from "@/store/auth-store";

// ── Inner component (uses useSearchParams — must be inside Suspense) ──────────

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const login = useAuthStore((state) => state.login);
  const hydrate = useAuthStore((state) => state.hydrate);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate auth state from localStorage on mount
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // If already logged in, go straight to home
  useEffect(() => {
    if (isHydrated && accessToken) {
      router.replace("/home");
    }
  }, [isHydrated, accessToken, router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.replace("/home");
    } catch {
      setError("Incorrect email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      autoComplete="off"
      className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="mb-7 flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-md bg-teal-700 text-white">
          <LockKeyhole size={20} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Sign in</h2>
          <p className="text-sm text-slate-500">Enter your email and password.</p>
        </div>
      </div>

      <label className="block text-sm font-medium text-slate-700">
        Email
        <input
          id="login-email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
          required
          autoComplete="off"
        />
      </label>

      <label className="mt-4 block text-sm font-medium text-slate-700">
        Password
        <input
          id="login-password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Your password"
          className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
          required
          autoComplete="new-password"
        />
      </label>

      {error ? (
        <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      <button
        id="login-submit"
        type="submit"
        disabled={isSubmitting}
        className="mt-6 h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
      >
        {isSubmitting ? "Signing in..." : "Sign in"}
      </button>

      <p className="mt-4 text-sm text-slate-600">
        New here?{" "}
        <Link href="/register" className="font-semibold text-teal-700 hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}

// ── Page export (wraps LoginForm in Suspense, required by Next.js) ────────────

export default function LoginPage() {
  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left hero panel */}
      <section className="animate-gradient flex min-h-[42vh] items-end bg-[linear-gradient(135deg,#0f766e_0%,#111827_55%,#7c2d12_100%)] p-8 text-white lg:min-h-screen lg:p-12">
        <div className="max-w-xl">
          <style>{`
            @keyframes slideDownFade {
              from { transform: translateY(-100vh); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes slideUpFade {
              from { transform: translateY(30px); opacity: 0; }
              to { transform: translateY(0); opacity: 1; }
            }
            @keyframes gradientMove {
              0% { background-position: 0% 50%; }
              50% { background-position: 100% 50%; }
              100% { background-position: 0% 50%; }
            }
            .animate-text-1 { animation: slideDownFade 0.8s ease-out forwards; }
            .animate-text-2 { animation: slideUpFade 0.8s ease-out 0.2s forwards; opacity: 0; }
            .animate-gradient {
              background-size: 200% 200%;
              animation: gradientMove 15s ease infinite;
            }
          `}</style>

          <h1 className={`animate-text-1 mb-4 text-4xl font-bold uppercase tracking-[0.15em] text-cyan-100 sm:text-5xl ${playfair.className}`}>
            404 Project Not Found
          </h1>
          <p className="animate-text-2 text-lg font-medium leading-relaxed text-slate-200 sm:text-xl">
            Tasks and annotation in one focused workspace.
          </p>
        </div>
      </section>

      {/* Right form panel — Suspense required because LoginForm uses useSearchParams */}
      <section className="flex items-center justify-center bg-[#f6f4ef] px-4 py-10">
        <Suspense fallback={<div className="h-11 w-full max-w-md animate-pulse rounded-lg bg-slate-200" />}>
          <LoginForm />
        </Suspense>
      </section>
    </main>
  );
}
