import type { EmailLog, Event } from "@/lib/types";

function countByType(logs: EmailLog[], type: "thank_you" | "nudge") {
  const ofType = logs.filter((l) => l.email_type === type);
  return {
    sent: ofType.filter((l) => l.status === "sent").length,
    failed: ofType.filter((l) => l.status === "failed").length,
  };
}

export function FollowUpStatusCard({
  event,
  emailLogs,
}: {
  event: Event;
  emailLogs: EmailLog[];
}) {
  const thankYou = countByType(emailLogs, "thank_you");
  const nudge = countByType(emailLogs, "nudge");

  const nudgeDate = event.completed_at
    ? new Date(
        new Date(event.completed_at).getTime() + 3 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : null;

  const lines: string[] = [];

  if (!event.follow_up_enabled) {
    lines.push("Thank-you email is turned off for this event.");
  } else if (thankYou.sent > 0) {
    lines.push(
      `${thankYou.sent} thank-you email${thankYou.sent === 1 ? "" : "s"} sent`,
    );
  } else if (event.completed_at) {
    lines.push("Thank-you emails are queued — they go out within 15 minutes.");
  } else {
    lines.push("Thank-you emails were not sent for this event.");
  }

  if (event.follow_up_enabled && event.nudge_enabled) {
    if (nudge.sent > 0) {
      lines.push(`${nudge.sent} nudge email${nudge.sent === 1 ? "" : "s"} sent`);
    } else if (nudgeDate) {
      lines.push(`nudge scheduled for ${nudgeDate}`);
    }
  }

  const failed = thankYou.failed + nudge.failed;

  return (
    <div className="mb-6 rounded-lg border border-border bg-card px-4 py-3">
      <p className="text-sm">
        <span className="font-medium">Follow-up:</span>{" "}
        <span className="text-muted-foreground">{lines.join(" · ")}</span>
        {failed > 0 && (
          <span className="text-destructive">
            {" "}
            · {failed} failed (retrying automatically)
          </span>
        )}
      </p>
    </div>
  );
}
