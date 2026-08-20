"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import {
  IconBookOpen,
  IconBuilding,
  IconCalendar,
  IconShield,
  LogoMark,
} from "@/components/icons";
import { useAuth } from "@/contexts/auth-context";
import { ApiError } from "@/lib/api";

const ROLES = [
  {
    value: "student",
    label: "Student",
    icon: IconBookOpen,
    desc: "Take assessments and earn certificates",
  },
  {
    value: "tutor",
    label: "Tutor",
    icon: IconCalendar,
    desc: "Teach remedial sessions",
  },
  {
    value: "employer",
    label: "Employer",
    icon: IconBuilding,
    desc: "Verify candidate skills",
  },
  {
    value: "university",
    label: "University",
    icon: IconShield,
    desc: "Manage academic assessment",
  },
];

export function LoginForm() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(fullName, email, password, role);
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("Invalid email or password.");
      } else {
        setError(err instanceof ApiError ? err.message : "Something went wrong.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-card-enter w-full max-w-[460px]">
      <div className="mb-7 flex flex-col items-center text-center">
        <Link href="/" className="flex items-center gap-3">
          <LogoMark className="h-10 w-10 text-[#2B2E33]" />
          <div className="text-left">
            <span className="block text-xl font-semibold text-[#2B2E33]">OpenAssess</span>
            <span className="block text-xs font-medium text-[#7B7F85]">
              Continuous assessment platform
            </span>
          </div>
        </Link>
      </div>

      <div className="rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] p-7 shadow-xl sm:p-8">
        <div className="mb-7">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7B7F85]">
            {mode === "login" ? "Secure sign in" : "Create workspace"}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[#2B2E33]">
            {mode === "login" ? "Welcome back" : "Create your account"}
          </h1>
          <p className="mt-2 text-sm leading-6 text-[#7B7F85]">
            {mode === "login"
              ? "Access assessments, analytics, certificates, and proctoring tools."
              : "Choose your role and start using OpenAssess."}
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {mode === "register" ? (
            <>
              <div>
                <label htmlFor="fullName" className="mb-1.5 block text-sm font-medium text-[#7B7F85]">
                  Full name
                </label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jordan Smith"
                  className="w-full rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3.5 py-2.5 text-sm text-[#2B2E33] outline-none transition placeholder:text-[#7B7F85] focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/15"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-[#7B7F85]">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {ROLES.map((r) => {
                    const Icon = r.icon;
                    return (
                      <button
                        key={r.value}
                        type="button"
                        onClick={() => setRole(r.value)}
                        className={`flex min-h-24 flex-col items-start rounded-lg border p-3 text-left transition ${
                          role === r.value
                            ? "border-[#2B2E33] bg-[#F5F6F7] text-[#2B2E33]"
                            : "border-[#C1C4C8] bg-[#F5F6F7] text-[#7B7F85] hover:border-[#C1C4C8] hover:bg-[#C1C4C8]/20"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        <span className="mt-2 text-xs font-semibold">{r.label}</span>
                        <span className="mt-1 text-[11px] leading-4 opacity-75">{r.desc}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          ) : null}

          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-[#7B7F85]">
              Email address
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
              className="w-full rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3.5 py-2.5 text-sm text-[#2B2E33] outline-none transition placeholder:text-[#7B7F85] focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/15"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-[#7B7F85]">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
              required
              minLength={8}
              maxLength={72}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
              className="w-full rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3.5 py-2.5 text-sm text-[#2B2E33] outline-none transition placeholder:text-[#7B7F85] focus:border-[#2B2E33] focus:ring-2 focus:ring-[#2B2E33]/15"
            />
          </div>

          {error ? (
            <p className="rounded-lg border border-[#C1C4C8] bg-[#2B2E33] px-3 py-2 text-sm text-[#F5F6F7]">
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={submitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#2B2E33] px-4 py-2.5 text-sm font-semibold text-[#F5F6F7] shadow-sm transition hover:bg-[#2B2E33]/90 focus:outline-none focus:ring-2 focus:ring-[#2B2E33] focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting
              ? "Please wait..."
              : mode === "login"
                ? "Sign in"
                : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-[#7B7F85]">
          {mode === "login" ? "No account yet?" : "Already have an account?"}{" "}
          <button
            type="button"
            onClick={() => {
              setMode(mode === "login" ? "register" : "login");
              setError(null);
            }}
            className="font-semibold text-[#2B2E33] transition hover:text-[#2B2E33]/80"
          >
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-[#C1C4C8] bg-[#2B2E33] px-4 py-3 text-center text-sm text-[#F5F6F7]">
        AI-guided feedback, verified certificates, and role-based dashboards.
      </div>
    </div>
  );
}
