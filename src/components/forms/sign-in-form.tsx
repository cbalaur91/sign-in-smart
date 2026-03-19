"use client";

import { useState } from "react";
import { submitVisitorSignIn } from "@/lib/actions/visitors";

export function VisitorSignInForm({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      full_name: form.get("full_name") as string,
      email: form.get("email") as string,
      phone: form.get("phone") as string,
      visitor_type: form.get("visitor_type") as
        | "buyer"
        | "neighbor"
        | "investor"
        | "other",
      notes: (form.get("notes") as string) || undefined,
    };

    const result = await submitVisitorSignIn(eventId, data);

    if (result.error) {
      setError(result.error);
    } else {
      setSuccess(true);
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="rounded-md bg-green-500/10 p-4 text-center">
        <p className="text-lg font-medium text-green-500">
          You&apos;re signed in!
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Thanks for visiting. The agent will be in touch.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="full_name" className="block text-sm font-medium">
          Full Name
        </label>
        <input
          id="full_name"
          name="full_name"
          type="text"
          required
          placeholder="Jane Smith"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          placeholder="jane@example.com"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium">
          Phone
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          required
          placeholder="(555) 123-4567"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      <div>
        <label htmlFor="visitor_type" className="block text-sm font-medium">
          I am a...
        </label>
        <select
          id="visitor_type"
          name="visitor_type"
          required
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        >
          <option value="buyer">Buyer</option>
          <option value="neighbor">Neighbor</option>
          <option value="investor">Investor</option>
          <option value="other">Just Looking</option>
        </select>
      </div>

      <div>
        <label htmlFor="notes" className="block text-sm font-medium">
          Notes <span className="text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Any questions about the property?"
          className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Signing in..." : "Sign In"}
      </button>
    </form>
  );
}
