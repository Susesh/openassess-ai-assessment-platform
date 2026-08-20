"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/library", label: "Library" },
  { href: "/assess/1", label: "Assess" },
  { href: "/portfolio", label: "Portfolio" },
  { href: "/certificates", label: "Certificates" },
  { href: "/analytics", label: "Analytics" },
  { href: "/history", label: "History" },
  { href: "/employer", label: "Employer" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 min-w-[256px] h-screen bg-[#0B0F19] border-r border-gray-800 flex flex-col justify-between p-4 z-50 shrink-0 lg:block">
      <div className="mb-8">
        <p className="text-lg font-semibold text-white">OpenAssess</p>
        <p className="mt-1 text-sm text-slate-400">Continuous assessment studio</p>
      </div>
      <nav className="space-y-2">
        {links.map((link) => {
          const active = pathname.startsWith(link.href);
          return (
            <Link key={link.href} href={link.href} className={`flex items-center rounded-r-lg px-4 py-3 text-sm font-medium transition ${active ? "bg-cyan-500/10 text-cyan-400 border-r-2 border-cyan-400 font-medium" : "text-gray-400 hover:text-white hover:bg-gray-800/50"}`}>
              {link.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
