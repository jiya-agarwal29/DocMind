// In-memory fixed-window rate limiter.
//
// Known limitation: state lives in this process's memory, so it is only
// correct for a single-instance deployment. Multiple instances (or serverless
// cold starts) each keep their own counters, and a restart resets them. We are
// deliberately not solving that with Redis right now.

type RateLimitEntry = {
    count: number;
    resetAt: number;
};

// Module scope, so counters persist across requests within one process.
const requests = new Map<string, RateLimitEntry>();

function envNumber(name: string, fallback: number): number {
    const value = Number(process.env[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

// Read per call (not at import) so env overrides like 2 requests / 5 minutes
// can be used for testing without editing code.
const limit = () => Math.floor(envNumber("SEARCH_RATE_LIMIT", 10));
const windowMs = () => envNumber("SEARCH_RATE_WINDOW_MS", 60 * 1000);

export type RateLimitResult =
    | { allowed: true; remaining: number }
    | { allowed: false; remaining: 0; retryAfterSeconds: number };

export function checkRateLimit(userId: string): RateLimitResult {
    const now = Date.now();
    const max = limit();
    const entry = requests.get(userId);

    if (!entry || now >= entry.resetAt) {
        requests.set(userId, { count: 1, resetAt: now + windowMs() });
        return { allowed: true, remaining: max - 1 };
    }

    if (entry.count >= max) {
        return {
            allowed: false,
            remaining: 0,
            retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
        };
    }

    entry.count++;
    return { allowed: true, remaining: max - entry.count };
}
