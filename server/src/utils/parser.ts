interface Command {
  type: "send" | "unknown";
  amount?: number;
  currency?: string;
  recipient?: string;
}

export const parseCommand = (text: string): Command => {
  const match = text.match(/send\s+(\d+)\s*(\w+)?\s*@(\w+)/i);
  if (match) {
    return {
      type: "send",
      amount: Number(match[1]),
      currency: match[2]?.toUpperCase() || "HBAR",
      recipient: match[3],
    };
  }
  return { type: "unknown" };
};
