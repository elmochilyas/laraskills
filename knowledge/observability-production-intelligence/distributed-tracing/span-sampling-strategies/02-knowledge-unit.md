# Span Sampling Strategies

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 04-distributed-tracing
- **Knowledge Unit:** span-sampling-strategies
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Span sampling determines which traces are recorded and exported — without it, every request generates spans that consume storage and incur costs. Head-based sampling decides at trace start, tail-based sampling buffers and decides after seeing the full trace, and parent-based sampling preserves distributed trace integrity. Getting sampling wrong means either runaway costs or missing critical traces.

---

## Core Concepts

- **Head-Based Sampling:** Decision at trace creation before any spans — O(1) cost, cannot use trace completeness information
- **Tail-Based Sampling:** Traces buffered, decision after trace completes — higher memory cost, can use error status or latency
- **Parent-Based Sampling:** Respects parent trace's sampling decision — ensures cross-service trace integrity via `ParentBasedSampler`
- **TraceIdRatio Sampler:** Determines fixed percentage via trace ID hash — consistent across services without coordination
- **Consistent Sampling:** Probability-based decision consistent across all services using trace ID hash as input
- **Sampling Context:** Decision propagated via `traceflags` byte in `traceparent` header — `sampled` flag (bit 0)

---

## Mental Models

- **Filter Model:** Three-stage filter: SDK head sampling (coarse), service parent sampling (consistency), Collector tail sampling (fine)
- **Budget Model:** Sampling is financial budgeting — total storage is your budget, sampling decisions allocate that budget to the most valuable traces (errors, slow requests)
- **Lottery Model:** Head-based sampling is a lottery ticket — each trace has a random chance of being recorded. Tail-based sampling is an auction — traces with higher value (errors) win the recording slot

---

## Internal Mechanics

Sampling decisions propagate through the architecture in stages. The SDK sampler (TraceIdRatioSampler) makes a head decision at trace start, propagated via traceflags. ParentBasedSampler in downstream services respects the incoming traceflags, maintaining trace integrity. The Collector's tail sampling processor examines complete traces and decides whether to export them. The SDK decision is a hint — the Collector can override via tail sampling, but the SDK decision is the first gate controlling data volume.

---

## Patterns

- **Endpoint-Aware Sampling:** Use a sampler callback that returns 0 for health endpoints, 1 for errors, and a configured rate for standard endpoints. Benefit: preserves critical traces while reducing noise. Tradeoff: requires sampler callback logic.
- **Combined Head + Tail Sampling:** Head-based sampling at 50% in the SDK (pre-filter), tail-based sampling in the Collector on remaining 50% (intelligent retention). Benefit: optimal cost/completeness balance. Tradeoff: more infrastructure (Collector).
- **Always-On Error Sampling:** Error traces (any span with an error) always sampled at 100% regardless of base rate. Benefit: never miss critical debugging data. Tradeoff: error volume must be monitored to prevent budget overrun.

---

## Architectural Decisions

**Use `ParentBasedSampler` in multi-service architectures.** Without parent fallback, service A at 10% and service B at 10% means trace continuity drops to 1% (10% × 10%). ParentBasedSampler ensures downstream services respect the upstream decision.

**Never use default `AlwaysOnSampler` in production.** Default OTel sampler records everything. On a 1000 req/s application with 20 spans/request, this produces 1.7B spans/day — prohibitively expensive.

**Sample error traces at 100% regardless of base rate.** Error traces are the most valuable for debugging. Head-based sampling can ensure this via sampler callback.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Head-based sampling: O(1), no memory overhead | Cannot see trace completeness when deciding | May miss traces that become errors downstream |
| Tail-based sampling: preserves error traces | Requires 500MB+ buffer for concurrent traces | Test under peak expected load |
| Parent-based sampling: cross-service integrity | Requires trace context propagation | Must configure propagators in all services |

---

## Performance Considerations

Head-based sampling: ~1μs per decision, no memory overhead. Tail-based sampling: memory proportional to concurrent trace count × trace duration — 1000 concurrent traces × 10s × 50KB = 500MB buffer. Parent-based sampling: microseconds per decision, no memory overhead. Collector tail sampling: 5-15% additional Collector CPU.

---

## Production Considerations

Security-relevant traces (auth failures, payment errors, admin actions) must sample at 100% regardless of base rate. Trace ID must be cryptographically random — predictable IDs allow sampling manipulation. Sampling rate and algorithm should not be exposed to external callers.

---

## Common Mistakes

**No sampling configured** — default `AlwaysOnSampler` on 1000 req/s app with 20 spans/request = 1.7B spans/day, prohibitively expensive.

**Sampling errors at same rate as healthy requests** — error traces are the most valuable for debugging. Always sample at 100%.

**Head-based sampling without parent fallback in multi-service apps** — service A at 10%, service B at 10% independently = 1% trace continuity.

**Tail sampling without sufficient buffer memory** — Collector OOM during traffic spikes because buffer fills up.

---

## Failure Modes

**Inconsistent sampling ratio across services:** Service A at 20%, Service B at 10% — downstream traces sampled inconsistently, losing trace completeness. Detection: traces missing spans from downstream services. Mitigation: use same `TraceIdRatioSampler` ratio everywhere.

**Collector tail sampling OOM:** Traffic spike fills tail sampling buffer beyond memory limit. Detection: Collector killed, trace data lost. Mitigation: pre-filter with head sampling; configure memory_limiter.

**Sampling budget exhaustion:** Despite sampling, span volume exceeds backend quota. Detection: backend rejects or drops spans. Mitigation: reduce sampling rate; add more aggressive filtering.

---

## Ecosystem Usage

OTel SDK provides `ParentBasedSampler`, `TraceIdRatioSampler`, and `AlwaysOnSampler`. The OTel Collector's `tail_sampling` processor provides policy-based decisions. Sentry's `traces_sampler` callback provides similar endpoint-aware sampling for non-OTel workflows.

---

## Related Knowledge Units

### Prerequisites
- OTLP Exporter & Collector Configuration (tail sampling in Collector)

### Related Topics
- OpenTelemetry PHP SDK (SDK-level samplers)
- PII Redaction & Log Sampling (related sampling strategies)

### Advanced Follow-up Topics
- Consistent Sampling Algorithms (advanced cross-service consistency)

---

## Research Notes

Default OTel sampler is `AlwaysOnSampler` — must be changed for production. `ParentBasedSampler` is mandatory for multi-service trace integrity. Error traces must always be sampled at 100% regardless of base rate. Tail sampling in Collector provides smarter decisions but requires memory planning. Sampling rate should be environment-configurable via `OTEL_TRACES_SAMPLER_ARG`.
