# Skill: Integrate Laravel Nightwatch for Production APM

## Purpose
Integrate Laravel Nightwatch as the production APM solution for real-time and historical performance monitoring, deployment tracking, and alerting on performance degradation.

## When To Use
- Production Laravel applications requiring APM
- Teams wanting deployment-performance correlation
- Applications needing alerting on performance degradation
- Long-term trend analysis and capacity planning

## When NOT To Use
- Local development (use Telescope/Debugbar)
- Applications on a tight budget (Nightwatch is a paid service)
- Simple applications where Pulse + basic monitoring suffices
- Environments with data residency restrictions on external services

## Prerequisites
- Nightwatch account and API credentials (paid service)
- Laravel application with production deployment
- Composer access to Nightwatch package

## Inputs
- Nightwatch API key and site ID
- `.env` — Nightwatch configuration variables
- `config/nightwatch.php` — published configuration

## Workflow

1. **Provision Nightwatch Service:** Sign up for Nightwatch, create a site, and obtain the API key and site ID from the Nightwatch dashboard.

2. **Install Package:** Run `composer require laravel/nightwatch` and configure the service provider.

3. **Configure Environment:** Set `NIGHTWATCH_API_KEY`, `NIGHTWATCH_SITE_ID` in production `.env`. Configure ingestion endpoint based on region.

4. **Configure Alerting:** Set performance thresholds (p95 response time > 500ms, error rate > 1%, queue backlog limits) in the Nightwatch dashboard for proactive notifications.

5. **Set Up Deployment Tracking:** Integrate Nightwatch with deployment pipeline. Tag releases so performance regressions correlate with specific deployments.

6. **Monitor Dashboard:** Review the Nightwatch dashboard for request throughput, latency distributions, slow query identification, queue job performance, and exception tracking.

## Validation Checklist

- [ ] Nightwatch package installed and configured in production
- [ ] Data appearing in Nightwatch dashboard (requests, queries, queues)
- [ ] Alerting thresholds configured for relevant metrics
- [ ] Deployment tracking integrated with CI/CD pipeline
- [ ] No performance impact observed from Nightwatch agent

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| Missing API key configuration | No data appears in dashboard |
| Data residency conflict | Check regional endpoint configuration |
| Budget overrun | Monitor ingestion volume; adjust sampling if needed |

## Decision Points

- **Nightwatch vs Pulse:** Nightwatch for long-term trends and alerting; Pulse for simpler self-hosted monitoring
- **Nightwatch vs Telescope/Debugbar:** Use development tools locally; Nightwatch is production-only APM

## Performance/Security Considerations

- **Agent overhead:** Minimal; optimized for production use
- **Data residency:** Verify regional endpoint meets compliance requirements
- **Cost:** Paid service per-site; evaluate budget against monitoring needs

## Related Rules

- NW-RULE-001: Production APM
- NW-RULE-002: Deployment tracking
- NW-RULE-003: Configure alerting

## Related Skills

- Configure Laravel Pulse for Monitoring
- Configure Laravel Telescope for Debugging
- Monitor Production with Laravel Pulse

## Success Criteria

- Nightwatch dashboard shows accurate production performance data
- Deployment-performance correlation identifies regressions quickly
- Alerting notifies team of performance degradation within configured thresholds
- Long-term trend data supports capacity planning
