# Skill: Optimize and Cache Auth Endpoint Decisions

## Purpose
Reduce auth endpoint latency and prevent database overload during reconnection storms by caching authorization decisions and optimizing callback execution.

## When To Use
- Applications with more than ~1000 concurrent WebSocket connections
- High-churn applications with frequent subscription/reconnection patterns
- Live event platforms where thousands of users join at scheduled times
- Any application using private or presence channels at scale

## When NOT To Use
- Small applications (<100 concurrent connections) where auth overhead is negligible
- Public-channel-only broadcasting (no auth endpoint calls)
- Development environments where caching adds unnecessary complexity

## Prerequisites
- Private or presence channels configured with auth callbacks
- Cache driver configured (Redis recommended)
- Auth endpoint metrics collection in place

## Inputs
- Auth callback functions in `routes/channels.php`
- Cache configuration (driver, TTL)
- Rate-limit middleware configuration

## Workflow
1. Audit existing auth callbacks for database query count and complexity
2. Wrap each callback in `Cache::remember()` with an appropriate TTL (300s default)
3. Implement jitter in TTL to prevent cache stampede: `random_int(240, 360)`
4. Reduce database queries to at most one per callback
5. Delegate complex authorization to Gates or Policies
6. Apply `throttle` middleware to `Broadcast::routes()` with separate limits per guard
7. Track auth endpoint P50/P95/P99 latency as a distinct metric
8. Pre-warm auth caches before planned deployments
9. Monitor auth failure rates for security anomalies
10. Test with simulated reconnection storm load

## Validation Checklist
- [ ] Auth callback executes at most 1 database query
- [ ] Auth decisions cached with `Cache::remember()` and appropriate TTL
- [ ] TTL includes jitter to prevent cache stampede
- [ ] Rate limiting applied to `/broadcasting/auth` endpoint
- [ ] Auth endpoint P95 latency <50ms under load
- [ ] Cache stampede prevention implemented (jitter, locks)
- [ ] Cache can be invalidated when user permissions change

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Auth endpoint slow under load | Multiple DB queries in callbacks | Check callback for >1 query execution |
| Cache stampede on reconnect | All auth cache entries expire simultaneously | Add jitter to TTL: `random_int(240, 360)` |
| Stale authorization served | Cache TTL too long without invalidation | Use shorter TTL or implement manual invalidation |
| Rate limiting false positives | Same throttle for web and API clients | Separate rate limits per auth guard |

## Decision Points
- **Cache TTL duration**: Balance freshness vs. load—300s is a good default; shorter for dynamic permissions
- **Cache invalidation strategy**: For instant permission changes, use shorter TTL or event-based cache clearing
- **Stampede prevention**: Use jittered TTL for most cases; use mutex locks for extremely hot cache keys

## Performance/Security Considerations
- Target auth endpoint latency: <50ms at P95 under load
- Redis cache lookup adds ~1-3ms; database queries add 5-50ms
- Cache keys must include user and channel identifiers to prevent cross-user auth bypass
- Monitor auth failure rates for brute-force attempts

## Related Rules (from 05-rules.md)
- Always Cache Authorization Decisions
- Always Apply Rate Limiting to the Auth Endpoint
- Always Keep Auth Callback Database Queries to at Most One
- Always Monitor Auth Endpoint Latency Separately
- Always Implement Cache Stampede Prevention
- Never Use Eternal TTL for Auth Caches

## Related Skills
- Authorize Private and Presence Channels in routes/channels.php
- Mitigate Reconnection Storms with Backoff and Rate Limiting

## Success Criteria
- Auth endpoint P95 latency <50ms under expected peak load
- No database overload during reconnection storms
- Auth cache hits serve the majority of authorization requests
- Cache stampede prevented during simultaneous cache expiry
- Rate limiting protects without false positives for legitimate traffic
