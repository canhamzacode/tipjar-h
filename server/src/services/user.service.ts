import { eq } from "drizzle-orm";
import { db } from "../db";
import { users } from "../db/schema";
import logger from "./logger.service";

export const findUserById = async (id: string) => {
  try {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  } catch (error) {
    logger.error(
      `Error finding user by id ${error instanceof Error ? error.message : error}`,
    );
    throw new Error(
      `Error finding user by id ${error instanceof Error ? error.message : error}`,
    );
  }
};
