import dotenv from "dotenv";

dotenv.config();
import { TwitterApi } from "twitter-api-v2";

const BOT_USERNAME = "canhamzacode";
const STATE_FILE = "./bot_state.json";
const POLL_INTERVAL = 2 * 60 * 1000;
const DRY_RUN = true;

const client = new TwitterApi({
  appKey: process.env.X_API_KEY!,
  appSecret: process.env.X_API_SECRET!,
  accessToken: process.env.X_ACCESS_TOKEN!,
  accessSecret: process.env.X_ACCESS_SECRET!,
});

export const rwClient = client.readWrite;
