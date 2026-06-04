---
id: ku-05
title: "Rate Limiting & Abuse Prevention"
subdomain: "ai-safety-security"
ku-type: "operations"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/ai-safety-security/ku-05/04-standardized-knowledge.md"
---

# Rate Limiting & Abuse Prevention

## Overview

Rate limiting and abuse prevention controls how many requests an AI system processes from a given user, application, or IP address within a time window. In LLM applications, rate limiting serves dual purposes: protecting backend resources (LLM API costs, database connections) and preventing abuse (scraping, prompt injection probing, budget exhaustion). Unlike traditional API rate limiting, AI rate limiting must also account for token consumption and cost, not just request count.

## Core Concepts

- **Request Rate Limit:** Maximum number of API requests per time window (e.g., 100 requests/minute per user).
- **Token Rate Limit:** Maximum number of tokens (prompt + completion) per time window (e.g., 100K tokens/hour per application).
- **Cost Rate Limit:** Maximum spend per time window (e.g., $10/day per user). Critical for preventing budget overruns.
- **Concurrency Limit:** Maximum number of simultaneous requests from a single user or application.
- **Token Bucket Algorithm:** A rate limiting algorithm that refills tokens at a fixed rate. Simple and effective for variable-sized bursts.
- **Sliding Window Algorithm:** Counts requests in a rolling time window. More accurate than fixed window (no boundary spikes).
- **Abuse Detection:** Identifying malicious patterns (multiple accounts from same IP, rapid-fire requests, known attack patterns).
- **Throttling vs. Blocking:** Throttling slows down requests (429 with retry-after); blocking permanently denies access (403).

## When To Use

- Any public-facing AI API or application — rate limiting is mandatory.
- Applications with free tiers — prevent one user from exhausting budget.
- Multi-tenant SaaS — ensure fair resource allocation across tenants.
- Systems with expensive LLM calls — cap daily/weekly spend per user.

## When NOT To Use

- Internal tools with a small, trusted user base (still recommended but can be simpler).
- Batch processing systems where queuing is handled by the job system (rate limit at the provider level instead).
- Single-user applications (the user is the only consumer).

## Best Practices

- **Implement layered rate limits:** infrastructure-level (nginx/cloudflare), application-level (Laravel middleware), and business-level (per-user token budget).
- **Always return meaningful error responses:** `429 Too Many Requests` with `Retry-After` header and a clear message.
- **Use token-aware limits, not just request counts.** A single request with 50K tokens is more expensive than 50 requests with 100 tokens each.
- **Notify users approaching limits** rather than surprising them with a hard block. Send warnings at 80%, 90%, 95% usage.
- **Allow bursting** within limits — the token bucket algorithm is ideal for this (refills over time, allows short bursts).

## Architecture Guidelines

- Use **Redis** for distributed rate limiting (all application instances share the same counter).
- Implement rate limiting at **multiple levels of the stack**: CDN (Cloudflare), load balancer, application middleware, and business logic.
- For token-based rate limiting, the middleware must read token usage from the LLM response and decrement the budget accordingly.
- Use a **dedicated rate limit service** for complex policies (per-user, per-IP, per-endpoint, per-model) with hot-reload of policy changes.
- Store rate limit state (counters, budgets) in **Redis with TTL** equal to the window duration.

## Performance Considerations

- Redis-based rate limiting adds <1ms per check. Use pipelining for batched checks.
- Token counting (prompt + completion) should be fast (<0.1ms). Use pre-computed estimates where exact counting is not needed.
- Cache rate limit policy definitions (not the counters) locally with short TTL (60 seconds).
- For high-throughput systems (>1000 req/s), use **local counters** with periodic sync to Redis (eventual consistency is acceptable for rate limiting).
- Concurrency limits require atomic operations (Redis INCR/DECR on request start/end).

## Security Considerations

