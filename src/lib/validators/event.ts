import { z } from "zod/v4";

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const eventSchema = z.object({
  property_address: z.string().min(5, "Address is required").max(200),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(50),
  zip: z.string().min(5, "ZIP code is required").max(10),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  timezone: z
    .string()
    .max(64)
    .refine(isValidTimeZone, "Invalid timezone")
    .default("America/Chicago"),
  description: z.string().max(5000).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  sqft: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  status: z.enum(["draft", "active", "completed"]).default("draft"),
  follow_up_enabled: z.boolean().default(true),
  nudge_enabled: z.boolean().default(true),
});

export type EventFormData = z.infer<typeof eventSchema>;
