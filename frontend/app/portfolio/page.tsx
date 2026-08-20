"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { portfolioService } from "@/services/portfolio.service";
import type { CertificateItem } from "@/types/portfolio.types";

interface PortfolioSummary {
  badges: number;
  certificates: number;
  verified_by: string;
}

export default function PortfolioPage() {
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);

  useEffect(() => {
    portfolioService.getCertificates().then((items) => {
      setCertificates(items);
      setSummary({
        badges: Math.max(0, items.length),
        certificates: items.length,
        verified_by: "OpenAssess",
      });
    }).catch(() => []);
  }, []);

  return (
    <div className="min-h-screen bg-[#F8FAFF]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <section className="rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_2px_16px_rgba(13,27,42,0.08)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#1A56DB]">Portfolio</p>
                <h1 className="mt-2 text-3xl font-semibold text-[#0D1B2A]">Your professional evidence trail</h1>
              </div>
              <Link href="/dashboard/certificates" className="rounded-full bg-[#1A56DB] px-5 py-2.5 text-sm font-semibold text-white">View certificates</Link>
            </div>
            {summary ? <div className="mt-6 grid gap-4 md:grid-cols-3">
              <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFF] p-4"><p className="text-sm text-slate-600">Skill badges</p><p className="mt-2 text-2xl font-semibold text-[#0D1B2A]">{summary.badges}</p></div>
              <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFF] p-4"><p className="text-sm text-slate-600">Certificates</p><p className="mt-2 text-2xl font-semibold text-[#0D1B2A]">{summary.certificates}</p></div>
              <div className="rounded-[20px] border border-slate-200 bg-[#F8FAFF] p-4"><p className="text-sm text-slate-600">Verified by</p><p className="mt-2 text-2xl font-semibold text-[#0D1B2A]">{summary.verified_by}</p></div>
            </div> : null}
          </section>

          <section className="mt-6 rounded-[24px] border border-slate-200 bg-white p-6 shadow-[0_2px_16px_rgba(13,27,42,0.08)]">
            <h2 className="text-lg font-semibold text-[#0D1B2A]">Certificates</h2>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              {certificates.length > 0 ? certificates.map((item) => (
                <div key={item.id} className="rounded-[20px] border border-slate-200 bg-[#F8FAFF] p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{item.topic_name}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-sm font-semibold text-[#1A56DB]">{item.score}%</span>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">Issued on {item.issued_at}</p>
                </div>
              )) : <div className="md:col-span-2 rounded-[20px] border border-dashed border-slate-200 bg-[#F8FAFF] p-6 text-center text-slate-600">No certificates yet. Complete an assessment to generate your first one.</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
