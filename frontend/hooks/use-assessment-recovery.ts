"use client";

import { useEffect, useState } from "react";
import { resumeQuiz } from "@/lib/api";
import type { QuizResumeResponse } from "@/lib/types";

export const RECOVERY_STORAGE_KEY = "openassess.activeAttempt";

type ActiveAttemptMeta = {
  attemptId: number;
  topicName?: string;
  criteriaId?: number | null;
  topicId?: number | null;
  paperId?: number | null;
};

type ActiveAttemptStore = {
  version: 2;
  attempts: Record<string, ActiveAttemptMeta>;
};

function buildAttemptScopeKey(meta: {
  topicId?: number | null;
  criteriaId?: number | null;
  paperId?: number | null;
  attemptId?: number | null;
}): string {
  if (meta.paperId && !Number.isNaN(meta.paperId)) {
    return `paper:${meta.paperId}`;
  }

  if (meta.criteriaId && !Number.isNaN(meta.criteriaId)) {
    return `criteria:${meta.criteriaId}`;
  }

  if (meta.topicId && !Number.isNaN(meta.topicId)) {
    return `topic:${meta.topicId}`;
  }

  return `attempt:${meta.attemptId ?? "unknown"}`;
}

function parseAttemptMeta(value: string | null): ActiveAttemptMeta | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as ActiveAttemptMeta;
    if (!parsed.attemptId || Number.isNaN(parsed.attemptId)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function parseAttemptStore(value: string | null): ActiveAttemptStore {
  if (!value) {
    return { version: 2, attempts: {} };
  }

  try {
    const parsed = JSON.parse(value) as Partial<ActiveAttemptStore> & ActiveAttemptMeta;

    if (parsed.version === 2 && parsed.attempts && typeof parsed.attempts === "object") {
      return {
        version: 2,
        attempts: Object.fromEntries(
          Object.entries(parsed.attempts).filter(([, meta]) => Boolean(meta?.attemptId))
        ),
      };
    }

    const legacyMeta = parseAttemptMeta(value);
    if (!legacyMeta) {
      return { version: 2, attempts: {} };
    }

    return {
      version: 2,
      attempts: {
        [buildAttemptScopeKey(legacyMeta)]: legacyMeta,
      },
    };
  } catch {
    return { version: 2, attempts: {} };
  }
}

function isMatchingAttempt(
  stored: ActiveAttemptMeta,
  topicId?: number,
  criteriaId?: number,
  paperId?: number
): boolean {
  const hasPaper = Boolean(paperId && !Number.isNaN(paperId));
  if (hasPaper) {
    return Number(stored.paperId) === Number(paperId);
  }

  const hasCriteria = Boolean(criteriaId && !Number.isNaN(criteriaId));
  if (hasCriteria) {
    return Number(stored.criteriaId) === Number(criteriaId);
  }

  if (topicId && !Number.isNaN(topicId)) {
    return Number(stored.topicId) === Number(topicId);
  }

  return false;
}

export function saveActiveAttempt(meta: ActiveAttemptMeta) {
  if (typeof window === "undefined") return;
  const store = parseAttemptStore(window.localStorage.getItem(RECOVERY_STORAGE_KEY));
  store.attempts[buildAttemptScopeKey(meta)] = meta;
  window.localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(store));
}

export function clearActiveAttempt(meta?: Partial<ActiveAttemptMeta>) {
  if (typeof window === "undefined") return;

  if (!meta || (!meta.topicId && !meta.criteriaId && !meta.paperId && !meta.attemptId)) {
    window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
    return;
  }

  const store = parseAttemptStore(window.localStorage.getItem(RECOVERY_STORAGE_KEY));
  delete store.attempts[buildAttemptScopeKey(meta)];

  if (Object.keys(store.attempts).length === 0) {
    window.localStorage.removeItem(RECOVERY_STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(RECOVERY_STORAGE_KEY, JSON.stringify(store));
}

export function useAssessmentRecovery(topicId?: number, criteriaId?: number, paperId?: number) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [meta, setMeta] = useState<ActiveAttemptMeta | null>(null);
  const [data, setData] = useState<QuizResumeResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      if (typeof window === "undefined") {
        setLoading(false);
        return;
      }

      const store = parseAttemptStore(window.localStorage.getItem(RECOVERY_STORAGE_KEY));
      const stored = Object.values(store.attempts).find((item) => isMatchingAttempt(item, topicId, criteriaId, paperId)) ?? null;
      if (!stored) {
        setLoading(false);
        return;
      }

      setMeta(stored);

      try {
        const resumed = await resumeQuiz(stored.attemptId);
        if (cancelled) return;

        if (resumed.is_submitted) {
          clearActiveAttempt(stored);
          setData(null);
          setLoading(false);
          return;
        }

        setData(resumed);
      } catch (err) {
        if (cancelled) return;
        clearActiveAttempt(stored);
        setError(err instanceof Error ? err.message : "Failed to restore assessment attempt");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void run();

    return () => {
      cancelled = true;
    };
  }, [criteriaId, paperId, topicId]);

  return {
    loading,
    error,
    meta,
    data,
  };
}
