import { z } from "zod/v4";

export const US_STATES = [
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA",
  "KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ",
  "NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT",
  "VA","WA","WV","WI","WY","DC",
] as const;

const ZIP_RE = /^\d{5}(-\d{4})?$/;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
// HH:MM, with optional :SS — time columns round-trip as HH:MM:SS on edit
const TIME_RE = /^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/;

function isValidTimeZone(tz: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export const eventSchema = z
  .object({
    property_address: z
      .string()
      .trim()
      .min(5, "Address is required")
      .max(200, "Address must be 200 characters or less"),
    city: z
      .string()
      .trim()
      .min(2, "City is required")
      .max(100, "City must be 100 characters or less"),
    state: z.enum(US_STATES, "Select a valid state"),
    zip: z.string().trim().regex(ZIP_RE, "Enter a valid ZIP code (e.g. 60601)"),
    date: z.string().regex(DATE_RE, "Enter a valid date"),
    start_time: z.string().regex(TIME_RE, "Enter a valid start time"),
    end_time: z.string().regex(TIME_RE, "Enter a valid end time"),
    timezone: z
      .string()
      .max(64)
      .refine(isValidTimeZone, "Invalid timezone")
      .default("America/Chicago"),
    description: z
      .string()
      .max(5000, "Description must be 5,000 characters or less")
      .optional(),
    bedrooms: z.coerce
      .number()
      .int("Bedrooms must be a whole number")
      .min(0)
      .max(50, "Bedrooms must be 50 or less")
      .optional(),
    bathrooms: z.coerce
      .number()
      .min(0)
      .max(50, "Bathrooms must be 50 or less")
      .optional(),
    sqft: z.coerce
      .number()
      .int("Square footage must be a whole number")
      .min(0)
      .max(1_000_000, "Square footage must be 1,000,000 or less")
      .optional(),
    price: z.coerce
      .number()
      .min(0)
      .max(1_000_000_000, "Price must be $1,000,000,000 or less")
      .optional(),
    status: z
      .enum(["draft", "active", "completed", "pending_payment"])
      .default("draft"),
    follow_up_enabled: z.boolean().default(true),
    nudge_enabled: z.boolean().default(true),
  })
  .refine((data) => data.end_time.slice(0, 5) > data.start_time.slice(0, 5), {
    message: "End time must be after start time",
    path: ["end_time"],
  });

export type EventFormData = z.infer<typeof eventSchema>;
