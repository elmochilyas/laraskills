# Skills

## Skill 1: Instrument AI requests with OpenTelemetry spans for distributed tracing

### Purpose
Create dedicated OpenTelemetry spans for every AI API call with GenAI semantic convention attributes, and propagate trace context across process boundaries (web, queue, AI provider) for end-to-end visibility into the full request lifecycle.

### When To Use
- Use when you need to visualize the full AI request lifecycle from user click to LLM response
- Use when debugging latency issues in multi-step agent workflows
- Use when tracing requests across process boundaries (web server → queue worker → AI provider)
- Use when correlating AI behavior with application logs and errors
- Use when building production observability dashboards for AI features

### When NOT To Use
- Do NOT use in development environments where tracing overhead is not desired
- Do NOT use when OTel exporter infrastructure is not available (Grafana, Jaeger, Datadog)
- Do NOT use when only basic request logging is needed — tracing is for detailed debugging
- Do NOT use without semantic convention attributes — generic spans lack AI-specific context

### Prerequisites
- OpenTelemetry PHP SDK installed (`open-telemetry/sdk`)
- OTel exporter configured (OTLP, Zipkin, or vendor-specific)
- Laravel AI SDK or equivalent AI provider integration
- GenAI semantic conventions knowledge (model, provider, token count attributes)
- Distributed tracing backend (Grafana Tempo, Jaeger, Datadog, Honeycomb)

### Inputs
- LLM request parameters (model, provider, max_tokens, prompt size)
- LLM response metadata (token counts, latency, error status)
- W3C Trace Context headers (`traceparent`, `tracestate`)
- User and request context for span attributes

### Workflow
1. Install and configure OpenTelemetry PHP SDK with OTLP exporter
2. Create a dedicated span for every LLM call with GenAI semantic attributes:
   ```php
   $span = $tracer->spanBuilder('llm.chat')
       ->setAttribute('gen_ai.system', 'openai')
       ->setAttribute('gen_ai.request.model', 'gpt-4o')
       ->setAttribute('gen_ai.request.max_tokens', 500)
       ->setAttribute('gen_ai.response.token_count', 142)
       ->startSpan();
   ```
3. Add nested spans for tool calls, agent steps, and middleware processing
4. Propagate trace context across process boundaries:
   - Inject W3C trace context headers into queue jobs
   - Pass `traceparent` header to HTTP calls to AI providers
   - Ensure queue worker continues the same trace
5. Add span events for important milestones:
   - "tool_call.started", "response.received", "middleware.processed"
6. Attach user ID, request ID, and feature name as span attributes
7. Configure auto-instrumentation for HTTP client calls to AI providers
8. Build dashboards in Grafana/Jaeger showing trace waterfall for AI requests

### Validation Checklist
- [ ] Every LLM call has a dedicated span with GenAI semantic attributes
- [ ] Model name, provider, and token counts are set as span attributes
- [ ] Nested spans capture tool calls, agent steps, and middleware
- [ ] Trace context propagates across queue worker boundaries
- [ ] W3C trace context headers are sent to AI provider HTTP calls
- [ ] Span events mark important milestones in the AI request lifecycle
- [ ] User ID and feature name are attached to spans
- [ ] Trace waterfall is visible in the observability backend
- [ ] Auto-instrumentation captures HTTP calls to AI providers

### Common Failures
- **Generic HTTP spans**: LLM call appears as `http.client` with no AI context — always use dedicated AI spans
- **Broken trace chain**: Web request trace ends before queue job — no trace propagation
- **Missing attributes**: Span created but no model/provider/token attributes — useless for debugging
- **Too many spans**: Every micro-operation creates a span — high overhead, noisy traces
- **No error attribution**: Failed LLM calls don't have error details in spans

### Decision Points
- **Span granularity**: Per-LLM-call (standard) vs. per-token (detailed but expensive)
- **Sampling rate**: 100% for low-traffic, 1-10% for high-traffic systems
- **Attribute detail level**: Basic (model, tokens) vs. detailed (+ prompt preview, response preview)
- **Exporter choice**: OTLP (vendor-neutral) vs. vendor-specific (Datadog, Honeycomb)

### Performance Considerations
- Span creation and export adds <1ms per request
- Attribute string values add storage cost — avoid storing full prompt/responses in attributes
- Sampling reduces tracing costs — sample rate depends on traffic volume
- Span export is async — does not block the request
- High-cardinality attributes (user ID) are expensive for some backends

### Security Considerations
- Span attributes may contain sensitive data — avoid including full prompts or responses
- User IDs in spans should be anonymized if privacy regulations require
- Trace data should have access controls matching the application's security model
- PII should not be included in span attributes or events
- Configure attribute truncation for long strings

### Related Rules
- R1: Always create a dedicated span for the LLM call with semantic convention attributes
- R2: Propagate trace context across process boundaries (Laravel → queue worker → AI provider)

### Related Skills
- Define SLOs and implement burn-rate alerting for AI reliability
- Implement server-side cost tracking with attribution
- Set up alerting and anomaly detection for AI systems
- Configure semantic caching for LLM responses

### Success Criteria
- Every LLM call produces a span visible in the tracing backend
- Full trace waterfall shows web request → queue → LLM call → response
- All spans have GenAI semantic attributes (model, provider, token count)
- Trace context propagates correctly across all process boundaries
- Failed LLM calls are easily identifiable with error attributes in spans
- Dashboards provide at-a-glance view of AI request performance
