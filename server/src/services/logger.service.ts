import winston from 'winston';
const { combine, timestamp, printf, colorize, errors } = winston.format;

interface LogContext {
  [key: string]: any;
}

// Custom format for better readability
const customFormat = printf((info) => {
  const { timestamp, level, message, ...meta } = info;
  const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
  return `${timestamp} ${level}: ${message}${metaStr}`;
});

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }), // Handle error objects properly
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    customFormat
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    })
  ]
});

// Add console transport for non-production environments
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: combine(
      colorize(),
      timestamp({ format: 'HH:mm:ss' }),
      printf((info) => {
        const { timestamp, level, message, ...meta } = info;
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta, null, 2)}` : '';
        return `${timestamp} ${level}: ${message}${metaStr}`;
      })
    )
  }));
}

// Extend logger with our custom interface for backward compatibility
const extendedLogger = {
  info: (message: string, context?: LogContext) => {
    logger.info(message, context);
  },
  
  warn: (message: string, context?: LogContext) => {
    logger.warn(message, context);
  },
  
  error: (message: string, error?: Error, context?: LogContext) => {
    if (error) {
      logger.error(message, { ...context, error: error.message, stack: error.stack });
    } else {
      logger.error(message, context);
    }
  },
  
  debug: (message: string, context?: LogContext) => {
    logger.debug(message, context);
  }
};

export { extendedLogger as logger };
export default logger;
