import { db } from "../db";
import { bot_state } from "../db/schema";
import { eq } from "drizzle-orm";
import { handleMentions } from "./handleMentions";
import { rwClient } from "./twitter";

export const BOT_USERNAME = process.env.BOT_USERNAME!;

export const pollMentions = async () => {
  const me = await rwClient.v2.me();
  console.log("🤖 Logged in as:", me.data);

  const state = await db.query.bot_state.findFirst({
    where: eq(bot_state.id, "tipjarbot"),
  });

  const sinceId = state?.last_mention_id ?? undefined;

  const mentions = await rwClient.v2.userMentionTimeline(me.data.id, {
    since_id: sinceId,
    max_results: 10,
  });

  console.log("Fetched mentions raw:", mentions.data);

  if (!mentions.data.data?.length) {
    console.log("🕸️ No new mentions found");
    return;
  }

  for (const tweet of mentions.data.data.reverse()) {
    console.log("🔔 Processing mention:", tweet.id, tweet.text);
    await handleMentions(tweet);
  }

  const latestId = mentions.data.data[0].id;
  await db
    .insert(bot_state)
    .values({
      id: "tipjarbot",
      last_mention_id: latestId,
      updated_at: new Date(),
    })
    .onConflictDoUpdate({
      target: bot_state.id,
      set: {
        last_mention_id: latestId,
        updated_at: new Date(),
      },
    });

  console.log(`✅ Processed up to mention ID ${latestId}`);
};
