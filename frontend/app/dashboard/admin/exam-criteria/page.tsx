"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/auth-context";
import { QuestionPaperForm } from "@/components/question-papers/question-paper-form";
import { Badge, Button, Input, Modal, PageHeader, Select, SkeletonCard } from "@/components/ui";
import { questionPaperService } from "@/services/question-paper.service";
import type { QuestionPaper, QuestionPaperInput } from "@/lib/types";

function defaultPaper(): QuestionPaperInput {
  const year = new Date().getFullYear();
  return {
    exam_category: "CBSE",
    board: "CBSE",
    exam_name: "",
    year,
    academic_year: `${year - 1}-${year}`,
    class_name: "",
    subject: "",
    topic_name: "",
    subtopic_name: "",
    question_type: null,
    difficulty: null,
    language: "en",
    total_marks: 0,
    pdf_url: null,
    answer_key_url: null,
    source: null,
    meta_data: null,
    is_published: false,
    questions: [],
  };
}

function isQuestionPaperInput(value: unknown): value is QuestionPaperInput {
  return typeof value === "object" && value !== null
    && "exam_category" in value
    && "board" in value
    && "exam_name" in value
    && "year" in value
    && "subject" in value;
}

export default function QuestionPaperAdminPage() {
  const { user, loading: authLoading } = useAuth();
  const [papers, setPapers] = useState<QuestionPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [boardFilter, setBoardFilter] = useState("All");
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<QuestionPaper | null>(null);
  const [createValue, setCreateValue] = useState<QuestionPaperInput>(defaultPaper());
  const [editValue, setEditValue] = useState<QuestionPaperInput>(defaultPaper());
  const [importJson, setImportJson] = useState(JSON.stringify({ paper: defaultPaper() }, null, 2));

  function resetCreateForm() {
    const nextDefault = defaultPaper();
    setCreateValue(nextDefault);
    setImportJson(JSON.stringify({ paper: nextDefault }, null, 2));
  }

  async function loadAll() {
    setLoading(true);
    setError(null);
    try {
      const items = await questionPaperService.getQuestionPapers();
      setPapers(items);
      resetCreateForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load question papers");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user?.role !== "admin") return;
    void loadAll();
  }, [user?.role]);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(papers.map((paper) => paper.exam_category))).sort()],
    [papers]
  );
  const boards = useMemo(
    () => ["All", ...Array.from(new Set(papers.map((paper) => paper.board))).sort()],
    [papers]
  );

  const visible = useMemo(() => {
    return papers.filter((paper) => {
      const matchesQuery =
        !query ||
        paper.exam_name.toLowerCase().includes(query.toLowerCase()) ||
        paper.subject.toLowerCase().includes(query.toLowerCase()) ||
        (paper.topic_name ?? "").toLowerCase().includes(query.toLowerCase());
      const matchesCategory = categoryFilter === "All" || paper.exam_category === categoryFilter;
      const matchesBoard = boardFilter === "All" || paper.board === boardFilter;
      return matchesQuery && matchesCategory && matchesBoard;
    });
  }, [boardFilter, categoryFilter, papers, query]);

  async function handleCreate() {
    if (!createValue.exam_name.trim()) {
      setError("Exam name is required");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await questionPaperService.createQuestionPaper(createValue);
      setCreateOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create paper");
    } finally {
      setSaving(false);
    }
  }

  function openEditModal(item: QuestionPaper) {
    setEditing(item);
    setEditValue({
      exam_category: item.exam_category,
      board: item.board,
      exam_name: item.exam_name,
      year: item.year,
      academic_year: item.academic_year,
      class_name: item.class_name,
      subject: item.subject,
      topic_name: item.topic_name,
      subtopic_name: item.subtopic_name,
      question_type: item.question_type,
      difficulty: item.difficulty,
      language: item.language,
      total_marks: item.total_marks,
      pdf_url: item.pdf_url,
      answer_key_url: item.answer_key_url,
      source: item.source,
      meta_data: item.meta_data ?? null,
      is_published: item.is_published,
      questions: [],
    });
    setEditOpen(true);
  }

  async function handleUpdate() {
    if (!editing) return;

    setSaving(true);
    setError(null);
    try {
      await questionPaperService.updateQuestionPaper(editing.id, editValue);
      setEditOpen(false);
      setEditing(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update paper");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(item: QuestionPaper) {
    const confirmed = window.confirm(`Delete question paper \"${item.exam_name}\"?`);
    if (!confirmed) return;

    setSaving(true);
    setError(null);
    try {
      await questionPaperService.deleteQuestionPaper(item.id);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete paper");
    } finally {
      setSaving(false);
    }
  }

  async function handleTogglePublish(item: QuestionPaper) {
    setSaving(true);
    setError(null);
    try {
      await questionPaperService.updateQuestionPaper(item.id, { is_published: !item.is_published });
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update publish state");
    } finally {
      setSaving(false);
    }
  }

  async function handleImport() {
    setSaving(true);
    setError(null);
    try {
      const parsed = JSON.parse(importJson) as unknown;
      const payload = (
        typeof parsed === "object"
        && parsed !== null
        && "paper" in parsed
        && isQuestionPaperInput((parsed as { paper?: unknown }).paper)
      )
        ? { paper: (parsed as { paper: QuestionPaperInput }).paper }
        : isQuestionPaperInput(parsed)
          ? { paper: parsed }
          : null;

      if (!payload) {
        throw new Error("Import JSON must be a question paper object or an object with a paper field.");
      }

      await questionPaperService.importQuestionPaper(payload);
      setImportOpen(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid import JSON");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Loading admin panel…</h2>
        <p className="mt-2 text-sm text-slate-500">Checking your session and permissions.</p>
      </div>
    );
  }

  if (user?.role !== "admin") {
    return (
      <div className="mx-auto max-w-xl py-20 text-center">
        <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
        <p className="mt-2 text-sm text-slate-500">Only administrators can manage question papers.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl animate-fade-in-up space-y-6">
      <PageHeader
        title="Question Paper Management"
        description="Upload, import, publish, and manage previous-year question papers across supported exam categories."
        action={
                <div className="flex flex-wrap gap-2">
              <Link
                href="/dashboard/admin"
                className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
              >
                Back to Admin
              </Link>
              <Button type="button" variant="secondary" onClick={() => setImportOpen(true)}>
                Import JSON
              </Button>
              <Button
                type="button"
                onClick={() => {
                  resetCreateForm();
                  setCreateOpen(true);
                }}
              >
                New Paper
              </Button>
            </div>
        }
      />

      {error ? <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p> : null}

      <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search exam name, subject, or topic"
        />
        <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
          {categories.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
        <Select value={boardFilter} onChange={(e) => setBoardFilter(e.target.value)}>
          {boards.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </Select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((i) => (
            <SkeletonCard key={i} lines={4} />
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-xs font-semibold uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3">Paper</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Board</th>
                <th className="px-4 py-3">Year</th>
                <th className="px-4 py-3">Subject</th>
                <th className="px-4 py-3">Questions</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visible.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-medium text-slate-900">{item.exam_name}</td>
                  <td className="px-4 py-3 text-slate-600">{item.exam_category}</td>
                  <td className="px-4 py-3 text-slate-600">{item.board}</td>
                  <td className="px-4 py-3 text-slate-600">{item.year}</td>
                  <td className="px-4 py-3 text-slate-600">{item.subject}</td>
                  <td className="px-4 py-3 text-slate-600">{item.total_questions}</td>
                  <td className="px-4 py-3">
                    <Badge variant={item.is_published ? "success" : "warning"}>
                      {item.is_published ? "Published" : "Draft"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="secondary" onClick={() => openEditModal(item)}>
                        Edit
                      </Button>
                      <Button type="button" variant="secondary" onClick={() => void handleTogglePublish(item)} disabled={saving}>
                        {item.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button type="button" variant="danger" onClick={() => void handleDelete(item)} disabled={saving}>
                        Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={createOpen}
        onClose={() => {
          setCreateOpen(false);
          resetCreateForm();
        }}
        title="Create Question Paper"
      >
        <QuestionPaperForm
          value={createValue}
          submitting={saving}
          onChange={setCreateValue}
          onSubmit={() => void handleCreate()}
          submitLabel="Create Paper"
        />
      </Modal>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Update Question Paper">
        <QuestionPaperForm
          value={editValue}
          submitting={saving}
          onChange={setEditValue}
          onSubmit={() => void handleUpdate()}
          submitLabel="Save Changes"
        />
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} title="Import Question Paper JSON">
        <div className="grid gap-4">
          <p className="text-sm text-slate-600">
            Paste a JSON payload shaped like {`{ paper: {...} }`}. The paper can include a questions array for bulk import.
          </p>
          <textarea
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            rows={18}
            className="min-h-[320px] w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none ring-0 transition placeholder:text-slate-400 focus:border-indigo-400"
          />
          <Button type="button" onClick={() => void handleImport()} disabled={saving}>
            {saving ? "Importing..." : "Import Paper"}
          </Button>
        </div>
      </Modal>
    </div>
  );
}