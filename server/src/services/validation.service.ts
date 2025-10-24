import { TweetV2 } from "twitter-api-v2";
import { z } from "zod";

export const tweetSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(280),
  author_id: z.string().min(1),
});

export const commandSchema = z.object({
  type: z.enum(["send", "unknown"]),
  amount: z.number().positive().max(1000000).optional(),
  currency: z
    .string()
    .regex(/^[A-Z]{2,10}$/)
    .optional(),
  recipient: z
    .string()
    .regex(/^[a-zA-Z0-9_]{1,15}$/)
    .optional(),
});

export const validateTweet = (tweet: TweetV2) => {
  return tweetSchema.safeParse(tweet);
};

export const validateCommand = (command: {
  type: "send" | "unknown";
  amount: number;
  currency: string;
  recipient: string;
}) => {
  return commandSchema.safeParse(command);
};

export const sanitizeUsername = (username: string): string => {
  return username.replace(/[^a-zA-Z0-9_]/g, "").substring(0, 15);
};

export const sanitizeAmount = (amount: number): number => {
  return Math.max(0, Math.min(1000000, Math.floor(amount * 100) / 100));
};
