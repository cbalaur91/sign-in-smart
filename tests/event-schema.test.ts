import { describe, expect, test } from "bun:test";
import { eventSchema } from "../src/lib/validators/event";

const valid = {
  property_address: "123 Main Street",
  city: "Chicago",
  state: "IL",
  zip: "60601",
  date: "2026-07-01",
  start_time: "10:00",
  end_time: "12:00",
  timezone: "America/Chicago",
  description: "A lovely home",
  bedrooms: 3,
  bathrooms: 2.5,
  sqft: 1800,
  price: 450000,
  status: "draft",
  follow_up_enabled: true,
  nudge_enabled: true,
};

describe("eventSchema", () => {
  test("accepts a valid payload", () => {
    const result = eventSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  test("accepts ZIP+4", () => {
    expect(eventSchema.safeParse({ ...valid, zip: "60601-1234" }).success).toBe(true);
  });

  test("rejects malformed ZIP", () => {
    for (const zip of ["6060", "abcde", "606011", "60601-12"]) {
      const result = eventSchema.safeParse({ ...valid, zip });
      expect(result.success).toBe(false);
    }
  });

  test("rejects unknown state code", () => {
    expect(eventSchema.safeParse({ ...valid, state: "ZZ" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, state: "Illinois" }).success).toBe(false);
  });

  test("rejects malformed date", () => {
    expect(eventSchema.safeParse({ ...valid, date: "07/01/2026" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, date: "" }).success).toBe(false);
  });

  test("rejects malformed times", () => {
    expect(eventSchema.safeParse({ ...valid, start_time: "25:00" }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, end_time: "noonish" }).success).toBe(false);
  });

  test("accepts HH:MM:SS times (DB round-trip on edit)", () => {
    const result = eventSchema.safeParse({
      ...valid,
      start_time: "10:00:00",
      end_time: "12:00:00",
    });
    expect(result.success).toBe(true);
  });

  test("rejects end time at or before start time", () => {
    expect(
      eventSchema.safeParse({ ...valid, start_time: "12:00", end_time: "10:00" }).success,
    ).toBe(false);
    expect(
      eventSchema.safeParse({ ...valid, start_time: "12:00", end_time: "12:00" }).success,
    ).toBe(false);
  });

  test("rejects out-of-range property numbers", () => {
    expect(eventSchema.safeParse({ ...valid, bedrooms: 51 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, bathrooms: 51 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, sqft: 1_000_001 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, price: 1_000_000_001 }).success).toBe(false);
    expect(eventSchema.safeParse({ ...valid, bedrooms: -1 }).success).toBe(false);
  });

  test("rejects oversized description", () => {
    expect(
      eventSchema.safeParse({ ...valid, description: "x".repeat(5001) }).success,
    ).toBe(false);
  });

  test("defaults status to draft when omitted", () => {
    const { status: _status, ...rest } = valid;
    const result = eventSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.status).toBe("draft");
  });

  test("accepts pending_payment status (edit of gated event)", () => {
    expect(eventSchema.safeParse({ ...valid, status: "pending_payment" }).success).toBe(true);
  });

  test("trims whitespace on address and city", () => {
    const result = eventSchema.safeParse({
      ...valid,
      property_address: "  123 Main Street  ",
      city: "  Chicago ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.property_address).toBe("123 Main Street");
      expect(result.data.city).toBe("Chicago");
    }
  });
});
