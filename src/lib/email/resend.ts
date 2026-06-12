import { Resend } from "resend";

export type OutgoingEmail = {
  from: string;
  to: string[];
  replyTo: string;
  subject: string;
  html: string;
};

export type BatchSendResult = {
  /** Resend ids, index-aligned with the input emails; null = that email failed */
  ids: (string | null)[];
};

export function createResendClient() {
  return new Resend(process.env.RESEND_API_KEY);
}

const BATCH_LIMIT = 100; // Resend batch API max per call

/**
 * Send emails via the Resend batch API, chunked to the 100-email limit.
 * A failed chunk marks all of its emails as failed (null id) rather than
 * throwing, so callers can record per-email outcomes in email_log.
 */
export async function sendBatch(
  resend: Resend,
  emails: OutgoingEmail[],
): Promise<BatchSendResult> {
  const ids: (string | null)[] = [];

  for (let i = 0; i < emails.length; i += BATCH_LIMIT) {
    const chunk = emails.slice(i, i + BATCH_LIMIT);
    const { data, error } = await resend.batch.send(chunk);

    if (error || !data) {
      console.error("resend batch error:", error?.message ?? "no data");
      ids.push(...chunk.map(() => null));
      continue;
    }

    ids.push(...data.data.map((d) => d.id ?? null));
  }

  return { ids };
}
