import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatStatus } from "@/lib/utils";
import { EventComparison } from "@/components/dashboard/event-comparison";
import { VisitorTypeTrend } from "@/components/dashboard/visitor-type-trend";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("agent_id", user.id)
    .order("date", { ascending: false })
    .limit(5);

  const { count: totalEvents } = await supabase
    .from("events")
    .select("*", { count: "exact", head: true })
    .eq("agent_id", user.id);

  // Get ALL agent events for analytics
  const { data: allEvents } = await supabase
    .from("events")
    .select("id, property_address")
    .eq("agent_id", user.id);

  const eventIds = allEvents?.map((e) => e.id) ?? [];

  let totalVisitors = 0;
  let visitors: { event_id: string; visitor_type: string }[] = [];
  let analytics: { event_id: string; event_type: string }[] = [];

  if (eventIds.length > 0) {
    const [visitorResult, analyticsResult] = await Promise.all([
      supabase
        .from("visitors")
        .select("event_id, visitor_type")
        .in("event_id", eventIds),
      supabase
        .from("event_analytics")
        .select("event_id, event_type")
        .in("event_id", eventIds),
    ]);

    visitors = visitorResult.data ?? [];
    analytics = analyticsResult.data ?? [];
    totalVisitors = visitors.length;
  }

  // Build event performance data
  const eventPerformance = (allEvents ?? []).map((e) => ({
    id: e.id,
    property_address: e.property_address,
    visitors: visitors.filter((v) => v.event_id === e.id).length,
    pageViews: analytics.filter(
      (a) => a.event_id === e.id && a.event_type === "page_view",
    ).length,
  }));

  // Build visitor type counts (all events)
  const allTypeCounts: Record<string, number> = {
    buyer: 0,
    neighbor: 0,
    investor: 0,
    other: 0,
  };
  for (const v of visitors) {
    const key = v.visitor_type in allTypeCounts ? v.visitor_type : "other";
    allTypeCounts[key]!++;
  }

  // Latest event type counts
  const latestEvent = events?.[0] ?? null;
  let latestEventTypeCounts: Record<string, number> | null = null;
  if (latestEvent) {
    latestEventTypeCounts = { buyer: 0, neighbor: 0, investor: 0, other: 0 };
    for (const v of visitors.filter((v) => v.event_id === latestEvent.id)) {
      const key =
        v.visitor_type in latestEventTypeCounts ? v.visitor_type : "other";
      latestEventTypeCounts[key]!++;
    }
  }

  // Check if user needs to pay for future open houses
  const { data: agent } = await supabase
    .from("agents")
    .select("credits")
    .eq("id", user.id)
    .single();

  const activeCompletedCount =
    events?.filter((e) => e.status === "active" || e.status === "completed")
      .length ?? 0;
  const showPricingBanner =
    activeCompletedCount >= 1 && (agent?.credits ?? 0) === 0;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <Link
          href="/events/new"
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Open House
        </Link>
      </div>

      {/* Stats */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Events</p>
          <p className="mt-1 text-3xl font-bold">{totalEvents ?? 0}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Total Visitors</p>
          <p className="mt-1 text-3xl font-bold">{totalVisitors}</p>
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <p className="text-sm text-muted-foreground">Active Events</p>
          <p className="mt-1 text-3xl font-bold">
            {events?.filter((e) => e.status === "active").length ?? 0}
          </p>
        </div>
      </div>

      {/* Pricing awareness */}
      {showPricingBanner && (
        <div className="mb-8 rounded-lg border border-blue-500/30 bg-blue-500/5 px-4 py-3 text-sm text-blue-400">
          Your free open house has been used. Additional open houses are{" "}
          <span className="font-semibold text-blue-300">$9.99 each</span>.
        </div>
      )}

      {/* Analytics */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-border bg-card p-6">
          <VisitorTypeTrend
            allTypeCounts={allTypeCounts}
            latestEventTypeCounts={latestEventTypeCounts}
            latestEventName={latestEvent?.property_address ?? null}
          />
        </div>
        <div className="rounded-lg border border-border bg-card p-6">
          <EventComparison events={eventPerformance} />
        </div>
      </div>

      {/* Recent Events */}
      <div>
        <h2 className="mb-4 text-lg font-semibold">Recent Events</h2>
        {!events || events.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <p className="text-muted-foreground">No events yet.</p>
            <Link
              href="/events/new"
              className="mt-2 inline-block text-sm text-primary hover:underline"
            >
              Create your first open house
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {events.map((event) => (
              <Link
                key={event.id}
                href={`/events/${event.id}`}
                className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{event.property_address}</p>
                    <p className="text-sm text-muted-foreground">
                      {event.city}, {event.state} {event.zip}
                    </p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                        event.status === "active"
                          ? "bg-green-500/10 text-green-500"
                          : event.status === "draft"
                            ? "bg-yellow-500/10 text-yellow-500"
                            : event.status === "pending_payment"
                              ? "bg-orange-500/10 text-orange-500"
                              : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {formatStatus(event.status)}
                    </span>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {formatDate(event.date)}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