- **Rate limit bypass:** Attackers may use distributed attacks (many IPs, many API keys). Implement behavioral analysis alongside rate limiting.
- **Rate limit header information:** Don't expose detailed rate limit state (remaining budget) to unauthenticated users (helps attackers optimize).
- **Resource exhaustion:** A coordinated attack can exhaust the rate limiter's Redis connection pool. Use connection pooling and timeouts.
- **Cost-based attacks:** An attacker may trigger expensive model calls (large context, long responses). Always rate limit by cost, not just requests.
- **Graceful degradation:** If the rate limit service is unavailable, allow requests with a warning log (fail-open for rate limiting, fail-closed for abuse detection).

## Common Mistakes

- Only rate limiting by request count, ignoring token/cost consumption.
- Using fixed-window rate limiting without handling window boundary spikes (sliding window preferred).
- Not rate limiting at the infrastructure level — application-level limits can be bypassed by direct network access.
- Exposing detailed rate limit state to unauthenticated users.
- Applying the same limits to all endpoints — streaming endpoints should have different limits than batch endpoints.

## Anti-Patterns

- **Hardcoded Limits:** Rate limit values should be configurable per environment and per plan tier.
- **Punitive Throttling:** Rate limiting that degrades all users to unacceptably slow speeds. Use hard blocks instead of overly aggressive throttling.
- **No Limit Visibility:** Users don't know their limits until they hit them. Expose limit status in API responses and developer dashboards.
- **Synchronous Blocking:** Blocking the request thread while checking rate limits. Use async Redis calls or pre-check middleware.
- **Single Rate Limiter:** One rate limiter for all use cases. Separate interactive (low limit) from batch (high limit) traffic.

## Examples

### Token-Based Rate Limiter
```php
class TokenRateLimiter {
    public function __construct(
        private Redis $redis,
        private int $maxTokensPerHour,
    ) {}

    public function consume(string $userId, int $tokens): bool {
        $key = "rate_limit:tokens:{$userId}:" . date('Y-m-d-H'); // sliding hour
        $current = (int) $this->redis->get($key);

        if ($current + $tokens > $this->maxTokensPerHour) {
            return false; // exceeded
        }

        $this->redis->multi();
        $this->redis->incrBy($key, $tokens);
        $this->redis->expire($key, 3600);
        $this->redis->exec();

        return true;
    }
}
```

### Rate Limit Middleware
```php
class RateLimitMiddleware {
    public function handle(Request $request, Closure $next): Response {
        $user = $request->user();
        $limiter = app(TokenRateLimiter::class);

        // Estimate tokens from request (before LLM call)
        $estimatedTokens = estimateTokens($request->input('messages'));
        if (!$limiter->consume($user->id, $estimatedTokens)) {
            return response()->json([
                'error' => 'Rate limit exceeded. Try again in ' . $limiter->timeToReset($user->id) . ' seconds.',
                'retry_after' => $limiter->timeToReset($user->id),
            ], 429);
        }

        return $next($request);
    }
}
```

## Related Topics

- ku-03 (Secure Secrets & Configuration Management): API keys for rate limit attribution.
- ai-middleware-gateway/ku-01: Gateway-level rate limiting.
- ai-middleware-gateway/ku-02: Rate limiting in load balancing.
- cost-management-observability/ku-01: Cost tracking for budget-aware rate limits.

## AI Agent Notes

- When asked to implement rate limiting, first differentiate: request-based vs. token-based vs. cost-based limits.
- For rate limit issues, check: Redis connectivity, window boundary logic, and whether the limit is per-user or per-IP.
- Prefer reading the rate limit algorithm implementation before the middleware configuration.
- When generating rate limit code, always include the `Retry-After` header in 429 responses.

## Verification

- [ ] Rate limits are implemented at infrastructure (CDN/nginx) and application levels.
- [ ] Rate limiting accounts for token/cost consumption, not just request count.
- [ ] Rate limiter uses sliding window (not fixed window) for accurate counting.
- [ ] 429 responses include `Retry-After` header and a clear error message.
- [ ] Rate limit policies are configurable per environment, plan, and endpoint.
- [ ] Rate limit state is stored in Redis (distributed, shared across instances).
- [ ] Rate limit service failure results in graceful degradation (fail-open logged).
