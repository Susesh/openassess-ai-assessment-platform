"use client";

import { useEffect } from "react";
import { useProctoring } from "@/contexts/proctoring-context";

export function CameraMonitor({ active }: { active: boolean }) {
  const { startCameraMonitoring } = useProctoring();

  useEffect(() => {
    if (!active) {
      return;
    }
    startCameraMonitoring();
  }, [active, startCameraMonitoring]);

  return null;
}
