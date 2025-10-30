import { validateCommand, sanitizeUsername, sanitizeAmount } from "../services";

export interface Command {
  type: "send" | "unknown";
  amount?: number;
  currency?: string;
  recipient?: string;
  note?: string;
  error?: string;
}

export const parseCommand = (text: string): Command => {
  try {
    // Enhanced regex to handle various formats and capture an optional trailing message/note.
    // Examples matched:
    // - send 5 HBAR @alice
    // - send 5 hbar @alice keep the good work
    // - send 5 @alice thanks!
    const match = text.match(
      /send\s+(\d+(?:\.\d{1,2})?)\s*(\w+)?\s*@([a-zA-Z0-9_]{1,15})(?:[\s,:-]+(.+))?/i,
    );

    if (!match) {
      return { type: "unknown", error: "Invalid command format" };
    }

    const rawAmount = parseFloat(match[1]);
    const currency = match[2]?.toUpperCase() || "HBAR";
    const recipient = sanitizeUsername(match[3]);
    const rawNote = match[4] ? String(match[4]).trim() : undefined;

    // limit note length to avoid storing huge data
    const note = rawNote ? rawNote.substring(0, 256) : undefined;

    // Validate parsed data
    const command = {
      type: "send" as const,
      amount: sanitizeAmount(rawAmount),
      currency,
      recipient,
      note,
    };

    const validation = validateCommand(command as any);
    if (!validation.success) {
      return {
        type: "unknown",
        error: `Invalid command: ${validation.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return validation.data as Command;
  } catch (error) {
    return { type: "unknown", error: "Failed to parse command" };
  }
};
