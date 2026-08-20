"use client";

import { Button, Input, Select } from "@/components/ui";
import type { ExamCriteriaInput, Topic } from "@/lib/types";

const BOARDS: ExamCriteriaInput["board"][] = [
  "CBSE",
  "ICSE",
  "State Board",
  "IIT-JEE",
  "NEET",
  "UPSC",
  "University",
  "Custom",
];

const DIFFICULTIES: ExamCriteriaInput["difficulty"][] = ["easy", "medium", "hard", "adaptive"];

type Props = {
  value: ExamCriteriaInput;
  topics: Topic[];
  submitting: boolean;
  onChange: (next: ExamCriteriaInput) => void;
  onSubmit: () => void;
  submitLabel: string;
};

export function CriteriaForm({ value, topics, submitting, onChange, onSubmit, submitLabel }: Props) {
  const selectedTopic = topics.find((t) => t.id === value.topic_id);

  function update<K extends keyof ExamCriteriaInput>(key: K, nextValue: ExamCriteriaInput[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <div className="grid gap-4">
      <Input
        placeholder="Exam Name"
        value={value.exam_name}
        onChange={(e) => update("exam_name", e.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={value.board} onChange={(e) => update("board", e.target.value as ExamCriteriaInput["board"])}>
          {BOARDS.map((board) => (
            <option key={board} value={board}>
              {board}
            </option>
          ))}
        </Select>

        <Input
          placeholder="Subject"
          value={value.subject}
          onChange={(e) => update("subject", e.target.value)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Select
          value={String(value.topic_id)}
          onChange={(e) => {
            const nextTopicId = Number(e.target.value);
            const nextTopic = topics.find((t) => t.id === nextTopicId);
            onChange({
              ...value,
              topic_id: nextTopicId,
              subtopic_id: nextTopic?.subtopics[0]?.id ?? null,
              subject: value.subject || nextTopic?.subject || "General",
            });
          }}
        >
          {topics.map((topic) => (
            <option key={topic.id} value={topic.id}>
              {topic.name}
            </option>
          ))}
        </Select>

        <Select
          value={value.subtopic_id ? String(value.subtopic_id) : ""}
          onChange={(e) => update("subtopic_id", e.target.value ? Number(e.target.value) : null)}
        >
          <option value="">All Subtopics</option>
          {(selectedTopic?.subtopics ?? []).map((sub) => (
            <option key={sub.id} value={sub.id}>
              {sub.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select
          value={value.difficulty}
          onChange={(e) => update("difficulty", e.target.value as ExamCriteriaInput["difficulty"])}
        >
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          min={1}
          max={100}
          value={value.total_questions}
          onChange={(e) => update("total_questions", Math.max(1, Number(e.target.value || 1)))}
          placeholder="Total Questions"
        />
        <Input
          type="number"
          min={1}
          value={value.total_marks}
          onChange={(e) => update("total_marks", Math.max(1, Number(e.target.value || 1)))}
          placeholder="Total Marks"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Input
          type="number"
          min={0}
          max={100}
          value={value.passing_percentage}
          onChange={(e) => update("passing_percentage", Math.min(100, Math.max(0, Number(e.target.value || 0))))}
          placeholder="Passing %"
        />
        <Input
          type="number"
          min={0}
          step="0.25"
          value={value.negative_marking}
          onChange={(e) => update("negative_marking", Math.max(0, Number(e.target.value || 0)))}
          placeholder="Negative Marking"
        />
        <Input
          type="number"
          min={0}
          value={value.maximum_attempts}
          onChange={(e) => update("maximum_attempts", Math.max(0, Number(e.target.value || 0)))}
          placeholder="Maximum Attempts (0 = unlimited)"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="number"
          min={60}
          value={value.duration_minutes}
          onChange={(e) => update("duration_minutes", Math.max(60, Number(e.target.value || 60)))}
          placeholder="Duration in minutes"
        />
        <Input
          placeholder="Custom instructions"
          value={value.instructions ?? ""}
          onChange={(e) => update("instructions", e.target.value || null)}
        />
      </div>

      <div className="grid gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm sm:grid-cols-2">
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.video_recording_enabled}
            onChange={(e) => update("video_recording_enabled", e.target.checked)}
          />
          Video Recording Enabled
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.ai_proctoring_enabled}
            onChange={(e) => update("ai_proctoring_enabled", e.target.checked)}
          />
          AI Proctoring Enabled
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.certificate_enabled}
            onChange={(e) => update("certificate_enabled", e.target.checked)}
          />
          Certificate Enabled
        </label>
        <label className="inline-flex items-center gap-2">
          <input
            type="checkbox"
            checked={value.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
          />
          Assessment Active
        </label>
      </div>

      <Button type="button" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}
