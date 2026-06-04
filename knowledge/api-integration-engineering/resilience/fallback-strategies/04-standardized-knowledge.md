# ECC Standardized Knowledge — Fallback Strategies

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-reliability-patterns |
| Knowledge Unit ID | ku-04 |
| Knowledge Unit | Fallback Strategies |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K001, K004, K005, K007 |

## Overview (Engineering Value)
Fallback strategies define alternative behavior when an API call fails after exhausting retries, is blocked by circuit breaker, or exceeds timeout. Instead of propagating an error to the user or failing a job, fallbacks provide degraded responses, cached data, alternative providers, or graceful degradation paths. In Laravel, fallbacks include serving stale cache, switching to a backup provider, returning partial data, or queuing the operation for later retry. Well-designed fallbacks maintain system functionality during outages, prioritizing core operations over non-critical features.

## Core Concepts
- **Stale Cache Fallback**: Serve cached response even if expired when fresh data unavailable
- **Provider Failover**: Switch to a backup API provider when primary is down
- **Graceful Degradation**: Return partial data or disable non-critical features
- **Queue for Later**: Defer the operation to a queue for retry when service recovers
- **Default Response**: Return sensible defaults when no data can be fetched
- **User Notification**: Inform users of degraded functionality without error pages

## When To Use
- Read-heavy APIs where stale data is better than no data
- Critical features that must remain available during provider outages
- Multi-provider integrations with failover capability
- User-facing features where errors should be avoided

## When NOT To Use
- Financial operations where stale data causes incorrect charges
- Security-critical features where degraded mode creates vulnerabilities
- Write operations where fallback would cause data inconsistency

## Best Practices
- Never fallback silently; always log the fallback event with reason
- Design fallbacks that maintain data consistency (stale read is OK; stale write is not)
- Test fallback paths as rigorously as primary paths
- Implement circuit breaker-aware fallbacks: fallback when circuit is open, not on first failure
- Use fallback response headers to indicate degraded mode to API consumers

## Architecture Guidelines
- Fallback implementation in service class, not controller
- Stale cache with `Cache::get()` after `Cache::remember()` miss
- Provider failover via strategy pattern at the connector level
- Degraded mode flag in service configuration for operational control
- Queue fallback for non-time-sensitive operations

## Performance Considerations
- Fallback path should be faster than primary (no network call)
- Stale cache fallback: 1-5ms (Redis)
- Provider failover: adds latency of secondary provider call
- Queue fallback: negligible (job dispatch is fast)

## Common Mistakes
- Silent fallback without logging (hard to debug when stale data served)
- Only implementing primary path, no fallback (operation fails when primary is down)
- Fallback to another API without verifying secondary is also degraded (cascading failure)
- Serving stale data without indication (consumers don't know data is stale)

## Related Topics
- **Prerequisites**: Retry strategies, circuit breaker, caching
- **Closely Related**: Degraded mode (ku-05), circuit breaker (ku-01), response caching
- **Advanced**: Multi-provider failover with health checking
- **Cross-Domain**: Graceful degradation, fault tolerance

## Verification
- [ ] Fallback path defined for each critical integration
- [ ] Fallback events logged with reason and timestamp
- [ ] Stale cache fallback configured for read endpoints
- [ ] Circuit breaker state triggers fallback path
- [ ] Fallback paths tested in CI
