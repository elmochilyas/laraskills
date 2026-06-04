# ECC Standardized Knowledge — Integration Health Checks

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Integration Health Checks |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K028, K029 |

## Overview (Engineering Value)
Integration health checks are endpoints or processes that validate whether external API integrations are functioning correctly. They test connectivity, authentication, response time, and data freshness for each integrated service. In Laravel, health checks are implemented as dedicated endpoints (e.g., `/health/stripe`, `/health/mailgun`) or integrated into Laravel Pulse cards. Health checks enable proactive detection of integration failures, automated alerting, and operational dashboards showing the real-time status of all external service connections.

## Core Concepts
- **Connectivity Check**: Verify the upstream API is reachable (DNS, TCP, TLS)
- **Auth Check**: Validate that API keys or OAuth tokens are still valid
- **Response Time Check**: Measure latency and alert on degradation
- **Data Freshness Check**: Verify that synchronized data is recent (last successful sync timestamp)
- **Laravel Pulse Integration**: Custom Pulse cards showing integration health at a glance
- **Aggregate Health Endpoint**: `/health` returning summary of all integration statuses

## When To Use
- All production integrations with SLAs
- Third-party service dependencies critical to application operation
- Multi-service architectures requiring per-service health visibility

## When NOT To Use
- Non-critical integrations with no production requirements
- Internal-only integrations where service health is managed at infrastructure level

## Best Practices
- Implement ping/pong check: call a lightweight endpoint (e.g., GET /v1/charges?limit=1 for Stripe)
- Cache health check results for 30-60s to avoid hammering upstream APIs
- Implement separate checks for connectivity and auth (auth failures have different remediation)
- Use Laravel Pulse cards for real-time health dashboard
- Alert on health check failure with escalation based on duration

## Architecture Guidelines
- Health check service classes implementing a `HealthCheckInterface`
- Pulse card custom component per integration
- Aggregate health endpoint returning status per service with latency
- Queue health checks to avoid blocking the health endpoint response
- Store check results in cache for dashboard and alerting consumption

## Performance Considerations
- Health checks add load to upstream APIs; run every 30-60s, not per-request
- Lightweight endpoints (simple ping) are fast: 50-200ms
- Failed checks add no extra load (fail-fast on timeout)
- Cache results to prevent thundering herd on dashboard page load

## Common Mistakes
- Making full business API calls in health checks (slow, expensive, may create resources)
- Not caching results (health endpoint fails under dashboard load)
- Alerting on every transient failure (use consecutive failure threshold)
- Checking health from a single location (may not reflect all server regions)

## Related Topics
- **Prerequisites**: Laravel Pulse, service classes
- **Closely Related**: Integration metrics (ku-02), logging and tracing
- **Advanced**: Synthetic monitoring, multi-region health checks
- **Cross-Domain**: Site reliability engineering, incident response

## Verification
- [ ] Per-integration health check endpoint exists
- [ ] Checks test connectivity, auth, and response time
- [ ] Results cached and available for dashboard
- [ ] Consecutive failure threshold configured for alerting
- [ ] Pulse card displays integration health status
