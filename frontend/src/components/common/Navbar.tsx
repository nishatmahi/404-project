"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ImageIcon, ListTodo, LogOut } from "lucide-react";

import { useAuthStore } from "@/store/auth-store";

const links = [
  { href: "/tasks", label: "Tasks", icon: ListTodo },
  { href: "/annotate", label: "Annotate", icon: ImageIcon },
];

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const logout = useAuthStore((state) => state.logout);

  return (
    <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/tasks" className="text-lg font-semibold text-slate-950">
          404 Project
        </Link>
        <nav className="flex items-center gap-2">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-950"
                }`}
              >
                <Icon size={17} aria-hidden="true" />
                {link.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="inline-flex h-10 items-center gap-2 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-rose-50 hover:text-rose-700"
          >
            <LogOut size={17} aria-hidden="true" />
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}
