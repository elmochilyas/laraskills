# Skill: Implement Rate Limiting Algorithms (Token Bucket, Leaky Bucket)

## Purpose
Implement client-side rate limiting using token bucket or leaky bucket algorithms to proactively stay within external API rate limits.

## When To Use
- Client-side rate limiting for outbound API requests
- Applications that need fine-grained control over request pacing
- When external API rate limits are strict or costly to exceed

## When NOT To Use
- Server-side rate limiting (incoming request throttling)
- Simple rate limits where fixed window suffices
- APIs with their own built-in rate limit handling

## Prerequisites
- Cache driver for token/leaky bucket state
- Understanding of external API rate limits

## Workflow
1. Choose algorithm: token bucket (bursty traffic) or leaky bucket (smooth traffic)
2. For token bucket: configure capacity, refill rate, refill interval
3. For leaky bucket: configure bucket capacity, drain rate
4. Store state in cache (Redis recommended for atomic operations)
5. Check rate limit before each request: consume token or queue
6. Delay or queue request when limit reached
7. Integrate with SaloonPHP rate limit plugin
8. Monitor rate limit utilization and headroom

## Validation Checklist
- [ ] Algorithm chosen (token/leaky bucket) based on traffic pattern
- [ ] Bucket capacity and refill/drain rate configured
- [ ] Cache used for state storage (Redis)
- [ ] Rate limit checked before each request
- [ ] Requests delayed/queued when limit reached
- [ ] Rate limit utilization monitored
