import type { HeatmapItem } from "@/lib/types";
import { normalizeHeatmapItems } from "@/lib/heatmap";
import { ProgressBar } from "./ui";

export function TopicPerformance({ items }: { items: HeatmapItem[] }) {
  const uniqueItems = normalizeHeatmapItems(items);

  if (uniqueItems.length === 0) {
    return (
      <p className="text-sm text-[#7B7F85]">
        No assessments yet. Complete a quiz to see your topic mastery.
      </p>
    );
  }

  return (
    <ul className="space-y-5">
      {uniqueItems.map((item, index) => {
        const isStrong = item.avg_score >= 60;
        return (
          <li key={`${item.topic}-${index}`}>
            <div className="mb-2 flex items-center justify-between text-sm">
              <span className="font-medium text-[#2B2E33]">{item.topic}</span>
              <span className="font-semibold tabular-nums text-[#2B2E33]">
                {item.avg_score}%
              </span>
            </div>
            <ProgressBar
              value={item.avg_score}
              className={isStrong ? "bg-[#2B2E33]" : "bg-[#7B7F85]"}
            />
            <p className="mt-1 text-xs text-[#7B7F85]">
              {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
            </p>
          </li>
        );
      })}
    </ul>
  );
}
