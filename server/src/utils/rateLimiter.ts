import { logger } from './logger';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  backoffMs: number;
}

class RateLimiter {
  private requests: number[] = [];
  private config: RateLimitConfig;
  private isBackingOff = false;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async checkLimit(): Promise<boolean> {
    if (this.isBackingOff) {
      logger.warn('Rate limiter in backoff mode');
      return false;
    }

    const now = Date.now();
    
    // Remove old requests outside the window
    this.requests = this.requests.filter(
      timestamp => now - timestamp < this.config.windowMs
    );

    if (this.requests.length >= this.config.maxRequests) {
      logger.warn('Rate limit exceeded, entering backoff', {
        requests: this.requests.length,
        maxRequests: this.config.maxRequests
      });
      
      this.startBackoff();
      return false;
    }

    this.requests.push(now);
    return true;
  }

  private startBackoff(): void {
    this.isBackingOff = true;
    setTimeout(() => {
      this.isBackingOff = false;
      this.requests = []; // Clear requests after backoff
      logger.info('Rate limiter backoff ended');
    }, this.config.backoffMs);
  }

  getStatus() {
    return {
      requestCount: this.requests.length,
      maxRequests: this.config.maxRequests,
      isBackingOff: this.isBackingOff
    };
  }
}

// Twitter API v2 free tier limits: 300 requests per 15 minutes
export const twitterRateLimiter = new RateLimiter({
  maxRequests: 250, // Conservative limit
  windowMs: 15 * 60 * 1000, // 15 minutes
  backoffMs: 5 * 60 * 1000, // 5 minute backoff
});
