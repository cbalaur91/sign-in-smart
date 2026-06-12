import { z } from "zod/v4";

export const signUpSchema = z
  .object({
    first_name: z.string().trim().min(1, "First name is required").max(100),
    last_name: z.string().trim().min(1, "Last name is required").max(100),
    phone: z
      .string()
      .trim()
      .min(10, "Please enter a valid phone number")
      .max(20)
      .regex(/^[+]?[\d\s()-]+$/, "Please enter a valid phone number"),
    email: z.email("Please enter a valid email address").max(255),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must contain at least one letter")
      .regex(/\d/, "Password must contain at least one number"),
    confirm_password: z.string(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "Passwords do not match",
    path: ["confirm_password"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;
