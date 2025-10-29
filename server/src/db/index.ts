import dotenv from "dotenv";
dotenv.config();
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "./schema";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql, { schema });

/**
 * Ensure the database is reachable by attempting a small read.
 * Uses exponential backoff with jitter. Returns when a probe succeeds or
 * throws after maxRetries.
 */
export async function ensureDbReady(opts?: {
  maxRetries?: number;
  initialDelayMs?: number;
  jitterMs?: number;
}) {
  const { maxRetries = 6, initialDelayMs = 250, jitterMs = 100 } = opts || {};

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      // Perform a lightweight read using a known table from our schema.
      // If your schema changes, adjust this probe to a stable table.
      // We use a findFirst which compiles to a simple SELECT 1 LIMIT 1 style query.
      // If the DB is not ready this will throw and we'll retry.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const _ = await db.query.bot_state.findFirst();
      return;
    } catch (err) {
      const delay = Math.round(
        initialDelayMs * Math.pow(2, attempt) + Math.random() * jitterMs,
      );
      // eslint-disable-next-line no-console
      console.warn(
        `Database probe failed (attempt ${attempt + 1}/${maxRetries}): ${String(err)} — retrying in ${delay}ms`,
      );
      await sleep(delay);
    }
  }

  throw new Error("Unable to reach database after multiple attempts");
}

/**
 * Single-shot readiness check. Returns true if DB responds to a lightweight
 * query, false otherwise. Use for readiness endpoints.
 */
export async function isDbReady(): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _ = await db.query.users.findFirst();
    return true;
  } catch {
    return false;
  }
}
