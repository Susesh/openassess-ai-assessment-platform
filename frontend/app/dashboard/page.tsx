"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IconArrowRight } from "@/components/icons";
import { TopicPerformance } from "@/components/topic-performance";
import { Badge, Card, PageHeader, ProgressBar, StatCard } from "@/components/ui";
import { useAuth } from "@/contexts/auth-context";
import { getAnalytics, getCertificates, getHeatmap } from "@/lib/api";
import { normalizeHeatmapItems } from "@/lib/heatmap";
import type { AnalyticsSummary, Certificate, HeatmapItem } from "@/lib/types";

export default function DashboardPage() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapItem[]>([]);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getAnalytics(), getHeatmap(), getCertificates()])
      .then(([summary, heat, certs]) => {
        setAnalytics(summary);
        setHeatmap(heat);
        setCertificates(certs);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load dashboard");
      })
      .finally(() => setLoading(false));
  }, []);

  const firstName = user?.full_name.split(" ")[0] ?? "Student";
  const uniqueHeatmap = normalizeHeatmapItems(heatmap);

  const stats = analytics
    ? [
        {
          label: "Completed Quizzes",
          value: String(analytics.total_attempts),
          change:
            analytics.total_attempts > 0
              ? `${analytics.topics_attempted} topic${analytics.topics_attempted === 1 ? "" : "s"}`
              : "Take your first quiz",
          progress: Math.min(100, analytics.total_attempts * 10),
        },
        {
          label: "Mastery Score",
          value: `${analytics.average_score}%`,
          change:
            analytics.strongest_topic
              ? `Strongest: ${analytics.strongest_topic}`
              : "No data yet",
          progress: analytics.average_score,
        },
        {
          label: "Pass Rate",
          value: `${analytics.pass_rate}%`,
          change:
            analytics.weakest_topic
              ? `Review: ${analytics.weakest_topic}`
              : "Keep practicing",
          progress: analytics.pass_rate,
        },
      ]
    : [];

  return (
    <div className="mx-auto max-w-7xl animate-fade-in-up">
      <PageHeader
        title={`Welcome back, ${firstName}!`}
        description="Track your progress, pick up where you left off, and keep building mastery."
        action={
          <Link
            href="/dashboard/assessment"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-blue-700 transition-colors"
          >
            Start Assessment
            <IconArrowRight />
          </Link>
        }
      />

      {error ? (
        <p className="mb-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700 border border-red-200">
          {error}
        </p>
      ) : null}

      {loading ? (
        <p className="text-gray-500">Loading dashboard…</p>
      ) : (
        <>
          <section className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {stats.map((stat, i) => (
              <div
                key={`${stat.label}-${i}`}
                className={`animate-fade-in-up stagger-${i + 1}`}
              >
                <StatCard {...stat} />
              </div>
            ))}
          </section>

          <div className="mt-8 grid gap-6 lg:grid-cols-5">
            <Card className="lg:col-span-3 p-6 border border-gray-200 shadow-sm">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Topic Mastery
                </h2>
                <Badge variant="brand">Live from API</Badge>
              </div>
              <TopicPerformance items={uniqueHeatmap} />
            </Card>

            <Card className="lg:col-span-2 p-6 border border-gray-200 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-900">
                Performance Summary
              </h2>
              {analytics && analytics.total_attempts > 0 ? (
                <ul className="space-y-4 text-sm">
                  <li className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Topics attempted</span>
                    <span className="font-semibold text-gray-900">
                      {analytics.topics_attempted}
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Average score</span>
                    <span className="font-semibold text-gray-900">
                      {analytics.average_score}%
                    </span>
                  </li>
                  <li className="flex justify-between border-b border-gray-100 pb-3">
                    <span className="text-gray-600">Strongest topic</span>
                    <span className="font-semibold text-green-700">
                      {analytics.strongest_topic ?? "—"}
                    </span>
                  </li>
                  <li className="flex justify-between">
                    <span className="text-gray-600">Weakest topic</span>
                    <span className="font-semibold text-amber-700">
                      {analytics.weakest_topic ?? "—"}
                    </span>
                  </li>
                </ul>
              ) : (
                <p className="text-sm text-gray-500">
                  Complete an assessment to see your performance summary.
                </p>
              )}
            </Card>
          </div>

          <Card className="mt-8 p-6 border border-gray-200 shadow-sm">
            <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Certificates
                </h2>
                <p className="text-sm text-gray-600">
                  Participation and achievement certificates earned
                </p>
              </div>
            </div>
            
            {certificates.length === 0 ? (
              <p className="text-sm text-gray-500">
                Complete an assessment to generate your first certificate.
              </p>
            ) : (
              <>
                <div className="mb-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                    <p className="text-xs font-semibold uppercase text-blue-700">
                      Participation Certificates
                    </p>
                    <p className="mt-2 text-2xl font-bold text-blue-900">
                      {certificates.filter(c => c.certificate_type === 'participation').length}
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-xs font-semibold uppercase text-green-700">
                      Achievement Certificates
                    </p>
                    <p className="mt-2 text-2xl font-bold text-green-900">
                      {certificates.filter(c => c.certificate_type === 'achievement').length}
                    </p>
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {certificates.slice(0, 3).map((certificate) => (
                    <div
                      key={certificate.certificate_id}
                      className={`rounded-lg border p-4 ${
                        certificate.certificate_type === 'achievement'
                          ? 'border-green-200 bg-green-50'
                          : 'border-blue-200 bg-blue-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {certificate.topic_name}
                          </p>
                          <p className="mt-1 text-xs font-medium text-gray-600">
                            {certificate.certificate_type === 'achievement' ? '🏆 Achievement' : '✓ Participation'}
                          </p>
                        </div>
                        <span className="inline-flex text-xs font-bold px-2 py-1 rounded-lg bg-white">
                          {certificate.percentage}%
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-gray-500">
                        {new Date(certificate.issued_at).toLocaleDateString()}
                      </p>
                      <Link
                        href={`/dashboard/certificates/${certificate.certificate_id}`}
                        className="mt-3 inline-flex text-sm font-semibold text-blue-600 hover:text-blue-700"
                      >
                        View Certificate
                      </Link>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Card>

          {uniqueHeatmap.length > 0 ? (
            <Card className="mt-8 p-6 border border-gray-200 shadow-sm">
              <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Topic Activity
                  </h2>
                  <p className="text-sm text-gray-600">
                    Attempts and average scores per topic
                  </p>
                </div>
                <Link
                  href="/dashboard/portfolio"
                  className="text-sm font-semibold text-blue-600 hover:text-blue-700"
                >
                  View portfolio →
                </Link>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {uniqueHeatmap.map((item, index) => (
                  <div
                    key={`${item.topic}-${index}`}
                    className="rounded-lg border border-gray-200 bg-gray-50 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-800">
                        {item.topic}
                      </span>
                      <span className="text-sm font-bold text-blue-600">
                        {item.avg_score}%
                      </span>
                    </div>
                    <div className="mt-2">
                      <ProgressBar value={item.avg_score} />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      {item.attempts} attempt{item.attempts === 1 ? "" : "s"}
                      {item.last_attempted
                        ? ` · Last: ${new Date(item.last_attempted).toLocaleDateString()}`
                        : ""}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
          ) : null}
        </>
      )}
    </div>
  );
}
