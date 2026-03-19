import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createAdminClient();
  const now = new Date().toISOString();

  // Find active events where date + end_time is in the past
  const { data: activeEvents, error: fetchError } = await supabase
    .from("events")
    .select("id, date, end_time")
    .eq("status", "active");

  if (fetchError) {
    console.error("cron fetch error:", fetchError.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  const expiredIds = (activeEvents ?? [])
    .filter((e) => {
      const endDateTime = new Date(`${e.date}T${e.end_time}`);
      return endDateTime < new Date(now);
    })
    .map((e) => e.id);

  if (expiredIds.length === 0) {
    return NextResponse.json({ completed: 0 });
  }

  const { error: updateError } = await supabase
    .from("events")
    .update({ status: "completed" })
    .in("id", expiredIds);

  if (updateError) {
    console.error("cron update error:", updateError.message);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }

  return NextResponse.json({ completed: expiredIds.length });
}
