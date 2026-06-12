import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatPrice, formatStatus, zonedDateTimeToUtc } from "@/lib/utils";
import { VisitorTable } from "@/components/dashboard/visitor-table";
import { QRCodeDisplay } from "@/components/property/qr-code-display";
import { PhotoUpload } from "@/components/forms/photo-upload";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DeleteEventButton } from "@/components/dashboard/delete-event-button";
import { CsvExportButton } from "@/components/dashboard/csv-export-button";
import { PeakHoursChart } from "@/components/dashboard/peak-hours-chart";
import { PaymentBanner } from "@/components/dashboard/payment-banner";
import { SellerReportCard } from "@/components/dashboard/seller-report-card";
import { FollowUpStatusCard } from "@/components/dashboard/follow-up-status-card";

export default async function EventDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ payment?: string }>;
}) {
  const { id } = await params;
  const { payment } = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const safePayment = ["success", "cancelled"].includes(payment ?? "")
    ? payment
    : undefined;

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .eq("agent_id", user.id)
    .single();

  if (!event) {
    notFound();
  }

  const { data: visitors } = await supabase
    .from("visitors")
    .select("*")
    .eq("event_id", id)
    .order("signed_in_at", { ascending: false });

  const { data: analytics } = await supabase
    .from("event_analytics")
    .select("event_type")
    .eq("event_id", id);

  const { data: emailLogs } =
    event.status === "completed"
      ? await supabase.from("email_log").select("*").eq("event_id", id)
      : { data: null };

  const pageViews =
    analytics?.filter((a) => a.event_type === "page_view").length ?? 0;
  const signIns =
    analytics?.filter((a) => a.event_type === "sign_in").length ?? 0;

  const visitorsByType = {
    buyer: visitors?.filter((v) => v.visitor_type === "buyer").length ?? 0,
    neighbor: visitors?.filter((v) => v.visitor_type === "neighbor").length ?? 0,
    investor: visitors?.filter((v) => v.visitor_type === "investor").length ?? 0,
    other: visitors?.filter((v) => v.visitor_type === "other").length ?? 0,
  };

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const eventUrl = `${appUrl}/oh/${event.slug}`;
  const reportUrl = `${appUrl}/report/${event.report_token}`;

  // If payment just succeeded but webhook hasn't updated the DB yet, treat as active
  const displayStatus =
    safePayment === "success" && event.status === "pending_payment"
      ? "active"
      : event.status;

  return (
    <div>
      {/* Header */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h1 className="text-2xl font-bold">{event.property_address}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                displayStatus === "active"
                  ? "bg-green-500/10 text-green-500"
                  : displayStatus === "draft"
                    ? "bg-yellow-500/10 text-yellow-500"
                    : displayStatus === "pending_payment"
                      ? "bg-orange-500/10 text-orange-500"
                      : "bg-muted text-muted-foreground"
              }`}
            >
              {formatStatus(displayStatus)}
            </span>
          </div>
          <p className="text-muted-foreground">
            {event.city}, {event.state} {event.zip}
          </p>
          <p className="text-sm text-muted-foreground">
            {formatDate(event.date)} &middot; {formatTime(event.start_time)} -{" "}
            {formatTime(event.end_time)}
          </p>
          {event.price && (
            <p className="mt-1 text-lg font-semibold">
              {formatPrice(event.price)}
            </p>
          )}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <DeleteEventButton eventId={event.id} />
          <Link
            href={`/events/${event.id}/edit`}
            className="rounded-md border border-border px-4 py-2.5 text-center text-sm font-medium hover:bg-muted transition-colors"
          >
            Edit
          </Link>
          <a
            href={eventUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md bg-primary px-4 py-2.5 text-center text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            View Page
          </a>
        </div>
      </div>

      {/* Payment feedback */}
      {safePayment && <PaymentBanner status={safePayment} />}

      {/* Pending payment banner — only show if not just paid */}
      {displayStatus === "pending_payment" && (
        <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-500">
          This event is awaiting payment. Complete payment to activate it.
        </div>
      )}

      {/* Event ended banner */}
      {displayStatus === "active" && (() => {
        const endDateTime = zonedDateTimeToUtc(event.date, event.end_time, event.timezone);
        return endDateTime < new Date() ? (
          <div className="mb-6 rounded-lg border border-yellow-500/30 bg-yellow-500/5 px-4 py-3 text-sm text-yellow-500">
            This event has ended. It will be marked as completed automatically.
          </div>
        ) : null;
      })()}

      {/* Follow-up email status */}
      {event.status === "completed" && (
        <FollowUpStatusCard event={event} emailLogs={emailLogs ?? []} />
      )}

      {/* Stats */}
      <StatsCards
        pageViews={pageViews}
        signIns={signIns}
        visitorsByType={visitorsByType}
      />

      {/* QR Code + Photos */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">QR Code & Share Link</h2>
          <QRCodeDisplay url={eventUrl} />
        </div>
        <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Photos</h2>
          <PhotoUpload eventId={event.id} photos={event.photos} />
        </div>
      </div>

      {/* Seller Report */}
      {(displayStatus === "active" || displayStatus === "completed") && (
        <div className="mb-8">
          <SellerReportCard eventId={event.id} reportUrl={reportUrl} />
        </div>
      )}

      {/* Peak Hours */}
      {(visitors?.length ?? 0) >= 3 && (
        <div className="mb-8 rounded-lg border border-border bg-card p-4 sm:p-6">
          <h2 className="mb-4 text-lg font-semibold">Peak Hours</h2>
          <PeakHoursChart
            visitors={visitors!}
            startTime={event.start_time}
            endTime={event.end_time}
          />
        </div>
      )}

      {/* Visitors */}
      <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Visitors ({visitors?.length ?? 0})
          </h2>
          <CsvExportButton
            visitors={visitors ?? []}
            eventAddress={event.property_address}
          />
        </div>
        <VisitorTable eventId={event.id} initialVisitors={visitors ?? []} />
      </div>
    </div>
  );
}
