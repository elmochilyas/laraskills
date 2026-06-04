# Skill: Evaluate and Select Laravel Error Tracking Platform

## Purpose
Evaluate, select, and integrate an error tracking platform for Laravel applications by comparing Flare, Bugsnag, Rollbar, and Honeybadger against Sentry across integration depth, pricing, and feature coverage.

## When To Use
- Initial project setup requiring error tracking
- Re-evaluating current error tracking platform
- Multi-platform teams needing unified error management

## When NOT To Use
- Already committed to a platform with no migration intent
- Very low-traffic applications where any free tier suffices

## Prerequisites
- Understanding of team size, traffic volume, and error rate
- List of required integrations (VCS, ticketing, communication)
- Data residency and compliance requirements

## Inputs
- Monthly request volume and estimated error rate
- Platform requirements (mobile, web, backend)
- Budget and team size
- Compliance requirements (data residency, self-hosting)

## Workflow
1. **Define requirements**: List must-have features (Laravel breadcrumbs, release tracking, source maps, mobile support, self-hosting). Rank by priority.
2. **Shortlist candidates**: Eliminate platforms that fail mandatory requirements. Typically 2-3 candidates remain.
3. **Evaluate integration depth**: For each candidate, check: Laravel-specific service provider, query breadcrumbs, queue job tracing, Octane support, CLI command tracking.
4. **Assess pricing model**: Map projected monthly event volume to each platform's pricing. Include 20% headroom. Factor in per-seat costs, overage rates, and retention limits.
5. **Run trial with production traffic**: Install SDK on a staging or canary instance. Measure SDK overhead, grouping accuracy, dashboard latency, alert delivery time.
6. **Document decision**: Record evaluation scores, trial results, pricing comparison, and rationale. Include migration path documentation.
7. **Integrate selected platform**: Install SDK, configure release tracking, set up breadcrumbs, configure alerting, build team dashboards.

## Validation Checklist
- [ ] Requirements defined and ranked by priority
- [ ] Candidates evaluated against all requirements
- [ ] Integration depth verified (breadcrumbs, queue, Octane)
- [ ] Pricing modeled against projected volume
- [ ] Production trial completed with performance data
- [ ] Decision documented with rationale and migration path
- [ ] SDK installed and configured
- [ ] Release tracking enabled
- [ ] Alerting configured per severity

## Common Failures
- **Overlooking self-hosting costs:** Self-hosted Sentry needs PostgreSQL, Redis, ClickHouse, Kafka, workers. Infrastructure often costs more than SaaS.
- **Ignoring multi-platform needs:** Laravel-only evaluation misses mobile app requirements. Team ends up with two platforms.
- **Choosing by UI alone:** Dashboard prettiness does not correlate with grouping quality, SDK performance, or alert reliability.

## Decision Points
- **Sentry vs Flare:** Sentry for comprehensive workflow, larger team, multi-service; Flare for small Laravel-only team wanting solution-based debugging.
- **Sentry vs Bugsnag:** Sentry for Laravel depth; Bugsnag for cross-platform (web + mobile) unified dashboard.
- **SaaS vs self-hosted:** SaaS for lower operational overhead; self-hosted for data sovereignty or regulatory compliance.

## Performance Considerations
- SDK overhead varies: Flare < Sentry < Bugsnag — benchmark with production traffic
- Queue job tracing adds ~5ms per job — verify acceptable
- Breadcrumb collector overhead is < 1ms per event — negligible

## Security Considerations
- DSN stored in environment variables, never committed
- Data processing agreement required for GDPR compliance
- Choose data residency region based on user location
- Self-hosting requires security maintenance (updates, patching, access control)

## Related Skills
- Error Tracking Workflow
- Sentry Laravel Integration

## Success Criteria
- Error tracking platform selected by objective criteria, not inertia
- Integration depth matches application needs
- Pricing fits within budget at projected scale
- Migration path documented for future platform changes
- Team trained on selected platform's workflow
