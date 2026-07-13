"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { UserPlus } from "lucide-react";

import { api } from "@/lib/api";
import { useAuthStore } from "@/store/auth-store";

export default function RegisterPage() {
  const router = useRouter();
  const hydrate = useAuthStore((state) => state.hydrate);
  const accessToken = useAuthStore((state) => state.accessToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Hydrate auth state on mount
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // If already logged in, redirect to home
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
      await api.post("/auth/register/", {
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      });
      // Registration successful — send to login with email pre-filled
      router.replace(`/login?email=${encodeURIComponent(email)}`);
    } catch (err: unknown) {
      // Try to show a specific error from the backend
      const anyErr = err as { response?: { data?: Record<string, string[]> } };
      const data = anyErr?.response?.data;
      if (data) {
        const firstMsg = Object.values(data).flat()[0];
        if (firstMsg) {
          setError(firstMsg);
          return;
        }
      }
      setError("Could not create account. Please check the details and try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-screen grid-cols-1 bg-slate-950 lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left hero panel */}
      <section className="flex min-h-[42vh] items-end bg-[linear-gradient(135deg,#0f766e_0%,#111827_55%,#7c2d12_100%)] p-8 text-white lg:min-h-screen lg:p-12">
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-cyan-100">
            404 Project Not Found
          </p>
          <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
            Create your workspace account.
          </h1>
          <p className="mt-5 max-w-lg text-base leading-7 text-slate-200">
            Register once, then use your email and password to log in any time.
          </p>
        </div>
      </section>

      {/* Right form panel */}
      <section className="flex items-center justify-center bg-[#f6f4ef] px-4 py-10">
        <form
          onSubmit={handleSubmit}
          className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
        >
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-teal-700 text-white">
              <UserPlus size={20} aria-hidden="true" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-slate-950">Create account</h2>
              <p className="text-sm text-slate-500">Fill in the details below.</p>
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700">
            Email
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
              required
              autoComplete="email"
            />
          </label>

          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-700">
              First name
              <input
                id="register-first-name"
                type="text"
                value={firstName}
                onChange={(event) => setFirstName(event.target.value)}
                placeholder="Jane"
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
                autoComplete="given-name"
              />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Last name
              <input
                id="register-last-name"
                type="text"
                value={lastName}
                onChange={(event) => setLastName(event.target.value)}
                placeholder="Doe"
                className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
                autoComplete="family-name"
              />
            </label>
          </div>

          <label className="mt-4 block text-sm font-medium text-slate-700">
            Password
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              className="mt-2 h-11 w-full rounded-md border border-slate-200 px-3 outline-none focus:border-teal-600"
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>

          {error ? (
            <p className="mt-4 rounded-md bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
          ) : null}

          <button
            id="register-submit"
            type="submit"
            disabled={isSubmitting}
            className="mt-6 h-11 w-full rounded-md bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:opacity-60"
          >
            {isSubmitting ? "Creating account..." : "Create account"}
          </button>

          <p className="mt-4 text-sm text-slate-600">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-teal-700 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </section>
    </main>
  );
}