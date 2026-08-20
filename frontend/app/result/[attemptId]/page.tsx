"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { portfolioService } from "@/services/portfolio.service";
import { quizService } from "@/services/quiz.service";

export default function ResultPage() {
  const params = useParams<{ attemptId: string }>();
  const attemptId = params?.attemptId ?? "";
  const [result, setResult] = useState<any>(null);
  const [certificate, setCertificate] = useState<any>(null);

  useEffect(() => {
    setResult({ score: 0, passed: false, attempts: 0 });
    portfolioService.getCertificates().then((data) => {
      const match = Array.isArray(data) ? data.find((item: any) => String(item.id) === String(attemptId)) : undefined;
      if (match) setCertificate(match);
    }).catch(() => undefined);
  }, [attemptId]);

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-8 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#7B7F85]">Assessment complete</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#2B2E33]">Your results are ready</h1>
            {result ? (
              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_0.8fr]">
                <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6">
                  <p className="text-sm text-[#7B7F85]">Score</p>
                  <p className="mt-2 text-4xl font-semibold text-[#2B2E33]">{result.score ?? result.average_score ?? 0}%</p>
                  <p className="mt-4 text-[#7B7F85]">{result.passed ? "Excellent work — you passed this assessment." : "You can review the gaps and retake the quiz."}</p>
                </div>
                <div className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6">
                  <p className="text-sm font-semibold text-[#7B7F85]">Certificate</p>
                  {certificate ? <p className="mt-2 text-[#7B7F85]">Issued: {certificate.issue_date ?? certificate.issued_at ?? "—"}</p> : <p className="mt-2 text-[#7B7F85]">A certificate will appear here after review.</p>}
                </div>
              </div>
            ) : <div className="mt-8 text-[#7B7F85]">Loading results…</div>}
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/dashboard" className="rounded-full bg-[#2B2E33] px-5 py-3 font-semibold text-[#F5F6F7] hover:bg-[#2B2E33]/90">Return to dashboard</Link>
              <Link href="/dashboard/portfolio" className="rounded-full border border-[#C1C4C8] px-5 py-3 font-semibold text-[#7B7F85] hover:text-[#2B2E33] hover:border-[#2B2E33]">View portfolio</Link>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
