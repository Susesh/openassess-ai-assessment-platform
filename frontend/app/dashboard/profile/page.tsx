"use client";

import { FormEvent, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { updateProfile } from "@/lib/api";
import { ApiError } from "@/lib/api";
import { Card, PageHeader } from "@/components/ui";

const ROLE_LABELS: Record<string, { label: string; icon: string; color: string }> = {
  student: { label: "Student", icon: "🎓", color: "text-indigo-600 bg-indigo-50" },
  tutor: { label: "Tutor", icon: "📚", color: "text-emerald-600 bg-emerald-50" },
  employer: { label: "Employer", icon: "🏢", color: "text-amber-600 bg-amber-50" },
  university: { label: "University", icon: "🏛️", color: "text-violet-600 bg-violet-50" },
  admin: { label: "Admin", icon: "⚙️", color: "text-slate-600 bg-slate-100" },
};

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const role = user?.role ?? "student";
  const roleInfo = ROLE_LABELS[role] ?? ROLE_LABELS.student;

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (newPassword && newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    if (newPassword && newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }

    setSaving(true);
    try {
      const updates: { full_name?: string; current_password?: string; new_password?: string } = {};
      if (fullName && fullName !== user?.full_name) updates.full_name = fullName;
      if (newPassword) {
        updates.current_password = currentPassword;
        updates.new_password = newPassword;
      }

      if (Object.keys(updates).length === 0) {
        setError("No changes to save.");
        return;
      }

      await updateProfile(updates);
      await refreshUser();
      setSuccess("Profile updated successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update profile");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl animate-fade-in-up">
      <PageHeader title="My Profile" description="Manage your account details and password." />

      {/* Role badge */}
      <div className={`mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-sm font-semibold ${roleInfo.color}`}>
        <span>{roleInfo.icon}</span>
        <span>{roleInfo.label}</span>
      </div>

      <div className="space-y-6">
        {/* Account info */}
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-slate-900">Account Information</h2>
          <div className="mb-4 rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Email</p>
            <p className="mt-1 text-sm font-medium text-slate-700">{user?.email}</p>
            <p className="mt-0.5 text-xs text-slate-400">Email cannot be changed</p>
          </div>
          <div className="rounded-xl bg-slate-50 p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Member since</p>
            <p className="mt-1 text-sm font-medium text-slate-700">
              {user?.created_at
                ? new Date(user.created_at).toLocaleDateString("en-IN", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "—"}
            </p>
          </div>
        </Card>

        {/* Edit form */}
        <Card className="p-6">
          <h2 className="mb-5 text-base font-semibold text-slate-900">Edit Profile</h2>
          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <hr className="border-slate-100" />
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Change Password (optional)
            </p>

            <div>
              <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                Current Password
              </label>
              <input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="Required to change password"
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="newPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                  New Password
                </label>
                <input
                  id="newPassword"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 8 characters"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
              <div>
                <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-medium text-slate-700">
                  Confirm New Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repeat new password"
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
              </div>
            </div>

            {error && (
              <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
            )}
            {success && (
              <p className="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">✓ {success}</p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-indigo-600/25 transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </form>
        </Card>
      </div>
    </div>
  );
}
