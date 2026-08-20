"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth.service";
import type { User } from "@/types/user.types";

export function useAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = window.localStorage.getItem("openassess_token");
    if (!storedToken) {
      router.replace("/login");
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    authService
      .getMe()
      .then((profile) => setUser(profile))
      .catch(() => {
        window.localStorage.removeItem("openassess_token");
        router.replace("/login");
      })
      .finally(() => setIsLoading(false));
  }, [router]);

  return useMemo(() => ({ user, token, isLoading }), [user, token, isLoading]);
}
