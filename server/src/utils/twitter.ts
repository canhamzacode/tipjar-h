import dotenv from "dotenv";
import { TwitterApi } from "twitter-api-v2";

dotenv.config();

const requiredEnvVars = [
  "X_API_KEY",
  "X_API_SECRET",
  "X_ACCESS_TOKEN",
  "X_ACCESS_SECRET",
  "BOT_USERNAME",
  "OAUTH2_CLIENT_ID",
  "OAUTH2_CLIENT_SECRET",
  "OAUTH2_CALLBACK_URL",
];

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`);
  }
}

export const BOT_USERNAME = process.env.BOT_USERNAME!;
export const DRY_RUN = process.env.NODE_ENV !== "production";

const client = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!,
});

export const rwClient = client.readWrite;

export function createOAuthClient() {
  return new TwitterApi({
    clientId: process.env.OAUTH2_CLIENT_ID!,
    clientSecret: process.env.OAUTH2_CLIENT_SECRET!,
  });
}

export function generateOAuthLink() {
  const client = createOAuthClient();

  return client.generateOAuth2AuthLink(process.env.OAUTH2_CALLBACK_URL!, {
    scope: ["tweet.read", "users.read", "offline.access", "tweet.write"],
  });
}
