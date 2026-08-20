"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { updateProfile } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";
import { useTheme } from "@/contexts/theme-context";
import { useAIInsights } from "@/contexts/ai-insights-context";
import { User, Mail, Shield, Bell, Link2, CreditCard, Settings as SettingsIcon, CheckCircle, AlertTriangle, Lock, Key, Globe, Zap, Crown, Save, Brain, Sparkles, ShieldAlert, Workflow, Bot, Puzzle, Activity } from "lucide-react";

export default function SettingsPage() {
  const { user, refreshUser } = useAuth();
  const { actualTheme } = useTheme();
  const { insights, generateInsights } = useAIInsights();
  const [activeTab, setActiveTab] = useState<"profile" | "account" | "security" | "notifications" | "integrations" | "billing">("profile");

  // Profile
  const [fullName, setFullName] = useState(user?.full_name ?? "");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [securityLoading, setSecurityLoading] = useState(false);
  const [securitySuccess, setSecuritySuccess] = useState(false);
  const [securityError, setSecurityError] = useState<string | null>(null);
  const [showAIAssistant, setShowAIAssistant] = useState(true);
  const [showSecurityDashboard, setShowSecurityDashboard] = useState(false);
  const [showAutomationBuilder, setShowAutomationBuilder] = useState(false);

  useEffect(() => {
    if (user) setFullName(user.full_name);
  }, [user]);

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault();
    setProfileError(null);
    setProfileSuccess(false);
    setProfileLoading(true);
    try {
      await updateProfile({ full_name: fullName.trim() });
      await refreshUser();
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      setProfileError(err instanceof Error ? err.message : "Failed to update profile");
    } finally {
      setProfileLoading(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    setSecurityError(null);
    setSecuritySuccess(false);

    if (newPassword !== confirmNewPassword) {
      setSecurityError("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setSecurityError("New password must be at least 8 characters.");
      return;
    }

    setSecurityLoading(true);
    try {
      await updateProfile({
        current_password: currentPassword,
        new_password: newPassword,
      });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
      setSecuritySuccess(true);
      setTimeout(() => setSecuritySuccess(false), 3000);
    } catch (err) {
      setSecurityError(err instanceof Error ? err.message : "Failed to change password");
    } finally {
      setSecurityLoading(false);
    }
  }

  const tabs = [
    { id: "profile", label: "Profile" },
    { id: "account", label: "Account" },
    { id: "security", label: "Security" },
    { id: "notifications", label: "Notifications" },
    { id: "integrations", label: "Integrations" },
    { id: "billing", label: "Billing" },
  ] as const;

  return (
    <div className="min-h-screen space-y-6">
      {/* Hero Header */}
      <section className="rounded-[24px] border border-[#C1C4C8] bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="w-6 h-6 text-white/80" />
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-white/70">Settings</p>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
            Comprehensive Management
          </h1>
          <p className="text-lg text-white/90">
            Manage your profile, security, and notification preferences.
          </p>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#C1C4C8] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-bold transition border-b-2 -mb-px whitespace-nowrap ${
              activeTab === tab.id
                ? "border-[#2B2E33] text-[#2B2E33]"
                : "border-transparent text-[#7B7F85] hover:text-[#2B2E33]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* AI Assistant Section */}
      {showAIAssistant && (
        <motion.section
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-6">
            <Brain className="w-6 h-6 text-[#2B2E33]" />
            <div>
              <h2 className="text-xl font-bold text-[#2B2E33] tracking-tight">AI Settings Assistant</h2>
              <p className="text-sm text-[#7B7F85]">Get personalized help with your settings</p>
            </div>
          </div>
          
          <div className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] text-white">
                <Bot className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <p className="font-semibold text-[#2B2E33] mb-1">AI Assistant</p>
                <p className="text-sm text-[#7B7F85] mb-3">I can help you configure your settings, optimize your preferences, and answer questions about your account.</p>
                <button className="px-4 py-2 rounded-lg bg-[#2B2E33] text-white text-sm font-semibold hover:bg-[#7B7F85] transition">
                  Start Chat
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {activeTab === "profile" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-5">
            <User className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">Profile Information</h2>
          </div>

          {/* Avatar */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#2B2E33] to-[#7B7F85] text-2xl font-bold text-white shadow-lg">
              {user?.full_name?.slice(0, 2).toUpperCase() ?? "VS"}
            </div>
            <div>
              <p className="font-bold text-[#2B2E33] tracking-tight">{user?.full_name}</p>
              <p className="text-sm text-[#7B7F85]">{user?.email}</p>
              <span className="mt-1 inline-block rounded-full bg-[#2B7F85]/10 border border-[#C1C4C8] px-3 py-1 text-xs font-semibold capitalize text-[#2B2E33]">
                {user?.role}
              </span>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label htmlFor="fullName" className="mb-1.5 block text-sm font-semibold text-[#2B2E33]">
                Full Name
              </label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full bg-[#F5F6F7] border border-[#C1C4C8] text-[#2B2E33] placeholder-[#7B7F85] rounded-xl px-4 py-3 focus:outline-none focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/20 transition-all"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-semibold text-[#2B2E33]">
                Email address
              </label>
              <Input
                type="email"
                value={user?.email ?? ""}
                disabled
                className="w-full bg-[#C1C4C8]/30 border border-[#C1C4C8] text-[#7B7F85] placeholder-[#7B7F85] rounded-xl px-4 py-3 focus:outline-none transition-all opacity-60"
              />
              <p className="mt-1 text-xs text-[#7B7F85]">Email cannot be changed.</p>
            </div>

            {profileError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
                {profileError}
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4" />
                Profile updated successfully!
              </div>
            )}

            <Button type="submit" disabled={profileLoading} className="bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition">
              <Save className="w-4 h-4 mr-2" />
              {profileLoading ? "Saving…" : "Save Changes"}
            </Button>
          </form>
        </motion.div>
      )}

      {activeTab === "account" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-5">
            <Mail className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">Account Settings</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div>
                <p className="font-bold text-[#2B2E33] tracking-tight">Email Address</p>
                <p className="text-sm text-[#7B7F85]">{user?.email}</p>
              </div>
              <span className="rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700 flex items-center gap-1">
                <CheckCircle className="w-3 h-3" />
                Verified
              </span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div>
                <p className="font-bold text-[#2B2E33] tracking-tight">Account Type</p>
                <p className="text-sm text-[#7B7F85]">{user?.role === "student" ? "Individual" : "Enterprise"}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                user?.role === "student" 
                  ? "bg-[#2B2E33]/10 text-[#2B2E33] border border-[#C1C4C8]"
                  : "bg-[#7B7F85]/10 text-[#7B7F85] border border-[#C1C4C8]"
              }`}>{user?.role}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div>
                <p className="font-bold text-[#2B2E33] tracking-tight">Member Since</p>
                <p className="text-sm text-[#7B7F85]">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  }) : "N/A"}
                </p>
              </div>
            </div>
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <p className="font-bold text-amber-600">Account Actions</p>
              </div>
              <p className="mt-2 text-sm text-amber-700">Dangerous actions like account deletion require confirmation.</p>
              <Button variant="secondary" className="mt-3 border border-amber-300 bg-amber-100 text-amber-700 hover:bg-amber-200 transition-all duration-300">
                Request Account Deletion
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "security" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-5">
            <Shield className="w-5 h-5 text-[#2B2E33]" />
            <div className="flex items-center justify-between flex-1">
              <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">Change Password</h2>
              <button
                onClick={() => setShowSecurityDashboard(!showSecurityDashboard)}
                className="px-3 py-1.5 rounded-lg bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8] text-xs font-semibold hover:bg-[#C1C4C8]/20 transition flex items-center gap-2"
              >
                <ShieldAlert className="w-3 h-3" />
                Security Dashboard
              </button>
            </div>
          </div>

          {/* Security Dashboard */}
          {showSecurityDashboard && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 rounded-xl border border-[#2B2E33] bg-[#2B2E33]/5 p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-[#2B2E33]" />
                <p className="font-bold text-[#2B2E33]">Security Overview</p>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {[
                  { label: "Password Strength", value: "Strong", color: "text-green-600" },
                  { label: "Last Login", value: "2 hours ago", color: "text-[#7B7F85]" },
                  { label: "Active Sessions", value: "1", color: "text-[#2B2E33]" },
                  { label: "2FA Enabled", value: "No", color: "text-amber-600" },
                ].map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-[#F5F6F7]">
                    <span className="text-sm text-[#7B7F85]">{item.label}</span>
                    <span className={`text-sm font-semibold ${item.color}`}>{item.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-semibold text-[#2B2E33]">
                Current Password
              </label>
              <Input
                id="currentPassword"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="bg-[#F5F6F7] border border-[#C1C4C8] text-[#2B2E33] focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/20"
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-[#2B2E33]">
                New Password
              </label>
              <Input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                placeholder="Minimum 8 characters"
                className="bg-[#F5F6F7] border border-[#C1C4C8] text-[#2B2E33] focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/20"
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="mb-1.5 block text-sm font-semibold text-[#2B2E33]">
                Confirm New Password
              </label>
              <Input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                autoComplete="new-password"
                className="bg-[#F5F6F7] border border-[#C1C4C8] text-[#2B2E33] focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/20"
              />
            </div>

            {securityError && (
              <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 px-4 py-2 rounded-xl">
                <AlertTriangle className="w-4 h-4" />
                {securityError}
              </div>
            )}
            {securitySuccess && (
              <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 px-4 py-2 rounded-xl">
                <CheckCircle className="w-4 h-4" />
                Password changed successfully!
              </div>
            )}

            <Button type="submit" disabled={securityLoading} className="bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition">
              <Lock className="w-4 h-4 mr-2" />
              {securityLoading ? "Updating…" : "Update Password"}
            </Button>
          </form>
        </motion.div>
      )}

      {activeTab === "integrations" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-5">
            <Link2 className="w-5 h-5 text-[#2B2E33]" />
            <div className="flex items-center justify-between flex-1">
              <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">Integrations</h2>
              <button
                onClick={() => setShowAutomationBuilder(!showAutomationBuilder)}
                className="px-3 py-1.5 rounded-lg bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8] text-xs font-semibold hover:bg-[#C1C4C8]/20 transition flex items-center gap-2"
              >
                <Workflow className="w-3 h-3" />
                Automation Builder
              </button>
            </div>
          </div>

          {/* Automation Builder */}
          {showAutomationBuilder && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 rounded-xl border border-[#2B2E33] bg-[#2B2E33]/5 p-4"
            >
              <div className="flex items-center gap-2 mb-4">
                <Puzzle className="w-5 h-5 text-[#2B2E33]" />
                <p className="font-bold text-[#2B2E33]">Automation Builder</p>
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F7]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#2B2E33]">Auto-sync Certificates</p>
                    <p className="text-xs text-[#7B7F85]">Sync certificates to LinkedIn automatically</p>
                  </div>
                  <button className="text-xs font-semibold text-[#2B2E33] hover:text-[#7B7F85]">Configure</button>
                </div>
                <div className="flex items-center gap-3 p-3 rounded-lg bg-[#F5F6F7]">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[#2B2E33]">Smart Notifications</p>
                    <p className="text-xs text-[#7B7F85]">Send reminders based on your schedule</p>
                  </div>
                  <button className="text-xs font-semibold text-[#2B2E33] hover:text-[#7B7F85]">Configure</button>
                </div>
              </div>
            </motion.div>
          )}
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#2B2E33] tracking-tight">Google Calendar</p>
                  <p className="text-sm text-[#7B7F85]">Sync assessment schedules</p>
                </div>
              </div>
              <Button variant="secondary" className="border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition-all duration-300">
                Connect
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                  <Zap className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#2B2E33] tracking-tight">Slack</p>
                  <p className="text-sm text-[#7B7F85]">Get notifications in channels</p>
                </div>
              </div>
              <Button variant="secondary" className="border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition-all duration-300">
                Connect
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50 text-green-600">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-[#2B2E33] tracking-tight">Microsoft Teams</p>
                  <p className="text-sm text-[#7B7F85]">Collaborate with tutors</p>
                </div>
              </div>
              <Button variant="secondary" className="border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition-all duration-300">
                Connect
              </Button>
            </div>
            <div className="rounded-xl border border-[#2B2E33] bg-[#2B2E33]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Key className="w-5 h-5 text-[#2B2E33]" />
                <p className="font-bold text-[#2B2E33]">API Access</p>
              </div>
              <p className="mt-2 text-sm text-[#7B7F85]">Generate API keys for programmatic access to your assessment data.</p>
              <Button variant="secondary" className="mt-3 border border-[#2B2E33] bg-[#2B2E33]/10 text-[#2B2E33] hover:bg-[#2B2E33]/20 transition-all duration-300">
                Manage API Keys
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "billing" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-5">
            <CreditCard className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">Billing & Subscription</h2>
          </div>
          <div className="space-y-4">
            <div className="rounded-xl border border-green-200 bg-green-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-bold text-green-700">Current Plan</p>
                  <p className="mt-1 text-2xl font-bold text-green-800 tracking-tight">Free Tier</p>
                </div>
                <span className="rounded-full bg-green-100 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">Active</span>
              </div>
              <p className="mt-3 text-sm text-green-600">Unlimited assessments, basic analytics, and certificate generation.</p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
                <p className="text-sm font-semibold text-[#7B7F85]">Assessments Taken</p>
                <p className="mt-1 text-2xl font-bold text-[#2B2E33] tracking-tight">∞</p>
              </div>
              <div className="rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
                <p className="text-sm font-semibold text-[#7B7F85]">Certificates</p>
                <p className="mt-1 text-2xl font-bold text-[#2B2E33] tracking-tight">∞</p>
              </div>
            </div>
            <div className="rounded-xl border border-[#2B2E33] bg-[#2B2E33]/5 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Crown className="w-5 h-5 text-[#2B2E33]" />
                <p className="font-bold text-[#2B2E33]">Upgrade to Pro</p>
              </div>
              <p className="mt-2 text-sm text-[#7B7F85]">Get advanced analytics, AI-powered insights, priority support, and custom branding.</p>
              <Button className="mt-3 bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition-all duration-300">
                View Plans
              </Button>
            </div>
            <div className="flex items-center justify-between rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300">
              <div>
                <p className="font-bold text-[#2B2E33] tracking-tight">Payment Method</p>
                <p className="text-sm text-[#7B7F85]">No payment method on file</p>
              </div>
              <Button variant="secondary" className="border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] hover:bg-[#C1C4C8]/20 transition-all duration-300">
                Add Payment Method
              </Button>
            </div>
          </div>
        </motion.div>
      )}

      {activeTab === "notifications" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-lg"
        >
          <div className="flex items-center gap-3 mb-5">
            <Bell className="w-5 h-5 text-[#2B2E33]" />
            <h2 className="text-lg font-bold text-[#2B2E33] tracking-tight">Notification Preferences</h2>
          </div>
          <div className="space-y-4">
            {[
              {
                id: "assessment-reminders",
                label: "Assessment Reminders",
                description: "Get reminded about scheduled assessments",
                defaultChecked: true,
              },
              {
                id: "certificate-issued",
                label: "Certificate Issued",
                description: "Be notified when you earn a new certificate",
                defaultChecked: true,
              },
              {
                id: "tutor-reminders",
                label: "Tutor Session Reminders",
                description: "Reminders before your booked tutor sessions",
                defaultChecked: true,
              },
              {
                id: "weekly-digest",
                label: "Weekly Progress Digest",
                description: "A weekly summary of your learning progress",
                defaultChecked: false,
              },
            ].map((pref) => (
              <label
                key={pref.id}
                htmlFor={pref.id}
                className="flex cursor-pointer items-start gap-4 rounded-xl border border-[#C1C4C8] bg-[#F5F6F7] p-4 hover-lift transition-all duration-300"
              >
                <input
                  id={pref.id}
                  type="checkbox"
                  defaultChecked={pref.defaultChecked}
                  className="mt-0.5 h-4 w-4 rounded border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/20 accent-[#2B2E33]"
                />
                <div>
                  <p className="font-bold text-[#2B2E33] tracking-tight">{pref.label}</p>
                  <p className="text-sm text-[#7B7F85]">{pref.description}</p>
                </div>
              </label>
            ))}
          </div>
          <div className="mt-5">
            <Button className="bg-gradient-to-r from-[#2B2E33] to-[#7B7F85] text-white shadow-lg hover:scale-105 transition-all duration-300">
              <Save className="w-4 h-4 mr-2" />
              Save Preferences
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
