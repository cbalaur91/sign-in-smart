import { afterAll, beforeAll, expect, mock, test } from "bun:test";

/**
 * Integration test for /api/cron/follow-ups against an in-memory Supabase
 * mock — verifies event selection, per-email dedupe, opt-out suppression,
 * email_log idempotency, retry caps, and nudge gating without external
 * services.
 */

type Row = Record<string, unknown>;
type Db = Record<string, Row[]>;

class FakeQuery implements PromiseLike<{ data: Row[] | null; error: null }> {
  private filters: ((r: Row) => boolean)[] = [];
  private sort: { col: string; ascending: boolean } | null = null;

  constructor(
    private db: Db,
    private table: string,
  ) {}

  select(_cols?: string) {
    return this;
  }
  eq(col: string, val: unknown) {
    this.filters.push((r) => r[col] === val);
    return this;
  }
  not(col: string, op: string, val: unknown) {
    if (op === "is" && val === null) {
      this.filters.push((r) => r[col] !== null);
    }
    return this;
  }
  lte(col: string, val: string) {
    this.filters.push((r) => typeof r[col] === "string" && r[col]! <= val);
    return this;
  }
  in(col: string, vals: unknown[]) {
    this.filters.push((r) => vals.includes(r[col]));
    return this;
  }
  order(col: string, opts?: { ascending?: boolean }) {
    this.sort = { col, ascending: opts?.ascending ?? true };
    return this;
  }
  upsert(rows: Row[], { onConflict }: { onConflict: string }) {
    const keys = onConflict.split(",").map((k) => k.trim());
    const table = this.db[this.table]!;
    for (const row of rows) {
      const idx = table.findIndex((r) => keys.every((k) => r[k] === row[k]));
      if (idx >= 0) table[idx] = { ...table[idx], ...row };
      else table.push({ ...row });
    }
    return Promise.resolve({ data: null, error: null });
  }

  then<R1, R2>(
    onfulfilled?: (v: { data: Row[] | null; error: null }) => R1 | PromiseLike<R1>,
    onrejected?: (reason: unknown) => R2 | PromiseLike<R2>,
  ) {
    let rows = (this.db[this.table] ?? []).filter((r) =>
      this.filters.every((f) => f(r)),
    );
    if (this.sort) {
      const { col, ascending } = this.sort;
      rows = [...rows].sort((a, b) =>
        ((a[col] as string) < (b[col] as string) ? -1 : 1) * (ascending ? 1 : -1),
      );
    }
    return Promise.resolve({ data: rows, error: null }).then(
      onfulfilled,
      onrejected,
    );
  }
}

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;
const ago = (ms: number) => new Date(Date.now() - ms).toISOString();

