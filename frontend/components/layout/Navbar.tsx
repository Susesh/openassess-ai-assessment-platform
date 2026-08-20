"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo } from "react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/dashboard/assessment", label: "Library" },
  { href: "/dashboard/portfolio", label: "Portfolio" },
  { href: "/dashboard/certificates", label: "Certificates" },
  { href: "/dashboard/analytics", label: "Analytics" },
  { href: "/dashboard/employer", label: "Employer Portal" },
];

export function Navbar() {
  const pathname = usePathname();
  const isLanding = pathname === "/";
  const navLinks = useMemo(() => links, []);

  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#0D1B2A] font-semibold text-white">OA</div>
          <div>
            <p className="font-semibold text-slate-900">OpenAssess</p>
            <p className="text-xs text-slate-500">Unlimited assessment</p>
          </div>
        </Link>
        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => {
            const active = pathname.startsWith(link.href);
            return (
              <Link key={link.href} href={link.href} className={`text-sm font-medium ${active ? "text-[#1A56DB]" : "text-slate-600 hover:text-slate-900"}`}>
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="flex items-center gap-3">
          {isLanding ? (
            <>
              <Link href="/login" className="hidden rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 sm:inline-flex">Sign in</Link>
              <Link href="/register" className="inline-flex rounded-full bg-[#1A56DB] px-4 py-2 text-sm font-semibold text-white">Get started</Link>
            </>
          ) : (
            <Link href="/login" className="inline-flex rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700">Login</Link>
          )}
        </div>
      </div>
    </header>
  );
}
