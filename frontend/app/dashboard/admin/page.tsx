"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Badge, Button, Card, PageHeader, SkeletonCard } from "@/components/ui";
import { adminGetTopics, adminGetUsers, adminPromoteUser } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import type { AdminTopicEntry, AdminUser } from "@/lib/types";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [topics, setTopics] = useState<AdminTopicEntry[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"users" | "topics">("users");
  const [promotingId, setPromotingId] = useState<number | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") return;

    Promise.all([adminGetUsers(), adminGetTopics()])
      .then(([u, t]) => {
        setUsers(u.users);
        setTotalUsers(u.total);
        setTopics(t.topics);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [user]);

  async function handlePromote(userId: number) {
    setPromotingId(userId);
    try {
      await adminPromoteUser(userId);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: "admin" } : u))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to promote user");
    } finally {
      setPromotingId(null);
    }
  }

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <span className="text-5xl">🔒</span>
        <h2 className="mt-4 text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-500">This page is only accessible to administrators.</p>
      </div>
    );
  }

  const roleBreakdown = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="mx-auto max-w-6xl animate-fade-in-up space-y-8">
      <PageHeader
        title="Admin Dashboard"
        description="Manage users, topics, certificates, and platform configuration."
      />

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      )}

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-2xl font-bold text-slate-900">{totalUsers}</p>
          <p className="mt-1 text-sm text-slate-500">Total Users</p>
        </div>
        {Object.entries(roleBreakdown).map(([role, count]) => (
          <div key={role} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-2xl font-bold text-slate-900">{count}</p>
            <p className="mt-1 text-sm capitalize text-slate-500">{role}s</p>
          </div>
        ))}
        <div className="rounded-2xl border border-indigo-200 bg-indigo-50 p-5 shadow-sm">
          <p className="text-2xl font-bold text-indigo-700">{topics.length}</p>
          <p className="mt-1 text-sm text-indigo-600">Topics</p>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "View Analytics", href: "/dashboard/analytics", icon: "📊" },
          { label: "Proctoring Logs", href: "/dashboard/admin/proctoring", icon: "🛡️" },
          { label: "All Certificates", href: "/dashboard/certificates", icon: "🏆" },
          { label: "System Settings", href: "/dashboard/settings", icon: "⚙️" },
        ].map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50/40"
          >
            <span className="text-2xl">{link.icon}</span>
            <span className="text-sm font-medium text-slate-700">{link.label}</span>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(["users", "topics"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {tab === "users" ? `Users (${totalUsers})` : `Topics (${topics.length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} lines={1} />)}
        </div>
      ) : activeTab === "users" ? (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Role</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{u.full_name}</td>
                  <td className="px-5 py-3 text-slate-600">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${
                        u.role === "admin"
                          ? "bg-slate-200 text-slate-700"
                          : u.role === "student"
                            ? "bg-indigo-100 text-indigo-700"
                            : u.role === "tutor"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        u.is_active ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"
                      }`}
                    >
                      {u.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3">
                    {u.role !== "admin" && (
                      <button
                        type="button"
                        onClick={() => handlePromote(u.id)}
                        disabled={promotingId === u.id}
                        className="rounded-lg bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200 disabled:opacity-50"
                      >
                        {promotingId === u.id ? "…" : "Make Admin"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-5 py-3">Topic</th>
                <th className="px-5 py-3">Subject</th>
                <th className="px-5 py-3">Questions</th>
                <th className="px-5 py-3">Duration</th>
                <th className="px-5 py-3">Pass Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {topics.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/50">
                  <td className="px-5 py-3 font-medium text-slate-900">{t.name}</td>
                  <td className="px-5 py-3 text-slate-600">{t.subject ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">{t.total_questions ?? "—"}</td>
                  <td className="px-5 py-3 text-slate-600">
                    {t.duration ? `${t.duration} min` : "—"}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {t.passing_score ? `${t.passing_score}%` : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
