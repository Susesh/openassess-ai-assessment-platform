"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { BrandLogo } from "@/components/brand-logo";
import {
  IconBookOpen,
  IconBuilding,
  IconCalendar,
  IconCertificate,
  IconChartBar,
  IconClipboard,
  IconDashboard,
  IconPortfolio,
  IconSettings,
  IconShield,
  IconSparkles,
  IconVideo,
} from "@/components/icons";
import { useAuth } from "@/contexts/auth-context";
import { getInitials } from "@/lib/auth";

type NavItem = {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
};

const studentNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { label: "Assessments", href: "/dashboard/assessment", icon: IconClipboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: IconChartBar },
  { label: "Certificates", href: "/dashboard/certificates", icon: IconCertificate },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: IconPortfolio },
  { label: "Adaptive", href: "/dashboard/adaptive", icon: IconSparkles },
  { label: "Remediation", href: "/dashboard/remediation", icon: IconBookOpen },
  { label: "Tutors", href: "/dashboard/tutors", icon: IconCalendar },
  { label: "Video Recordings", href: "/dashboard/recordings", icon: IconVideo },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

const adminNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { label: "Admin Panel", href: "/dashboard/admin", icon: IconShield },
  { label: "Question Papers", href: "/dashboard/admin/exam-criteria", icon: IconClipboard },
  { label: "Assessments", href: "/dashboard/assessment", icon: IconClipboard },
  { label: "Analytics", href: "/dashboard/analytics", icon: IconChartBar },
  { label: "Certificates", href: "/dashboard/certificates", icon: IconCertificate },
  { label: "Proctoring", href: "/dashboard/proctoring", icon: IconShield },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

const employerNavItems: NavItem[] = [
  { label: "Employer Portal", href: "/employer", icon: IconBuilding },
  { label: "Create Test", href: "/employer/tests/new", icon: IconClipboard },
  { label: "Proctoring Sessions", href: "/employer/proctoring", icon: IconShield },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

const tutorNavItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: IconDashboard },
  { label: "My Sessions", href: "/dashboard/tutors", icon: IconCalendar },
  { label: "Settings", href: "/dashboard/settings", icon: IconSettings },
];

const ROLE_BADGE: Record<string, { label: string; color: string }> = {
  student: { label: "Student", color: "bg-[#F5F6F7]/10 text-[#F5F6F7] border border-[#C1C4C8]/30" },
  tutor: { label: "Tutor", color: "bg-[#F5F6F7]/10 text-[#F5F6F7] border border-[#C1C4C8]/30" },
  employer: { label: "Employer", color: "bg-[#F5F6F7]/10 text-[#F5F6F7] border border-[#C1C4C8]/30" },
  university: { label: "University", color: "bg-[#F5F6F7]/10 text-[#F5F6F7] border border-[#C1C4C8]/30" },
  admin: { label: "Admin", color: "bg-[#F5F6F7]/10 text-[#F5F6F7] border border-[#C1C4C8]/30" },
};

function NavLinks({
  items,
  onNavigate,
}: {
  items: NavItem[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1 px-3" aria-label="Main navigation">
      {items.map((item) => {
        const isActive =
          item.href === "/dashboard"
            ? pathname === "/dashboard"
            : pathname.startsWith(item.href);
        const Icon = item.icon;

        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
              isActive
                ? "bg-[#F5F6F7]/10 text-[#F5F6F7] font-semibold border-l-2 border-[#F5F6F7]"
                : "text-[#7B7F85] hover:bg-[#F5F6F7]/5 hover:text-[#F5F6F7]"
            }`}
          >
            <Icon
              className={`h-5 w-5 shrink-0 ${isActive ? "text-[#F5F6F7]" : "text-[#7B7F85]"}`}
            />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function DashboardSidebar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();

  const initials = user ? getInitials(user.full_name) : "?";
  const firstName = user?.full_name.split(" ")[0] ?? "Student";
  const role = user?.role ?? "student";
  const roleBadge = ROLE_BADGE[role] ?? ROLE_BADGE.student;

  const navItems =
    role === "admin"
      ? adminNavItems
      : role === "employer"
        ? employerNavItems
        : role === "tutor"
          ? tutorNavItems
          : studentNavItems;

  return (
    <>
      <div className="flex items-center justify-between border-b border-[#C1C4C8]/20 bg-[#2B2E33] px-4 py-3 lg:hidden">
        <BrandLogo href="/dashboard" subtitle="Portal" dark />
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg border border-[#C1C4C8]/30 bg-[#2B2E33] px-3 py-2 text-sm font-medium text-[#7B7F85] hover:text-[#F5F6F7]"
          aria-label="Open navigation menu"
        >
          Menu
        </button>
      </div>

      {mobileOpen && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-[#2B2E33]/60 backdrop-blur-sm lg:hidden"
          aria-label="Close navigation menu"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 flex-col border-r border-[#C1C4C8]/20 bg-[#2B2E33] transition-transform duration-200 lg:sticky lg:top-0 lg:z-auto lg:h-screen lg:translate-x-0 ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="hidden border-b border-[#C1C4C8]/20 px-5 py-6 lg:block">
          <BrandLogo href="/dashboard" subtitle="Portal" dark />
        </div>

        <div className="flex items-center justify-between border-b border-[#C1C4C8]/20 px-4 py-4 lg:hidden">
          <span className="text-sm font-semibold text-[#F5F6F7]">Menu</span>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="rounded-lg px-2 py-1 text-sm text-[#7B7F85] hover:text-[#F5F6F7]"
            aria-label="Close menu"
          >
            Close
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-5">
          <NavLinks items={navItems} onNavigate={() => setMobileOpen(false)} />
        </div>

        <div className="border-t border-[#C1C4C8]/20 p-4">
          <div className="flex items-center gap-3 rounded-xl border border-[#C1C4C8]/20 bg-[#2B2E33] p-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#F5F6F7]/10 text-sm font-semibold text-[#F5F6F7]">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#F5F6F7]">{firstName}</p>
              <span
                className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${roleBadge.color}`}
              >
                {roleBadge.label}
              </span>
            </div>
            <button
              type="button"
              onClick={logout}
              className="shrink-0 rounded-lg border border-[#C1C4C8]/30 bg-[#2B2E33] px-2 py-1.5 text-xs font-medium text-[#7B7F85] hover:bg-[#F5F6F7]/10 hover:text-[#F5F6F7]"
              aria-label="Sign out"
            >
              Exit
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

