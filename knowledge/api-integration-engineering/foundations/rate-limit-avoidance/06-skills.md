# Skill: Avoid External API Rate Limits with Proactive Throttling

## Purpose
Proactively manage outbound request rates to stay within external API rate limits using queue-based pacing, token buckets, and response header monitoring.

## When To Use
- Any integration with rate-limited external APIs
- High-volume API consumers needing to avoid 429 responses
- Batch processing of API-dependent operations

## When NOT To Use
- Low-volume integrations (rate limits rarely exceeded)
- APIs without rate limit documentation or headers

## Prerequisites
- Understanding of target API's rate limit policy
- Queue system for delayed/paced requests

## Workflow
1. Research API rate limits: requests per window, burst allowance, reset behavior
2. Monitor `X-RateLimit-*` response headers on every response
3. Parse `Retry-After` header on 429 responses
4. Implement queue-based pacing: dispatch jobs with delays
5. Use SaloonPHP's rate limit plugin for automatic header tracking
6. Implement exponential backoff on rate limit errors
7. Distribute requests evenly across the rate window
8. Alert when approaching rate limit thresholds
9. Log rate limit hits for capacity planning

## Validation Checklist
- [ ] Rate limit headroom monitored via response headers
- [ ] 429 responses handled with backoff and retry
- [ ] Queue-based pacing distributes requests evenly
- [ ] Saloon rate limit plugin configured (if using Saloon)
- [ ] Alerts configured for rate limit threshold approach
- [ ] Rate limit hits logged for analysis
