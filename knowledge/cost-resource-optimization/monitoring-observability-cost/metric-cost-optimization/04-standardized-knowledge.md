# Metric Cost Optimization

## Metadata
- **ID**: KU-02-METRIC-COST-OPTIMIZATION
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Metric Cost Optimization
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Custom metrics (CloudWatch, Datadog, New Relic, Scout APM) are priced per metric per month. For Laravel applications, instrumenting every query, cache hit, queue job, and response time can generate thousands of custom metrics, rapidly escalating costs. Selective instrumentation, metric aggregation, and proper resolution settings reduce metric costs by 60-80% while preserving essential signals.

## Core Concepts
- **Custom metric**: User-defined metric (e.g., `laravel.query.count`, `queue.job.duration`)
- **Metric resolution**: Standard (1-minute) vs High-Resolution (1-second); high-res costs more
- **Metric dimension**: Key-value pairs that segment metrics (e.g., `endpoint`, `status_code`)
- **Datadog custom metrics**: $0.05/metric/month (annual); $0.10/metric/month (monthly)
- **CloudWatch custom metrics**: $0.30/metric/month (standard resolution)
- **Scout APM**: Per-host pricing (not per-metric); simpler cost model for Laravel
- **Metric cardinality**: Number of unique metric + dimension combinations; high cardinality = high cost

## When To Use
- Custom metrics: Monitor business KPIs, application performance trends, deployment health
- Business metrics: Orders placed, users registered, revenue processed (not just technical)
- APM: Scout APM for Laravel-specific insights (queries, N+1 detection, cache performance)
- Standard resolution: Most application metrics (1-minute resolution is sufficient for trend monitoring)
- High-resolution: Only for real-time alerting on fast-changing metrics (request latency spikes)

## When NOT To Use
- Per-endpoint metrics: Don't create separate metric per URL path (use labels/tags instead; high cardinality)
- High-resolution for trend data: 1-second resolution for "monthly active users" is wasteful
- Unused metrics: Don't create metrics that are never graphed or alerted on
- datadog for all-in-one: Consider Scout APM for simpler Laravel monitoring (host-based pricing)
- Excessive dimensions: Each dimension multiplies metric count; limit to 3-5 dimensions

## Best Practices
- **Limit custom metrics to 50 per service**: Focus on metrics that directly impact business or performance (WHY: each custom metric costs $0.30-0.50/month; 500 metrics = $150-250/month; 50 metrics = $15-25/month; most of the value comes from the first 20 metrics)
- **Use Scout APM for Laravel-specific metrics**: Scout auto-instruments queries, N+1, cache, queues, Octane (WHY: Scout gives 30+ Laravel-specific metrics for a single per-host price ($7-25/month); equivalent CloudWatch custom metrics would cost $100+/month)
- **Aggregate high-cardinality data before emitting**: Compute p50/p95/p99 in application code, emit as single metric (WHY: emitting each request's latency as a separate datapoint with `endpoint` dimension creates 1000+ unique metrics; aggregated percentile metric = 1 metric)
- **Set metric resolution to standard for business metrics**: Customer signups, revenue, active users don't need high-resolution monitoring (WHY: high-resolution (1-second) costs 2x more than standard (1-minute); business metrics don't change by the second)
- **Monitor metric cost per host**: Track how many custom metrics each server emits; remove noisy metrics (WHY: a single misconfigured server emitting 100 custom metrics doubles monitoring cost; find and fix noisy instrumentation)
- **Use ServiceLens/CloudWatch Dashboards**: Group related metrics into dashboards; share across team (WHY: dashboards don't cost extra; they help identify unused metrics that can be removed)

## Architecture Guidelines
- Start with Scout APM for Laravel (low cost, Laravel-native metrics)
- Add custom CloudWatch/Datadog metrics only for business-specific needs
- Tag metrics with environment (prod/staging/dev) and service name for cost allocation
- Use metric math for derived metrics (e.g., error rate = errors/total requests)
- Set CloudWatch metric alarms with 3+ evaluation periods to reduce false alarms
- Review custom metrics quarterly; remove any not used in dashboards or alerts

## Performance Considerations
- Emitting metrics adds <0.1ms per metric (asynchronous)
- Batch metric emission: 20 metrics in 1 API call vs 20 separate calls (20x fewer API requests)
- CloudWatch PutMetricData API can accept up to 20 metrics per call (batch for efficiency)
- Metric aggregation at application level reduces network calls from N per request to 1 per minute
- Scout APM agent uses ~1-3% CPU for instrumentation

## Security Considerations
- Custom metrics may leak business data (revenue, user counts) if monitoring is exposed
- Restrict CloudWatch/Scout APM API access to authorized services only
- Metric dashboards should have appropriate IAM permissions
- Don't emit metrics containing sensitive values (user IDs, emails)
- Use monitoring tools with SOC 2/HIPAA compliance for regulated apps

## Common Mistakes
1. **Per-endpoint custom metrics**: 100 endpoints x 3 metrics each = 300 custom metrics (Cause: well-intentioned granular monitoring; Consequence: $90-150/month in custom metric costs; Better: aggregate into 5 endpoint-group metrics or use APM (Scout) which doesn't charge per metric)
2. **High-resolution for everything**: Setting 1-second resolution for all 100 metrics (Cause: enabling "detailed monitoring" checkbox; Consequence: 2x metric cost for no benefit; Better: standard 1-minute resolution; high-res only for latency-sensitive alerting)
3. **Unused metrics accumulated**: 200 custom metrics defined over 2 years; 80% never viewed or alerted on (Cause: metrics added for debugging, never removed; Consequence: $60/month for metrics nobody uses; Better: quarterly metric audit, remove unused metrics)

## Anti-Patterns
- **Metric explosion**: Every engineer adds their own metrics; no governance
- **No metric cost monitoring**: Custom metric costs hidden in monitoring bill; no accountability
- **duplicate metrics**: App emits both CloudWatch + Datadog + Scout metrics for same thing
- **Excessive granularity**: Metrics tagged with `user_id` dimension (cardinality = number of users)

## Examples
- **Before**: 500 CloudWatch custom metrics, per-endpoint latency and error count, high-res on all = $250/month
- **After**: 40 metrics (20 business + 20 technical), Scout APM for per-endpoint data, standard resolution = $50/month (including Scout)
- **Scout APM**: $17/month for single server; covers queries, N+1, cache, Octane, queue; zero per-metric cost
- **Metric aggregation**: `OrderPlaced` metric; `PaymentSuccess` metric; `AverageOrderValue` metric (3 business metrics instead of individual order tracking)

## Related Topics
- Log Cost Optimization (ku-01)
- Tracing Cost Optimization (ku-03)
- Sampling Strategies (ku-04)
- Scout APM vs Datadog vs New Relic

## AI Agent Notes
- Default: Scout APM for Laravel-specific monitoring
- Default: 50 or fewer custom business/technical metrics
- Audit metrics quarterly; remove unused ones

## Verification
- [ ] Custom metrics < 50 per service
- [ ] Scout APM or similar used for Laravel-specific metrics
- [ ] Metric resolution = standard (1-min) unless justified
- [ ] High-cardinality data aggregated before emission
- [ ] Quarter metric audit performed
- [ ] Metric cost tracked and < 5% of infra spend
- [ ] No per-endpoint custom metrics (use APM instead)
