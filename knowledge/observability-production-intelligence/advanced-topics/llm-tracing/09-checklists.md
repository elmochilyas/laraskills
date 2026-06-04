# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** llm-tracing
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] LLM spans created with correct OpenTelemetry semantic conventions for prompts and completions
- [ ] Trace context propagated from HTTP request through LLM API calls to downstream queries
- [ ] Token usage captured as span attributes using `gen_ai.response.usage.*` conventions
- [ ] Provider-agnostic span attributes used to support multiple LLM providers

---

# Architecture Checklist

- [ ] LLM tracing integrated within existing OpenTelemetry tracing pipeline, not as a separate system
- [ ] Span hierarchy designed to correlate LLM calls with parent HTTP request spans
- [ ] Provider-agnostic attribute schema chosen to avoid vendor lock-in
- [ ] Manual instrumentation strategy selected over auto-instrumentation where LLM client libraries lack support

---

# Implementation Checklist

- [ ] OTel PHP SDK configured as the tracing foundation before adding LLM-specific spans
- [ ] LLM span created wrapping each API call with start/end timing
- [ ] Prompt and completion text captured as span attributes with size limits to avoid span explosion
- [ ] Token counts (prompt, completion, total) recorded on span attributes

---

# Performance Checklist

- [ ] Span attribute size limited for large prompts and completions to avoid OTel exporter memory pressure
- [ ] Sampling strategy applied to LLM spans to control volume and cost
- [ ] Token counting implemented without adding measurable latency to LLM API calls
- [ ] Background span export configured to avoid blocking the request lifecycle

---

# Security Checklist

- [ ] Sensitive data (API keys, user-specific prompts) redacted from span attributes
- [ ] PII stripping applied to prompt and completion text before sending to OTel backend
- [ ] Span attribute filtering configured at the SDK or collector level

---

# Reliability Checklist

- [ ] LLM span creation wrapped in try/catch so tracing failures do not break API calls
- [ ] Graceful degradation when OTel exporter is unreachable during LLM tracing
- [ ] Timeout configured for span export to prevent cascading latency

---

# Testing Checklist

- [ ] Unit tests verify LLM span attributes match semantic convention schema
- [ ] Integration tests confirm trace context propagates from HTTP request through LLM call
- [ ] Tests cover span creation for multiple LLM providers (OpenAI, Claude)
- [ ] Failure tests confirm tracing errors do not affect application logic

---

# Maintainability Checklist

- [ ] LLM tracing logic extracted into middleware or service layer, not scattered across controllers
- [ ] Semantic convention version tracked and updated as OpenTelemetry LLM spec evolves
- [ ] Documentation covers how to add new LLM providers to the tracing setup

---

# Anti-Pattern Prevention Checklist

- [ ] No span attributes containing full prompt/completion text in high-volume production traces
- [ ] No synchronous span export blocking the HTTP response
- [ ] No LLM spans created outside the OpenTelemetry trace context

---

# Production Readiness Checklist

- [ ] LLM trace volume estimated and budgeted in OTel collector and backend capacity
- [ ] Sampling rules tuned for LLM spans separately from general HTTP spans
- [ ] Dashboards configured to visualize LLM latency and token usage per model/feature
- [ ] Alerts set for abnormal LLM error rates or latency spikes

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related References

- Token Usage & Cost Monitoring (cost tracking and token metrics companion)
- OpenTelemetry PHP SDK (span creation foundation for LLM calls)
- OpenTelemetry Ecosystem (auto-instrumentation may eventually cover LLM clients)
