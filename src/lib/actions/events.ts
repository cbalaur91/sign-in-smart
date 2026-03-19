"use server";

import { createClient } from "@/lib/supabase/server";
import { eventSchema, type EventFormData } from "@/lib/validators/event";
import { generateSlug } from "@/lib/utils";
import { redirect } from "next/navigation";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function createEvent(formData: EventFormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  // Force new events to draft — activation requires payment gate
  const slug = generateSlug(parsed.data.property_address, parsed.data.date);

  const { data, error } = await supabase
    .from("events")
    .insert({
      agent_id: user.id,
      slug,
      property_address: parsed.data.property_address,
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip,
      date: parsed.data.date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      description: parsed.data.description ?? null,
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      sqft: parsed.data.sqft ?? null,
      price: parsed.data.price ?? null,
      status: "draft",
      photos: [],
    })
    .select("id")
    .single();

  if (error) {
    console.error("createEvent error:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/events/${data.id}`);
}

export async function updateEvent(eventId: string, formData: EventFormData) {
  if (!UUID_RE.test(eventId)) return { error: "Invalid event ID" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const parsed = eventSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Invalid form data" };
  }

  // Check if user is trying to activate the event
  if (parsed.data.status === "active") {
    // Get current event status
    const { data: currentEvent } = await supabase
      .from("events")
      .select("status")
      .eq("id", eventId)
      .eq("agent_id", user.id)
      .single();

    if (!currentEvent) {
      return { error: "Event not found" };
    }

    // Only gate if event is not already active
    if (currentEvent.status !== "active") {
      // Count how many events this agent has already activated
      const { count } = await supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("agent_id", user.id)
        .in("status", ["active", "completed"]);

      const activeCount = count ?? 0;

      // Get agent credits
      const { data: agent } = await supabase
        .from("agents")
        .select("credits")
        .eq("id", user.id)
        .single();

      const credits = agent?.credits ?? 0;

      // First activation is free (credits default to 1), or use available credits
      if (credits > 0) {
        // Atomic credit deduction — prevents double-spend race condition
        const { data: deducted } = await supabase.rpc("deduct_credit", {
          agent_uuid: user.id,
        });
        if (!deducted) {
          // Race condition: credits were consumed between read and deduct
          await supabase
            .from("events")
            .update({ status: "pending_payment" })
            .eq("id", eventId)
            .eq("agent_id", user.id);
          return { requiresPayment: true, eventId };
        }
      } else {
        // No credits — set to pending_payment and signal client
        await supabase
          .from("events")
          .update({ status: "pending_payment" })
          .eq("id", eventId)
          .eq("agent_id", user.id);

        return { requiresPayment: true, eventId };
      }
    }
  }

  const { error } = await supabase
    .from("events")
    .update({
      property_address: parsed.data.property_address,
      city: parsed.data.city,
      state: parsed.data.state,
      zip: parsed.data.zip,
      date: parsed.data.date,
      start_time: parsed.data.start_time,
      end_time: parsed.data.end_time,
      description: parsed.data.description ?? null,
      bedrooms: parsed.data.bedrooms ?? null,
      bathrooms: parsed.data.bathrooms ?? null,
      sqft: parsed.data.sqft ?? null,
      price: parsed.data.price ?? null,
      status: parsed.data.status,
    })
    .eq("id", eventId)
    .eq("agent_id", user.id);

  if (error) {
    console.error("updateEvent error:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  redirect(`/events/${eventId}`);
}

export async function deleteEvent(eventId: string) {
  if (!UUID_RE.test(eventId)) return { error: "Invalid event ID" };
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("agent_id", user.id);

  if (error) {
    console.error("deleteEvent error:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/events");
}

export async function updateEventPhotos(eventId: string, photos: string[]) {
  if (!UUID_RE.test(eventId)) return { error: "Invalid event ID" };
  if (photos.length > 10) return { error: "Too many photos" };

  // Validate each photo URL is HTTPS and from Supabase storage
  for (const url of photos) {
    try {
      const parsed = new URL(url);
      if (parsed.protocol !== "https:" || !parsed.hostname.endsWith(".supabase.co")) {
        return { error: "Invalid photo URL" };
      }
    } catch {
      return { error: "Invalid photo URL" };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("events")
    .update({ photos })
    .eq("id", eventId)
    .eq("agent_id", user.id);

  if (error) {
    console.error("updateEventPhotos error:", error.message);
    return { error: "Something went wrong. Please try again." };
  }

  return { success: true };
}
