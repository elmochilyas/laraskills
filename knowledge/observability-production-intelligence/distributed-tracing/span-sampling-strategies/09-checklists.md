# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 04-distributed-tracing
**Knowledge Unit:** span-sampling-strategies
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Head-based vs tail-based vs parent-based sampling tradeoffs understood
- [ ] Sampling strategy selected based on cost, completeness, and latency needs
- [ ] TraceIdRatio sampler configured in SDK for head-based decision
- [ ] Parent-based sampling verified for distributed trace integrity
- [ ] Tail-based sampling evaluated for Collector deployment
- [ ] Consistent sampling algorithm chosen for cross-service trace integrity

---

# Architecture Checklist

- [ ] Sampling decision point identified: SDK-level vs Collector-level
- [ ] Head-based sampling used when sampling decision needed upfront
- [ ] Tail-based sampling used when completeness information needed first
- [ ] Parent-based sampling configured for multi-service trace chains
- [ ] Sampling context propagated correctly through trace context
- [ ] Sampling rate configured separately per service or endpoint

---

# Implementation Checklist

- [ ] `TraceIdRatioSampler` configured in OTel SDK with rate environment variable
- [ ] `ParentBased` sampler wrapping `TraceIdRatio` as fallback
- [ ] Sampler registered in `TracerProvider` builder
- [ ] Tail-based sampling processor configured in Collector YAML (`tail_sampling`)
- [ ] Sampling policy defined in Collector (latency, error, status_code)
- [ ] Consistent sampling probability ratio set across all services

---

# Performance Checklist

- [ ] Sampling rate tuned to stay within storage and ingestion budget
- [ ] Tail-based sampling memory overhead measured (buffers full traces)
- [ ] Head-based sampling latency impact measured (decision is fast, no buffer)
- [ ] Parent-based sampling overhead on context propagation measured
- [ ] Sampling decision policy overhead benchmarked end-to-end
- [ ] Dynamic sampling rate adjustment frequency evaluated

---

# Security Checklist

- [ ] Sampling decision does not affect error/crash detection coverage
- [ ] Sampling policies reviewed to not drop security-relevant traces
- [ ] Tail-based sampling buffer data secured in memory
- [ ] Sampling configuration does not expose internal rate decisions
- [ ] Consistent sampling seed not derived from predictable values
- [ ] Sampling override available for security incident investigation

---

# Reliability Checklist

- [ ] Sampling rate change does not require full service restart
- [ ] Tail sampling buffer overflow strategy defined (drop vs compress)
- [ ] Parent-based sampling correctly propagates across async boundaries
- [ ] Consistent sampling verified across team's polyglot services
- [ ] Sampling policy fallback if Collector crash
- [ ] Sampling decision audit-logged for trace integrity analysis

---

# Testing Checklist

- [ ] Unit test: `TraceIdRatioSampler` produces expected sampling ratio
- [ ] Unit test: `ParentBased` sampler respects parent decision
- [ ] Integration test: sampled trace appears in backend
- [ ] Integration test: non-sampled trace does not appear in backend
- [ ] Stress test: tail sampling buffer handles burst traffic
- [ ] Cross-service test: parent decision preserved in downstream service

---

# Maintainability Checklist

- [ ] Sampling strategy documented with cost-benefit rationale
- [ ] Sampling rate environment variables documented in `.env.example`
- [ ] Collector tail sampling policy documented with expected savings
- [ ] Sampling configuration reviewed quarterly for traffic changes
- [ ] Dynamic sampling thresholds documented if used
- [ ] Decision record created for head-based vs tail-based choice

---

# Anti-Pattern Prevention Checklist

- [ ] Sampling not set to 100% in production (runaway cost)
- [ ] Not using head-based sampling without parent fallback for multi-service
- [ ] Tail-based sampling not used without sufficient memory resources
- [ ] Fixed sampling rate not applied without considering traffic variability
- [ ] Sampling not applied to error spans (always capture errors)
- [ ] Cross-service sampling inconsistency not ignored (parent or consistent)

---

# Production Readiness Checklist

- [ ] Sampling rate configured per service with env override
- [ ] Span ingestion cost modeled at current sampling rate
- [ ] Trace integrity verified across service boundaries
- [ ] Tail sampling buffer memory monitored in production
- [ ] Sampling effectiveness reviewed: % of traces dropped vs needed
- [ ] Dynamic sampling rate validated against traffic pattern changes

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: sampling point decided, strategy chosen, context propagation working
- [ ] Security requirements satisfied: error coverage not reduced, security traces kept, buffer secured
- [ ] Performance requirements satisfied: overhead measured, memory sized, latency within budget
- [ ] Testing requirements satisfied: ratio correct, parent respected, cross-service integrity confirmed
- [ ] Anti-pattern checks passed: 100% not applied, parent fallback in place, errors always captured
- [ ] Production readiness verified: cost modeled, buffer monitored, effectiveness reviewed, dynamic tuning ready

---

# Related References

- OTLP Exporter & Collector Configuration (tail sampling in Collector)
- OpenTelemetry PHP SDK (SDK-level samplers)
- PII Redaction & Log Sampling (related logging sampling strategies)
