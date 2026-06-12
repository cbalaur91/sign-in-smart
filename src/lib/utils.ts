import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatTime(time: string): string {
  const [hours, minutes] = time.split(":");
  const h = parseInt(hours!, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return `${h12}:${minutes} ${ampm}`;
}

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft",
  active: "Active",
  completed: "Completed",
  pending_payment: "Pending Payment",
};

export function formatStatus(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

// Converts a wall-clock date + time in an IANA timezone to the UTC instant.
// date/time columns are stored without timezone, so comparisons against the
// server clock must go through here. Falls back to UTC for unknown zones.
export function zonedDateTimeToUtc(
  date: string,
  time: string,
  timeZone: string,
): Date {
  const utcGuess = new Date(`${date}T${time}Z`);
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    }).formatToParts(utcGuess);
    const get = (type: string) =>
      Number(parts.find((p) => p.type === type)?.value ?? 0);
    const wallAsUtc = Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour") % 24,
      get("minute"),
      get("second"),
    );
    return new Date(utcGuess.getTime() + (utcGuess.getTime() - wallAsUtc));
  } catch {
    return utcGuess;
  }
}

export function generateSlug(address: string, date: string): string {
  const addressPart = address
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);

  const datePart = new Date(date)
    .toLocaleDateString("en-US", { month: "short", year: "2-digit" })
    .toLowerCase()
    .replace(/\s+/g, "-");

  return `${addressPart}-${datePart}`;
}
