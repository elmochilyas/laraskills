---
id: KU-041 (Observability)
title: "OpenTelemetry AI Traces - Rules"
subdomain: "observability-monitoring"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for OpenTelemetry AI Traces

### R1: Always create a dedicated span for the LLM call with semantic convention attributes
- **Category:** Observability
- **Rule:** Wrap every LLM API call in an OpenTelemetry span using `llm.request.type` and `llm.response.model` semantic conventions per the OpenTelemetry GenAI semantic conventions spec; never omit span attributes for model, provider, and prompt size.
- **Reason:** Without semantic attributes, tracing data lacks context needed for effective debugging. "Which model was called?" and "what was the prompt length?" are essential for diagnosing latency, cost, and error issues.
- **Bad Example:** A single generic `http.client` span covers the LLM call with no attributes identifying it as an AI call.
- **Good Example:** A span with attributes: `gen_ai.system: "openai"`, `gen_ai.request.model: "gpt-4o"`, `gen_ai.request.max_tokens: 500`, `gen_ai.response.token_count: 142`.
- **Exceptions:** Development environments where tracing overhead is not desired.
- **Consequences of Violation:** Tracings provide no AI-specific context; debugging a slow/costly AI call requires correlating generic HTTP spans with application logs manually.

### R2: Propagate trace context across process boundaries (Laravel → queue worker → AI provider)
- **Category:** Observability
- **Rule:** Use W3C Trace Context headers (`traceparent`, `tracestate`) to propagate the trace ID across all services involved in an AI request (web server, queue worker, AI bridge, WebSocket server); never break the trace chain.
- **Reason:** AI requests often involve multiple processes: web → queue → AI provider. Without trace propagation, each process creates an isolated trace, and you cannot see the full request lifecycle from user click to LLM response.
- **Bad Example:** A trace that shows the web request -> queue job -> no continuation. The LLM call appears as a separate trace with no parent — you can't correlate it to the user's request.
- **Good Example:** The trace ID is injected into the queue job headers; the job's HTTP client sends the trace context to the LLM provider; the full trace shows: web request (120ms) → queue wait (340ms) → LLM call (2100ms) → response (50ms).
- **Exceptions:** Third-party services that don't accept W3C trace headers.
- **Consequences of Violation:** The total end-to-end latency of an AI feature cannot be diagnosed; slow paths cannot be identified and optimized; performance improvements are based on guesses, not data.

### R3: Record prompt and response content in span attributes only for sampled traces, never for all requests
- **Category:** Security
- **Rule:** When recording prompt/response content in span attributes, apply a sampling rate (1% of requests) and strip PII before recording; never record full prompt/response content for every request.
- **Reason:** Full prompt/response recording exposes user data and internal prompts in the tracing backend. A sampling rate provides representative data for debugging without the privacy and storage cost of 100% recording.
- **Bad Example:** OpenTelemetry configured to record `gen_ai.prompt` and `gen_ai.completion` for every request — the tracing backend now contains all user conversations and system prompts.
- **Good Example:** A `SampledSpanProcessor` that applies `TraceIdRatioBasedSampler(0.01)` for content recording; non-sampled traces still capture metadata (token count, latency, model) for every request.
- **Exceptions:** Development/staging environments where full recording is acceptable.
- **Consequences of Violation:** PII and internal prompts stored in tracing backend; privacy compliance violations (GDPR data minimization); storage costs grow linearly with request volume.
