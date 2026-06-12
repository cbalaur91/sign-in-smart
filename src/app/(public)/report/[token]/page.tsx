import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Image from "next/image";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { buildTimeBuckets } from "@/lib/peak-hours";
import {
  EngagementTimeline,
  PeakTrafficBars,
  VisitorTypeBreakdown,
} from "@/components/report/report-charts";
import { DownloadPdfButton } from "@/components/report/download-pdf-button";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* Editorial document palette — intentionally light, unlike the dashboard */
const PAPER = "#f7f4ee";
const INK = "#1d2433";
const MUTED = "#5d6b81";
const HAIRLINE = "#e3ddd0";
const ACCENT = "#3b82f6";
const SERIF = { fontFamily: "'Fraunces', Georgia, 'Times New Roman', serif" };

export const metadata: Metadata = {
  title: "Open House Report — SignInSmart",
  robots: { index: false, follow: false },
};

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-center gap-3">
      <h2
        className="text-xs font-semibold uppercase tracking-[0.22em]"
        style={{ color: ACCENT }}
      >
        {children}
      </h2>
      <div className="h-px flex-1" style={{ backgroundColor: HAIRLINE }} />
    </div>
  );
}

export default async function SellerReportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  if (!UUID_RE.test(token)) notFound();

  // The unguessable token IS the access control (122-bit UUID, agent-rotatable)
  const supabase = createAdminClient();
  const { data: event } = await supabase
    .from("events")
    .select(
      "id, agent_id, property_address, city, state, zip, date, start_time, end_time, price, bedrooms, bathrooms, sqft, photos",
    )
    .eq("report_token", token)
    .single();

  if (!event) notFound();

  const [{ data: agent }, { data: visitors }, { data: analytics }] =
    await Promise.all([
      supabase
        .from("agents")
        .select("full_name, email, phone, brokerage")
        .eq("id", event.agent_id)
        .single(),
      supabase
        .from("visitors")
        .select("visitor_type, signed_in_at")
        .eq("event_id", event.id),
      supabase
        .from("event_analytics")
        .select("event_type, created_at")
        .eq("event_id", event.id),
    ]);

  const pageViews =
    analytics?.filter((a) => a.event_type === "page_view") ?? [];
  const totalSignIns = visitors?.length ?? 0;
  const hasData = totalSignIns > 0 || pageViews.length > 0;

  const typeCounts = {
    buyer: visitors?.filter((v) => v.visitor_type === "buyer").length ?? 0,
    neighbor:
      visitors?.filter((v) => v.visitor_type === "neighbor").length ?? 0,
    investor:
      visitors?.filter((v) => v.visitor_type === "investor").length ?? 0,
    other: visitors?.filter((v) => v.visitor_type === "other").length ?? 0,
  };

  const conversion =
    pageViews.length > 0
      ? Math.min(Math.round((totalSignIns / pageViews.length) * 100), 100)
      : null;

  const trafficBuckets = buildTimeBuckets(
    (visitors ?? []).map((v) => v.signed_in_at),
    event.start_time,
    event.end_time,
  );

  // Page views per day (marketing reach in the run-up to the event)
  const viewsByDay = new Map<string, { label: string; count: number }>();
  for (const view of [...pageViews].sort((a, b) =>
    a.created_at.localeCompare(b.created_at),
  )) {
    const d = new Date(view.created_at);
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    const existing = viewsByDay.get(key);
    if (existing) existing.count++;
    else viewsByDay.set(key, { label, count: 1 });
  }
  const timelineDays = [...viewsByDay.values()].slice(-14);

  const propertyFacts = [
    event.bedrooms ? `${event.bedrooms} Beds` : null,
    event.bathrooms ? `${event.bathrooms} Baths` : null,
    event.sqft ? `${event.sqft.toLocaleString()} sqft` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  const stats: { label: string; value: string; hint?: string }[] = [
    { label: "Sign-ins", value: String(totalSignIns) },
    { label: "Page views", value: String(pageViews.length) },
    {
      label: "Online → door",
      value: conversion != null ? `${conversion}%` : "—",
      hint: "of online viewers signed in",
    },
    { label: "Buyer leads", value: String(typeCounts.buyer) },
  ];

  const generatedOn = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div
      className="report-root min-h-screen"
      style={{ backgroundColor: PAPER, color: INK }}
    >
      {/* react hoists these into <head> */}
      <link
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&display=swap"
        rel="stylesheet"
      />
      <style>{`
        @media print {
          @page { margin: 12mm; }
          .report-root { background: #ffffff !important; }
          .report-section { break-inside: avoid; }
        }
      `}</style>

      <div className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
        {/* Masthead */}
        <header className="report-section">
          <div className="flex items-start justify-between gap-4">
            <p
              className="text-xs font-semibold uppercase tracking-[0.28em]"
              style={{ color: ACCENT }}
            >
              Open House Report
            </p>
            <DownloadPdfButton />
          </div>
          <h1
            className="mt-3 text-3xl leading-tight sm:text-[2.6rem]"
            style={{ ...SERIF, fontWeight: 600 }}
          >
            {event.property_address}
          </h1>
          <p className="mt-1 text-base" style={{ color: MUTED }}>
            {event.city}, {event.state} {event.zip}
            {event.price ? ` · ${formatPrice(event.price)}` : ""}
            {propertyFacts ? ` · ${propertyFacts}` : ""}
          </p>
          <p className="mt-1 text-sm" style={{ color: MUTED }}>
            {formatDate(event.date)} · {formatTime(event.start_time)} –{" "}
            {formatTime(event.end_time)}
          </p>

          {/* Agent strip */}
          {agent && (
            <div
              className="mt-6 flex flex-wrap items-baseline gap-x-2 gap-y-1 border-y py-3 text-sm"
              style={{ borderColor: HAIRLINE }}
            >
              <span style={{ color: MUTED }}>Prepared by</span>
              <span className="font-semibold">{agent.full_name}</span>
              {agent.brokerage && (
                <span style={{ color: MUTED }}>· {agent.brokerage}</span>
              )}
              {agent.phone && (
                <span style={{ color: MUTED }}>· {agent.phone}</span>
              )}
              <span style={{ color: MUTED }}>· {agent.email}</span>
            </div>
          )}
        </header>

        {/* Hero photo */}
        {event.photos[0] && (
          <div className="report-section relative mt-8 aspect-[16/9] overflow-hidden rounded-lg">
            <Image
              src={event.photos[0]}
              alt={event.property_address}
              fill
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
              priority
            />
          </div>
        )}

        {!hasData ? (
          <div
            className="report-section mt-10 rounded-lg border px-6 py-12 text-center"
            style={{ borderColor: HAIRLINE, backgroundColor: "#ffffff" }}
          >
            <p className="text-lg" style={{ ...SERIF, fontWeight: 600 }}>
              This report will populate after your open house.
            </p>
            <p className="mt-2 text-sm" style={{ color: MUTED }}>
              Visitor sign-ins, traffic, and engagement will appear here once
              the event begins.
            </p>
          </div>
        ) : (
          <>
            {/* Headline stats */}
            <section className="report-section mt-10">
              <div
                className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border sm:grid-cols-4"
                style={{ borderColor: HAIRLINE, backgroundColor: HAIRLINE }}
              >
                {stats.map((stat) => (
                  <div
                    key={stat.label}
                    className="px-5 py-4"
                    style={{ backgroundColor: "#ffffff" }}
                  >
                    <p
                      className="text-3xl tabular-nums"
                      style={{ ...SERIF, fontWeight: 600 }}
                    >
                      {stat.value}
                    </p>
                    <p
                      className="mt-1 text-xs font-medium uppercase tracking-wider"
                      style={{ color: MUTED }}
                    >
                      {stat.label}
                    </p>
                    {stat.hint && (
                      <p className="mt-0.5 text-[11px]" style={{ color: MUTED }}>
                        {stat.hint}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Who came through */}
            {totalSignIns > 0 && (
              <section className="report-section mt-10">
                <SectionHeading>Who came through</SectionHeading>
                <VisitorTypeBreakdown counts={typeCounts} />
              </section>
            )}

            {/* Peak traffic */}
            {totalSignIns > 0 && (
              <section className="report-section mt-10">
                <SectionHeading>Peak traffic</SectionHeading>
                <PeakTrafficBars buckets={trafficBuckets} />
              </section>
            )}

            {/* Marketing reach */}
            {timelineDays.length > 0 && (
              <section className="report-section mt-10">
                <SectionHeading>Online reach by day</SectionHeading>
                <p className="mb-4 text-sm" style={{ color: MUTED }}>
                  Views of the property page before and during the open house.
                </p>
                <EngagementTimeline days={timelineDays} />
              </section>
            )}
          </>
        )}

        {/* Footer */}
        <footer
          className="mt-12 border-t pt-4 text-xs"
          style={{ borderColor: HAIRLINE, color: MUTED }}
        >
          Prepared by {agent?.full_name ?? "your agent"} with SignInSmart ·
          Generated {generatedOn}
        </footer>
      </div>
    </div>
  );
}
