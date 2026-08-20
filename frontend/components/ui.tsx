"use client";

import Link from "next/link";
import type { HTMLAttributes, ReactNode } from "react";
import { createContext, useCallback, useContext, useEffect, useState } from "react";

export function Card({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-2xl border border-[#C1C4C8] bg-[#F5F6F7] shadow-sm ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-[#2B2E33] sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#7B7F85] sm:text-base">
          {description}
        </p>
      </div>
      {action}
    </header>
  );
}

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "brand";
}) {
  const styles = {
    default: "bg-[#2B2E33] text-[#F5F6F7] border border-[#2B2E33]",
    success: "bg-[#2B2E33] text-[#F5F6F7] border border-[#2B2E33]",
    warning: "bg-[#F5F6F7] text-[#7B7F85] border border-[#C1C4C8]",
    brand: "bg-[#F5F6F7] text-[#2B2E33] border border-[#C1C4C8]",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
}

export function ProgressBar({
  value,
  className = "bg-[#2B2E33]",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div className="h-2 overflow-hidden rounded-full bg-[#C1C4C8]/40">
      <div
        className={`h-full rounded-full transition-all duration-500 ${className}`}
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={100}
      />
    </div>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  const variants = {
    primary:
      "bg-[#2B2E33] text-[#F5F6F7] shadow-sm hover:bg-[#2B2E33]/90 focus:ring-[#2B2E33]",
    secondary:
      "border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] shadow-sm hover:bg-[#C1C4C8]/20 focus:ring-[#C1C4C8]",
    ghost: "text-[#7B7F85] hover:bg-[#C1C4C8]/20 focus:ring-[#C1C4C8]",
  };
  return (
    <Link href={href} className={`${base} ${variants[variant]} ${className}`}>
      {children}
    </Link>
  );
}

export function StatCard({
  label,
  value,
  change,
  progress,
}: {
  label: string;
  value: string;
  change: string;
  progress: number;
}) {
  return (
    <Card className="p-5">
      <p className="text-sm font-medium text-[#7B7F85]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[#2B2E33]">{value}</p>
      <p className="mt-1 text-xs font-medium text-[#7B7F85]">{change}</p>
      <div className="mt-4">
        <ProgressBar value={progress} />
      </div>
    </Card>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-[#C1C4C8]/40 ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ lines = 3 }: { lines?: number }) {
  return (
    <Card className="space-y-3 p-6">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={`h-3 ${i % 2 === 0 ? "w-full" : "w-5/6"}`} />
      ))}
    </Card>
  );
}

type ToastVariant = "success" | "error" | "warning" | "info";

type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  toast: (message: string, variant?: ToastVariant) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev, { id, message, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        aria-live="polite"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2"
      >
        {toasts.map((t) => (
          <ToastItem
            key={t.id}
            toast={t}
            onRemove={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onRemove,
}: {
  toast: Toast;
  onRemove: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex max-w-sm items-center gap-3 rounded-xl border border-[#C1C4C8] bg-[#2B2E33] px-4 py-3 text-[#F5F6F7] shadow-lg animate-fade-in-up"
    >
      <p className="flex-1 text-sm font-medium">{toast.message}</p>
      <button
        type="button"
        onClick={onRemove}
        className="shrink-0 text-lg leading-none text-[#7B7F85] hover:text-[#F5F6F7]"
        aria-label="Dismiss"
      >
        x
      </button>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ? <span className="text-5xl" aria-hidden="true">{icon}</span> : null}
      <h3 className="mt-4 text-lg font-semibold text-[#2B2E33]">{title}</h3>
      {description ? (
        <p className="mt-2 max-w-sm text-sm text-[#7B7F85]">{description}</p>
      ) : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}

export function Input({
  className = "",
  ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`w-full rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3.5 py-2.5 text-sm text-[#2B2E33] shadow-sm transition placeholder:text-[#7B7F85] focus:border-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15 ${className}`}
      {...props}
    />
  );
}

export function Select({
  className = "",
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={`w-full rounded-lg border border-[#C1C4C8] bg-[#F5F6F7] px-3.5 py-2.5 text-sm text-[#2B2E33] shadow-sm transition focus:border-[#2B2E33] focus:outline-none focus:ring-2 focus:ring-[#2B2E33]/15 ${className}`}
      {...props}
    >
      {children}
    </select>
  );
}

export function Button({
  variant = "primary",
  className = "",
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";
  const variants = {
    primary:
      "bg-[#2B2E33] text-[#F5F6F7] shadow-sm hover:bg-[#2B2E33]/90 focus:ring-[#2B2E33]",
    secondary:
      "border border-[#C1C4C8] bg-[#F5F6F7] text-[#2B2E33] shadow-sm hover:bg-[#C1C4C8]/20 focus:ring-[#C1C4C8]",
    ghost: "text-[#7B7F85] hover:bg-[#C1C4C8]/20 focus:ring-[#C1C4C8]",
    danger: "bg-[#2B2E33] text-[#F5F6F7] border border-[#7B7F85] hover:bg-[#7B7F85] focus:ring-[#2B2E33]",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-[#2B2E33]/60 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close dialog"
      />
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-[#F5F6F7] border border-[#C1C4C8] p-6 shadow-xl text-[#2B2E33]">
        <div className="mb-4 flex items-center justify-between">
          <h2 id="modal-title" className="text-lg font-semibold text-[#2B2E33]">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#7B7F85] hover:bg-[#C1C4C8]/20 hover:text-[#2B2E33]"
            aria-label="Close"
          >
            x
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

