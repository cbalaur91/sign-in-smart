import { z } from "zod/v4";

export const visitorSchema = z.object({
  full_name: z.string().min(2, "Name must be at least 2 characters").max(200),
  email: z.email("Please enter a valid email address"),
  phone: z
    .string()
    .min(10, "Please enter a valid phone number")
    .max(20)
    .regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number"),
  visitor_type: z.enum(["buyer", "neighbor", "investor", "other"]),
  notes: z.string().max(1000).optional(),
});

export type VisitorFormData = z.infer<typeof visitorSchema>;
