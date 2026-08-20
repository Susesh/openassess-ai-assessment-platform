"use client";

import { useEffect } from "react";
import { useProctoring } from "@/contexts/proctoring-context";

export function TabMonitor({ active }: { active: boolean }) {
  const { startTabMonitoring, startViolationTracking } = useProctoring();

  useEffect(() => {
    if (!active) {
      return;
    }

    startTabMonitoring();
    startViolationTracking();
  }, [active, startTabMonitoring, startViolationTracking]);

  return null;
}
