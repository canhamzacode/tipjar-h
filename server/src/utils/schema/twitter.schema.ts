import { z } from "zod";

export const twitterCallbackSchema = z.object({
  query: z.object({
    code: z.string(),
    state: z.string(),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refresh_token: z.string().min(1, "Refresh token is required"),
  }),
});
