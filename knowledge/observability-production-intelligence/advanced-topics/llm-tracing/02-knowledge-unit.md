# LLM Tracing

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 09-advanced-topics
- **Knowledge Unit:** llm-tracing
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

LLM tracing applies distributed tracing concepts to large language model interactions, creating spans for prompt preparation, API call, response processing, guardrail checks, and context retrieval. Traditional tracing (HTTP → database → response) is insufficient for LLM workflows involving long durations, large payloads, non-deterministic behavior, and multi-step agent loops.

---

## Core Concepts

- **LLM Span:** Span representing a single LLM API call — attributes include model name, prompt tokens, completion tokens, temperature, cost
- **RAG Span:** Span for retrieval-augmented generation context retrieval — shows query, context chunks, latency
- **Agent Span:** Span representing an agent's decision-making step — evaluates state, determines next action, executes
- **Guardrail Span:** Span for input/output guardrail evaluation — rules evaluated, verdict (pass/fail), elapsed time
- **Prompt Template Span:** Span for prompt template rendering — template used, variables injected, final rendered prompt
- **Token Attribution:** Tracking which tokens correspond to which part of the LLM interaction for cost attribution

---

## Mental Models

- **Surgical Procedure Model:** LLM tracing is like documenting a surgical procedure — each step (incision, clamp, suture) is a separate span, creating a complete record of the operation
- **Decision Tree Model:** Agent tracing captures the decision tree — each agent step evaluates options and chooses a path. Without tracing, you only see the final result, not the reasoning
- **Breadcrumb Trail Model:** Each LLM interaction step leaves a breadcrumb (span). Together they form a trail from user request to final response, showing every decision and detour

---

## Internal Mechanics

LLM tracing creates a root span for the LLM interaction with child spans for each step: `prompt_preparation`, `context_retrieval`, `llm_api_call`, `guardrail_check`, `response_processing`. Each span carries relevant attributes: model, tokens, temperature, cost. RAG spans link to LLM spans via SpanLinks to show which context was used. Guardrail spans capture rule evaluations. Agent spans capture decision-making. The trace is exported via OTel SDK → OTLP Exporter → Collector → Tracing backend (Jaeger, Tempo, Datadog).

---

## Patterns

- **Granular Step Spans:** Create separate spans for each LLM interaction step — preparation, retrieval, API call, guardrail, processing. Benefit: targeted performance analysis — identify which step is slow. Tradeoff: more spans means more storage.
- **Span Links for Context:** When the LLM uses retrieved context, link the RAG span to the LLM span using SpanLinks. Benefit: explicit relationship between context and response. Tradeoff: additional span complexity.
- **Async Export for Long-Running Spans:** LLM calls can take 30+ seconds — configure exporter timeouts accordingly. Benefit: prevents span data loss. Tradeoff: must test exporter timeout configuration.

---

## Architectural Decisions

**Create separate span types for each LLM interaction step.** Prompt preparation, context retrieval, API call, guardrail check, and response processing should each be a named span. This granularity enables targeted performance analysis.

**Include token counts as span attributes.** Record prompt_tokens, completion_tokens, and total_tokens on the LLM API call span. Enables cost calculation and token usage dashboards.

**Sample LLM traces appropriately.** LLM traces are large (prompts, responses, context) and expensive to store. Sample 100% for low-traffic features, 10% for high-traffic features.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Granular spans identify exact slow step | More spans = more storage and overhead | Acceptable — span creation is ~1-5ms total |
| Token attributes enable cost calculation | Prompts and responses can be large (10-100KB) | Store full data externally; reference by trace ID |
| Guardrail tracing ensures safety compliance | Guardrail spans may reveal sensitive rules | Essential for safety-critical LLM features |

---

## Performance Considerations

Span creation overhead is 1-5ms total — negligible compared to LLM call duration (1-30s). Prompts and responses stored as span attributes increase storage significantly. If the OTLP exporter blocks, it adds latency to the LLM response — use async export. At 100% sampling for high-traffic features, storage grows quickly — use aggressive sampling.

---

## Production Considerations

Full prompts and responses stored in tracing backend — ensure backend has access control. Retrieved context may contain PII — redact before storing in spans. Guardrail bypass detection: if guardrail spans are missing, investigate potential bypass. Never include API keys in span attributes.

---

## Common Mistakes

**One giant span** — creating a single span for the entire LLM interaction. When debugging, operators cannot tell whether slowness is in the API call, context retrieval, or guardrail evaluation.

**No context link** — RAG spans created but not linked to the LLM span. Operators cannot determine which context was used for which response.

**Applying same sampling rate as HTTP traces** — sampling LLM traces at 5% when they are far more valuable for debugging. Sample LLM traces at 100%.

---

## Failure Modes

**Span duration exceeded:** LLM call takes longer than exporter timeout. Detection: span truncated or missing from trace. Mitigation: configure exporter timeout for LLM durations (30s+); use async export.

**Payload too large:** Full prompt/response stored as span attribute exceeds backend limit. Detection: span attribute truncated. Mitigation: store large payloads externally; reference by trace ID.

**Agent loop explosion:** Agent loops indefinitely, creating thousands of spans. Detection: trace has hundreds of agent decision spans. Mitigation: set agent step limits; detect and break loops.

---

## Ecosystem Usage

LLM tracing uses the OpenTelemetry PHP SDK with custom span creation for each LLM interaction step. The `gen_ai` semantic conventions provide standardized attribute names for LLM spans. Guardrail traces integrate with safety monitoring systems. LangChain and similar frameworks provide OTel-compatible instrumentation.

---

## Related Knowledge Units

### Prerequisites
- OpenTelemetry Distributed Tracing (span creation, attributes, export)

### Related Topics
- AI/LLM Observability (metrics and logging for LLM features)
- Token Usage Monitoring (detailed per-model token tracking)

### Advanced Follow-up Topics
- Agent tracing and decision chain visualization
- RAG quality tracing

---

## Research Notes

Separate spans for each LLM step: preparation, retrieval, API call, guardrail, processing. Include token counts and cost as span attributes. LLM traces are large — sample 100% for low-traffic, 10% for high-traffic. Store full prompts/responses separately, reference by trace ID. Guardrail tracing is essential for safety compliance. Agent decision chains need separate agent spans.
