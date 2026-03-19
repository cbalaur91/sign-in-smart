import Link from "next/link";

type EventPerformance = {
  id: string;
  property_address: string;
  visitors: number;
  pageViews: number;
};

export function EventComparison({ events }: { events: EventPerformance[] }) {
  if (events.length < 2) return null;

  const avgVisitors =
    events.reduce((sum, e) => sum + e.visitors, 0) / events.length;

  const sorted = [...events].sort((a, b) => b.visitors - a.visitors);
  const maxVisitors = Math.max(...events.map((e) => e.visitors), 1);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Event Performance</h2>
      <div className="space-y-3">
        {sorted.map((event) => {
          const conversionRate =
            event.pageViews > 0
              ? Math.round((event.visitors / event.pageViews) * 100)
              : 0;
          const vsAvg =
            avgVisitors > 0
              ? Math.round(((event.visitors - avgVisitors) / avgVisitors) * 100)
              : 0;

          return (
            <Link
              key={event.id}
              href={`/events/${event.id}`}
              className="block rounded-lg border border-border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <div className="mb-2 flex items-center justify-between">
                <p className="text-sm font-medium truncate pr-4">
                  {event.property_address}
                </p>
                <span
                  className={`shrink-0 text-xs font-medium ${
                    vsAvg > 0
                      ? "text-green-500"
                      : vsAvg < 0
                        ? "text-red-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {vsAvg > 0 ? "+" : ""}
                  {vsAvg}% vs avg
                </span>
              </div>
              <div className="mb-2 h-2 rounded-full bg-muted/30 overflow-hidden">
                <div
                  className="h-full rounded-full bg-blue-500/70"
                  style={{
                    width: `${(event.visitors / maxVisitors) * 100}%`,
                  }}
                />
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>{event.visitors} visitors</span>
                <span>{event.pageViews} views</span>
                <span>{conversionRate}% conversion</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
