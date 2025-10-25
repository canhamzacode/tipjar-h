import dotenv from "dotenv";

dotenv.config();

interface Config {
  port: number;
  nodeEnv: string;
  CONSUMER_API_KEY: string;
  CONSUMER_API_SECRET: string;
  jwtSecret: string;
  jwtRefreshSecret: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || "development",
  CONSUMER_API_KEY: process.env.CONSUMER_API_KEY || "",
  CONSUMER_API_SECRET: process.env.CONSUMER_API_SECRET || "",
  jwtSecret: process.env.JWT_SECRET || "change-this-secret-in-production",
  jwtRefreshSecret:
    process.env.JWT_REFRESH_SECRET ||
    "change-this-refresh-secret-in-production",
};

// Warn if using default secrets in production
if (config.nodeEnv === "production") {
  if (config.jwtSecret === "change-this-secret-in-production") {
    console.warn("⚠️  WARNING: Using default JWT_SECRET in production!");
  }
  if (config.jwtRefreshSecret === "change-this-refresh-secret-in-production") {
    console.warn(
      "⚠️  WARNING: Using default JWT_REFRESH_SECRET in production!",
    );
  }
}

export default config;
