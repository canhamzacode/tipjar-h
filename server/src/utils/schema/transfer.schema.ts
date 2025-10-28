import { z } from "zod";

export const transferTokenSchema = z.object({
  body: z.object({
    receiverHandle: z.string().min(1, "receiverHandle is required"),
    amount: z.preprocess(
      (val) => {
        if (typeof val === "number") return String(val);
        if (typeof val === "string") return val.trim();
        return val;
      },
      z
        .string()
        .min(1, "amount is required")
        .refine((val) => /^\d+(?:\.\d+)?$/.test(val), {
          message: "amount must be a numeric string (e.g. '1' or '1.23')",
        }),
    ),
    token: z.enum(["HBAR"]),
  }),
});

export type TransferTokenInput = z.infer<typeof transferTokenSchema>;
