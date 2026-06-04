# KU-03-TRACING-COST-OPTIMIZATION: Tracing Cost Optimization

## Metadata
- **ID**: KU-03-TRACING-COST-OPTIMIZATION
- **Subdomain**: Monitoring & Observability Cost
- **Topic**: Tracing Cost Optimization
- **Source**: Monitoring & Observability Cost, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
Distributed tracing (X-Ray, Datadog APM, New Relic Distributed Tracing) captures end-to-end request flows across services. For Laravel applications, tracing spans are generated for every HTTP request, database query, cache operation, and queue job. Pricing is per span ingested. An unoptimized Laravel app can generate 50+ spans per request, making tracing the most expensive observability component at scale. Sampling and span filtering are essential cost controls.

## Core Concepts
- **Trace**: End-to-end request flow (e.g., HTTP request -> controller -> Eloquent query -> Redis -> HTTP response)
- **Span**: Individual operation within a trace (each query, cache call, HTTP request is a span)
- **AWS X-Ray**: $0.000005/trace + $0.0000005/span; 100K traces/month free
- **Datadog APM**: $0.05-0.70/million spans ingested (depending on plan)
- **New Relic Distributed Tracing**: $0.25/GB ingested (tracing data); included in higher-tier plans
- **Head-based sampling**: Decision to trace made at request entry; simple but may miss slow tails
- **Tail-based sampling**: Decision after request completes; preserves slow/error traces; more expensive

## Mental Models
- Default: 1-5% head-based sampling + 100% error traces
- Default: filter health checks from tracing
- Default: aggregate low-value spans (cache, config lookups)
- Tracing cost should < 10% of observability spend

## Internal Mechanics
- Tracing instrumentation adds 1-5% CPU overhead per request
- Span export adds 1-10ms if synchronous; use async export
- OTel collector can batch spans, reducing export API calls by 100x
- High span count per request (>50) degrades app throughput; aggregate or trim spans
- Trace context propagation adds ~0.5ms per HTTP call

## Patterns
- Use head-based sampling with 1-10% rate
- Filter health check traces
- Span aggregation for low-value operations
- Use tail-based sampling for error traces
- Set trace budget alerts
- Use OpenTelemetry for vendor-neutral tracing

## Architectural Decisions
- Single Laravel service: Scout APM or New Relic APM (includes tracing in per-host pricing)
- Multi-service: OpenTelemetry collector with head/tail-based sampling
- AWS-native: X-Ray with sampling rules (5% default, 100% for errors)
- High-traffic (1000+ req/s): Send only 1% of traces to APM; use log-based correlation for rest
- Queue tracing: Sample queue jobs at 5% (same reasoning as HTTP; 5% gives signal at 5% cost)
- Always exclude internal monitoring traffic from tracing (health checks, admin pings)

## Tradeoffs
**When To Use:**
- Distributed tracing: Microservices or multi-service Laravel apps (app + queue + worker + cron)
- Performance debugging: Identifying latency bottlenecks across service boundaries
- Error correlation: Tracing errors across services with single trace ID
- X-Ray: Low-cost option for AWS-native Laravel apps
- Tail-based sampling: When you need to capture all error traces and slow traces (not just random sample)

**When NOT To Use:**
- Single-service Laravel app: Monolithic app doesn't benefit from distributed tracing (APM is sufficient)
- All-spans tracing at high volume: 1000 req/s x 50 spans = 50M spans/day = $500-3500/month in tracing costs
- Tracing every request: For high-traffic apps, 100% sampling costs more than the compute infrastructure
- X-Ray for high-trace volume: X-Ray's per-trace pricing adds up quickly at scale ($1000+/month for 200M spans)

## Performance Considerations
- Tracing instrumentation adds 1-5% CPU overhead per request
- Span export adds 1-10ms if synchronous; use async export
- OTel collector can batch spans, reducing export API calls by 100x
- High span count per request (>50) degrades app throughput; aggregate or trim spans
- Trace context propagation adds ~0.5ms per HTTP call

## Production Considerations
- Traces may contain sensitive data (query parameters, request bodies, response data)
- Use OTel span processors to redact sensitive attributes before export
- Restrict trace data access to SRE/backend engineering teams
- X-Ray traces are encrypted at rest and in transit
- Don't trace endpoints handling PII or financial data (or redact span attributes)

## Common Mistakes
- **100% trace sampling at high traffic**: Tracing 100% of 5000 req/s (Cause: "we need full visibility"; Consequence: $5000+/month tracing bill exceeds compute costs; Better: 1-5% head-based sampling; 100% for errors only)
- **Not filtering health checks**: 50% of traces from health check endpoints (Cause: tracing all traffic indiscriminately; Consequence: paying double for useless traces; Better: add sampling rule to drop health check traces)
- **Individual spans for every Redis command**: 50 cache calls = 50 spans per request (Cause: granular cache monitoring; Consequence: majority of spans are low-value cache hits; Better: aggregate Redis spans into single "Cache operations" span)

## Failure Modes
- **Tracing without monitoring cost**: Setting up tracing and ignoring the monthly bill until it's $2000+
- **Excessive span detail**: Span per line of application code (100+ spans per request)
- **No sampling configuration**: Default 100% sampling for new applications; never adjusted

## Ecosystem Usage
- **Before**: 500 req/s, 50 spans/req, 100% sampled = 2.16B spans/month = $15,120/month at Datadog APM
- **After**: 1% head-based sampling, health check filtered, Redis spans aggregated = 10M spans/month = $70/month
- **X-Ray sampling rule**: 5% default sampling, 100% for errors, 100% for requests > 1s
- **OpenTelemetry collector**: OTel with head sampler (1%), error sampler (100%), batch export every 5 seconds

## Related Knowledge Units
- Sampling Strategies (ku-04)
- Metric Cost Optimization (ku-02)
- Data Retention Tiering (ku-05)
- Scout APM vs X-Ray vs Datadog

## Research Notes
Derived from Monitoring & Observability Cost, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.