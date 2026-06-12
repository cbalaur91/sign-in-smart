import { NextResponse } from "next/server";
import { render } from "@react-email/components";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import { createResendClient, sendBatch, type OutgoingEmail } from "@/lib/email/resend";
import { buildUnsubscribeUrl } from "@/lib/email/unsubscribe";
import ThankYouEmail from "@/emails/thank-you";
import NudgeEmail from "@/emails/nudge";
import type { Database } from "@/lib/types";

type AdminClient = SupabaseClient<Database>;
type EmailType = "thank_you" | "nudge";

const MAX_ATTEMPTS = 3;
const NUDGE_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

type SendItem = {
  visitor: { id: string; full_name: string; email: string };
  event: {
    id: string;
    property_address: string;
    city: string;
    state: string;
    zip: string;
    price: number | null;
    bedrooms: number | null;
    bathrooms: number | null;
    sqft: number | null;
    photos: string[];
  };
  agent: {
    full_name: string;
    email: string;
    phone: string | null;
    brokerage: string | null;
  };
  prevAttempts: number;
};

async function processEmailType(
  supabase: AdminClient,
  resend: Resend,
  emailType: EmailType,
): Promise<{ sent: number; failed: number }> {
  let query = supabase
    .from("events")
    .select(
      "id, agent_id, property_address, city, state, zip, price, bedrooms, bathrooms, sqft, photos",
    )
    .eq("status", "completed")
    .not("completed_at", "is", null);

  query =
    emailType === "thank_you"
      ? query.eq("follow_up_enabled", true)
      : query
          .eq("nudge_enabled", true)
          .lte(
            "completed_at",
            new Date(Date.now() - NUDGE_DELAY_MS).toISOString(),
          );

  const { data: events, error: eventsError } = await query;
  if (eventsError) throw new Error(`events fetch: ${eventsError.message}`);
  if (!events?.length) return { sent: 0, failed: 0 };

  const agentIds = [...new Set(events.map((e) => e.agent_id))];
  const { data: agents, error: agentsError } = await supabase
    .from("agents")
    .select("id, full_name, email, phone, brokerage")
    .in("id", agentIds);
  if (agentsError) throw new Error(`agents fetch: ${agentsError.message}`);
  const agentById = new Map((agents ?? []).map((a) => [a.id, a]));

  const toSend: SendItem[] = [];

  for (const event of events) {
    const agent = agentById.get(event.agent_id);
    if (!agent) continue;

    // Sorted ascending so the first sign-in wins the per-email dedupe below
    const { data: visitors, error: visitorsError } = await supabase
      .from("visitors")
      .select("id, full_name, email")
      .eq("event_id", event.id)
      .eq("email_opt_out", false)
      .order("signed_in_at", { ascending: true });
    if (visitorsError) {
      console.error("visitors fetch:", visitorsError.message);
      continue;
    }
    if (!visitors?.length) continue;

    const { data: logs, error: logsError } = await supabase
      .from("email_log")
      .select("visitor_id, email_type, status, attempts")
      .eq("event_id", event.id);
    if (logsError) {
      console.error("email_log fetch:", logsError.message);
      continue;
    }

    const logFor = (visitorId: string, type: EmailType) =>
      logs?.find((l) => l.visitor_id === visitorId && l.email_type === type);

    const seenEmails = new Set<string>();
    for (const visitor of visitors) {
      const emailKey = visitor.email.trim().toLowerCase();
      if (seenEmails.has(emailKey)) continue;
      seenEmails.add(emailKey);

      // Nudges only follow a successfully delivered thank-you
      if (emailType === "nudge") {
        const thankYou = logFor(visitor.id, "thank_you");
        if (!thankYou || thankYou.status !== "sent") continue;
      }

      const existing = logFor(visitor.id, emailType);
      if (
        existing &&
        (existing.status === "sent" || existing.attempts >= MAX_ATTEMPTS)
      ) {
        continue;
      }

      toSend.push({
        visitor,
        event,
        agent,
        prevAttempts: existing?.attempts ?? 0,
      });
    }
  }

  if (!toSend.length) return { sent: 0, failed: 0 };

  const from = process.env.EMAIL_FROM!;
  const emails: OutgoingEmail[] = await Promise.all(
    toSend.map(async (item) => {
      const props = {
        propertyAddress: item.event.property_address,
        city: item.event.city,
        state: item.event.state,
        zip: item.event.zip,
        price: item.event.price,
        bedrooms: item.event.bedrooms,
        bathrooms: item.event.bathrooms,
        sqft: item.event.sqft,
        photoUrl: item.event.photos[0] ?? null,
        agentName: item.agent.full_name,
        agentBrokerage: item.agent.brokerage,
        agentPhone: item.agent.phone,
        agentEmail: item.agent.email,
        unsubscribeUrl: buildUnsubscribeUrl(item.visitor.id),
      };
      return {
        from,
        to: [item.visitor.email],
        replyTo: item.agent.email,
        subject:
          emailType === "thank_you"
            ? `Thanks for visiting ${item.event.property_address}!`
            : `Still thinking about ${item.event.property_address}?`,
        html: await render(
          emailType === "thank_you" ? ThankYouEmail(props) : NudgeEmail(props),
        ),
      };
    }),
  );

  const { ids } = await sendBatch(resend, emails);

  const rows = toSend.map((item, i) => ({
    event_id: item.event.id,
    visitor_id: item.visitor.id,
    email_type: emailType,
    status: (ids[i] ? "sent" : "failed") as "sent" | "failed",
    attempts: item.prevAttempts + 1,
    resend_id: ids[i] ?? null,
  }));

  const { error: upsertError } = await supabase
    .from("email_log")
    .upsert(rows, { onConflict: "visitor_id,email_type" });
  if (upsertError) {
    // Sends went out but logging failed — surface loudly; the unique
    // constraint is the only thing preventing double-sends next run.
    console.error("email_log upsert:", upsertError.message);
  }

  const sent = ids.filter(Boolean).length;
  return { sent, failed: ids.length - sent };
}

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    return NextResponse.json({
      skipped: "email not configured (RESEND_API_KEY / EMAIL_FROM missing)",
    });
  }

  const supabase = createAdminClient();
  const resend = createResendClient();

  try {
    const thankYous = await processEmailType(supabase, resend, "thank_you");
    const nudges = await processEmailType(supabase, resend, "nudge");

    return NextResponse.json({
      thankYousSent: thankYous.sent,
      nudgesSent: nudges.sent,
      failed: thankYous.failed + nudges.failed,
    });
  } catch (err) {
    console.error("follow-ups cron error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
