export interface RateLimitResult {
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTimeMs: number;
}

export interface RateLimiter {
  check(key: string): Promise<RateLimitResult> | RateLimitResult;
  reset(key: string): Promise<void> | void;
}

/**
 * In-memory sliding window rate limiter.
 * Default: 10 requests per 60 minutes per user key.
 * Can be swapped for Redis / Upstash with the same RateLimiter interface.
 */
class InMemoryRateLimiter implements RateLimiter {
  private requests = new Map<string, number[]>();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests = 10, windowMs = 60 * 60 * 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    // Periodic cleanup of stale entries every 10 minutes
    if (typeof setInterval !== 'undefined') {
      const timer = setInterval(() => this.cleanup(), 10 * 60 * 1000);
      if (typeof timer.unref === 'function') {
        timer.unref();
      }
    }
  }

  check(key: string): RateLimitResult {
    const now = Date.now();
    const timestamps = this.requests.get(key) || [];

    // Filter out timestamps outside the active sliding window
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxRequests) {
      const oldestValid = validTimestamps[0];
      const resetTimeMs = oldestValid + this.windowMs;
      this.requests.set(key, validTimestamps);
      return {
        allowed: false,
        limit: this.maxRequests,
        remaining: 0,
        resetTimeMs,
      };
    }

    validTimestamps.push(now);
    this.requests.set(key, validTimestamps);

    return {
      allowed: true,
      limit: this.maxRequests,
      remaining: this.maxRequests - validTimestamps.length,
      resetTimeMs: now + this.windowMs,
    };
  }

  reset(key: string): void {
    this.requests.delete(key);
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, timestamps] of this.requests.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.requests.delete(key);
      } else {
        this.requests.set(key, valid);
      }
    }
  }
}

// Global singleton instance
export const agentRateLimiter = new InMemoryRateLimiter(10, 60 * 60 * 1000);
