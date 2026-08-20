import { HEATMAP_DATA } from "@/lib/data";

const INTENSITY: Record<number, string> = {
  0: "bg-slate-100",
  1: "bg-indigo-100",
  2: "bg-indigo-300",
  3: "bg-indigo-500",
  4: "bg-indigo-700",
};

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function ProgressHeatmap() {
  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[320px]">
        <div className="mb-3 flex items-center justify-between text-xs text-slate-500">
          <span>12 weeks of study activity</span>
          <div className="flex items-center gap-1">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span
                key={level}
                className={`h-3 w-3 rounded-sm ${INTENSITY[level]}`}
              />
            ))}
            <span>More</span>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex flex-col justify-between py-0.5 text-[10px] font-medium text-slate-400">
            {DAYS.map((day) => (
              <span key={day} className="h-3 leading-3">
                {day}
              </span>
            ))}
          </div>
          <div className="grid flex-1 grid-flow-col gap-1">
            {HEATMAP_DATA.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((level, dayIndex) => (
                  <span
                    key={`${weekIndex}-${dayIndex}`}
                    title={`Activity level ${level}`}
                    className={`h-3 w-3 rounded-sm ${INTENSITY[level] ?? INTENSITY[0]}`}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
