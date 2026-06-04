# Skill: Instrument LLM Calls with OpenTelemetry Tracing

## Purpose
Add OpenTelemetry spans to LLM API calls (OpenAI, Claude, etc.) to capture prompts, completions, token usage, and latency correlated with the HTTP request that triggered them. This enables debugging, cost attribution, and performance optimization of AI features.

## When To Use
- Adding LLM integration to a Laravel application production
- Debugging slow or expensive LLM calls
- Correlating AI feature usage with user requests

## When NOT To Use
- Applications not using any LLM APIs
- Teams without capacity to manage OTel infrastructure

## Prerequisites
- OpenTelemetry PHP SDK installed and configured
- Span exporter configured (collector, console, or vendor backend)

## Inputs
- LLM service provider (OpenAI, Anthropic, etc.)
- Model name used per call
- Prompt and completion content

## Workflow
1. Create a wrapper service for LLM calls that accepts provider and model parameters
2. Start an OTel span with `gen_ai.operation.name` and `gen_ai.request.model` attributes
3. Record prompt text as a span event (not attribute) with max_length truncation
4. After LLM response, record completion tokens and total tokens as attributes
5. Add `user_id` and `feature` dimensions to span attributes for cost attribution
6. End the span and export

## Validation Checklist
- [ ] Every LLM call creates a span with `gen_ai.operation.name`
- [ ] Prompt recorded as span event (not attribute) with truncation
- [ ] Token usage captured in span attributes
- [ ] Model name recorded in every span

## Common Failures
- Recording prompts as span attributes bloats span metadata — use span events
- Missing model attribute prevents correlating regressions with model upgrades
- No token tracking means no cost attribution possible

## Decision Points
- Span events vs span attributes for prompt content?
- Wrapper service vs middleware-based instrumentation?

## Performance Considerations
- Prompt content can be large — set max_length truncation (2KB recommended)
- Span events should not exceed span size limits

## Security Considerations
- Prompts may contain PII — implement redaction before recording
- Completion output may leak business logic — apply access control

## Related Skills
- Configure OpenTelemetry for Laravel
- Monitor LLM Token Usage and Cost
- Set Up OTel Collector for Production

## Success Criteria
- LLM call latency visible in traces correlated with HTTP requests
- Token usage per model, user, and feature available for cost analysis
- Prompt output searchable for debugging without overflowing span storage
