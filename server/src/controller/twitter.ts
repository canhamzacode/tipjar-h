import { Request, Response } from "express";
import { twitterClient } from "../utils";

export const getTweetById = async (req: Request, res: Response) => {
  const lookupTweetById = await twitterClient.tweets.findTweetById(
    "1511757922354663425",
    {
      expansions: ["author_id"],
      "user.fields": ["created_at", "description", "name"],
    },
  );

  console.log(lookupTweetById);
  return {
    data: lookupTweetById,
  };
};
