import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyUnsubscribeToken } from "@/lib/email/unsubscribe";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function htmlPage(title: string, message: string, status = 200) {
  return new NextResponse(
    `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex" />
  <title>${title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #f8fafc; color: #0f172a; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 40px; max-width: 420px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.06); }
    h1 { font-size: 20px; margin: 0 0 8px; }
    p { font-size: 14px; color: #475569; margin: 0; }
  </style>
</head>
<body>
  <div class="card">
    <h1>${title}</h1>
    <p>${message}</p>
  </div>
</body>
</html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const visitorId = searchParams.get("v");
  const signature = searchParams.get("sig");

  if (
    !visitorId ||
    !signature ||
    !UUID_RE.test(visitorId) ||
    !verifyUnsubscribeToken(visitorId, signature)
  ) {
    return htmlPage(
      "Invalid link",
      "This unsubscribe link is invalid or has expired.",
      400,
    );
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("visitors")
    .update({ email_opt_out: true })
    .eq("id", visitorId);

  if (error) {
    console.error("unsubscribe error:", error.message);
    return htmlPage(
      "Something went wrong",
      "We couldn't process your request. Please try again later.",
      500,
    );
  }

  return htmlPage(
    "You've been unsubscribed",
    "You won't receive any more emails about this open house.",
  );
}
