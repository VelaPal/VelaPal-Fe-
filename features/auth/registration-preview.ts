import { z } from "zod";

// Form validation only; registration is unavailable in the frozen contract.
export const registrationSchema = z
  .object({
    party: z.enum(["CUSTOMER", "SELLER"]),
    name: z.string().trim().min(2, "Enter your full name.").max(100),
    email: z.email("Enter a valid email address.").max(254),
    password: z.string().min(15, "Use at least 15 characters.").max(128),
    confirmPassword: z.string(),
    terms: z.boolean().refine((v) => v, "Review and accept the terms."),
    businessName: z.string().trim().max(100),
    businessCategory: z.enum(["Digital content", "Physical goods", "Services"]),
    country: z.enum(["Indonesia", "Singapore", "United States"]),
    website: z.union([z.literal(""), z.url("Enter a valid website URL.")]),
  })
  .superRefine((v, ctx) => {
    if (v.password !== v.confirmPassword)
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Passwords do not match.",
      });
    if (v.party === "SELLER" && v.businessName.length < 2)
      ctx.addIssue({
        code: "custom",
        path: ["businessName"],
        message: "Enter your business name.",
      });
  });
export type RegistrationInput = z.infer<typeof registrationSchema>;
