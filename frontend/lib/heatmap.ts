import type { HeatmapItem } from "./types";

function latestDate(a: string | null, b: string | null): string | null {
  if (!a) return b;
  if (!b) return a;
  return new Date(a).getTime() >= new Date(b).getTime() ? a : b;
}

export function normalizeHeatmapItems(items: HeatmapItem[]): HeatmapItem[] {
  const byTopic = new Map<string, HeatmapItem>();

  for (const item of items) {
    const topicKey = item.topic.trim().toLowerCase();
    const existing = byTopic.get(topicKey);

    if (!existing) {
      byTopic.set(topicKey, { ...item });
      continue;
    }

    const attempts = existing.attempts + item.attempts;
    const weightedScore =
      attempts > 0
        ? (existing.avg_score * existing.attempts + item.avg_score * item.attempts) /
          attempts
        : Math.max(existing.avg_score, item.avg_score);

    byTopic.set(topicKey, {
      topic: existing.topic,
      attempts,
      avg_score: Math.round(weightedScore * 10) / 10,
      last_attempted: latestDate(existing.last_attempted, item.last_attempted),
    });
  }

  return Array.from(byTopic.values());
}
