"use client";

import { AuthGuard } from "@/components/auth-guard";
import { DashboardSidebar } from "@/app/dashboard/_components/sidebar";

export default function EmployerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen bg-[#F5F6F7] text-[#2B2E33] overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

