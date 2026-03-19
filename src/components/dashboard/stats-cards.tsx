export function StatsCards({
  pageViews,
  signIns,
  visitorsByType,
}: {
  pageViews: number;
  signIns: number;
  visitorsByType: {
    buyer: number;
    neighbor: number;
    investor: number;
    other: number;
  };
}) {
  const totalVisitors = Object.values(visitorsByType).reduce((a, b) => a + b, 0);
  const conversionRate =
    pageViews > 0 ? Math.round((signIns / pageViews) * 100) : 0;

  return (
    <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-5">
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Page Views</p>
        <p className="mt-1 text-2xl font-bold">{pageViews}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Sign-ins</p>
        <p className="mt-1 text-2xl font-bold">{totalVisitors}</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Conversion</p>
        <p className="mt-1 text-2xl font-bold">{conversionRate}%</p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4">
        <p className="text-xs text-muted-foreground">Buyers</p>
        <p className="mt-1 text-2xl font-bold text-blue-500">
          {visitorsByType.buyer}
        </p>
      </div>
      <div className="rounded-lg border border-border bg-card p-4 col-span-2 md:col-span-1">
        <p className="text-xs text-muted-foreground">Investors</p>
        <p className="mt-1 text-2xl font-bold text-green-500">
          {visitorsByType.investor}
        </p>
      </div>
    </div>
  );
}
