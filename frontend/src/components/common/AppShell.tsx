"use client";

import { Navbar } from "@/components/common/Navbar";
import { ProtectedRoute } from "@/components/common/ProtectedRoute";

type AppShellProps = {
  children: React.ReactNode;
  requireStaff?: boolean;
};

export function AppShell({ children, requireStaff = false }: AppShellProps) {
  return (
    <ProtectedRoute requireStaff={requireStaff}>
      <div className="min-h-screen bg-[#f6f4ef]">
        <Navbar />
        {children}
      </div>
    </ProtectedRoute>
  );
}
