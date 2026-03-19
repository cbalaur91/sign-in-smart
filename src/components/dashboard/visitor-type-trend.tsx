const typeConfig: Record<string, { label: string; color: string }> = {
  buyer: { label: "Buyers", color: "bg-blue-500" },
  neighbor: { label: "Neighbors", color: "bg-purple-500" },
  investor: { label: "Investors", color: "bg-green-500" },
  other: { label: "Other", color: "bg-zinc-500" },
};

type TypeCounts = Record<string, number>;

export function VisitorTypeTrend({
  allTypeCounts,
  latestEventTypeCounts,
  latestEventName,
}: {
  allTypeCounts: TypeCounts;
  latestEventTypeCounts: TypeCounts | null;
  latestEventName: string | null;
}) {
  const total = Object.values(allTypeCounts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  const types = Object.keys(typeConfig);

  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold">Visitor Breakdown</h2>

      {/* Stacked bar */}
      <div className="mb-3 flex h-4 overflow-hidden rounded-full">
        {types.map((type) => {
          const count = allTypeCounts[type] ?? 0;
          const pct = (count / total) * 100;
          if (pct === 0) return null;
          return (
            <div
              key={type}
              className={`${typeConfig[type]!.color} opacity-70`}
              style={{ width: `${pct}%` }}
              title={`${typeConfig[type]!.label}: ${count} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Legend */}
      <div className="mb-4 flex flex-wrap gap-4">
        {types.map((type) => {
          const count = allTypeCounts[type] ?? 0;
          const pct = total > 0 ? Math.round((count / total) * 100) : 0;
          return (
            <div key={type} className="flex items-center gap-1.5 text-xs">
              <span className={`inline-block h-2.5 w-2.5 rounded-full ${typeConfig[type]!.color}`} />
              <span className="text-muted-foreground">
                {typeConfig[type]!.label} {pct}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Latest event comparison */}
      {latestEventTypeCounts && latestEventName && (() => {
        const latestTotal = Object.values(latestEventTypeCounts).reduce((a, b) => a + b, 0);
        if (latestTotal === 0) return null;

        const insights: string[] = [];
        for (const type of types) {
          const overallPct = total > 0 ? ((allTypeCounts[type] ?? 0) / total) * 100 : 0;
          const latestPct = latestTotal > 0 ? ((latestEventTypeCounts[type] ?? 0) / latestTotal) * 100 : 0;
          const diff = Math.round(latestPct - overallPct);
          if (Math.abs(diff) >= 10) {
            insights.push(
              `${diff > 0 ? "+" : ""}${diff}% ${typeConfig[type]!.label.toLowerCase()}`
            );
          }
        }

        if (insights.length === 0) return null;

        return (
          <p className="text-xs text-muted-foreground">
            Your latest event had {insights.join(", ")} vs your overall average.
          </p>
        );
      })()}
    </div>
  );
}
