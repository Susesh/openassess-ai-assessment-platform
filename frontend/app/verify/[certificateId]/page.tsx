"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getCertificate } from "@/lib/api";
import type { Certificate } from "@/lib/types";

export default function PublicVerifyPage() {
  const params = useParams<{ certificateId: string }>();
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getCertificate(params.certificateId)
      .then(setCertificate)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [params.certificateId]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="mt-3 text-sm text-slate-500">Verifying certificate…</p>
        </div>
      </div>
    );
  }

  if (notFound || !certificate) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="max-w-sm text-center">
          <span className="text-6xl">❌</span>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">Certificate Not Found</h1>
          <p className="mt-2 text-slate-500">
            The certificate ID "{params.certificateId}" is not valid or does not exist in our system.
          </p>
          <Link
            href="/"
            className="mt-6 inline-block rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Go to OpenAssess
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-2xl font-bold text-white">
            OA
          </div>
          <h1 className="mt-3 text-xl font-bold text-slate-900">OpenAssess</h1>
          <p className="text-sm text-slate-500">Certificate Verification Portal</p>
        </div>

        {/* Verified Banner */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-50 px-6 py-4 ring-1 ring-emerald-200">
          <span className="text-3xl">✅</span>
          <div>
            <p className="font-bold text-emerald-900">Authentic Certificate</p>
            <p className="text-sm text-emerald-700">
              Verified in OpenAssess database — {new Date().toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Certificate Card */}
        <div className="rounded-2xl border border-indigo-200 bg-white shadow-md">
          <div className="bg-gradient-to-r from-indigo-600 to-violet-600 rounded-t-2xl px-6 py-5 text-center text-white">
            <p className="text-xs font-bold uppercase tracking-widest opacity-80">
              OpenAssess
            </p>
            <h2 className="mt-1 text-xl font-bold">
              {certificate.certificate_type === "achievement"
                ? "Certificate of Achievement"
                : "Certificate of Participation"}
            </h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Candidate" value={certificate.student_name} />
              <Field label="Topic" value={certificate.topic_name} />
              <Field
                label="Score"
                value={`${certificate.score}/${certificate.total} · ${certificate.percentage}%`}
              />
              <Field
                label="Issued"
                value={new Date(certificate.issued_at).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              />
              <Field label="Certificate ID" value={certificate.certificate_id} mono className="sm:col-span-2" />
            </div>

            <div className="flex gap-2 pt-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  certificate.percentage >= 80
                    ? "bg-emerald-600 text-white"
                    : "bg-indigo-600 text-white"
                }`}
              >
                {certificate.percentage >= 80 ? "PASS" : "PARTICIPATED"}
              </span>
              {certificate.certificate_type === "achievement" && (
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">
                  🏆 ACHIEVEMENT
                </span>
              )}
            </div>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          This certificate is cryptographically verified by OpenAssess.{" "}
          <Link href="/" className="text-indigo-600 hover:underline">
            Learn more
          </Link>
        </p>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  mono = false,
  className = "",
}: {
  label: string;
  value: string;
  mono?: boolean;
  className?: string;
}) {
  return (
    <div className={`rounded-xl bg-slate-50 p-3 ${className}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className={`mt-0.5 font-semibold text-slate-900 ${mono ? "font-mono text-sm" : ""}`}>
        {value}
      </p>
    </div>
  );
}
