import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  CONSUMER_API_KEY: string;
  CONSUMER_API_SECRET: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  CONSUMER_API_KEY: process.env.CONSUMER_API_KEY || "",
  CONSUMER_API_SECRET: process.env.CONSUMER_API_SECRET || "",
};

export default config;
