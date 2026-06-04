# ECC Standardized Knowledge — Saloon Rate Limiting Plugin

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-patterns |
| Knowledge Unit ID | ku-18 |
| Knowledge Unit | Saloon Rate Limiting Plugin |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K017, K006, K008, K009, K011 |

## Overview (Engineering Value)
SaloonPHP's rate limiting plugin provides a plug-and-play rate limiter that can be added to any connector. It supports token bucket and sliding window algorithms, stores state in Laravel's cache, and automatically delays or fails requests that exceed limits. This eliminates manual rate limiting logic and ensures consistent enforcement across all requests.

## Core Concepts
- **Rate Limiter Plugin**: Pre-built Saloon plugin for rate limiting
- **Token Bucket**: Default algorithm, configurable tokens per second and burst size
- **Limit Store**: Cache driver storing rate limiter state (Redis recommended)
- **Auto-Delay**: Plugin delays request instead of rejecting when rate limited
- **Custom Response Handling**: Override behavior when rate limited
- **Connector-Level Scope**: Rate limiter scoped to a connector instance

## When To Use
- Any Saloon connector with rate-limited upstream
- Multiple connectors with different rate limits
- Teams wanting consistent rate limiting across integrations

## When NOT To Use
- Non-Saloon HTTP clients (use custom middleware)
- Single request type (use simpler rate limiter)
- When upstream has no rate limits

## Best Practices
- Use Redis cache for distributed rate limit state
- Configure burst capacity slightly above request pattern
- Set auto-delay true for non-time-sensitive operations
- Monitor rate limit hits to detect upstream limit changes
- Separate rate limiter instances per connector

## Architecture Guidelines
- Rate limiter configured in connector's `defaultHeaders()` or `boot()` method
- Per-connector rate limits based on upstream documentation
- Cache prefix per connector for cache isolation
- Alerting on rate limit saturation (approaching limits)

## Performance Considerations
- Cache lookup per request adds ~1-2ms (Redis)
- Token bucket O(1) computation negligible
- Auto-delay adds wait time but prevents 429 responses
- Separate instances don't share overhead

## Common Mistakes
- Using file/database cache for rate limit state (wrong for multi-server)
- Setting tokens_per_second too high (rate limiting ineffective)
- Not testing rate limiter behavior under load
- Using same cache keys for different connectors
- Not monitoring rate limit hit rate for tuning

## Related Topics
- **Prerequisites**: Saloon connectors, rate limiting concepts
- **Closely Related**: Saloon plugins, token bucket algorithm
- **Advanced**: Custom rate limiter plugins, adaptive limiting
- **Cross-Domain**: Caching (Redis), queue management

## Verification
- [ ] Redis cache configured for rate limit state
- [ ] Per-connector rate limits configured
- [ ] Auto-delay enabled or custom handling implemented
- [ ] Rate limit hit rate monitored
- [ ] Cache prefix per connector for isolation
- [ ] Rate limiter tested under expected load
