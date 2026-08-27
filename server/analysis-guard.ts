export type RateLimitDecision = {
  allowed: boolean;
  retryAfterSeconds: number;
};

/**
 * Per-process budget guard. It limits abuse and accidental fan-out; it is not
 * a substitute for a distributed quota store when the service scales out.
 */
export function createSlidingWindowLimiter(options: {
  maxRequests: number;
  windowMs: number;
  maxKeys?: number;
}) {
  const hits = new Map<string, number[]>();
  const maxKeys = options.maxKeys ?? 2_000;

  function purge(now: number) {
    for (const [key, timestamps] of hits) {
      const fresh = timestamps.filter((timestamp) => now - timestamp < options.windowMs);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
    while (hits.size > maxKeys) {
      const firstKey = hits.keys().next().value as string | undefined;
      if (!firstKey) break;
      hits.delete(firstKey);
    }
  }

  return {
    consume(key: string, now = Date.now()): RateLimitDecision {
      purge(now);
      const timestamps = hits.get(key) ?? [];
      if (timestamps.length >= options.maxRequests) {
        const retryAfterSeconds = Math.max(1, Math.ceil((options.windowMs - (now - timestamps[0])) / 1_000));
        return { allowed: false, retryAfterSeconds };
      }
      hits.set(key, [...timestamps, now]);
      return { allowed: true, retryAfterSeconds: 0 };
    },
  };
}

export function requestIdentity(headers: unknown) {
  const headerRecord = headers && typeof headers === "object"
    ? headers as Record<string, unknown>
    : {};
  const getter = headerRecord.get;
  const forwarded = typeof getter === "function"
    ? (getter as (name: string) => string | null)("x-forwarded-for")
    : headerRecord["x-forwarded-for"];
  const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  const candidate = value?.split(",")[0]?.trim();
  return candidate && /^[a-fA-F0-9:.]{3,64}$/.test(candidate) ? `ip:${candidate}` : "anonymous";
}
