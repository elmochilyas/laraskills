# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Threat Mitigation |
| Knowledge Unit | Advanced Rate Limiting (Sliding Window, Token Bucket) |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

Beyond Laravel's built-in sliding window rate limiter, advanced algorithms provide more precise traffic control: **Token Bucket** (allows bursts up to a limit, then refills at a fixed rate), **Sliding Window Log** (tracks timestamps of all requests in a sliding window — most memory-intensive but most accurate), and **Sliding Window Counter** (compromise between fixed window and sliding log). The `grazulex/laravel-api-throttle-smart` package implements plan-aware throttling with these algorithms. Custom implementations can use the `RateLimiter` facade with custom `Limit` configurations or Redis-backed Lua scripts.

---

## Core Concepts

- **Token Bucket**: A bucket with `capacity` tokens. Each request consumes one token. Tokens refill at `rate` per second. Bursts up to `capacity` are allowed. No throttling until bucket empties.
- **Sliding Window Log**: Store timestamp of every request. Count requests within the window. Accurate but memory-heavy (O(n) storage per key).
- **Sliding Window Counter**: Split window into sub-intervals. Count requests in the current and previous sub-interval. Weighted average. Less accurate but memory-efficient (O(1) storage per key).
- **Plan-Aware Throttling**: Different rate limits per subscription plan (free: 100/hr, pro: 1000/hr, enterprise: 10000/hr).
- **Redis Lua Scripting**: Atomic rate limit operations using Lua scripts in Redis — guaranteed atomicity for token bucket operations.

---

## When To Use

- API-driven SaaS requiring plan-based rate limits
- High-precision rate limiting (token bucket for real-time APIs)
- Traffic shaping (allow bursts but sustain at a rate)
- Multi-tenant APIs where each tenant has different limits

## When NOT To Use

- Simple rate limiting (Laravel's built-in sliding window is sufficient)
- Low-traffic applications (advanced algorithms add complexity without benefit)
- Applications without Redis (token bucket needs atomic operations)
- When the built-in `RateLimiter` meets requirements (start simple)

---

## Best Practices

- **Start with Simple Rate Limiting**: Use Laravel's built-in sliding window. Only move to advanced algorithms when requirements demand it.
- **Use Redis Lua for Token Bucket**: Atomic token refill and consumption requires Lua scripting in Redis. Do not implement without atomicity.
- **Plan-Aware Design**: Store plan limits in configuration or database. Pass plan to rate limiter via request context.
- **Monitor Rate Limit Accuracy**: Advanced algorithms can have edge cases. Monitor throttling decisions for correctness.
- **Cache Plan Limits**: If rate limits are per-plan, cache the plan-to-limits mapping to avoid per-request database queries.

---

## Architecture Guidelines

- Token bucket: implement as Redis Lua script with `capacity` and `refill_rate` parameters
- Sliding window counter: use atomic increment on the current sub-interval minute
- Plan-aware: middleware resolves user's plan → passes max attempts to rate limiter
- Burst-friendly: token bucket allows short bursts while maintaining average rate
- Fallback: if Redis is unavailable, fail closed or fall back to simple limiting

---

## Performance Considerations

- Token Bucket: atomic Lua script in Redis — ~1-3ms per check
- Sliding Window Counter: 1 Redis INCR + EXPIRE per request — ~0.5ms
- Sliding Window Log: O(n) per check (count timestamps in window) — slower for high-traffic keys
- Plan-aware: one cache lookup per request (plan → limits) — ~0.5ms

---

## Security Considerations

- **Algorithm Choice Impacts Fairness**: Token bucket can starve some users if capacity is too low. Monitor throttling patterns.
- **Burst Protection**: Token bucket allows bursts — ensure bursts don't overwhelm downstream services (database, email API).
- **Plan Boundary**: A user on free plan hitting limits should not affect paid users. Ensure rate limit keys include plan or user ID.
- **Distributed Atomicity**: Redis Lua ensures atomic operations across multiple application servers — essential for accuracy.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Token bucket without atomicity | PHP-level token tracking | Race conditions — tokens over-consumed | Use Redis Lua for atomic operations |
| Sliding window log without cleanup | Not setting TTL on timestamps | Memory exhaustion for high-traffic keys | Set TTL equal to window duration |
| Plan limits without caching | Per-request DB query for plan | Unnecessary database load | Cache plan-to-limit mapping |
| Not handling Redis failure | Assuming Redis always available | Rate limiting disabled when Redis down | Fall back to file/array cache or fail closed |

---

## Anti-Patterns

- **Implementing advanced rate limiting before simple**: Start with Laravel's built-in limiter
- **Token bucket with file cache**: File cache cannot provide atomic operations for burst tracking
- **Plan-aware limit exposed to users**: Users should not know the exact limit formula — return remaining counts

---

## Examples

**Redis Lua token bucket:**
```lua
-- KEYS[1] = bucket key
-- ARGV[1] = capacity
-- ARGV[2] = refill_rate (tokens per second)
-- ARGV[3] = current time

local bucket = redis.call('HMGET', KEYS[1], 'tokens', 'last_refill')
local tokens = tonumber(bucket[1]) or tonumber(ARGV[1])
local last_refill = tonumber(bucket[2]) or tonumber(ARGV[3])

local elapsed = tonumber(ARGV[3]) - last_refill
local refill = elapsed * tonumber(ARGV[2])
tokens = math.min(tokens + refill, tonumber(ARGV[1]))

redis.call('HMSET', KEYS[1], 'tokens', tokens, 'last_refill', ARGV[3])
redis.call('EXPIRE', KEYS[1], 10)
```

**Plan-aware rate limiter:**
```php
// PlanAwareRateLimiter
public function limit(Request $request): Limit
{
    $plan = $request->user()?->plan ?? 'free';
    
    $limits = [
        'free' => 100,
        'pro' => 1000,
        'enterprise' => 10000,
    ];
    
    return Limit::perMinute($limits[$plan] ?? 100)
        ->by($request->user()?->id ?: $request->ip());
}
```

---

## Related Topics

- Rate Limiter facade and throttle middleware
- Plan-aware throttling for SaaS APIs
- Brute force protection
- Redis caching

---

## AI Agent Notes

- Advanced rate limiting is for SaaS APIs with plan-based tiers or high-precision traffic shaping needs.
- Token bucket with Redis Lua is the gold standard for fair, burst-tolerant rate limiting.
- Most applications should start with Laravel's built-in sliding window limiter and only upgrade when requirements demand it.

---

## Verification

- [ ] Advanced rate limiting justified (plan-based or precision requirements)
- [ ] Token bucket implemented with Redis Lua (atomic operations)
- [ ] Sliding window log has TTL cleanup
- [ ] Plan limits cached (no per-request DB queries)
- [ ] Redis failure handling (fallback or fail-closed)
- [ ] Rate limiting accuracy monitored
- [ ] Burst protection for downstream services
- [ ] Plan boundaries enforced (free users don't affect paid users)
