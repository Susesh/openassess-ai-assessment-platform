import Link from "next/link";
import { Badge, Card } from "@/components/ui";
import type { ExamCriteria } from "@/lib/types";

export function CriteriaCard({ criteria }: { criteria: ExamCriteria }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">{criteria.board}</p>
            <h3 className="mt-1 text-lg font-semibold text-slate-900">{criteria.exam_name}</h3>
            <p className="mt-1 text-sm text-slate-600">
              {criteria.subject} • {criteria.topic_name ?? "Topic"}
              {criteria.subtopic_name ? ` • ${criteria.subtopic_name}` : ""}
            </p>
          </div>
          <Badge variant={criteria.is_active ? "success" : "warning"}>
            {criteria.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-slate-600 sm:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[11px] uppercase text-slate-500">Difficulty</p>
            <p className="mt-1 font-semibold text-slate-800 capitalize">{criteria.difficulty}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[11px] uppercase text-slate-500">Duration</p>
            <p className="mt-1 font-semibold text-slate-800">{Math.max(60, criteria.duration_minutes)} min</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[11px] uppercase text-slate-500">Questions</p>
            <p className="mt-1 font-semibold text-slate-800">{criteria.total_questions}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
            <p className="text-[11px] uppercase text-slate-500">Pass Mark</p>
            <p className="mt-1 font-semibold text-slate-800">{criteria.passing_percentage}%</p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          {criteria.video_recording_enabled ? <Badge variant="brand">Video Recording</Badge> : null}
          {criteria.ai_proctoring_enabled ? <Badge variant="brand">AI Proctoring</Badge> : null}
          {criteria.certificate_enabled ? <Badge variant="brand">Certificate</Badge> : null}
        </div>

        <div className="mt-5 flex gap-3">
          <Link
            href={`/dashboard/assessment/take?criteria_id=${criteria.id}&topic_name=${encodeURIComponent(criteria.exam_name)}`}
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    </Card>
  );
}
