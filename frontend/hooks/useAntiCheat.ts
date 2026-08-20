"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/services/api";

export function useAntiCheat(attemptId: string | null) {
  const [cheatCount, setCheatCount] = useState(0);
  const [isFlagged, setIsFlagged] = useState(false);

  useEffect(() => {
    if (!attemptId) return;

    const logEvent = async (eventType: string) => {
      try {
        await api.post("/proctoring/log", { attempt_id: attemptId, event_type: eventType, details: {} });
      } catch {
        // ignore logging failures for now
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === "hidden") {
        setCheatCount((value) => {
          const next = value + 1;
          setIsFlagged(next >= 3);
          void logEvent("tab_switch");
          return next;
        });
      }
    };

    const handleBlur = () => {
      setCheatCount((value) => {
        const next = value + 1;
        setIsFlagged(next >= 3);
        void logEvent("window_blur");
        return next;
      });
    };

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("blur", handleBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("blur", handleBlur);
    };
  }, [attemptId]);

  return useMemo(() => ({ cheatCount, isFlagged }), [cheatCount, isFlagged]);
}
