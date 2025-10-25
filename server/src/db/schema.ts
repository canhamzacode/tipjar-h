import {
  pgTable,
  pgEnum,
  varchar,
  text,
  timestamp,
  uuid,
  integer,
} from "drizzle-orm/pg-core";

export const walletType = pgEnum("wallet_type", ["non-custodial", "custodial"]);
export const transactionStatus = pgEnum("transaction_status", [
  "pending",
  "confirmed",
  "failed",
]);

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  twitter_handle: varchar("twitter_handle", { length: 50 }).unique(),
  twitter_id: varchar("twitter_id", { length: 50 }),
  wallet_address: varchar("wallet_address", { length: 66 }),
  wallet_type: walletType("wallet_type").default("non-custodial"),
  name: varchar("name", { length: 100 }),
  profile_image_url: text("profile_image_url"),
  description: text("description"),
  access_token: text("access_token"),
  refresh_token: text("refresh_token"),
  token_expires_at: timestamp("token_expires_at"),
  created_at: timestamp("created_at").defaultNow(),
});

export const contracts = pgTable("contracts", {
  id: uuid("id").defaultRandom().primaryKey(),
  owner_id: uuid("owner_id").references(() => users.id),
  contract_address: varchar("contract_address", { length: 66 }).unique(),
  deployed_at: timestamp("deployed_at").defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  sender_id: uuid("sender_id").references(() => users.id),
  receiver_id: uuid("receiver_id").references(() => users.id),
  token: varchar("token", { length: 20 }),
  amount: text("amount"),
  tx_hash: varchar("tx_hash", { length: 100 }),
  status: transactionStatus("status").default("pending"),
  created_at: timestamp("created_at").defaultNow(),
});

export const pending_tips = pgTable("pending_tips", {
  id: uuid("id").defaultRandom().primaryKey(),
  receiver_twitter: varchar("receiver_twitter", { length: 50 }),
  amount: text("amount"),
  token: varchar("token", { length: 20 }),
  sender_id: uuid("sender_id").references(() => users.id),
  created_at: timestamp("created_at").defaultNow(),
});

export const mentions = pgTable("mentions", {
  id: uuid("id").defaultRandom().primaryKey(),
  tweet_id: text("tweet_id").unique().notNull(),
  author_username: varchar("author_username", { length: 50 }).notNull(),
  text: text("text").notNull(),
  processed: integer("processed").default(0), // 0 = new, 1 = processed
  created_at: timestamp("created_at").defaultNow(),
});

export const bot_state = pgTable("bot_state", {
  id: text("id").primaryKey().default("tipjarbot"),
  last_mention_id: text("last_mention_id"),
  updated_at: timestamp("updated_at").defaultNow(),
});
