"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateEventStatus } from "@/lib/actions/events";

const ACTIONS: Record<
  string,
  { label: string; busy: string; className: string }
> = {
  draft: {
    label: "Activate",
    busy: "Activating...",
    className:
      "border-green-500/30 text-green-500 hover:bg-green-500/10",
  },
  active: {
    label: "Mark Completed",
    busy: "Completing...",
    className: "border-border text-muted-foreground hover:bg-accent",
  },
  pending_payment: {
    label: "Complete Payment",
    busy: "Redirecting...",
    className:
      "border-orange-500/30 text-orange-500 hover:bg-orange-500/10",
  },
};

export function EventStatusAction({
  eventId,
  status,
}: {
  eventId: string;
  status: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const action = ACTIONS[status];
  if (!action) return null;

  async function goToCheckout() {
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ eventId }),
    });
    const checkout = await res.json();

    if (checkout.free) {
      // Credit was used — refresh to show active event
      router.refresh();
      return;
    }
    if (checkout.url) {
      window.location.href = checkout.url;
      return;
    }
    setError(checkout.error ?? "Payment setup failed");
    setLoading(false);
  }

  async function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    // Card is wrapped in a link — keep the click from navigating
    e.preventDefault();
    e.stopPropagation();

    // Completing schedules follow-up emails — don't fire them on a misclick
    if (
      status === "active" &&
      !window.confirm(
        "Mark this open house as completed? If follow-up emails are enabled, they will be sent to visitors.",
      )
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (status === "pending_payment") {
        await goToCheckout();
        return;
      }

      const result = await updateEventStatus(
        eventId,
        status === "draft" ? "active" : "completed",
      );

      if (result && "requiresPayment" in result && result.requiresPayment) {
        await goToCheckout();
        return;
      }
      if (result && "error" in result && result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }
      router.refresh();
      setLoading(false);
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <span className="relative z-10 flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50 ${action.className}`}
      >
        {loading ? action.busy : action.label}
      </button>
      {error && <span className="text-[11px] text-destructive">{error}</span>}
    </span>
  );
}
