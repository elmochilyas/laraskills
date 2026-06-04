# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** span-sampling-strategies
**Difficulty:** Advanced
**Category:** Tracing Cost & Completeness
**Last Updated:** 2026-06-03

# Overview

Span sampling determines which traces are recorded and exported. Without sampling, every request generates spans that consume storage and incur costs. Head-based sampling decides at trace start; tail-based sampling buffers traces and decides after seeing the full trace. Parent-based sampling preserves distributed trace integrity across service boundaries.

The choice between sampling strategies involves tradeoffs between memory usage, latency, and completeness. Getting sampling wrong means either runaway costs (sampling too little) or missing critical traces (sampling too aggressively). This KU covers the full spectrum of OTel-compatible sampling strategies.

Engineers should care because sampling is the primary cost control mechanism for distributed tracing. Without deliberate sampling strategy, tracing costs scale linearly with traffic volume — a successful application becomes an expensive application.

# Core Concepts

**Head-Based Sampling:** The sampling decision is made at trace creation time, before any spans are generated. Implemented via OTel SDK `Sampler`. Low overhead (O(1)) but cannot use trace completeness information.

**Tail-Based Sampling:** Traces are buffered and the sampling decision is made after the trace completes. Implemented in the OTel Collector's `tail_sampling` processor. Higher overhead (buffering memory) but can make informed decisions based on error status, latency, or span count.

**Parent-Based Sampling:** The sampling decision respects the parent trace's sampling decision. If the upstream service sampled the trace, this service also samples it. This ensures cross-service trace integrity. Implemented via `ParentBasedSampler`.

**TraceIdRatio Sampler:** A deterministic head-based sampler that samples a fixed percentage of traces based on trace ID hash. Consistent across services — if service A samples trace `abc123`, service B (with same ratio) will also sample it. Configured via `TraceIdRatioSampler(rate)`.

**Consistent Sampling:** A sampling approach where the probability-based decision is consistent across all services without coordination. Achieved by using the trace ID's hash as the sampling decision input. OTel's TraceIdRatio sampler is inherently consistent.

**Sampling Context:** The decision about whether a trace is sampled is propagated via the `traceflags` byte in the `traceparent` header. The `sampled` flag (bit 0) communicates the decision to downstream services.

# When To Use

- **All production applications** with >100 requests/second — sampling is required for cost control
- **Multi-service architectures** — parent-based or consistent sampling maintains trace integrity
- **High-cost backends** (SaaS APM charging per ingested span) — sampling directly reduces cost

# When NOT To Use

- **Low-traffic applications** (<100 req/s) — sampling savings do not justify complexity
- **Development/staging environments** — sample at 100% for maximum debugging data
- **Compliance-mandated full trace capture** — some regulated environments require 100% trace retention

# Best Practices

**Always sample error traces at 100%.** Error spans and traces containing errors must always be recorded. Head-based sampling can ensure this via sampler callback; tail-based sampling naturally achieves this by keeping traces with error spans.

**Use head-based sampling for simple cost control.** If the only goal is reducing span volume by a fixed percentage, `TraceIdRatioSampler` at 10-20% in the SDK is sufficient. No Collector infrastructure needed.

**Use tail-based sampling for smart cost control.** If the goal is to keep all interesting traces (errors, slow requests, high-value users) while dropping healthy traces, use tail-based sampling in the Collector. This requires more infrastructure but provides better data completeness.

**Combine head and tail sampling.** Head-based sampling in the SDK at 50% (pre-filter). Tail-based sampling in the Collector on the remaining 50% (intelligent retention). This provides cost control with intelligence.

**Configure sampling rates via environment variables.** `OTEL_TRACES_SAMPLER` and `OTEL_TRACES_SAMPLER_ARG` allow runtime configuration without code changes.

# Architecture Guidelines

Sampling decision points propagate through the architecture:

1. **SDK (head sampling):** `TraceIdRatioSampler` decides at trace start. Decision propagated via `traceflags`
2. **Downstream services (parent sampling):** `ParentBasedSampler` respects the incoming `traceflags`. Trace integrity maintained
3. **Collector (tail sampling):** Tail sampling processor examines complete traces. Drops unsampled traces, exports sampled ones
4. **Backend:** Receives only sampled traces. Storage and cost proportional to sampling rate

