# LLM Tracing with OpenTelemetry

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** AI/LLM Observability
- **Knowledge Unit:** LLM Tracing with OpenTelemetry
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

As Laravel applications increasingly integrate with OpenAI, Claude, and other LLM APIs, observability for AI features emerges as a critical subdomain. OpenTelemetry semantic conventions for LLM (stable in 2026) define standard attributes for prompts, completions, token usage, model parameters, and latency. Manual instrumentation using the OTel SDK enables tracing LLM calls within the context of the HTTP request that triggered them, correlated with downstream database queries and cache operations.

---

## Core Concepts

- **LLM span:** A span representing an LLM API call with semantic conventions: `gen_ai.operation.name`, `gen_ai.request.model`, `gen_ai.request.max_tokens`, `gen_ai.response.usage`
- **Semantic conventions:** Standardized attribute names for LLM observability; defined in OTel Semantic Conventions under `gen_ai` namespace
- **Token counting:** Recording prompt tokens, completion tokens, and total tokens as span attributes
- **Prompt/completion tracing:** Capturing full prompt text and completion output as span events or attributes (with size limits)
- **Provider-agnostic attributes:** Conventions support OpenAI, Anthropic, Google, AWS Bedrock, and other providers via `gen_ai.system` attribute

---

## Mental Models

- **Credit Card Receipt Model:** LLM token counts are like credit card receipts — you need to keep them for cost attribution, but you don't need to store the full conversation on every receipt
- **X-Ray for AI Model:** LLM tracing is an X-ray for AI behavior — it shows you the internal structure of each request without modifying the LLM itself
- **Audit Trail Model:** Think of LLM traces as an audit trail for AI decisions — every prompt, every completion, every model choice is recorded for accountability

---

## Internal Mechanics

LLM tracing integrates with the OTel SDK by using the tracer's `spanBuilder` method to create spans for each LLM API call. The span is populated with semantic convention attributes (`gen_ai.*`), prompt/completion content is recorded as span events, and token usage is captured from the API response metadata. The span ends after the API call completes, and it is exported through the standard OTLP pipeline.

---

## Patterns

- **Prompts as Span Events:** Record prompts as span events (not attributes) to avoid bloating span metadata. Benefit: smaller indexed payloads. Tradeoff: events require backend support for event queries.
- **Centralized LLM Wrapper:** Use a single wrapper service for all LLM calls to ensure consistent instrumentation. Benefit: no missed spans, consistent attributes. Tradeoff: all LLM calls must go through the wrapper.
- **Streaming Latency Tracing:** For streaming completions, measure both first-token latency and total completion time. Benefit: identifies network vs model latency. Tradeoff: more complex instrumentation code.

---

## Architectural Decisions

**Record prompts as span events, not attributes.** Attributes are indexed and searchable; using them for large prompt content creates oversized payloads and increases storage cost.

**Always include `gen_ai.request.model` attribute.** Without it, regressions cannot be correlated with model upgrades.

**Set max_length truncation on prompt event recording (2KB recommended).** Prevents span bloat from 100K+ token prompts.

**Export LLM traces at a higher sampling rate than general traffic.** Cost-critical calls at 100% for accurate attribution.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Full prompt tracing enables debugging quality issues | Prompts can be 10-50KB each; storage grows quickly | Sample at 1-10%; truncate to 2KB |
| Provider-agnostic attributes work across all LLMs | Must learn `gen_ai.*` conventions | Industry standard — transferable knowledge |
| Streaming latency measurement identifies bottlenecks | More complex instrumentation | Essential for streaming features |

---

## Performance Considerations

LLM tracing adds 5-20ms per trace depending on complexity (number of spans, attributes). Token counting via API response parsing is <1ms overhead per call. Full prompt/response traces are 10-50KB each; sample at 1-10% for cost control. Span creation overhead is ~1-2us per span in OTel PHP SDK. Use batch span processor to avoid blocking request thread on export.

---

## Production Considerations

Never record full prompts in production without redaction — prompts may contain PII, secrets, or proprietary data. Implement PII redaction on span attributes and events before export. Never put sensitive data in baggage headers as they propagate everywhere. Evaluate data residency requirements when using third-party LLM observability platforms.

---

## Common Mistakes

**No model version recorded** — cannot correlate regressions with model upgrades. Always set `gen_ai.request.model`.

**Prompts in span attributes instead of events** — bloats indexed span metadata.

**No token truncation on prompts** — oversized payloads with 100K+ token prompts.

**Ignoring streaming latency** — measuring only total completion time misses first-token latency.

---

## Failure Modes

**Misdirected cost attribution:** Without model version on spans, GPT-4o and GPT-4o-mini costs are blended. Detection: cost dashboards show unexpected averages. Mitigation: always record model identifier.

**Oversized span payloads:** Full prompts recorded as attributes cause backend storage spikes. Detection: tracing backend storage costs increase. Mitigation: use span events with truncation.

**PII leakage in traces:** Prompts containing PII exported to tracing backend without redaction. Detection: compliance audit. Mitigation: implement redaction before export.

---

## Ecosystem Usage

Laravel applications integrate LLM tracing through the OTel PHP SDK. The tracer creates spans for each LLM call, using semantic conventions from the `gen_ai` namespace. Instrumentation can be manual (wrapper service) or auto-instrumentation (when community packages mature). Traces are exported via OTLP to the Collector, then to backends like Jaeger, Grafana Tempo, or Datadog.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry PHP SDK (span creation for LLM calls)
- OpenTelemetry Ecosystem (auto-instrumentation may eventually cover LLM clients)

### Related Topics
- Token Usage & Cost Monitoring (cost tracking companion)
- OTel Semantic Conventions for GenAI

### Advanced Follow-up Topics
- Agent tracing and decision chain visualization
- RAG quality tracing

---

## Research Notes

OTel Semantic Conventions for GenAI (LLM) reached stability in early 2026. Community instrumentation packages for OpenAI PHP client are emerging but not yet mature. The `gen_ai.*` namespace covers: `gen_ai.system`, `gen_ai.request.model`, `gen_ai.request.max_tokens`, `gen_ai.request.temperature`, `gen_ai.response.usage.*`. LLM observability is the fastest-growing subdomain in OTel as of 2026.
