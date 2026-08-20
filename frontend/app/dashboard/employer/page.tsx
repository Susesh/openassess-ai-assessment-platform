"use client";

import { useState } from "react";
import { Button, Card, Input, PageHeader } from "@/components/ui";
import { getCertificate } from "@/lib/api";
import type { Certificate } from "@/lib/types";

export default function EmployerPortalPage() {
  const [certificateId, setCertificateId] = useState("");
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    if (!certificateId.trim()) return;
    setError(null);
    setCertificate(null);
    setVerified(false);
    setLoading(true);
    try {
      const cert = await getCertificate(certificateId.trim());
      setCertificate(cert);
      setVerified(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Certificate not found or invalid ID"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl animate-fade-in-up space-y-10 py-8">
      {/* Hero */}
      <div className="rounded-3xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-700 px-8 py-12 text-center text-white">
        <span className="text-5xl">🏢</span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight">Employer Portal</h1>
        <p className="mt-3 max-w-xl mx-auto text-indigo-100">
          Verify candidate certificates, check their scores, and confirm authenticity — instantly and securely.
        </p>
      </div>

      {/* Verification Tool */}
      <Card className="p-8">
        <h2 className="mb-2 text-xl font-bold text-slate-900">
          Certificate Verification
        </h2>
        <p className="mb-6 text-sm text-slate-500">
          Enter a certificate ID provided by the candidate to verify its authenticity.
        </p>

        <form onSubmit={handleVerify} className="flex flex-col gap-4 sm:flex-row">
          <Input
            type="text"
            placeholder="e.g. CERT-ABC123 or OA-2024-XXXX"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            className="flex-1"
            aria-label="Certificate ID"
          />
          <Button type="submit" disabled={loading || !certificateId.trim()}>
            {loading ? "Verifying…" : "Verify Certificate"}
          </Button>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-3 rounded-xl bg-red-50 px-4 py-3">
            <span className="text-2xl">❌</span>
            <div>
              <p className="font-semibold text-red-900">Verification Failed</p>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {verified && certificate && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-6">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">✅</span>
              <div>
                <p className="font-bold text-emerald-900 text-lg">Certificate Verified</p>
                <p className="text-sm text-emerald-700">This is an authentic OpenAssess certificate.</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <CertField label="Candidate Name" value={certificate.student_name} />
              <CertField label="Topic" value={certificate.topic_name} />
              <CertField
                label="Certificate Type"
                value={certificate.certificate_type === "achievement" ? "🏆 Achievement" : "📜 Participation"}
              />
              <CertField label="Score" value={`${certificate.score}/${certificate.total} (${certificate.percentage}%)`} />
              <CertField label="Certificate ID" value={certificate.certificate_id} mono />
              <CertField
                label="Issued Date"
                value={new Date(certificate.issued_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
            </div>

            <div className="mt-4 flex gap-3">
              <span
                className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
                  certificate.certificate_type === "achievement"
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {certificate.percentage >= 80 ? "HIGH COMPETENCE" : "PARTICIPATED"}
              </span>
              {certificate.percentage >= 80 && (
                <span className="rounded-full bg-emerald-100 px-4 py-1.5 text-sm font-semibold text-emerald-700">
                  PASS ✓
                </span>
              )}
            </div>
          </div>
        )}
      </Card>

      {/* How it works */}
      <Card className="p-8">
        <h2 className="mb-6 text-xl font-bold text-slate-900">How to Verify</h2>
        <ol className="space-y-4">
          {[
            {
              step: "1",
              title: "Request Certificate ID",
              desc: "Ask the candidate to provide their certificate ID (format: OA-YYYY-XXXX).",
            },
            {
              step: "2",
              title: "Enter the ID above",
              desc: "Paste the certificate ID into the verification field and click Verify.",
            },
            {
              step: "3",
              title: "Review verified details",
              desc: "Instantly see the candidate name, topic, score, and certificate type.",
            },
          ].map((item) => (
            <li key={item.step} className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white">
                {item.step}
              </div>
              <div>
                <p className="font-semibold text-slate-900">{item.title}</p>
                <p className="text-sm text-slate-600">{item.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </Card>
    </div>
  );
}

function CertField({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-xl bg-white p-4 ring-1 ring-emerald-200">
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-600">{label}</p>
      <p className={`mt-1 font-semibold text-slate-900 ${mono ? "font-mono text-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}
