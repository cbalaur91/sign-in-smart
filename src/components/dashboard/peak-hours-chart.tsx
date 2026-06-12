"use client";

import type { Visitor } from "@/lib/types";
import { buildTimeBuckets } from "@/lib/peak-hours";

export function PeakHoursChart({
  visitors,
  startTime,
  endTime,
}: {
  visitors: Visitor[];
  startTime: string;
  endTime: string;
}) {
  const buckets = buildTimeBuckets(
    visitors.map((v) => v.signed_in_at),
    startTime,
    endTime,
  );

  const maxCount = Math.max(...buckets.map((b) => b.count), 1);

  return (
    <div className="space-y-2">
      {buckets.map((bucket) => (
        <div key={bucket.label} className="flex items-center gap-3">
          <span className="w-20 shrink-0 text-right text-xs text-muted-foreground font-mono">
            {bucket.label}
          </span>
          <div className="flex-1 h-6 rounded bg-muted/30 overflow-hidden">
            {bucket.count > 0 && (
              <div
                className="h-full rounded bg-blue-500/70 transition-all duration-300"
                style={{ width: `${(bucket.count / maxCount) * 100}%` }}
              />
            )}
          </div>
          <span className="w-6 text-right text-xs font-medium tabular-nums">
            {bucket.count}
          </span>
        </div>
      ))}
    </div>
  );
}
