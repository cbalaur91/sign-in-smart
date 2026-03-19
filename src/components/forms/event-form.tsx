"use client";

import { useState } from "react";
import { createEvent, updateEvent } from "@/lib/actions/events";
import type { Event } from "@/lib/types";

const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
];

export function EventForm({ event }: { event?: Event }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const form = new FormData(e.currentTarget);
    const data = {
      property_address: form.get("property_address") as string,
      city: form.get("city") as string,
      state: form.get("state") as string,
      zip: form.get("zip") as string,
      date: form.get("date") as string,
      start_time: form.get("start_time") as string,
      end_time: form.get("end_time") as string,
      description: (form.get("description") as string) || undefined,
      bedrooms: form.get("bedrooms") ? Number(form.get("bedrooms")) : undefined,
      bathrooms: form.get("bathrooms") ? Number(form.get("bathrooms")) : undefined,
      sqft: form.get("sqft") ? Number(form.get("sqft")) : undefined,
      price: form.get("price") ? Number(form.get("price")) : undefined,
      status: (form.get("status") as "draft" | "active" | "completed") ?? "draft",
    };

    const result = event
      ? await updateEvent(event.id, data)
      : await createEvent(data);

    if (result && "requiresPayment" in result && result.requiresPayment) {
      // Redirect to Stripe Checkout
      try {
        const res = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ eventId: result.eventId }),
        });
        const checkout = await res.json();

        if (checkout.free) {
          // Credit was used — reload to show active event
          window.location.href = `/events/${result.eventId}`;
          return;
        }

        if (checkout.url) {
          window.location.href = checkout.url;
          return;
        }

        setError(checkout.error ?? "Payment setup failed");
      } catch {
        setError("Failed to initiate payment");
      }
      setLoading(false);
      return;
    }

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
    // On success, the server action redirects
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Property Address */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Property Details</h3>

        <div>
          <label htmlFor="property_address" className="block text-sm font-medium">
            Street Address
          </label>
          <input
            id="property_address"
            name="property_address"
            type="text"
            required
            defaultValue={event?.property_address}
            placeholder="123 Main Street"
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="city" className="block text-sm font-medium">
              City
            </label>
            <input
              id="city"
              name="city"
              type="text"
              required
              defaultValue={event?.city}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="state" className="block text-sm font-medium">
              State
            </label>
            <select
              id="state"
              name="state"
              required
              defaultValue={event?.state}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            >
              <option value="">Select</option>
              {US_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="zip" className="block text-sm font-medium">
              ZIP
            </label>
            <input
              id="zip"
              name="zip"
              type="text"
              required
              defaultValue={event?.zip}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="bedrooms" className="block text-sm font-medium">
              Beds
            </label>
            <input
              id="bedrooms"
              name="bedrooms"
              type="number"
              min="0"
              defaultValue={event?.bedrooms ?? ""}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="bathrooms" className="block text-sm font-medium">
              Baths
            </label>
            <input
              id="bathrooms"
              name="bathrooms"
              type="number"
              min="0"
              step="0.5"
              defaultValue={event?.bathrooms ?? ""}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="sqft" className="block text-sm font-medium">
              Sqft
            </label>
            <input
              id="sqft"
              name="sqft"
              type="number"
              min="0"
              defaultValue={event?.sqft ?? ""}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="price" className="block text-sm font-medium">
              Price ($)
            </label>
            <input
              id="price"
              name="price"
              type="number"
              min="0"
              defaultValue={event?.price ?? ""}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            defaultValue={event?.description ?? ""}
            placeholder="Tell visitors about this property..."
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>
      </div>

      {/* Event Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Event Details</h3>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="date" className="block text-sm font-medium">
              Date
            </label>
            <input
              id="date"
              name="date"
              type="date"
              required
              defaultValue={event?.date}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium">
              Start Time
            </label>
            <input
              id="start_time"
              name="start_time"
              type="time"
              required
              defaultValue={event?.start_time}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium">
              End Time
            </label>
            <input
              id="end_time"
              name="end_time"
              type="time"
              required
              defaultValue={event?.end_time}
              className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium">
            Status
          </label>
          <select
            id="status"
            name="status"
            defaultValue={event?.status ?? "draft"}
            className="mt-1 block w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring"
          >
            <option value="draft">Draft</option>
            <option value="active">Active</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 sm:w-auto"
      >
        {loading
          ? "Saving..."
          : event
            ? "Update Open House"
            : "Create Open House"}
      </button>
    </form>
  );
}
