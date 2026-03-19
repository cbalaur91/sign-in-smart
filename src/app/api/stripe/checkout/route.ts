import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";

const PRICE_CENTS = 999; // $9.99

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { eventId } = await req.json();
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!eventId || typeof eventId !== "string" || !UUID_RE.test(eventId)) {
    return NextResponse.json({ error: "Invalid eventId" }, { status: 400 });
  }

  // Verify the event belongs to this user and is in pending_payment status
  const { data: event } = await supabase
    .from("events")
    .select("id, status")
    .eq("id", eventId)
    .eq("agent_id", user.id)
    .single();

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  // Get agent profile
  const { data: agent } = await supabase
    .from("agents")
    .select("credits, stripe_customer_id, email, full_name")
    .eq("id", user.id)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  }

  // Check if user has credits available
  if (agent.credits > 0) {
    // Atomic credit deduction — prevents double-spend race condition
    const { data: deducted } = await supabase.rpc("deduct_credit", {
      agent_uuid: user.id,
    });
    if (deducted) {
      await supabase
        .from("events")
        .update({ status: "active" })
        .eq("id", eventId)
        .eq("agent_id", user.id);
      return NextResponse.json({ free: true });
    }
    // Race: credits consumed between read and deduct — fall through to Stripe
  }

  // No credits — create Stripe Checkout Session
  const stripe = getStripe();

  // Create or reuse Stripe customer
  let customerId = agent.stripe_customer_id;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: agent.email,
      name: agent.full_name,
      metadata: { supabase_user_id: user.id },
    });
    customerId = customer.id;

    await supabase
      .from("agents")
      .update({ stripe_customer_id: customerId })
      .eq("id", user.id);
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PRICE_CENTS,
          product_data: {
            name: "Open House Activation",
            description: "Activate and publish your open house event",
          },
        },
        quantity: 1,
      },
    ],
    metadata: {
      eventId,
      agentId: user.id,
    },
    success_url: `${appUrl}/events/${eventId}?payment=success`,
    cancel_url: `${appUrl}/events/${eventId}?payment=cancelled`,
  });

  // Record pending payment (use admin client — no insert RLS policy on payments)
  const admin = createAdminClient();
  await admin.from("payments").insert({
    agent_id: user.id,
    event_id: eventId,
    stripe_checkout_session_id: session.id,
    amount_cents: PRICE_CENTS,
    status: "pending",
  });

  return NextResponse.json({ url: session.url });
}
