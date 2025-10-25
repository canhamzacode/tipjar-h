import { z } from "zod";

export const twitterCallbackSchema = z.object({
  query: z.object({
    code: z.string(),
    state: z.string(),
  }),
});
