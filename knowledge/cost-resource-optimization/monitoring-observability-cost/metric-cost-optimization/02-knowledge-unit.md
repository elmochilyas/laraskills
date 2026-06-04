# KU-02-METRIC-COST-OPTIMIZATION: Metric Cost Optimization

## Metadata
- **ID**: KU-02-METRIC-COST-OPTIMIZATION
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Metric Cost Optimization
- **Source**: Monitoring & Observability Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Custom metrics (CloudWatch, Datadog, New Relic, Scout APM) are priced per metric per month. For Laravel applications, instrumenting every query, cache hit, queue job, and response time can generate thousands of custom metrics, rapidly escalating costs. Selective instrumentation, metric aggregation, and proper resolution settings reduce metric costs by 60-80% while preserving essential signals.

## Core Concepts
- **Custom metric**: User-defined metric (e.g., `laravel.query.count`, `queue.job.duration`)
- **Metric resolution**: Standard (1-minute) vs High-Resolution (1-second); high-res costs more
- **Metric dimension**: Key-value pairs that segment metrics (e.g., `endpoint`, `status_code`)
- **Datadog custom metrics**: $0.05/metric/month (annual); $0.10/metric/month (monthly)
- **CloudWatch custom metrics**: $0.30/metric/month (standard resolution)
- **Scout APM**: Per-host pricing (not per-metric); simpler cost model for Laravel
- **Metric cardinality**: Number of unique metric + dimension combinations; high cardinality = high cost

## Mental Models
- Default: Scout APM for Laravel-specific monitoring
- Default: 50 or fewer custom business/technical metrics
- Audit metrics quarterly; remove unused ones

## Internal Mechanics
- Emitting metrics adds <0.1ms per metric (asynchronous)
- Batch metric emission: 20 metrics in 1 API call vs 20 separate calls (20x fewer API requests)
- CloudWatch PutMetricData API can accept up to 20 metrics per call (batch for efficiency)
- Metric aggregation at application level reduces network calls from N per request to 1 per minute
- Scout APM agent uses ~1-3% CPU for instrumentation

## Patterns
- Limit custom metrics to 50 per service
- Use Scout APM for Laravel-specific metrics
- Aggregate high-cardinality data before emitting
- Set metric resolution to standard for business metrics
- Monitor metric cost per host
- Use ServiceLens/CloudWatch Dashboards

## Architectural Decisions
- Start with Scout APM for Laravel (low cost, Laravel-native metrics)
- Add custom CloudWatch/Datadog metrics only for business-specific needs
- Tag metrics with environment (prod/staging/dev) and service name for cost allocation
- Use metric math for derived metrics (e.g., error rate = errors/total requests)
- Set CloudWatch metric alarms with 3+ evaluation periods to reduce false alarms
- Review custom metrics quarterly; remove any not used in dashboards or alerts

## Tradeoffs
**When To Use:**
- Custom metrics: Monitor business KPIs, application performance trends, deployment health
- Business metrics: Orders placed, users registered, revenue processed (not just technical)
- APM: Scout APM for Laravel-specific insights (queries, N+1 detection, cache performance)
- Standard resolution: Most application metrics (1-minute resolution is sufficient for trend monitoring)
- High-resolution: Only for real-time alerting on fast-changing metrics (request latency spikes)

**When NOT To Use:**
- Per-endpoint metrics: Don't create separate metric per URL path (use labels/tags instead; high cardinality)
- High-resolution for trend data: 1-second resolution for "monthly active users" is wasteful
- Unused metrics: Don't create metrics that are never graphed or alerted on
- datadog for all-in-one: Consider Scout APM for simpler Laravel monitoring (host-based pricing)
- Excessive dimensions: Each dimension multiplies metric count; limit to 3-5 dimensions

## Performance Considerations
- Emitting metrics adds <0.1ms per metric (asynchronous)
- Batch metric emission: 20 metrics in 1 API call vs 20 separate calls (20x fewer API requests)
- CloudWatch PutMetricData API can accept up to 20 metrics per call (batch for efficiency)
- Metric aggregation at application level reduces network calls from N per request to 1 per minute
- Scout APM agent uses ~1-3% CPU for instrumentation

## Production Considerations
- Custom metrics may leak business data (revenue, user counts) if monitoring is exposed
- Restrict CloudWatch/Scout APM API access to authorized services only
- Metric dashboards should have appropriate IAM permissions
- Don't emit metrics containing sensitive values (user IDs, emails)
- Use monitoring tools with SOC 2/HIPAA compliance for regulated apps

## Common Mistakes
- **Per-endpoint custom metrics**: 100 endpoints x 3 metrics each = 300 custom metrics (Cause: well-intentioned granular monitoring; Consequence: $90-150/month in custom metric costs; Better: aggregate into 5 endpoint-group metrics or use APM (Scout) which doesn't charge per metric)
- **High-resolution for everything**: Setting 1-second resolution for all 100 metrics (Cause: enabling "detailed monitoring" checkbox; Consequence: 2x metric cost for no benefit; Better: standard 1-minute resolution; high-res only for latency-sensitive alerting)
- **Unused metrics accumulated**: 200 custom metrics defined over 2 years; 80% never viewed or alerted on (Cause: metrics added for debugging, never removed; Consequence: $60/month for metrics nobody uses; Better: quarterly metric audit, remove unused metrics)

## Failure Modes
- **Metric explosion**: Every engineer adds their own metrics; no governance
- **No metric cost monitoring**: Custom metric costs hidden in monitoring bill; no accountability
- **duplicate metrics**: App emits both CloudWatch + Datadog + Scout metrics for same thing
- **Excessive granularity**: Metrics tagged with `user_id` dimension (cardinality = number of users)

## Ecosystem Usage
- **Before**: 500 CloudWatch custom metrics, per-endpoint latency and error count, high-res on all = $250/month
- **After**: 40 metrics (20 business + 20 technical), Scout APM for per-endpoint data, standard resolution = $50/month (including Scout)
- **Scout APM**: $17/month for single server; covers queries, N+1, cache, Octane, queue; zero per-metric cost
- **Metric aggregation**: `OrderPlaced` metric; `PaymentSuccess` metric; `AverageOrderValue` metric (3 business metrics instead of individual order tracking)

## Related Knowledge Units
- Log Cost Optimization (ku-01)
- Tracing Cost Optimization (ku-03)
- Sampling Strategies (ku-04)
- Scout APM vs Datadog vs New Relic

## Research Notes
Derived from Monitoring & Observability Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.