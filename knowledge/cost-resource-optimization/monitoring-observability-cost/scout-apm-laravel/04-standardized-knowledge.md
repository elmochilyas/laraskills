# Scout APM for Laravel

## Metadata
- **ID**: KU-32-SCOUT-APM
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Scout APM for Laravel
- **Version**: 1.0
- **Classification**: Emerging
- **Maturity**: High

## Overview
Scout APM offers Laravel-specific application performance monitoring at $39-299/month flat pricing — dramatically cheaper than Datadog ($6K+/month) or New Relic ($3K+/month) for equivalent visibility. Scout provides Laravel-optimized tracing (N+1 detection, query analysis, Octane support) with predictable billing. For Laravel-first teams, Scout APM + CloudWatch for infrastructure covers 90%+ of observability needs at <10% of enterprise APM costs.

## Core Concepts
- **Pricing**: $39/month (10 requests/min), $99/month (100 requests/min), $299/month (unlimited)
- **Laravel-optimized**: N+1 query detection, Octane support, queue tracing, cache analysis
- **Flat pricing**: No per-host, per-GB, or per-metric charges
- **vs Datadog**: At mid-scale, Scout APM costs $299/month vs Datadog APM $6K+
- **Coverage**: APM + error tracking + deployment tracking

## When To Use
- Laravel-first teams that want specialized, predictable APM pricing
- Small to mid-scale deployments (<50 hosts) where flat pricing saves vs per-host billing
- Teams wanting Octane-specific monitoring (request/worker tracing)
- Projects requiring N+1 detection and query analysis out of the box
- Cost-sensitive teams wanting enterprise APM features at a fraction of the cost

## When NOT To Use
- Teams needing infrastructure/host-level monitoring (Scout is APM only; pair with CloudWatch)
- Organizations requiring log management, custom metrics, or dashboarding (use Grafana or Datadog)
- Multi-language or polyglot environments (Scout is PHP/Laravel focused)
- High-request-volume apps (>1000 req/s) need the $299 unlimited tier minimum
- Kubernetes-heavy deployments needing K8s-native monitoring (use Grafana)

## Best Practices
- **Pair Scout APM with CloudWatch**: Scout handles application performance; CloudWatch handles infrastructure metrics (WHY: Scout is $299/month flat for unlimited APM; CloudWatch EC2/RDS metrics are free; together they cover observability at $300-800/month vs $6K+ Datadog)
- **Start with $99/month plan**: 100 requests/min covers most mid-size Laravel apps (WHY: 100 req/min = 144,000 requests/day = 4.3M requests/month; most apps stay well under this; upgrade only if consistently exceeding for a week)
- **Enable Octane instrumentation**: Scout automatically detects Laravel Octane and tracks per-worker metrics (WHY: Octane's in-memory architecture changes profiling; Scout's Octane support gives per-worker CPU/memory/query breakdown)
- **Use deployment tracking**: Tag deploys to correlate performance changes with releases (WHY: Scout's deployment tracking compares performance before/after deploys; identifies regressions immediately)
- **Set up error alerting**: Configure Scout to notify on error thresholds per endpoint (WHY: flat-rate pricing means free alerting; no per-alarm cost unlike CloudWatch)

## Architecture Guidelines
- Scout APM as the primary Laravel APM tool for application-layer visibility
- CloudWatch for infrastructure metrics (EC2, RDS, Lambda, ELB) at $0 cost
- For log management, use CloudWatch Logs with 7-day retention or S3 export
- Scout fits into hybrid observability: Scout (APM) + CloudWatch (infra) + Sentry (errors)
- No need for full-stack enterprise APM if Laravel is primary technology

## Performance Considerations
- Scout agent adds ~2-5ms overhead per request (1-3% of typical response time)
- N+1 detection runs asynchronously; no impact on request response times
- Octane support adds minimal overhead per worker process
- Agent auto-throttles in high-traffic bursts to prevent performance impact

## Security Considerations
- Scout agent communicates over TLS; API key stored in application config
- Agent does not send raw request data or user PII by default
- IP addresses can be anonymized in Scout settings
- Deployment tracking via API; use dedicated deployment tokens
- Data stored in Scout's cloud infrastructure (US/EU regions configurable)

## Common Mistakes
1. **Using Scout as the only monitoring tool**: Scout is APM-only, no infrastructure monitoring (Cause: assuming Scout covers everything; Consequence: missing EC2 CPU spikes, disk space, memory pressure; Better: always pair Scout with CloudWatch or basic infrastructure monitoring)
2. **Not configuring the plan to match scale**: Paying $299/month when $99/month covers needs (Cause: defaulting to highest tier; Consequence: paying 3x for unused capacity; Better: start at $99/month, monitor usage, upgrade when consistently exceeding 100 req/min)
3. **Ignoring Scout's queue tracing**: Scout traces Laravel Horizon/SQS jobs (Cause: focusing only on web requests; Consequence: missing queue worker performance insights; Better: enable queue tracing in Scout config; identify slow jobs)
4. **Staying on Scout when needing multi-language monitoring**: Team adds Node.js/Ruby services but keeps only Scout (Cause: comfort with existing tool; Consequence: polyglot teams missing full-stack tracing; Better: evaluate New Relic or Grafana for polyglot environments)

## Anti-Patterns
- **Scout for multi-language environments**: Scout is PHP/Laravel specific; insufficient for polyglot
- **Scout without infrastructure monitoring**: No visibility into host CPU, memory, or disk
- **Highest tier by default**: $299/month plan before evaluating actual traffic
- **No error alerting**: Scout has built-in alerting; configure it instead of separate tool

## Examples
- **Small Laravel app (10 req/min)**: Scout $39/month plan; CloudWatch free metrics; Total = $39/month
- **Mid-scale app (80 req/min average)**: Scout $99/month plan; CloudWatch $200-300/month; Total = ~$350/month
- **High-traffic app (500 req/min)**: Scout $299/month unlimited; CloudWatch $500/month; Total = ~$800/month vs Datadog $6,500

## Related Topics
- CloudWatch Cost Analysis (ku-29)
- Datadog Enterprise Pricing (ku-30)
- New Relic Ingestion Pricing (ku-31)
- Monitoring Cost Comparison (ku-33)

## AI Agent Notes
- Default: Scout APM + CloudWatch for Laravel teams
- Start at $99/month plan unless traffic <10 req/min
- Always pair with infrastructure monitoring
- Enable Octane instrumentation for Octane-based apps
- $299/month flat covers unlimited requests
