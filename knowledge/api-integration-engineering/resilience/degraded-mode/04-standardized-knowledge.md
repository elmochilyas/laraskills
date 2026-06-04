# ECC Standardized Knowledge — Degraded Mode

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | resilience-reliability-patterns |
| Knowledge Unit ID | ku-05 |
| Knowledge Unit | Degraded Mode |
| Difficulty | Advanced |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K004, K007, K008 |

## Overview (Engineering Value)
Degraded mode is an operational state where the application continues functioning with reduced capabilities when external services are unavailable. Unlike a hard failure (error page), degraded mode provides partial functionality, cached data, or alternative features while clearly indicating the reduced service level. In API integration contexts, degraded mode is triggered by circuit breaker Open state, rate limit exhaustion, or timeout storms. The system enters degraded mode, serves cached/fallback responses, and automatically resumes normal operation when the underlying service recovers.

## Core Concepts
- **Degraded Mode Trigger**: Circuit breaker Open, rate limit headroom exhausted, timeout threshold exceeded
- **Feature Toggle**: System-wide or per-service flag indicating degraded operation
- **Reduced Functionality**: Non-critical features disabled; critical features work with fallback data
- **User Communication**: Indicate degraded state to end users (banners, status indicators)
- **Automatic Recovery**: Exit degraded mode when upstream service health checks pass
- **Operational Dashboard**: Display degraded mode state per service in real-time

## When To Use
- User-facing applications where availability is prioritized over completeness
- Multi-service integrations where losing one feature shouldn't break the entire app
- High-traffic systems where graceful degradation beats hard failure
- When circuit breaker, rate limiting, or timeout handling indicates systemic issues

## When NOT To Use
- Internal processing systems where degraded output causes more harm than failure
- Financial reconciliation systems requiring complete and accurate data
- Compliance systems where partial processing violates audit requirements

## Best Practices
- Clearly define which features degrade and which remain critical in each mode
- Implement automatic entry and exit from degraded mode based on health checks
- Track time spent in degraded mode per service for reliability reporting
- Monitor degraded mode as an incident trigger (escalate if degraded for >30 minutes)
- Test degraded mode scenarios in staging with simulated service failures

## Architecture Guidelines
- Degraded mode state in distributed cache (Redis) for multi-server consistency
- Health checks determine entry/exit from degraded mode
- Feature flags per integration for manual degraded mode activation
- Dashboard UI components that adapt to degraded state
- Alerting when any service enters degraded mode

## Performance Considerations
- Degraded mode checks: single cache read (~1-5ms) per operation
- Serving cached data is faster than API calls (1-5ms vs 50-5000ms)
- Reduced external API calls in degraded mode lower upstream load and costs
- Feature flag checks add negligible overhead

## Common Mistakes
- Building degraded mode after the system is in production (too late; outages force hasty implementation)
- Not testing degraded mode behavior (untested fallback paths fail under real pressure)
- Entering degraded mode on transient blips (multiple circuit breaker timeouts should trigger, not single failures)
- Exiting degraded mode immediately on first successful probe (consecutive successes needed)
- Not communicating degraded state to users (they think the system is fully functional with missing data)

## Related Topics
- **Prerequisites**: Circuit breaker, fallback strategies, health checks
- **Closely Related**: Circuit breaker (ku-01), fallback strategies (ku-04), integration health checks
- **Advanced**: Feature flags, progressive degradation, chaos engineering
- **Cross-Domain**: Site reliability engineering, incident management

## Verification
- [ ] Degraded mode triggers defined and configured
- [ ] Feature flags for manual degraded mode activation
- [ ] Automatic recovery from degraded mode on health check success
- [ ] User-facing degraded mode indicators implemented
- [ ] Time in degraded mode monitored and alerted
- [ ] Degraded mode tested in staging with simulated failures
