import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';

// In-memory store for rate limiting
const store = new Map<string, { count: number; resetTime: number }>();

// Configuration from environment variables
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000');
const RATE_LIMIT_MAX_REQUESTS_USER = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_USER || '100');
const RATE_LIMIT_MAX_REQUESTS_IP = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_IP || '500');
const RATE_LIMIT_MAX_REQUESTS_GLOBAL = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS_GLOBAL || '10000');
const RATE_LIMIT_BURST_PERCENTAGE = parseInt(process.env.RATE_LIMIT_BURST_PERCENTAGE || '20');

// Action-specific limits
const ACTION_LIMITS: Record<string, number> = {
  SCAN: parseInt(process.env.RATE_LIMIT_ACTION_SCAN || '200'),
  DELETE: parseInt(process.env.RATE_LIMIT_ACTION_DELETE || '10'),
  LOGIN: parseInt(process.env.RATE_LIMIT_ACTION_LOGIN || '5'),
};

// Custom in-memory store implementation
class InMemoryStore {
  private hits: Map<string, { count: number; resetTime: number }> = store;

  async increment(key: string): Promise<{ totalHits: number; resetTime: number }> {
    const now = Date.now();
    const record = this.hits.get(key);

    if (!record || now > record.resetTime) {
      // Create new record
      const resetTime = now + RATE_LIMIT_WINDOW_MS;
      this.hits.set(key, { count: 1, resetTime });
      return { totalHits: 1, resetTime };
    }

    // Increment existing record
    record.count++;
    this.hits.set(key, record);
    return { totalHits: record.count, resetTime: record.resetTime };
  }

  async decrement(key: string): Promise<void> {
    const record = this.hits.get(key);
    if (record && record.count > 0) {
      record.count--;
      this.hits.set(key, record);
    }
  }

  async resetKey(key: string): Promise<void> {
    this.hits.delete(key);
  }

  async resetAll(): Promise<void> {
    this.hits.clear();
  }
}

const customStore = new InMemoryStore();

// Helper function to check rate limit
const checkRateLimit = async (
  key: string,
  limit: number,
  burstLimit?: number
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  const result = await customStore.increment(key);
  const actualLimit = burstLimit ? Math.floor(limit * (1 + burstLimit / 100)) : limit;
  
  return {
    allowed: result.totalHits <= actualLimit,
    remaining: Math.max(0, actualLimit - result.totalHits),
    resetTime: result.resetTime,
  };
};

// Per-user rate limiter
export const userRateLimiter = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const userId = (req as any).user?.id;
    if (!userId) {
      next();
      return;
    }

    const actionType = req.body?.actionType || req.method;
    const limit = ACTION_LIMITS[actionType] || RATE_LIMIT_MAX_REQUESTS_USER;
    const burstLimit = RATE_LIMIT_BURST_PERCENTAGE;

    const key = `user:${userId}`;
    const result = await checkRateLimit(key, limit, burstLimit);

    res.setHeader('X-RateLimit-Limit', limit.toString());
    res.setHeader('X-RateLimit-Remaining', result.remaining.toString());
    res.setHeader('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

    if (!result.allowed) {
      res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for user',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      });
      return;
    }

    next();
  } catch (error) {
    // If rate limiter fails, allow the request (fail-open)
    console.error('Rate limiter error:', error);
    next();
  }
};

// Per-IP rate limiter
export const ipRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS_IP,
  message: {
    success: false,
    message: 'Rate limit exceeded for IP address',
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip IP rate limiting for authenticated requests (user rate limiter handles it)
    return !!(req as any).user?.id;
  },
});

// Global rate limiter
export const globalRateLimiter = rateLimit({
  windowMs: RATE_LIMIT_WINDOW_MS,
  max: RATE_LIMIT_MAX_REQUESTS_GLOBAL,
  message: {
    success: false,
    message: 'System rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Combined rate limiter for log endpoints
export const logRateLimiter = [
  ipRateLimiter,
  globalRateLimiter,
  userRateLimiter,
];

// Helper to check if a specific action is allowed
export const checkActionRateLimit = async (
  userId: number,
  actionType: string
): Promise<{ allowed: boolean; remaining: number; resetTime: number }> => {
  const limit = ACTION_LIMITS[actionType] || RATE_LIMIT_MAX_REQUESTS_USER;
  const key = `user:${userId}:${actionType}`;
  return checkRateLimit(key, limit);
};

// Reset rate limit for a specific user (admin function)
export const resetUserRateLimit = async (userId: number): Promise<void> => {
  const key = `user:${userId}`;
  await customStore.resetKey(key);
};