const db: Db = {
  agents: [
    {
      id: "agent-1",
      full_name: "Test Agent",
      email: "agent@x.com",
      phone: "555-0100",
      brokerage: "Test Realty",
    },
  ],
  events: [
    // Fresh completion → thank-you phase
    {
      id: "e1",
      agent_id: "agent-1",
      status: "completed",
      completed_at: ago(HOUR),
      follow_up_enabled: true,
      nudge_enabled: true,
      property_address: "123 Main St",
      city: "Detroit",
      state: "MI",
      zip: "48201",
      price: 400000,
      bedrooms: 3,
      bathrooms: 2,
      sqft: 1800,
      photos: [],
    },
    // Historical event (completed before feature shipped) → never emailed
    {
      id: "e2",
      agent_id: "agent-1",
      status: "completed",
      completed_at: null,
      follow_up_enabled: true,
      nudge_enabled: true,
      property_address: "9 Old Rd",
      city: "Detroit",
      state: "MI",
      zip: "48201",
      price: null,
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      photos: [],
    },
    // 4 days old → nudge phase (and thank-you retries)
    {
      id: "e3",
      agent_id: "agent-1",
      status: "completed",
      completed_at: ago(4 * DAY),
      follow_up_enabled: true,
      nudge_enabled: true,
      property_address: "456 Oak Ave",
      city: "Detroit",
      state: "MI",
      zip: "48202",
      price: 250000,
      bedrooms: 2,
      bathrooms: 1,
      sqft: 900,
      photos: [],
    },
    // Thank-you disabled → no thank-yous; nudges still gated on sent thank-yous
    {
      id: "e4",
      agent_id: "agent-1",
      status: "completed",
      completed_at: ago(4 * DAY),
      follow_up_enabled: false,
      nudge_enabled: true,
      property_address: "789 Pine Ct",
      city: "Detroit",
      state: "MI",
      zip: "48203",
      price: null,
      bedrooms: null,
      bathrooms: null,
      sqft: null,
      photos: [],
    },
  ],
  visitors: [
    // e1: v1+v2 share an email (first sign-in wins), v3 opted out, v4 normal
    { id: "v1", event_id: "e1", full_name: "A", email: "dup@x.com", email_opt_out: false, signed_in_at: "2026-06-12T13:00:00Z" },
    { id: "v2", event_id: "e1", full_name: "B", email: "DUP@x.com", email_opt_out: false, signed_in_at: "2026-06-12T13:30:00Z" },
    { id: "v3", event_id: "e1", full_name: "C", email: "optout@x.com", email_opt_out: true, signed_in_at: "2026-06-12T13:10:00Z" },
    { id: "v4", event_id: "e1", full_name: "D", email: "v4@x.com", email_opt_out: false, signed_in_at: "2026-06-12T13:20:00Z" },
    // e3: v5 thank-you sent → due a nudge; v6 thank-you failed once → retry;
    // v7 nudge already sent; v8 nudge failed 3x → capped
    { id: "v5", event_id: "e3", full_name: "E", email: "v5@x.com", email_opt_out: false, signed_in_at: "2026-06-08T13:00:00Z" },
    { id: "v6", event_id: "e3", full_name: "F", email: "v6@x.com", email_opt_out: false, signed_in_at: "2026-06-08T13:05:00Z" },
    { id: "v7", event_id: "e3", full_name: "G", email: "v7@x.com", email_opt_out: false, signed_in_at: "2026-06-08T13:10:00Z" },
    { id: "v8", event_id: "e3", full_name: "H", email: "v8@x.com", email_opt_out: false, signed_in_at: "2026-06-08T13:15:00Z" },
    // e4: never got a thank-you (toggle off) → must not get a nudge
    { id: "v9", event_id: "e4", full_name: "I", email: "v9@x.com", email_opt_out: false, signed_in_at: "2026-06-08T13:00:00Z" },
  ],
  email_log: [
    { event_id: "e3", visitor_id: "v5", email_type: "thank_you", status: "sent", attempts: 1, resend_id: "r1" },
    { event_id: "e3", visitor_id: "v6", email_type: "thank_you", status: "failed", attempts: 1, resend_id: null },
    { event_id: "e3", visitor_id: "v7", email_type: "thank_you", status: "sent", attempts: 1, resend_id: "r2" },
    { event_id: "e3", visitor_id: "v7", email_type: "nudge", status: "sent", attempts: 1, resend_id: "r3" },
    { event_id: "e3", visitor_id: "v8", email_type: "thank_you", status: "sent", attempts: 1, resend_id: "r4" },
    { event_id: "e3", visitor_id: "v8", email_type: "nudge", status: "failed", attempts: 3, resend_id: null },
  ],
};

const sentEmails: { to: string[]; subject: string; replyTo: string; html: string }[] = [];
let idCounter = 0;

mock.module("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({
    from: (table: string) => new FakeQuery(db, table),
  }),
}));

mock.module("@/lib/email/resend", () => ({
  createResendClient: () => ({}),
  sendBatch: async (_resend: unknown, emails: typeof sentEmails) => {
    sentEmails.push(...emails);
    return { ids: emails.map(() => `mock-${++idCounter}`) };
  },
}));

