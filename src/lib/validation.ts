import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const registerSchema = z.object({
  name: z.string().min(2, "Please enter your full name"),
  email: z.string().min(1, "Email is required").email("Enter a valid email"),
  password: z
    .string()
    .min(12, "At least 12 characters")
    .regex(/[A-Z]/, "Add an uppercase letter")
    .regex(/[0-9]/, "Add a number")
    .regex(/[^A-Za-z0-9]/, "Add a symbol"),
});

export const serverNameSchema = z
  .string()
  .min(3, "At least 3 characters")
  .max(32, "Keep it under 32 characters")
  .regex(/^[a-z0-9][a-z0-9-]*$/, "Lowercase letters, numbers, and dashes only");

export type FieldErrors<T extends string> = Partial<Record<T, string>>;

/** Validate with a zod schema; returns typed field errors keyed by path. */
export function validate<T>(
  schema: z.ZodType<T>,
  data: unknown,
): { ok: true; data: T } | { ok: false; errors: Record<string, string> } {
  const res = schema.safeParse(data);
  if (res.success) return { ok: true, data: res.data };
  const errors: Record<string, string> = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0]?.toString() ?? "_";
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, errors };
}
