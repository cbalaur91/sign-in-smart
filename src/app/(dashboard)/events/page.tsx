import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatPrice, formatStatus } from "@/lib/utils";
import { EventStatusAction } from "@/components/events/event-status-action";

export default async function EventsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("agent_id", user.id)
    .order("date", { ascending: false });

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Open Houses</h1>
        <Link
          href="/events/new"
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          + New Open House
        </Link>
      </div>

      {!events || events.length === 0 ? (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <p className="text-lg font-medium">No open houses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first open house to start capturing leads.
          </p>
          <Link
            href="/events/new"
            className="mt-4 inline-block rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Create Open House
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="group relative rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/50"
            >
              <Link
                href={`/events/${event.id}`}
                className="absolute inset-0 z-0"
                aria-label={`View ${event.property_address}`}
              />

              <div className="mb-3 flex items-start justify-between">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
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
                {event.price && (
                  <span className="text-sm font-medium">
                    {formatPrice(event.price)}
                  </span>
                )}
              </div>

              <p className="font-medium group-hover:text-primary transition-colors">
                {event.property_address}
              </p>
              <p className="text-sm text-muted-foreground">
                {event.city}, {event.state} {event.zip}
              </p>

              <div className="mt-3 flex items-end justify-between gap-2">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{formatDate(event.date)}</span>
                  {event.bedrooms && <span>{event.bedrooms} bed</span>}
                  {event.bathrooms && <span>{event.bathrooms} bath</span>}
                  {event.sqft && <span>{event.sqft.toLocaleString()} sqft</span>}
                </div>
                <EventStatusAction eventId={event.id} status={event.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
