# ECC Standardized Knowledge — Rate Limiting Algorithms (Token Bucket, Leaky Bucket, Sliding Window)

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-17 |
| Knowledge Unit | Rate Limiting Algorithms |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K008, K009, K011 |

## Overview (Engineering Value)
Rate limiting controls the rate at which requests are sent or processed. Different algorithms trade off between precision, memory, and burst tolerance. Token Bucket allows controlled bursts, Leaky Bucket smooths traffic to a constant rate, and Sliding Window provides precise per-window limits. Choosing the right algorithm prevents upstream throttling while maximizing throughput.

## Core Concepts
- **Token Bucket**: Tokens added at fixed rate; requests consume tokens; supports bursts
- **Leaky Bucket**: Requests enter a queue processed at fixed rate; excess discarded
- **Sliding Window**: Rolling time window with per-interval counters
- **Fixed Window**: Simple per-interval counter (boundary bursts possible)
- **Burst Capacity**: Maximum accumulated tokens/buffer size
- **Refill Rate**: Tokens added per time unit
- **Throttle Response**: 429 Too Many Requests with Retry-After header

## When To Use
- Controlling outbound request rate to rate-limited upstream APIs
- Protecting downstream services from traffic spikes
- Enforcing API usage quotas

## When NOT To Use
- No rate limits on upstream service (adds unnecessary complexity)
- Low-throughput APIs (rate limit won't be hit)
- When upstream provides its own rate limiting

## Best Practices
- Prefer token bucket for burst-tolerant workloads
- Prefer sliding window for precise per-second/limits
- Prefer leaky bucket for consistent processing rates
- Always respect Retry-After headers from upstream
- Implement distributed rate limiting via Redis for multi-server

## Architecture Guidelines
- Rate limiter as middleware in handler stack
- Per-upstream rate limit configuration
- Distributed state via Redis for accuracy across servers
- Monitoring on rate limit hit rate to tune limits
- Graceful fallback: queue requests when rate limited, don't drop

## Performance Considerations
- Token bucket: O(1) per request, memory ~16 bytes per limiter
- Leaky bucket: O(1) per request, queue memory proportional to buffer
- Sliding window: O(log N) per request with Redis sorted sets
- Fixed window: O(1) per request, simplest but least precise

## Common Mistakes
- Using fixed window without understanding boundary burst issue
- Single-server bucket in multi-server deployment (inaccurate)
- Not persisting rate limiter state across restarts
- Too-aggressive limiting reducing throughput unnecessarily
- Ignoring upstream Retry-After headers

## Related Topics
- **Prerequisites**: Cache (Redis), concurrency basics
- **Closely Related**: Saloon rate limiting, concurrency pools
- **Advanced**: Adaptive rate limiting, AIMD algorithm
- **Cross-Domain**: Distributed systems, queuing theory

## Verification
- [ ] Algorithm chosen based on workload characteristics
- [ ] Distributed state for multi-server deployments
- [ ] Retry-After headers from upstream respected
- [ ] Rate limit hit rate monitored for tuning
- [ ] Graceful queue/delay on rate limit hit
- [ ] Persisted state across restarts
