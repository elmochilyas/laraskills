# Standardized Knowledge: LLM Tracing with OpenTelemetry

## Metadata
| Attribute | Value |
|---|---|
| Domain | Observability & Production Intelligence |
| Subdomain | AI/LLM Observability |
| Knowledge Unit | LLM Tracing with OpenTelemetry |
| Difficulty | Advanced |
| Maturity | Emerging |
| Last Updated | 2026-06-02 |

## Overview
As Laravel applications increasingly integrate with OpenAI, Claude, and other LLM APIs, observability for AI features emerges as a critical subdomain. OpenTelemetry semantic conventions for LLM (stable in 2026) define standard attributes for prompts, completions, token usage, model parameters, and latency. Manual instrumentation using the OTel SDK enables tracing LLM calls within the context of the HTTP request that triggered them, correlated with downstream database queries and cache operations.

## Core Concepts
- **LLM span**: A span representing an LLM API call with semantic conventions: `gen_ai.operation.name`, `gen_ai.request.model`, `gen_ai.request.max_tokens`, `gen_ai.response.usage`
- **Semantic conventions**: Standardized attribute names for LLM observability; defined in OTel Semantic Conventions under `gen_ai` namespace
- **Token counting**: Recording prompt tokens, completion tokens, and total tokens as span attributes
- **Prompt/completion tracing**: Capturing full prompt text and completion output as span events or attributes (with size limits)
- **Provider-agnostic attributes**: Conventions support OpenAI, Anthropic, Google, AWS Bedrock, and other providers via `gen_ai.system` attribute

## When To Use
- Applications integrating with LLM APIs (OpenAI, Anthropic, AWS Bedrock, Google AI)
- Debugging LLM latency, cost attribution, or response quality issues
- Correlating LLM calls with user requests for audit trail and cost chargeback
- Monitoring prompt effectiveness and model version regressions over time

## When NOT To Use
- Applications not using any LLM or AI APIs (no instrumentation needed)
- Simple AI features where token cost is negligible and latency is acceptable
- Teams without capacity to manage OTel infrastructure (consider vendor-specific agents instead)
- When full prompt recording creates compliance risk without adequate redaction

## Best Practices
- Record prompts as span events (not attributes) to avoid bloating span metadata
- Always include `gen_ai.request.model` attribute — without it, regressions cannot be correlated with model upgrades
- Set `max_length` truncation on prompt event recording (2KB recommended) to prevent span bloat
- Use wrapper functions/services for LLM calls to ensure consistent instrumentation across all AI features
- Track token cost per user/tenant by adding `user_id` and `feature` dimensions to span attributes
- Instrument cached LLM responses separately with `gen_ai.cache_hit: true` attribute

## Architecture Guidelines
- Place LLM tracing middleware/ wrapper in a dedicated service class that every AI feature call goes through
- Use the OTel SDK's `$tracer->spanBuilder('llm.chat')` pattern consistently across all model providers
- For streaming completions, use span events to log incremental token arrivals; measure both first-token latency and total completion time
- Configure trace context propagation through async/queued LLM jobs to maintain parent-child span relationship
- Export LLM traces at a higher sampling rate than general traffic (errors and cost-critical calls at 100%)

## Performance Considerations
- LLM tracing adds 5-20ms per trace depending on complexity (number of spans, attributes)
- Token counting via API response parsing is <1ms overhead per call
- Full prompt/response traces are 10-50KB each; sample at 1-10% for cost control
- Span creation overhead is ~1-2us per span in OTel PHP SDK
- Use batch span processor to avoid blocking request thread on export

## Security Considerations
- Never record full prompts in production without redaction — prompts may contain PII, secrets, or proprietary data
- Implement PII redaction on span attributes and events before export
- Never put sensitive data in baggage headers as they propagate everywhere
- Token counting data should not expose user-specific consumption patterns in shared dashboards
- Evaluate data residency requirements when using third-party LLM observability platforms

## Common Mistakes
| Mistake | Cause | Consequence | Better Approach |
|---|---|---|---|
| Not recording model version | Oversight during instrumentation | Cannot correlate regressions with model upgrades | Always set `gen_ai.request.model` |
| Prompts in span attributes instead of events | Unfamiliarity with OTel conventions | Bloating indexed span metadata | Use events for prompt content |
| No token truncation on prompts | Assuming prompt is always small | Oversized payloads with 100K+ token prompts | Set 2KB max truncation |
| Ignoring streaming latency | Measuring only total completion time | Missing first-token latency metric | Measure both first-token and total completion |

## Anti-Patterns
- **Full prompt in span attributes**: Attributes are indexed and searchable; using them for large prompt content creates oversized payloads and increases storage cost. Use span events instead.
- **Same sampling rate for LLM and regular traces**: LLM traces carry cost data and should be sampled at higher rates (or 100%) for accurate cost attribution.
- **No model version in cost metrics**: GPT-4o and GPT-4o-mini have 20x cost difference; attribution to wrong model gives incorrect cost data.

## Examples
```php
$span = $tracer->spanBuilder('llm.chat')->startSpan();
$span->setAttribute('gen_ai.system', 'openai');
$span->setAttribute('gen_ai.request.model', 'gpt-4o');
$span->setAttribute('gen_ai.request.max_tokens', 1024);
$span->setAttribute('gen_ai.request.temperature', 0.7);
$span->setAttribute('gen_ai.response.usage.prompt_tokens', 150);
$span->setAttribute('gen_ai.response.usage.completion_tokens', 45);
$span->setAttribute('gen_ai.response.usage.total_tokens', 195);
$span->addEvent('gen_ai.prompt', ['content' => $prompt]);
$span->addEvent('gen_ai.completion', ['content' => $response]);
$span->end();
```

## Related Topics
- Token Usage & Cost Monitoring (cost tracking companion)
- OpenTelemetry PHP SDK (span creation for LLM calls)
- OTel Semantic Conventions for GenAI

## AI Agent Notes
- OTel Semantic Conventions for GenAI (LLM) reached stability in early 2026
- Community instrumentation packages for OpenAI PHP client are emerging but not yet mature
- The `gen_ai.*` namespace covers: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.request.max_tokens`, `gen_ai.request.temperature`, `gen_ai.response.usage.*`
- LLM observability is the fastest-growing subdomain in OTel as of 2026

## Verification
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
