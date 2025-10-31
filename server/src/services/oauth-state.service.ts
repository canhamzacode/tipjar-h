import { db } from "../db";
import { oauth_states } from "../db/schema";
import { eq, lt } from "drizzle-orm";

export const saveOAuthState = async (state: string, codeVerifier: string) => {
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  
  await db.insert(oauth_states).values({
    state,
    code_verifier: codeVerifier,
    expires_at: expiresAt,
  });
};

export const getOAuthState = async (state: string) => {
  const result = await db
    .select()
    .from(oauth_states)
    .where(eq(oauth_states.state, state))
    .limit(1);
  
  return result[0] || null;
};

export const deleteOAuthState = async (state: string) => {
  await db.delete(oauth_states).where(eq(oauth_states.state, state));
};

export const cleanupExpiredOAuthStates = async () => {
  const now = new Date();
  await db.delete(oauth_states).where(lt(oauth_states.expires_at, now));
};
