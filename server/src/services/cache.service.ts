import logger from "./logger.service";

interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private cleanupInterval: NodeJS.Timeout;

  constructor(cleanupIntervalMs = 5 * 60 * 1000) {
    // 5 minutes
    // Periodic cleanup of expired items
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, cleanupIntervalMs);
  }

  set<T>(key: string, data: T, ttlMs = 10 * 60 * 1000): void {
    // 10 minutes default
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs,
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data as T;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    let expiredCount = 0;

    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
        expiredCount++;
      }
    }

    if (expiredCount > 0) {
      logger.debug("Cache cleanup completed", {
        expiredItems: expiredCount,
        remainingItems: this.cache.size,
      });
    }
  }

  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// Create singleton cache instance
export const cache = new MemoryCache();

// Utility functions for common cache patterns
export const cacheUser = (twitterHandle: string, userData: any): void => {
  cache.set(`user:${twitterHandle}`, userData, 30 * 60 * 1000); // 30 minutes
};

export const getCachedUser = (twitterHandle: string): any | null => {
  return cache.get(`user:${twitterHandle}`);
};

export const cacheBotState = (state: any): void => {
  cache.set("bot:state", state, 5 * 60 * 1000); // 5 minutes
};

export const getCachedBotState = (): any | null => {
  return cache.get("bot:state");
};
