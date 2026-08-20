"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { portfolioService } from "@/services/portfolio.service";
import type { CertificateItem } from "@/types/portfolio.types";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState<CertificateItem[]>([]);

  useEffect(() => {
    portfolioService.getCertificates().then(setCertificates).catch(() => []);
  }, []);

  return (
    <div className="min-h-screen bg-[#F5F6F7]">
      <Navbar />
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <Sidebar />
        <main className="flex-1">
          <section className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.32em] text-[#7B7F85]">Certificates</p>
                <h1 className="mt-2 text-3xl font-semibold text-[#2B2E33]">Verified achievements</h1>
              </div>
              <Link href="/dashboard/portfolio" className="rounded-full border border-[#C1C4C8] px-5 py-2.5 text-sm font-semibold text-[#7B7F85] hover:text-[#2B2E33] hover:border-[#2B2E33] transition-colors">Back to portfolio</Link>
            </div>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              {certificates.length > 0 ? certificates.map((item) => (
                <div key={item.id} className="rounded-[24px] border border-[#C1C4C8] bg-[#F5F6F7] p-6">
                  <p className="text-lg font-semibold text-[#2B2E33]">{item.topic_name}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#2B2E33]">{item.score}%</span>
                    <span className="text-sm text-[#7B7F85]">{item.issued_at}</span>
                  </div>
                </div>
              )) : <div className="md:col-span-2 rounded-[20px] border border-dashed border-[#C1C4C8] bg-[#F5F6F7] p-6 text-center text-[#7B7F85]">No certificates yet.</div>}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

