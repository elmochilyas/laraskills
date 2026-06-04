# Skill: Implement Degraded Mode When External Services Are Unavailable

## Purpose
Design the application to operate in degraded mode when external API dependencies are unavailable, serving cached/stale data or informative error messages instead of failing hard.

## When To Use
- External API-dependent features that the app can partially function without
- Public-facing pages that should remain available during upstream outages
- Non-critical features backed by external APIs
- Reducing user-facing errors during upstream incidents

## When NOT To Use
- Critical payment/transaction processing where degraded mode is not acceptable
- Features with no fallback data available

## Prerequisites
- Circuit breaker or health check for detecting failures
- Cached or default data for degraded response

## Workflow
1. Identify features with acceptable degraded behavior
2. Configure fallback data: cached responses, defaults, empty states
3. Detect upstream failure via circuit breaker or timeout
4. Switch to degraded mode: serve fallback, show warning banner
5. Communicate degraded state to users via UI banners
6. Implement health endpoint for monitoring degraded state
7. Automatically recover when upstream becomes available
8. Test degraded mode behavior with simulated failures

## Validation Checklist
- [ ] Degraded-mode features identified
- [ ] Fallback data configured (cache, defaults, empty state)
- [ ] Upstream failure detection implemented
- [ ] User-facing communication of degraded state
- [ ] Health endpoint reports degraded status
- [ ] Automatic recovery on upstream availability
- [ ] Degraded mode tested with simulated failures
