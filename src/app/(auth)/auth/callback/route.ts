import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Check if agent profile exists, create if not
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const { data: agent } = await supabase
          .from("agents")
          .select("id")
          .eq("id", user.id)
          .single();

        if (!agent) {
          await supabase.from("agents").insert({
            id: user.id,
            full_name: user.user_metadata?.full_name ?? user.email?.split("@")[0] ?? "Agent",
            first_name: user.user_metadata?.first_name ?? null,
            last_name: user.user_metadata?.last_name ?? null,
            phone: user.user_metadata?.phone ?? null,
            email: user.email!,
          });
        }
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
