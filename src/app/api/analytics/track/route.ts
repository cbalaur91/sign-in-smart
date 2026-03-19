import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_EVENT_TYPES = ["page_view", "sign_in"];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { event_id, event_type, metadata } = body;

    if (
      !event_id ||
      !event_type ||
      typeof event_id !== "string" ||
      !UUID_RE.test(event_id) ||
      !ALLOWED_EVENT_TYPES.includes(event_type)
    ) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    // Cap metadata size to prevent storage abuse
    if (metadata && JSON.stringify(metadata).length > 4096) {
      return NextResponse.json({ error: "Metadata too large" }, { status: 400 });
    }

    const supabase = await createClient();
    await supabase.from("event_analytics").insert({
      event_id,
      event_type,
      metadata: metadata ?? null,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}
