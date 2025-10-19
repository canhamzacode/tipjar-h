import express from "express";
import config from "./config/config";
import { errorHandler } from "./middleware";
import appROute from "./routes";
import { logger } from "./utils/logger";

const app = express();

// Middleware
app.use(express.json());
app.use("/api/v1", appROute);
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    server: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      pid: process.pid
    }
  });
});

// Start server
const server = app.listen(config.port, () => {
  logger.info('Server started', { port: config.port });
});

// Start bot in separate process (optional - can be run separately)
if (process.env.START_BOT !== 'false') {
  logger.info('Starting integrated bot...');
  // Import bot to start it automatically
  import('./bot').catch((error) => {
    logger.error('Failed to start bot', error);
  });
}

// Graceful shutdown
process.on('SIGINT', () => {
  logger.info('Received SIGINT, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  logger.info('Received SIGTERM, shutting down gracefully');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
