import { z } from "zod/v4";

export const eventSchema = z.object({
  property_address: z.string().min(5, "Address is required").max(200),
  city: z.string().min(2, "City is required").max(100),
  state: z.string().min(2, "State is required").max(50),
  zip: z.string().min(5, "ZIP code is required").max(10),
  date: z.string().min(1, "Date is required"),
  start_time: z.string().min(1, "Start time is required"),
  end_time: z.string().min(1, "End time is required"),
  description: z.string().max(5000).optional(),
  bedrooms: z.coerce.number().int().min(0).optional(),
  bathrooms: z.coerce.number().min(0).optional(),
  sqft: z.coerce.number().int().min(0).optional(),
  price: z.coerce.number().min(0).optional(),
  status: z.enum(["draft", "active", "completed"]).default("draft"),
});

export type EventFormData = z.infer<typeof eventSchema>;
