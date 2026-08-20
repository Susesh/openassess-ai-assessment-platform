"use client";

import { useEffect, useState } from "react";
import { LoginForm } from "@/components/login-form";

export function ClientOnlyLogin() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex w-full max-w-[460px] items-center justify-center rounded-2xl border border-white/15 bg-white/80 px-8 py-10 text-sm font-medium text-slate-600 shadow-xl backdrop-blur">
        Preparing sign-in…
      </div>
    );
  }

  return <LoginForm />;
}
