# Skill: Implement LLM Tracing for Laravel AI Applications
## Purpose
Implement distributed tracing for LLM calls in Laravel applications — capturing prompt/response metadata, token usage, latency, and model parameters — for debugging AI features and optimizing LLM workflows.
## When To Use
- Laravel applications making LLM API calls (GPT, Claude, Gemini)
- Debugging why an AI feature is slow or returning poor results
- Monitoring LLM behavior across prompts, models, and parameters
## When NOT To Use
- Applications not using AI/LLM APIs
- Simple LLM integration where basic logging suffices
## Prerequisites
- OpenTelemetry SDK or equivalent tracer installed
- LLM API integration package (openai, anthropic, or custom HTTP client)
- Tracing backend (Jaeger, Tempo, Zipkin)
## Inputs
- LLM API request parameters (model, temperature, max_tokens, messages/prompt)
- LLM API response (completion, token usage, finish_reason)
- User/request context for trace attribution
## Workflow
1. Create LLM call span per API request: span name `llm.call`, attributes set: `llm.model`, `llm.temperature`, `llm.max_tokens`, `llm.finish_reason`
2. Add context span for prompt construction: `llm.prepare_prompt` — duration of prompt assembly, number of messages
3. Record token counts as span attributes: `llm.prompt_tokens`, `llm.completion_tokens`, `llm.total_tokens`
4. Set span status based on API response: OK on success; ERROR on failure with error code attribute
5. Add metadata as span events: LLM request start, first token received (TTFP), response complete
6. Correlate LLM spans with user session: add `user.id`, `session.id`, `feature.name` attributes
7. Handle streaming LLM calls: create child spans per chunk or stream event
8. Create trace dashboard: slowest LLM calls, model usage distribution, error rate by model
9. Set up alerts: LLM p99 latency > 10s, error rate > 5%, token usage spike
## Validation Checklist
- [ ] LLM call spans created with model, temperature, max_tokens attributes
- [ ] Prompt construction span captured (duration, message count)
- [ ] Token counts recorded as span attributes
- [ ] Span status reflects API success/error
- [ ] Span events for request start, first token, response complete
- [ ] User session attributes correlated with LLM spans
- [ ] Streaming LLM spans handled (events per chunk)
- [ ] Dashboard: slowest LLM calls, model usage, error rate
- [ ] Alerts configured: latency, error rate, token usage spike
- [ ] Traces visible in tracing backend (Jaeger/Tempo)
## Common Failures
- **Tracing the wrong layer:** Tracing HTTP client call but not parsing LLM-specific attributes from response.
- **Missing prompt truncation:** Large prompts captured as span attributes overflow attribute limits. Truncate to 4096 chars.
- **No streaming span handling:** Streaming calls show as single long span without intermediate events.
- **Missing error details:** LLM API errors not captured in span status or events.
- **Token cost not tracked:** Token counts captured but cost calculation not added (must multiply by model rate).
## Decision Points
- **Full prompt tracing vs metadata only:** Full prompt for debugging quality; metadata only for performance/cost monitoring.
- **Per-call vs streaming spans:** Per-call span for simplicity; streaming events for detailed latency analysis (TTFP).
- **Attributes vs span events:** Attributes for queryable fields (model, tokens); events for temporal data (start, first token, complete).
## Performance Considerations
- Capturing full prompts as attributes increases span size 10x+ — truncate to 4096 chars
- Streaming spans generate more events — use lower sampling for high-volume LLM apps
- Span attribute limits: most backends support 2048-4096 chars per attribute
## Security Considerations
- LLM prompts may contain PII — truncate or redact before storing in span attributes
- Don't record full user messages if they contain sensitive data
- LLM responses should be truncated (first 500 chars) in span attributes
- Token usage metrics should aggregate but not expose individual user behavior
## Related Skills
- Token Usage Monitoring (advanced-topics)
- OpenTelemetry PHP SDK (distributed-tracing)
- Span Sampling Strategies (distributed-tracing)
- Grafana Dashboard Design (dashboards)
## Success Criteria
- LLM calls traced with model, token counts, latency, and error status
- Slowest LLM calls identifiable in tracing UI (Jaeger/Tempo)
- Streaming LLM calls show TTFP and per-chunk events
- Alerts configured for latency and error rate thresholds
- LLM traces correlated with user session and feature context
