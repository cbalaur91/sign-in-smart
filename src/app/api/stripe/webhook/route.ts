import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import type Stripe from "stripe";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = createAdminClient();

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const eventId = session.metadata?.eventId;
      const agentId = session.metadata?.agentId;

      if (!eventId || !agentId) {
        console.error("Missing metadata in checkout session:", session.id);
        break;
      }

      // Update payment record
      await supabase
        .from("payments")
        .update({
          status: "completed",
          stripe_payment_intent_id:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
        })
        .eq("stripe_checkout_session_id", session.id);

      // Activate the event
      await supabase
        .from("events")
        .update({ status: "active" })
        .eq("id", eventId)
        .eq("agent_id", agentId);

      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const eventId = session.metadata?.eventId;
      const agentId = session.metadata?.agentId;

      if (!eventId || !agentId) break;

      // Mark payment as expired
      await supabase
        .from("payments")
        .update({ status: "expired" })
        .eq("stripe_checkout_session_id", session.id);

      // Revert event to draft
      await supabase
        .from("events")
        .update({ status: "draft" })
        .eq("id", eventId)
        .eq("agent_id", agentId)
        .eq("status", "pending_payment");

      break;
    }
  }

  return NextResponse.json({ received: true });
}
