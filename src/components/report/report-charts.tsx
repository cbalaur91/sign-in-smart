import type { TimeBucket } from "@/lib/peak-hours";

/* Light editorial palette for the seller-facing report document */
const INK = "#1d2433";
const MUTED = "#5d6b81";
const TRACK = "#ece7db";

const TYPE_META: { key: VisitorTypeKey; label: string; color: string }[] = [
  { key: "buyer", label: "Buyers", color: "#3b82f6" },
  { key: "neighbor", label: "Neighbors", color: "#f59e0b" },
  { key: "investor", label: "Investors", color: "#10b981" },
  { key: "other", label: "Other", color: "#94a3b8" },
];

export type VisitorTypeKey = "buyer" | "neighbor" | "investor" | "other";

export function VisitorTypeBreakdown({
  counts,
}: {
  counts: Record<VisitorTypeKey, number>;
}) {
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  if (total === 0) return null;

  return (
    <div className="space-y-3">
      {/* Stacked composition bar */}
      <div className="flex h-3 w-full overflow-hidden rounded-full">
        {TYPE_META.filter((t) => counts[t.key] > 0).map((t) => (
          <div
            key={t.key}
            style={{
              backgroundColor: t.color,
              width: `${(counts[t.key] / total) * 100}%`,
            }}
          />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
        {TYPE_META.map((t) => (
          <div key={t.key} className="flex items-baseline gap-2">
            <span
              className="inline-block h-2.5 w-2.5 shrink-0 self-center rounded-full"
              style={{ backgroundColor: t.color }}
            />
            <span className="text-sm" style={{ color: MUTED }}>
              {t.label}
            </span>
            <span
              className="ml-auto text-sm font-semibold tabular-nums"
              style={{ color: INK }}
            >
              {counts[t.key]}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function PeakTrafficBars({ buckets }: { buckets: TimeBucket[] }) {
  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-2">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="flex items-center gap-3">
          <span
            className="w-20 shrink-0 text-right text-xs tabular-nums"
            style={{ color: MUTED }}
          >
            {bucket.label}
          </span>
          <div
            className="h-5 flex-1 overflow-hidden rounded"
            style={{ backgroundColor: TRACK }}
          >
            {bucket.count > 0 && (
              <div
                className="h-full rounded"
                style={{
                  backgroundColor: "#3b82f6",
                  width: `${(bucket.count / maxCount) * 100}%`,
                }}
              />
            )}
          </div>
          <span
            className="w-6 text-right text-xs font-semibold tabular-nums"
            style={{ color: INK }}
          >
            {bucket.count}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EngagementTimeline({
  days,
}: {
  days: { label: string; count: number }[];
}) {
  if (days.length === 0) return null;
  const maxCount = Math.max(...days.map((d) => d.count), 1);

  return (
    <div>
      <div className="flex h-28 items-end gap-1.5">
        {days.map((day) => (
          <div
            key={day.label}
            className="flex flex-1 flex-col items-center gap-1"
          >
            <span
              className="text-[10px] font-semibold tabular-nums"
              style={{ color: MUTED }}
            >
              {day.count}
            </span>
            <div
              className="w-full rounded-t"
              style={{
                backgroundColor: "#3b82f6",
                opacity: 0.35 + 0.65 * (day.count / maxCount),
                height: `${Math.max((day.count / maxCount) * 80, 4)}px`,
              }}
            />
          </div>
        ))}
      </div>
      <div
        className="mt-1.5 flex gap-1.5 border-t pt-1.5"
        style={{ borderColor: TRACK }}
      >
        {days.map((day) => (
          <span
            key={day.label}
            className="flex-1 text-center text-[10px]"
            style={{ color: MUTED }}
          >
            {day.label}
          </span>
        ))}
      </div>
    </div>
  );
}