The SDK sampling decision is a hint — the Collector can override it via tail sampling. But the SDK decision is the first gate that controls data volume.

# Performance Considerations

- **Head-based sampling:** ~1μs per decision. No memory overhead. Zero latency impact
- **Tail-based sampling:** Memory proportional to concurrent trace count × trace duration. 1000 concurrent traces × 10s average duration × 50KB per trace = 500MB buffer
- **Parent-based sampling:** Microseconds per decision (reads trace flags). No memory overhead
- **Collector tail sampling:** CPU cost for trace analysis and decision logic. 5-15% additional Collector CPU

# Security Considerations

- **Sampling must not affect security monitoring:** Security-relevant traces (auth failures, payment errors, admin actions) must be sampled at 100% regardless of base rate
- **Consistent sampling entropy source:** The trace ID must be cryptographically random. Predictable trace IDs allow manipulation of sampling decisions
- **Sampling rate confidentiality:** The sampling rate and algorithm should not be exposed to external callers to prevent gaming of the system

# Common Mistakes

**No sampling configured.** Default `AlwaysOnSampler` records everything. On a 1000 req/s application with 20 spans/request, this produces 1.7B spans/day — prohibitively expensive.

**Sampling errors at the same rate as healthy requests.** Error traces are the most valuable for debugging. Always sample them at 100% regardless of base sampling rate.

**Head-based sampling without parent fallback in multi-service apps.** Service A samples trace at 10%. Service B receives it and runs head-based sampling at 10% independently — trace continuity drops to 1% (10% × 10%). Use `ParentBasedSampler`.

**Tail sampling without sufficient buffer memory.** Collector OOM during traffic spikes because tail sampling buffer fills up. Always test tail sampling under peak expected load.

**Inconsistent sampling ratio across services.** Service A at 20% and Service B at 10% means downstream traces are sampled inconsistently, losing trace completeness in the backend.

# Anti-Patterns

**100% sampling in production on general traffic:** Unless the application handles < 100 req/s, 100% sampling is cost-prohibitive and data-overwhelming. Apply sampling.

**Sampling all spans uniformly:** Treating all endpoints the same. Health checks, static assets, and internal monitoring endpoints should be sampled at 0%. Critical API endpoints should be sampled at 100%.

**Tail sampling without head pre-filter:** Running 100% of traces through tail sampling requires Collector memory for all traces. Pre-filter with head sampling at 50% to halve the tail sampling buffer requirement.

# Examples

**SDK sampler configuration:**
```php
$tracerProvider = TracerProviderBuilder::create()
    ->setSampler(new ParentBasedSampler(
        new TraceIdRatioSampler(0.1)  // 10% base rate
    ))
    ->build();
```

**Traces_sampler with endpoint awareness (Sentry-style):**
```php
'traces_sampler' => function (SamplingContext $context): float {
    $name = $context->getTransactionContext()->getName();
    if (str_contains($name, '/health')) return 0.0;
    if ($context->getParentSampled()) return 1.0;
    if ($context->getTransactionContext()->getIsError()) return 1.0;
    return 0.1;
};
```

# Related Topics

**Prerequisites:**
- OTLP Exporter & Collector Configuration (tail sampling in Collector)

**Closely Related Topics:**
- OpenTelemetry PHP SDK (SDK-level samplers)
- PII Redaction & Log Sampling (related sampling strategies for logs)

**Advanced Follow-Up Topics:**
- Consistent Sampling Algorithms (advanced cross-service consistency)

**Cross-Domain Connections:**
- Cost & Resource Optimization — observability cost management

# AI Agent Notes

- Default OTel sampler is `AlwaysOnSampler` — must be changed for production
- `ParentBasedSampler` is mandatory for multi-service trace integrity
- Error traces must always be sampled at 100% regardless of base rate
- Tail sampling in Collector provides smarter decisions but requires memory planning
- Sampling rate should be environment-configurable via `OTEL_TRACES_SAMPLER_ARG`
- Head-based + tail-based combination provides optimal cost/completeness balance
- `TraceIdRatioSampler` provides consistent sampling across services without coordination
