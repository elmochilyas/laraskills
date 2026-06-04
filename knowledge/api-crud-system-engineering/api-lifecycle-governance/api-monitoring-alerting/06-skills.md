# Skill: Monitor and Alert on API Health

## Purpose
Set up API monitoring using the RED method (Rate, Errors, Duration) with health checks verifying dependency connectivity, synthetic monitoring from multiple regions, burn rate alerting, multi-window/multi-burst alerting, runbooks for every alert, and monitoring system heartbeats.

## When To Use
- All production APIs
- APIs with SLAs/SLOs
- Consumer-facing APIs where uptime impacts revenue
- Multi-service architectures needing coordinated monitoring

## When NOT To Use
- Development/staging environments (basic health check only)
- Prototype APIs not yet in production
- Internal batch jobs with no consumer impact

## Prerequisites
- Metrics infrastructure (Prometheus + Grafana)
- Log aggregation (Loki or equivalent)
- Alert routing (PagerDuty or equivalent)
- SLO definitions and error budget

## Inputs
- API endpoints and critical user journeys
- SLO targets (latency, error rate, uptime)
- Dependency list (database, cache, queue, services)
- On-call rotation schedule

## Workflow
1. Monitor every service using RED method: Rate (requests/sec), Errors (failed/sec), Duration (latency p50/p95/p99)
2. Implement health checks verifying dependency connectivity (DB, cache, queue, services) — respond within 100ms
3. Alert on error budget burn rate, not raw error rate — measure budget consumption speed
4. Run synthetic monitoring transactions simulating real consumer behavior from multiple geographic regions
5. Write runbooks for every alert defining: what to check, how to diagnose, how to remediate
6. Configure multi-window, multi-burst alerting — catch both sustained and burst issues
7. Implement heartbeat monitoring for monitoring infrastructure (Prometheus, Loki, Grafana)
8. Use three-tier dashboards: executive (business), operational (team), tactical (on-call)

## Validation Checklist
- [ ] RED method metrics for every service (Rate/Errors/Duration)
- [ ] Health check with dependency verification (< 100ms)
- [ ] Burn rate alerting (not raw error rate)
- [ ] Synthetic monitoring from 3+ geographic regions
- [ ] Runbooks for every alert
- [ ] Multi-window, multi-burst alerting configuration
- [ ] Monitoring infrastructure heartbeat alert
- [ ] Three-tier dashboards

## Common Failures
- Alert thresholds too tight (false positives → alert fatigue)
- Health check without dependency verification (passes but deps down)
- Monitoring averages only, ignoring percentiles (average hides long tail)
- No synthetic monitoring (waiting for real consumers to report)
- Alerting on symptoms (CPU) instead of consumer impact (error rate)
- No runbooks for alerts (on-call wastes time investigating)

## Decision Points
- Monitoring stack: Prometheus + Grafana vs Datadog vs New Relic
- Synthetic monitoring: Checkly vs Playwright vs custom scripts
- Alert routing: PagerDuty vs OpsGenie vs Slack-based rotation

## Performance Considerations
- Health check endpoints < 100ms — avoid expensive DB queries
- Metrics collection is async (batch export) — negligible request path impact
- Log shipping async with buffer — prevents log writes blocking requests
- Synthetic monitoring runs from external services — no production impact

## Security Considerations
- Health check endpoints should not expose internal topology or version info
- Synthetic monitoring credentials must have limited scoped permissions
- Alert notification channels must not leak sensitive data in alert messages
- Monitoring dashboards access-controlled by role

## Related Rules
- Monitor Using RED Method for Every Service
- Alert on Error Budget Burn Rate, Not Raw Error Rate
- Implement Health Checks with Dependency Verification
- Run Synthetic Monitoring from Multiple Regions
- Write Runbooks for Every Alert
- Implement Multi-Window, Multi-Burst Alerting
- Monitor the Monitoring System

## Related Skills
- Track API Usage
- Conduct API Audit Reviews
- Design Rate Limit Tiers

## Success Criteria
- All services have RED metrics (Rate/Errors/Duration)
- Health checks verify real dependencies and respond under 100ms
- Alerts fire based on error budget burn rate, not noise
- Synthetic monitors detect issues before real consumers
- Every alert has an associated runbook
- Both sustained degradations and brief bursts trigger appropriate alerts
- Monitoring infrastructure has its own heartbeat alerts
- Dashboards serve executive, operational, and tactical needs
