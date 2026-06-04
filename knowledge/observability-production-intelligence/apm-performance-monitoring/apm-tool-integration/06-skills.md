# Skill: Integrate APM Tools with Laravel

## Purpose
Evaluate, select, and integrate Application Performance Monitoring (APM) tools for Laravel applications to provide always-on performance visibility and enable data-driven optimization.

## When To Use
- Production Laravel applications requiring continuous performance monitoring
- Teams needing performance regression detection tied to deployments
- Capacity planning and scaling decisions

## When NOT To Use
- Development environments (overhead exceeds benefit)
- Applications already using comprehensive OpenTelemetry instrumentation

## Prerequisites
- Access to APM vendor account (New Relic, Datadog, Scout APM, or OTel Platform)
- Server-level access for agent installation (if extension-based)
- Production traffic generating measurable performance data

## Inputs
- Traffic patterns (requests per second, endpoint distribution)
- Performance budget (acceptable p95/p99 latency per endpoint)
- Deployment frequency and release version format
- Team size and monitoring requirements

## Workflow
1. **Evaluate APM options**: Compare tool-specific instrumentation depth, Laravel support, pricing model, data retention, and agent overhead.
2. **Install APM agent**: Follow tool-specific installation — PHP extension for New Relic/Scout APM, Composer package for OTel-based APM. Verify agent loads.
3. **Configure transaction naming**: Set URL grouping rules for dynamic routes. Exclude health checks. Set service name matching Laravel app name.
4. **Configure sampling**: Set sampling rate based on traffic volume. Configure high-rate or always-on sampling for slow/error transactions.
5. **Configure release tracking**: Send deployment markers to APM platform. Verify release-perf correlation in dashboards.
6. **Set Apdex thresholds**: Define per-endpoint Apdex targets. Configure dashboard panels showing Apdex by endpoint.
7. **Configure alerting**: Set rules for p99 latency breaches, error rate spikes, Apdex drops. Route to appropriate notification channels.
8. **Test and validate**: Verify transactions appear with correct names. Confirm span coverage (queries, cache, HTTP, queue). Test alert triggering.

## Validation Checklist
- [ ] APM agent installed and active on production
- [ ] Health check endpoints excluded from tracing
- [ ] Dynamic URL segments normalized
- [ ] Sampling configured appropriately for traffic volume
- [ ] Release tracking sending deployment markers
- [ ] Apdex thresholds defined per endpoint group
- [ ] Alerting rules configured for latency and error rate
- [ ] Transaction naming shows grouped, not individual, endpoints
- [ ] Agent overhead measured and within budget
- [ ] Non-production environments have agent disabled

## Common Failures
- **No sampling:** 100% tracing on high-traffic app → massive costs. Always configure sampling.
- **Dynamic transaction names:** `/users/42` and `/users/99` as separate transactions. Fix URL grouping.
- **Health check noise:** 30% of traces are health checks. Exclude at agent level.
- **Agent overhead surprise:** 10% CPU increase not accounted for in capacity planning. Benchmark first.

## Decision Points
- **Extension vs package APM:** Extension for lower overhead (<3%); Package for easier deployment.
- **General APM vs Laravel-specific:** General APM (New Relic) for enterprise compliance; Laravel-specific (Scout APM) for deeper framework insight.
- **Vendor APM vs OpenTelemetry:** Vendor APM for out-of-box setup; OTel for vendor neutrality and multi-backend flexibility.

## Performance Considerations
- Extension-based agents: 3-5% CPU overhead
- Package-based agents: 5-10% CPU overhead
- Memory: 10-50MB per worker with agent
- Span sampling: Essential for cost control
- Agent cold start: 50-200ms on PHP-FPM startup

## Security Considerations
- TLS for all data transmission from agent to collector
- SQL parameter scrubbing in query spans
- License keys in environment variables, not in code
- Dashboard and alert access restricted to engineering team

## Related Skills
- Performance Profiling & Bottleneck Detection
- N+1 Query Detection
- Span Sampling Strategies

## Success Criteria
- APM dashboard shows correct transaction names with aggregated metrics
- Health check traffic excluded from all APM data
- Performance regressions detected within hours of deployment
- Sampling controls span volume within budget
- Team uses APM data for capacity planning and optimization decisions
