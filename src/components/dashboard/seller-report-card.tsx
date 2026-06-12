"use client";

import { useState } from "react";
import { resetReportToken } from "@/lib/actions/events";

export function SellerReportCard({
  eventId,
  reportUrl,
}: {
  eventId: string;
  reportUrl: string;
}) {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(reportUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy — copy the link manually.");
    }
  }

  async function handleReset() {
    setResetting(true);
    setError(null);
    const result = await resetReportToken(eventId);
    if (result?.error) {
      setError(result.error);
    }
    setResetting(false);
    setConfirming(false);
  }

  return (
    <div className="rounded-lg border border-border bg-card p-4 sm:p-6">
      <h2 className="mb-1 text-lg font-semibold">Seller Report</h2>
      <p className="mb-4 text-sm text-muted-foreground">
        A private, shareable summary of this open house for your seller — no
        visitor names or contact info included.
      </p>

      <p className="mb-4 truncate rounded-md bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
        {reportUrl}
      </p>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleCopy}
          className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {copied ? "Copied!" : "Copy link"}
        </button>
        <a
          href={reportUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
        >
          Preview
        </a>
        {confirming ? (
          <span className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={resetting}
              className="rounded-md bg-destructive px-4 py-2.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90 disabled:opacity-50"
            >
              {resetting ? "Resetting..." : "Confirm reset"}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="rounded-md border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </span>
        ) : (
          <button
            onClick={() => setConfirming(true)}
            className="rounded-md border border-destructive/30 px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/10 transition-colors"
            title="Generates a new link and invalidates the old one"
          >
            Reset link
          </button>
        )}
      </div>

      {confirming && (
        <p className="mt-3 text-xs text-muted-foreground">
          Resetting generates a new link — anyone with the old link will lose
          access.
        </p>
      )}
      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
    </div>
  );
}
