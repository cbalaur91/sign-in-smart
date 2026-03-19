import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatTime, formatPrice } from "@/lib/utils";
import { VisitorSignInForm } from "@/components/forms/sign-in-form";
import { PropertyHero } from "@/components/property/property-hero";
import Image from "next/image";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const supabase = await createClient();
  const { data: event } = await supabase
    .from("events")
    .select("property_address, city, state, description, price, photos")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!event) return {};

  const title = `Open House: ${event.property_address}, ${event.city}, ${event.state}`;
  const description = event.price
    ? `${formatPrice(event.price)} — ${event.description ?? "Come visit this property!"}`
    : event.description ?? "Come visit this property!";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: event.photos?.[0] ? [event.photos[0]] : [],
    },
  };
}

export default async function OpenHousePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data: event } = await supabase
    .from("events")
    .select("id, agent_id, slug, property_address, city, state, zip, date, start_time, end_time, description, photos, bedrooms, bathrooms, sqft, price, status")
    .eq("slug", slug)
    .eq("status", "active")
    .single();

  if (!event) {
    notFound();
  }

  // Get agent info
  const { data: agent } = await supabase
    .from("agents")
    .select("full_name, email, phone, brokerage")
    .eq("id", event.agent_id)
    .single();

  // Track page view
  await supabase.from("event_analytics").insert({
    event_id: event.id,
    event_type: "page_view",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <PropertyHero photos={event.photos} />

      <div className="mx-auto max-w-2xl px-4 py-8">
        {/* Property Info (visible to everyone) */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold">{event.property_address}</h1>
          <p className="mt-1 text-lg text-muted-foreground">
            {event.city}, {event.state} {event.zip}
          </p>

          {event.price && (
            <p className="mt-3 text-2xl font-bold text-primary">
              {formatPrice(event.price)}
            </p>
          )}

          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {event.bedrooms && (
              <span className="rounded-md bg-muted px-3 py-1">
                {event.bedrooms} Beds
              </span>
            )}
            {event.bathrooms && (
              <span className="rounded-md bg-muted px-3 py-1">
                {event.bathrooms} Baths
              </span>
            )}
            {event.sqft && (
              <span className="rounded-md bg-muted px-3 py-1">
                {event.sqft.toLocaleString()} sqft
              </span>
            )}
          </div>

          <div className="mt-4 rounded-md bg-muted/50 p-3 text-sm">
            <p className="font-medium">Open House</p>
            <p className="text-muted-foreground">
              {formatDate(event.date)} &middot; {formatTime(event.start_time)} -{" "}
              {formatTime(event.end_time)}
            </p>
          </div>
        </div>

        {/* Sign-in Form (prominent CTA) */}
        <div className="mb-8 rounded-lg border-2 border-primary/30 bg-card p-6">
          <h2 className="mb-1 text-xl font-semibold">Sign In to This Open House</h2>
          <p className="mb-5 text-sm text-muted-foreground">
            Get the full property details and stay updated.
          </p>
          <VisitorSignInForm eventId={event.id} />
        </div>

        {/* Extended Details (visible after sign-in via client state, but also server-rendered for SEO) */}
        {event.description && (
          <div className="mb-8">
            <h2 className="mb-3 text-xl font-semibold">About This Property</h2>
            <p className="whitespace-pre-wrap text-muted-foreground">
              {event.description}
            </p>
          </div>
        )}

        {/* Agent Info */}
        {agent && (
          <div className="rounded-lg border border-border bg-card p-5">
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              Listing Agent
            </h3>
            <p className="text-lg font-semibold">{agent.full_name}</p>
            {agent.brokerage && (
              <p className="text-sm text-muted-foreground">{agent.brokerage}</p>
            )}
            <div className="mt-3 flex flex-wrap gap-3">
              {agent.email && (
                <a
                  href={`mailto:${agent.email}`}
                  className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  Email Agent
                </a>
              )}
              {agent.phone && (
                <a
                  href={`tel:${agent.phone}`}
                  className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
                >
                  Call {agent.phone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
