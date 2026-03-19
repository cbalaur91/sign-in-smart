"use client";

import type { Visitor } from "@/lib/types";

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

function formatBucketLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function PeakHoursChart({
  visitors,
  startTime,
  endTime,
}: {
  visitors: Visitor[];
  startTime: string;
  endTime: string;
}) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const bucketSize = 30; // minutes

  // Build buckets
  const buckets: { label: string; count: number }[] = [];
  for (let t = startMin; t < endMin; t += bucketSize) {
    buckets.push({
      label: formatBucketLabel(t),
      count: 0,
    });
  }

  // Assign visitors to buckets
  for (const v of visitors) {
    const d = new Date(v.signed_in_at);
    const vMin = d.getHours() * 60 + d.getMinutes();
    const bucketIdx = Math.floor((vMin - startMin) / bucketSize);
    if (bucketIdx >= 0 && bucketIdx < buckets.length) {
      buckets[bucketIdx]!.count++;
    }
  }

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
