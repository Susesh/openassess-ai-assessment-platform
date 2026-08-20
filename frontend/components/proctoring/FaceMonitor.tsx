"use client";

import { useEffect } from "react";
import { useProctoring } from "@/contexts/proctoring-context";

export function FaceMonitor({ active }: { active: boolean }) {
  const { startFaceDetection, stopFaceDetection } = useProctoring();

  useEffect(() => {
    if (!active) {
      stopFaceDetection();
      return;
    }

    startFaceDetection();
    return () => stopFaceDetection();
  }, [active, startFaceDetection, stopFaceDetection]);

  return null;
}
