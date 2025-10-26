import { z } from "zod";

export const connectWalletSchema = z.object({
  body: z.object({
    walletAddress: z
      .string()
      .min(1, "Wallet address is required")
      .regex(/^0\.[0-9]+\.[0-9]+$/, "Invalid Hedera account ID format"),
  }),
});
