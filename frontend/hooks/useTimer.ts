"use client";

import { useEffect, useMemo, useState } from "react";

export function useTimer(totalSeconds: number, onExpire?: () => void) {
  const [timeLeft, setTimeLeft] = useState(totalSeconds);

  useEffect(() => {
    setTimeLeft(totalSeconds);
  }, [totalSeconds]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onExpire?.();
      return;
    }
    const timeout = window.setTimeout(() => setTimeLeft((value) => value - 1), 1000);
    return () => window.clearTimeout(timeout);
  }, [timeLeft, onExpire]);

  return useMemo(() => ({
    timeLeft,
    formattedTime: `${Math.floor(timeLeft / 60).toString().padStart(2, "0")}:${(timeLeft % 60).toString().padStart(2, "0")}`,
    isExpired: timeLeft <= 0,
  }), [timeLeft]);
}
