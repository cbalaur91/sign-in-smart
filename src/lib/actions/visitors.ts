"use server";

import { createClient } from "@/lib/supabase/server";
import { visitorSchema, type VisitorFormData } from "@/lib/validators/visitor";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitVisitorSignIn(
  eventId: string,
  formData: VisitorFormData,
) {
  if (!UUID_RE.test(eventId)) {
    return { error: "Invalid event." };
  }

  const parsed = visitorSchema.safeParse(formData);
  if (!parsed.success) {
    return { error: "Please check your information and try again." };
  }

  // Use server client — RLS INSERT policy allows anonymous inserts
  const supabase = await createClient();

  // Verify event exists and is active
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .single();

  if (!event || event.status !== "active") {
    return { error: "This open house is not currently active." };
  }

  // Check for duplicate sign-in (same email for same event)
  const { data: existing } = await supabase
    .from("visitors")
    .select("id")
    .eq("event_id", eventId)
    .eq("email", parsed.data.email)
    .single();

  if (existing) {
    return { success: true, alreadySignedIn: true };
  }

  const { error } = await supabase.from("visitors").insert({
    event_id: eventId,
    full_name: parsed.data.full_name,
    email: parsed.data.email,
    phone: parsed.data.phone,
    visitor_type: parsed.data.visitor_type,
    notes: parsed.data.notes ?? null,
  });

  if (error) {
    return { error: "Something went wrong. Please try again." };
  }

  // Track sign-in analytics
  await supabase.from("event_analytics").insert({
    event_id: eventId,
    event_type: "sign_in",
  });

  return { success: true };
}