let GET: (req: Request) => Promise<Response>;

beforeAll(async () => {
  process.env.CRON_SECRET = "test-cron";
  process.env.RESEND_API_KEY = "re_test";
  process.env.EMAIL_FROM = "SignInSmart <noreply@test.dev>";
  process.env.UNSUBSCRIBE_SECRET = "test-secret";
  process.env.NEXT_PUBLIC_APP_URL = "http://localhost:3000";
  ({ GET } = await import("@/app/api/cron/follow-ups/route"));
});

afterAll(() => {
  mock.restore();
});

const request = (auth?: string) =>
  new Request("http://localhost/api/cron/follow-ups", {
    headers: auth ? { authorization: auth } : {},
  });

test("rejects missing/wrong cron secret", async () => {
  expect((await GET(request())).status).toBe(401);
  expect((await GET(request("Bearer wrong"))).status).toBe(401);
});

test("first run: sends correct thank-yous and nudges", async () => {
  const res = await GET(request("Bearer test-cron"));
  const body = await res.json();

  // thank-yous: v1 (dup v2 suppressed, opt-out v3 suppressed), v4, v6 (retry)
  // nudges: v5 only (v6 ty failed, v7 already nudged, v8 capped, v9 no ty)
  expect(body).toEqual({ thankYousSent: 3, nudgesSent: 1, failed: 0 });

  const recipients = sentEmails.flatMap((e) => e.to).sort();
  expect(recipients).toEqual(["dup@x.com", "v4@x.com", "v5@x.com", "v6@x.com"]);

  // subjects per type
  const v5Email = sentEmails.find((e) => e.to[0] === "v5@x.com")!;
  expect(v5Email.subject).toBe("Still thinking about 456 Oak Ave?");
  const v4Email = sentEmails.find((e) => e.to[0] === "v4@x.com")!;
  expect(v4Email.subject).toBe("Thanks for visiting 123 Main St!");

  // replies go to the agent; unsubscribe link present (CAN-SPAM)
  expect(v4Email.replyTo).toBe("agent@x.com");
  expect(v4Email.html).toMatch(/\/api\/email\/unsubscribe\?v=v4&(amp;)?sig=/);

  // ledger state: v6 retry incremented to attempts=2 and now sent
  const v6Log = db.email_log!.find(
    (l) => l.visitor_id === "v6" && l.email_type === "thank_you",
  )!;
  expect(v6Log.status).toBe("sent");
  expect(v6Log.attempts).toBe(2);

  // nudge recorded for v5
  const v5Nudge = db.email_log!.find(
    (l) => l.visitor_id === "v5" && l.email_type === "nudge",
  );
  expect(v5Nudge?.status).toBe("sent");

  // historical event e2 and toggle-off e4 never touched
  expect(db.email_log!.some((l) => l.event_id === "e2")).toBe(false);
  expect(db.email_log!.some((l) => l.event_id === "e4")).toBe(false);
});

test("second run: v6's nudge follows its recovered thank-you, nothing else", async () => {
  sentEmails.length = 0;
  const res = await GET(request("Bearer test-cron"));
  const body = await res.json();

  expect(body).toEqual({ thankYousSent: 0, nudgesSent: 1, failed: 0 });
  expect(sentEmails.flatMap((e) => e.to)).toEqual(["v6@x.com"]);
  expect(sentEmails[0]!.subject).toBe("Still thinking about 456 Oak Ave?");
});

test("third run: fully idempotent, nothing re-sent", async () => {
  sentEmails.length = 0;
  const res = await GET(request("Bearer test-cron"));
  const body = await res.json();

  expect(body).toEqual({ thankYousSent: 0, nudgesSent: 0, failed: 0 });
  expect(sentEmails).toHaveLength(0);
});
