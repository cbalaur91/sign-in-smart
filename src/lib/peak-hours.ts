export type TimeBucket = { label: string; count: number };

export function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h! * 60 + m!;
}

export function formatBucketLabel(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${m.toString().padStart(2, "0")} ${ampm}`;
}

/** Bucket sign-in timestamps into intervals across the event window. */
export function buildTimeBuckets(
  signedInAt: string[],
  startTime: string,
  endTime: string,
  bucketSize = 30,
): TimeBucket[] {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  const buckets: TimeBucket[] = [];
  for (let t = startMin; t < endMin; t += bucketSize) {
    buckets.push({ label: formatBucketLabel(t), count: 0 });
  }

  for (const ts of signedInAt) {
    const d = new Date(ts);
    const vMin = d.getHours() * 60 + d.getMinutes();
    const bucketIdx = Math.floor((vMin - startMin) / bucketSize);
    if (bucketIdx >= 0 && bucketIdx < buckets.length) {
      buckets[bucketIdx]!.count++;
    }
  }

  return buckets;
}
