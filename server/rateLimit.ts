import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

export function createRateLimiter(limit: number, windowMs: number) {
  const buckets = new Map<string, Bucket>();
  let requestsSinceSweep = 0;

  return (request: Request, response: Response, next: NextFunction) => {
    const now = Date.now();
    requestsSinceSweep += 1;
    if (requestsSinceSweep >= 1_000) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
      requestsSinceSweep = 0;
    }
    const key = request.ip || request.socket.remoteAddress || "unknown";
    const current = buckets.get(key);

    if (!current || current.resetAt <= now) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      next();
      return;
    }

    if (current.count >= limit) {
      response.setHeader("Retry-After", Math.ceil((current.resetAt - now) / 1000));
      response.status(429).json({ error: "请求过于频繁，请稍后再试。" });
      return;
    }

    current.count += 1;
    next();
  };
}
