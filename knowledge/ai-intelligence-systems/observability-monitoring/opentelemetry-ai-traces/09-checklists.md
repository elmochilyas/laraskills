# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** observability-monitoring
**Knowledge Unit:** opentelemetry-ai-traces
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automatic instrumentation
- [ ] Correlated tracing
- [ ] Cost in span attributes
- [ ] DDTrace for GenAI
- [ ] Error spans
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for OpenTelemetry AI Traces

---

# Architecture Checklist

- [ ] Auto
- [ ] OTel vs. custom logging â†’ OTel for standardized, vendor
- [ ] OTLP vs. provider
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom

---

# Implementation Checklist

- [ ] Automatic instrumentation
- [ ] Correlated tracing
- [ ] Cost in span attributes
- [ ] DDTrace for GenAI
- [ ] Error spans
- [ ] Tool timeout detection
- [ ] X-ray for AI
- [ ] Rules for OpenTelemetry AI Traces

---

# Performance Checklist

- [ ] Attribute attachment: negligible
- [ ] Export overhead: batch export every 5s or 100 spans â€” no per-request network call
- [ ] Memory: spans held in buffer until export â€” configure buffer size appropriately
- [ ] Sampling: use head-based or tail-based sampling for high-volume apps
- [ ] Span creation: negligible (<0.1ms)

---

# Security Checklist

- [ ] Configure sampling rate â€” 100% for staging, 5-10% for production high-volume
- [ ] Correlate traces with application logs â€” trace ID in log context
- [ ] Implement tail-based sampling for error traces â€” capture 100% of error traces, sample successful ones
- [ ] Monitor OTel exporter errors â€” failed exports lose trace data silently
- [ ] Never attach sensitive data (PII, API keys) to span attributes
- [ ] Plan for storage costs â€” OTel backends charge per data ingested
- [ ] Set up OTel collector as sidecar or gateway â€” don't export directly from PHP workers

---

# Reliability Checklist

- [ ] Attaching PII to spans â€” sensitive data in observability tool (compliance risk)
- [ ] No sampling â€” OTel backend costs explode at production scale
- [ ] Not correlating with HTTP request traces â€” can't trace from user click to AI response
- [ ] Not testing OTel setup before production â€” discovered during outage with no traces
- [ ] Over-instrumentation â€” creating too many spans (per-token spans) â€” noise over signal
- [ ] Synchronous export â€” blocking PHP worker during span export

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[No Trace Sampling in Production](#1-no-trace-sampling-in-production)]
- [ ] [[PII in Span Attributes](#2-pii-in-span-attributes)]
- [ ] [[Synchronous Span Export](#3-synchronous-span-export)]
- [ ] [[Over-Instrumentation Creating Noise](#4-over-instrumentation-creating-noise)]
- [ ] [[Not Testing OTel Before Production](#5-not-testing-otel-before-production)]
- [ ] Attribute explosion
- [ ] Context propagation failure
- [ ] Exporter failure
- [ ] Sampling bias
- [ ] Span leak

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


