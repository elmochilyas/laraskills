# Sampling Strategies

## Metadata
- **ID**: KU-04-SAMPLING-STRATEGIES
- **Subdomain**: monitoring-observability-cost
- **Domain**: cost-resource-optimization
- **Topic**: Sampling Strategies
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
Sampling reduces observability costs by collecting data from only a subset of requests while maintaining statistical significance. For Laravel applications, the key insight is that 99% of debugging value comes from error and slow requests. Sampling strategies determine which subset of data to retain, balancing cost against observability quality. A well-designed sampling strategy reduces monitoring costs by 90-99% while preserving incident-response capability.

## Core Concepts
- **Head-based sampling**: Decision at request start (e.g., "trace every 100th request"); simple, but may miss slow/error tails
- **Tail-based sampling**: Decision after request completes; preserves slow/error traces; more complex
- **Priority sampling**: Always retain errors, slow requests, high-value users; sample healthy requests
- **Dynamic sampling**: Adjust rate based on traffic volume (1% at peak, 10% at low traffic)
- **Sample rate**: Ratio of requests retained (0.01 = 1%); lower rate = lower cost
- **Statistical validity**: Minimum sample size for meaningful percentile calculations (usually 1000-5000 samples)
- **Distributed sampling coordination**: Ensuring all spans for a trace are sampled consistently (or trace is incomplete)

## When To Use
- Head-based sampling: Low-complexity needs; single-service apps; budget-constrained monitoring
- Tail-based sampling: Multi-service apps; need to capture all errors/slow requests; incident response focus
- Priority sampling: All production apps (always retain errors, sample healthy)
- Dynamic sampling: Apps with 10x+ traffic variation between peak and off-peak
- Log sampling: High-volume endpoints (API logs, health checks, cron outputs)
- Metric sampling: Pre-aggregation for high-cardinality data (per-user metrics)
- Trace sampling: Distributed tracing at scale (>100 req/s)

## When NOT To Use
- No sampling: Low-traffic apps (<10 req/s) don't need sampling; collect everything
- Head-based for error capture: Head-based sampling may miss rare errors; use tail-based if errors are priority
- Tail-based for simple apps: Overkill for single-server Laravel app; head-based is simpler and sufficient
- Sampling for compliance monitoring: If you need 100% audit trail; don't sample
- Random sampling for debugging: If you're actively debugging a specific issue, disable sampling temporarily

## Best Practices
- **Always sample healthy requests, never errors**: Set 1-5% rate for 2xx/3xx, 100% for 4xx/5xx (WHY: errors are rare (1-5%) but provide 90% of debugging value; sampling errors would miss incidents; healthy requests are 95%+ of traffic and provide little debugging value individually)
- **Use consistent sample rate across services**: All services in a trace must sample the same requests (WHY: a sampled request with missing child-service spans is an incomplete trace; use trace ID hash-based deterministic sampling for consistency)
- **Implement priority sampling for APM**: 100% of error traces, 100% of traces > 500ms, 5% of healthy traces (WHY: priority sampling captures the 3 categories that matter: errors (broken), slow (performance issues), and healthy (baseline comparison); 5% healthy gives statistical significance)
- **Adjust sample rate based on traffic volume**: 10% at 10 req/s, 1% at 1000 req/s (WHY: 10 samples/sec gives same statistical power regardless of traffic; adjust rate to maintain consistent sample count per second)
- **Use pre-aggregation for metrics**: Compute percentiles or counts in application code, emit single aggregated metric (WHY: emitting per-request metrics creates high cardinality; pre-aggregation reduces metric count from N to 5 (p50, p95, p99, count, sum))
- **Test sampling coverage quarterly**: Simulate error scenarios and verify they're captured in traces (WHY: sampling configuration may drift; errors may be undersampled if configuration changes; quarterly validation ensures coverage)

## Architecture Guidelines
- Configure sampling at the tracing provider level (X-Ray sampling rules, Datadog APM sampling)
- Use OpenTelemetry sampler for vendor-neutral configuration
- Set up two-tier sampling: head-based for general traffic, tail-based for edge cases
- Coordinate sampling across services via trace ID hash (consistent sampling)
- Log sample rate as a metric to monitor effective sample percentage
- Document sampling strategy in runbook: what's sampled, what's retained, why

## Performance Considerations
- Sampling decision adds <0.1ms per request (negligible)
- Tail-based sampling requires buffering traces (memory: ~1KB per incomplete trace)
- Head-based sampling has zero memory overhead (decision made immediately)
- Coordinated sampling adds ~0.5ms for trace ID hash computation
- Aggregated metrics: 1 API call per minute vs N per request (huge network savings)

## Security Considerations
- Sampling decisions should not be based on user roles (don't sample-paying-users-only)
- Sampling must respect data privacy rules (don't sample PII-containing requests differently)
- Audit log of sampling configuration changes (tampering with sampling can hide incidents)
- Disable sampling temporarily for security incidents (need full trace data)
- Ensure raw trace data is access-controlled regardless of sampling rate

## Common Mistakes
1. **Random sampling without error prioritization**: 1% random sampling misses all errors that happen in the 99% (Cause: simple "sample 1% of all requests" config; Consequence: zero traces of production errors; Better: priority sampling: 100% errors, 1% healthy)
2. **Inconsistent sampling across services**: Web app sampled at 10%, queue worker at 1% (Cause: separate sampling config per service; Consequence: 90% of traces are incomplete (missing queue spans); Better: coordinate sampling via trace ID hash)
3. **Not sampling at all at scale**: Tracing 100% of 5000 req/s = $5000+/month (Cause: "we need all the data"; Consequence: observability cost exceeds compute cost; Better: 1% sample gives 98% of value at 1% of cost)

## Anti-Patterns
- **Static sample rate**: Never adjusting rate as traffic grows; paying 100x at peak vs off-peak
- **No error priority**: Sampling errors at same rate as healthy requests; missing incident data
- **Sampling configuration in code**: Hardcoded sample rates that require deploy to change
- **Sampling logs but not traces**: Capturing all traces but sampling 90% of logs (or vice versa; inconsistent)

## Examples
- **X-Ray sampling rule**: `{"RuleName": "Default", "Priority": 1, "FixedRate": 0.05, "ReservoirSize": 1}` (5% sample + 1 trace/second reservoir)
- **Datadog APM**: Head-based sampling 10% with error prioritization
- **OpenTelemetry**: `Sampler = ParentBased(root=TraceIdRatioBased(0.01), remoteParentSampled=AlwaysOn)` (1% head-based, always sample if parent sampled)
- **Log sampling**: Laravel channel `sampled_log` with `rate_limiter` middleware: 1:100 sampling

## Related Topics
- Tracing Cost Optimization (ku-03)
- Log Cost Optimization (ku-01)
- Metric Cost Optimization (ku-02)
- Data Retention Tiering (ku-05)

## AI Agent Notes
- Default: priority sampling (100% errors, slow traces; 1-5% healthy)
- Default: consistent sampling across services (trace ID hash)
- Never randomly sample errors; always retain them

## Verification
- [ ] Priority sampling configured (errors at 100%, healthy at 1-5%)
- [ ] Sampling coordinated across services (trace ID hash)
- [ ] Sample rate dynamic (adjusts with traffic volume)
- [ ] Error traces captured at 100%
- [ ] Sampling coverage tested quarterly
- [ ] Sampling config in environment/config (not hardcoded)
- [ ] Observability cost reduced by 90%+ from sampling
