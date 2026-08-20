"use client";

import { useEffect } from "react";
import { useProctoring } from "@/contexts/proctoring-context";

export function FullscreenMonitor({ active }: { active: boolean }) {
  const { startFullscreenMonitoring } = useProctoring();

  useEffect(() => {
    if (!active) {
      return;
    }

    startFullscreenMonitoring();
  }, [active, startFullscreenMonitoring]);

  return null;
}
