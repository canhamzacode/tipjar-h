import { validateCommand, sanitizeUsername, sanitizeAmount } from "../services";

interface Command {
  type: "send" | "unknown";
  amount?: number;
  currency?: string;
  recipient?: string;
  error?: string;
}

export const parseCommand = (text: string): Command => {
  try {
    // Enhanced regex to handle various formats
    const match = text.match(/send\s+(\d+(?:\.\d{1,2})?)\s*(\w+)?\s*@(\w+)/i);

    if (!match) {
      return { type: "unknown", error: "Invalid command format" };
    }

    const rawAmount = parseFloat(match[1]);
    const currency = match[2]?.toUpperCase() || "HBAR";
    const recipient = sanitizeUsername(match[3]);

    // Validate parsed data
    const command = {
      type: "send" as const,
      amount: sanitizeAmount(rawAmount),
      currency,
      recipient,
    };

    const validation = validateCommand(command);
    if (!validation.success) {
      return {
        type: "unknown",
        error: `Invalid command: ${validation.error.issues.map((i) => i.message).join(", ")}`,
      };
    }

    return validation.data;
  } catch (error) {
    return { type: "unknown", error: "Failed to parse command" };
  }
};
