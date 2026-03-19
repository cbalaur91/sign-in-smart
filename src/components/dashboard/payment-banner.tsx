"use client";

export function PaymentBanner({ status }: { status: string }) {
  if (status === "success") {
    return (
      <div className="mb-6 rounded-lg border border-green-500/30 bg-green-500/5 px-4 py-3 text-sm text-green-500">
        Payment successful! Your open house is now active.
      </div>
    );
  }

  if (status === "cancelled") {
    return (
      <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/5 px-4 py-3 text-sm text-red-500">
        Payment was cancelled. Change status to Active to try again.
      </div>
    );
  }

  return null;
}
