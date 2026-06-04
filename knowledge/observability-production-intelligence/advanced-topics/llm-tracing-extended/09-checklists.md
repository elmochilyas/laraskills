# LLM Tracing with OpenTelemetry — Checklist

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** AI/LLM Observability
- **Knowledge Unit:** LLM Tracing with OpenTelemetry
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] OpenTelemetry PHP SDK installed via Composer
- [ ] OTel TracerProvider configured and bootstrapped
- [ ] OTLP exporter configured with backend endpoint
- [ ] LLM API integration exists in the application (OpenAI, Anthropic, etc.)

## Implementation Checklist
- [ ] All LLM API calls are wrapped in OTel spans with `gen_ai.*` attributes
- [ ] Prompts are recorded as span events (not attributes) with max_length truncation
- [ ] Model version is recorded on every LLM span
- [ ] Token usage (prompt, completion, total) is captured from API response
- [ ] PII redaction is applied to prompt/response content before export
- [ ] LLM traces are correlated with parent HTTP request via trace context
- [ ] Cost attribution dimensions (user, feature, model) are consistently applied
- [ ] Streaming completions have both first-token and total latency measured
- [ ] Cached responses are marked with `gen_ai.cache_hit: true`
- [ ] Budget alerts are configured based on token consumption per feature

## Verification Checklist
- [ ] Span attributes include `gen_ai.system`, `gen_ai.request.model`, `gen_ai.request.max_tokens`, `gen_ai.request.temperature`
- [ ] Span attributes include `gen_ai.response.usage.prompt_tokens`, `gen_ai.response.usage.completion_tokens`, `gen_ai.response.usage.total_tokens`
- [ ] Span events `gen_ai.prompt` and `gen_ai.completion` exist with truncated content
- [ ] Trace context propagates through async/queued LLM jobs
- [ ] LLM traces are visible in OTel backend (Jaeger, Grafana Tempo, etc.)
- [ ] Sampling rate for LLM calls is higher than general traffic
- [ ] LLM span is nested under HTTP request span

## Security Checklist
- [ ] Full prompts are NEVER recorded in production without redaction
- [ ] PII redaction implemented on span attributes and events before export
- [ ] No sensitive data in baggage headers (propagates everywhere)
- [ ] Token consumption data doesn't expose user-specific patterns in shared dashboards
- [ ] Data residency requirements evaluated for third-party LLM observability platforms
- [ ] `max_length` truncation (2KB) on prompt event recording prevents span bloat
- [ ] No secrets in span attribute values

## Performance Checklist
- [ ] LLM tracing adds <5-20ms per trace
- [ ] Token counting via API response parsing is <1ms overhead per call
- [ ] Full prompt/response traces are sampled at 1-10% for cost control
- [ ] Batch span processor used to avoid blocking request thread on export
- [ ] Span creation overhead (~1-2us per span) is acceptable
- [ ] Prompt truncation prevents oversized span payloads
- [ ] Wrapper functions ensure consistent instrumentation across all AI features

## Production Readiness Checklist
- [ ] Wrapper service class exists that all AI feature calls go through
- [ ] `$tracer->spanBuilder('llm.chat')` pattern consistent across all providers
- [ ] User/tenant cost tracking added via `user_id` and `feature` dimensions
- [ ] Cached LLM responses instrumented separately
- [ ] Sampler configured for different rates (errors and cost-critical calls at 100%)
- [ ] Span events have appropriate content truncation
- [ ] Dashboards show latency, token usage, and cost per model

## Common Mistakes to Avoid
- [ ] Not recording model version — cannot correlate regressions with model upgrades
- [ ] Prompts in span attributes instead of events — bloats indexed metadata
- [ ] No token truncation on prompts — oversized payloads with 100K+ token prompts
- [ ] Ignoring streaming latency — missing first-token latency metric
- [ ] Full prompt in span attributes — creates oversized payloads, increases storage cost
- [ ] Same sampling rate for LLM and regular traces — LLM needs higher rates for cost data
- [ ] No model version in cost metrics — GPT-4o vs GPT-4o-mini have 20x cost difference
