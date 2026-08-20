import { AuthGuard } from "@/components/auth-guard";
import { DashboardSidebar } from "./_components/sidebar";
import { DuolingoGamificationBar } from "@/src/components/home/DuolingoGamificationBar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGuard>
      <div className="flex h-screen w-screen bg-[#F5F6F7] text-[#2B2E33] overflow-hidden">
        {/* 1. Docked Left Sidebar */}
        <DashboardSidebar />

        {/* 2. Main Scrollable Content Area */}
        <div className="flex-1 flex flex-col h-screen overflow-y-auto overflow-x-hidden">
          {/* Top Header / Gamification Bar */}
          <header className="sticky top-0 z-40 bg-[#F5F6F7]/90 backdrop-blur-md border-b border-[#C1C4C8] px-6 py-3 flex justify-between items-center">
            <DuolingoGamificationBar />
          </header>

          {/* Page Main Content */}
          <main className="flex-1 p-6 max-w-7xl w-full mx-auto">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}

