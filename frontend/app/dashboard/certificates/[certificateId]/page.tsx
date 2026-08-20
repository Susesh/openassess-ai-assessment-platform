"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Card, PageHeader } from "@/components/ui";
import { getCertificate } from "@/lib/api";
import { downloadCertificatePdf } from "@/lib/certificate-pdf";
import type { Certificate } from "@/lib/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString("en-GB");
}

export default function CertificatePage() {
  const params = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    getCertificate(params.certificateId)
      .then((cert) => {
        setCertificate(cert);
        if (!cert.qr_code_data_url) {
          generateQR(cert.certificate_id);
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load certificate");
      })
      .finally(() => setLoading(false));
  }, [params.certificateId]);

  async function generateQR(certId: string) {
    try {
      const QRCode = (await import("qrcode")).default;
      const verifyUrl = `${window.location.origin}/verify/${certId}`;
      const dataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
      setQrDataUrl(dataUrl);
    } catch {
      // qrcode failed silently
    }
  }

  async function handleShare() {
    const url = `${window.location.origin}/verify/${params.certificateId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      window.prompt("Copy this verification URL:", url);
    }
  }

  const displayQr = certificate?.qr_code_data_url ?? qrDataUrl;

  return (
    <div className="mx-auto max-w-5xl animate-fade-in-up">
      <PageHeader
        title="Certificate"
        description="View and download your OpenAssess certificate."
      />

      {loading ? <p className="text-slate-400">Loading certificate…</p> : null}
      {error ? (
        <p className="rounded-lg bg-red-500/10 border border-red-500/30 px-4 py-3 text-sm text-red-400">{error}</p>
      ) : null}

      {certificate ? (
        <>
          <Card className={`relative overflow-hidden p-8 text-center sm:p-12 ${
            certificate.certificate_type === "achievement"
              ? "border-emerald-500/50 bg-gradient-to-br from-[#070A11] via-emerald-950/30 to-[#0F172A] shadow-[0_0_60px_rgba(16,185,129,0.15)]"
              : "border-cyan-500/50 bg-gradient-to-br from-[#070A11] via-cyan-950/30 to-[#0F172A] shadow-[0_0_60px_rgba(6,182,212,0.15)]"
          }`}>
            {/* Glowing border effect */}
            <div className={`absolute inset-0 rounded-2xl opacity-50 ${
              certificate.certificate_type === "achievement"
                ? "bg-gradient-to-r from-emerald-500/20 via-transparent to-emerald-500/20"
                : "bg-gradient-to-r from-cyan-500/20 via-transparent to-cyan-500/20"
            }`} />
            
            <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-bold text-white shadow-lg ${
              certificate.certificate_type === "achievement"
                ? "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/50"
                : "bg-gradient-to-br from-cyan-500 to-cyan-600 shadow-cyan-500/50"
            }`}>
              {certificate.certificate_type === "achievement" ? "🏆" : "OA"}
            </div>
            <p className={`text-sm font-bold uppercase tracking-[0.24em] ${
              certificate.certificate_type === "achievement" ? "text-emerald-400" : "text-cyan-400"
            }`}>
              OpenAssess
            </p>
            <h1 className="mt-4 text-3xl font-bold text-white sm:text-4xl">
              {certificate.certificate_type === "achievement"
                ? "Certificate of Achievement"
                : "Certificate of Participation"}
            </h1>
            <p className="mt-8 text-sm text-slate-400">This certifies that</p>
            <p className="mt-2 text-3xl font-bold text-white">
              {certificate.student_name}
            </p>
            <p className="mt-6 text-sm text-slate-400">
              {certificate.certificate_type === "achievement"
                ? "has successfully achieved"
                : "participated in and completed"}
            </p>
            <p className={`mt-2 text-2xl font-bold ${
              certificate.certificate_type === "achievement" ? "text-emerald-400" : "text-cyan-400"
            }`}>
              {certificate.topic_name} Assessment
            </p>
            {certificate.certificate_type === "achievement" && (
              <p className="mt-4 text-sm text-slate-400">
                and demonstrated proficiency in the subject
              </p>
            )}
            <div className="mx-auto mt-8 grid max-w-xl gap-4 text-left sm:grid-cols-2">
              <div className={`rounded-xl p-4 border ${
                certificate.certificate_type === "achievement"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-cyan-500/10 border-cyan-500/30"
              }`}>
                <p className="text-xs font-semibold uppercase text-slate-400">Score</p>
                <p className="mt-1 text-xl font-bold text-white">
                  {certificate.score}/{certificate.total}
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${
                certificate.certificate_type === "achievement"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-cyan-500/10 border-cyan-500/30"
              }`}>
                <p className="text-xs font-semibold uppercase text-slate-400">Percentage</p>
                <p className={`mt-1 text-xl font-bold ${
                  certificate.certificate_type === "achievement" ? "text-emerald-400" : "text-cyan-400"
                }`}>
                  {certificate.percentage}%
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${
                certificate.certificate_type === "achievement"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-cyan-500/10 border-cyan-500/30"
              }`}>
                <p className="text-xs font-semibold uppercase text-slate-400">Certificate ID</p>
                <p className="mt-1 font-mono text-sm font-bold text-white">
                  {certificate.certificate_id}
                </p>
              </div>
              <div className={`rounded-xl p-4 border ${
                certificate.certificate_type === "achievement"
                  ? "bg-emerald-500/10 border-emerald-500/30"
                  : "bg-cyan-500/10 border-cyan-500/30"
              }`}>
                <p className="text-xs font-semibold uppercase text-slate-400">Date</p>
                <p className="mt-1 font-bold text-white">
                  {formatDate(certificate.issued_at)}
                </p>
              </div>
            </div>

            {/* QR Code */}
            <div className="mx-auto mt-8 flex flex-col items-center gap-2">
              <p className="text-xs font-medium text-slate-400">Scan to verify authenticity</p>
              <div className={`flex min-h-[100px] min-w-[100px] items-center justify-center rounded-lg border p-2 ${
                certificate.certificate_type === "achievement"
                  ? "border-emerald-500/30 bg-emerald-500/5"
                  : "border-cyan-500/30 bg-cyan-500/5"
              }`}>
                {displayQr ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={displayQr}
                    alt="Certificate verification QR code"
                    className="h-24 w-24"
                  />
                ) : (
                  <span className="text-xs font-semibold text-slate-500">
                    {loading ? "Generating QR…" : "QR unavailable"}
                  </span>
                )}
              </div>
              <p className="text-xs font-mono text-slate-500">{certificate.certificate_id}</p>
            </div>
          </Card>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              type="button"
              onClick={() => downloadCertificatePdf(certificate)}
              className={`inline-flex items-center justify-center rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition ${
                certificate.certificate_type === "achievement"
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 shadow-emerald-500/30"
                  : "bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-400 hover:to-cyan-500 shadow-cyan-500/30"
              }`}
            >
              ⬇ Download PDF
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-[#1E293B]/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-gray-800 hover:text-white"
            >
              {copied ? "✓ Copied!" : "🔗 Share Link"}
            </button>
            <Link
              href="/dashboard/certificates"
              className="inline-flex items-center justify-center rounded-xl border border-gray-700 bg-[#1E293B]/50 px-5 py-2.5 text-sm font-semibold text-slate-300 transition hover:bg-gray-800 hover:text-white"
            >
              Back to Certificates
            </Link>
          </div>
        </>
      ) : null}
    </div>
  );
}
