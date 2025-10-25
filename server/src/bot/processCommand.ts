import { parseCommand } from "./parser";
import { rwClient, DRY_RUN } from "../utils";
import { logger } from "../services";
import { handleTransactionCommand } from "./handleTransactionCommand";

export async function processCommand(validTweet: {
  id: string;
  text: string;
  author_id: string;
}) {
  const command = parseCommand(validTweet.text);
  logger.debug("Parsed command", { command, tweetId: validTweet.id });

  if (command.type === "send" && command.recipient && command.amount) {
    await handleTransactionCommand(validTweet, command);
  } else {
    const helpMessage = command.error
      ? `❌ ${command.error}. Try: "send 5 HBAR @username"`
      : `❌ Could not understand your command. Try: "send 5 HBAR @username"`;

    if (!DRY_RUN) {
      await rwClient.v2.reply(helpMessage, validTweet.id);
    } else {
      logger.info("DRY RUN - Would send help reply", { message: helpMessage });
    }

    logger.info("Sent help message for invalid command", {
      tweetId: validTweet.id,
      error: command.error,
    });
  }
}
