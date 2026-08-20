"use client";

import { Button, Input, Select } from "@/components/ui";
import type { QuestionPaperInput } from "@/lib/types";

const EXAM_CATEGORIES: QuestionPaperInput["exam_category"][] = [
  "CBSE",
  "ICSE",
  "State Board",
  "IIT-JEE",
  "NEET",
  "UPSC",
  "University Exams",
  "Custom Assessments",
];

const QUESTION_TYPES = ["", "mcq", "true_false", "short_answer", "essay"];
const DIFFICULTIES = ["", "easy", "medium", "hard"];

type Props = {
  value: QuestionPaperInput;
  submitting: boolean;
  onChange: (next: QuestionPaperInput) => void;
  onSubmit: () => void;
  submitLabel: string;
};

export function QuestionPaperForm({ value, submitting, onChange, onSubmit, submitLabel }: Props) {
  function update<K extends keyof QuestionPaperInput>(key: K, nextValue: QuestionPaperInput[K]) {
    onChange({ ...value, [key]: nextValue });
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Select value={value.exam_category} onChange={(e) => update("exam_category", e.target.value)}>
          {EXAM_CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </Select>
        <Input placeholder="Board" value={value.board} onChange={(e) => update("board", e.target.value)} />
      </div>

      <Input
        placeholder="Exam Name"
        value={value.exam_name}
        onChange={(e) => update("exam_name", e.target.value)}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input
          type="number"
          min={1900}
          max={2100}
          value={value.year}
          onChange={(e) => update("year", Number(e.target.value || 0))}
          placeholder="Question Paper Year"
        />
        <Input
          placeholder="Academic Year"
          value={value.academic_year ?? ""}
          onChange={(e) => update("academic_year", e.target.value || null)}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Class / Grade" value={value.class_name ?? ""} onChange={(e) => update("class_name", e.target.value || null)} />
        <Input placeholder="Subject" value={value.subject} onChange={(e) => update("subject", e.target.value)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="Topic" value={value.topic_name ?? ""} onChange={(e) => update("topic_name", e.target.value || null)} />
        <Input placeholder="Subtopic" value={value.subtopic_name ?? ""} onChange={(e) => update("subtopic_name", e.target.value || null)} />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Select value={value.question_type ?? ""} onChange={(e) => update("question_type", e.target.value || null)}>
          {QUESTION_TYPES.map((type) => (
            <option key={type || "all"} value={type}>
              {type || "Any Question Type"}
            </option>
          ))}
        </Select>
        <Select value={value.difficulty ?? ""} onChange={(e) => update("difficulty", e.target.value || null)}>
          {DIFFICULTIES.map((difficulty) => (
            <option key={difficulty || "all"} value={difficulty}>
              {difficulty || "Any Difficulty"}
            </option>
          ))}
        </Select>
        <Input
          type="number"
          min={0}
          value={value.total_marks ?? 0}
          onChange={(e) => update("total_marks", Math.max(0, Number(e.target.value || 0)))}
          placeholder="Total Marks"
        />
      </div>

      <Input placeholder="Language" value={value.language ?? "en"} onChange={(e) => update("language", e.target.value)} />

      <div className="grid gap-3 sm:grid-cols-2">
        <Input placeholder="PDF URL" value={value.pdf_url ?? ""} onChange={(e) => update("pdf_url", e.target.value || null)} />
        <Input placeholder="Answer Key URL" value={value.answer_key_url ?? ""} onChange={(e) => update("answer_key_url", e.target.value || null)} />
      </div>

      <Input placeholder="Source" value={value.source ?? ""} onChange={(e) => update("source", e.target.value || null)} />

      <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(value.is_published)}
          onChange={(e) => update("is_published", e.target.checked)}
        />
        Published
      </label>

      <Button type="button" onClick={onSubmit} disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </Button>
    </div>
  );
}