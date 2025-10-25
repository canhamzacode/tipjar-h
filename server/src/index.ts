import express from "express";
import config from "./config/config";
import { errorHandler } from "./middleware";
import appROute from "./routes";
import { logger } from "./services";
import session from "express-session";

const app = express();

// TODO: Upgrade to persistent session store (Redis or connect-pg-simple) for production
// Current in-memory store will lose OAuth states on server restart
app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key-change-this",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(express.json());
app.use("/api/v1", appROute);
app.use(errorHandler);

app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid,
    },
  });
});

const server = app.listen(config.port, () => {
  logger.info("Server started", { port: config.port });
});

if (process.env.START_BOT !== "false") {
  logger.info("Starting integrated bot...");
  import("./bot").catch((error) => {
    logger.error("Failed to start bot", error);
  });
}

process.on("SIGINT", () => {
  logger.info("Received SIGINT, shutting down gracefully");

  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});

process.on("SIGTERM", () => {
  logger.info("Received SIGTERM, shutting down gracefully");

  server.close(() => {
    logger.info("Server closed");
    process.exit(0);
  });
});
