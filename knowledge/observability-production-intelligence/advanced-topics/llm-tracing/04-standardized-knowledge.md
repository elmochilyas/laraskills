# Metadata

**Domain:** observability-production-intelligence
**Subdomain:** 09-advanced-topics
**Knowledge Unit:** llm-tracing
**Difficulty:** Advanced
**Category:** LLM Observability
**Last Updated:** 2026-06-03

# Overview

LLM tracing applies distributed tracing concepts to large language model interactions. Each LLM request becomes a trace with spans for prompt preparation, API call, response processing, guardrail checks, and context retrieval (RAG). This enables end-to-end visibility into AI-powered features.

Traditional tracing (HTTP request → database → response) is insufficient for LLM workflows. LLM interactions involve multiple internal steps (prompt construction, context injection, API call, output parsing, guardrail evaluation) plus potential multi-step agent loops. LLM tracing makes these steps visible and debuggable.

Engineers should care because LLM features introduce new tracing challenges: long durations (5-30s per LLM call), large payloads (prompts can be 10KB+), non-deterministic behavior, and complex branching (agents that decide next actions based on previous responses).

# Core Concepts

**LLM Span:** A span representing a single LLM API call. Attributes include model name, prompt tokens, completion tokens, temperature, and cost. Similar to a database span in traditional tracing.

**RAG Span:** A span for retrieval-augmented generation context retrieval. Shows the retrieval query, context chunks retrieved, and retrieval latency. Essential for debugging "LLM doesn't know about X" issues.

**Agent Span:** A span representing an agent's decision-making step. The agent evaluates the current state, determines the next action (call tool, search, respond), and executes it. Agent loops create nested span trees.

**Guardrail Span:** A span for input or output guardrail evaluation. Shows the rules evaluated, the verdict (pass/fail), and elapsed time. Critical for safety compliance.

**Prompt Template Span:** A span for prompt template rendering. Shows the template used, variables injected, and final rendered prompt. Helps debug prompt injection or formatting issues.

**Token Attribution:** Tracking which tokens (input and output) correspond to which part of the LLM interaction. Useful for cost attribution per feature or per user within a complex agent workflow.

# When To Use

- **Production LLM features** where debugging quality issues requires full interaction visibility
- **Multi-step agent workflows** where understanding the decision chain is essential
- **RAG implementations** where retrieval quality directly impacts response quality

# When NOT To Use

- **Simple one-shot LLM calls** (translation, classification) — prompt/response logging may suffice
- **Early development** where tracing infrastructure is not yet available

# Best Practices

**Create separate span types for each LLM interaction step.** Prompt preparation, context retrieval, API call, guardrail check, and response processing should each be a named span. This granularity enables targeted performance analysis.

**Include token counts as span attributes.** Record prompt_tokens, completion_tokens, and total_tokens on the LLM API call span. This enables cost calculation and token usage dashboards.

**Set appropriate span duration limits.** LLM calls can take 30+ seconds. Configure exporter timeouts accordingly. Do not truncate spans that exceed default duration limits.

**Use span links for context retrieval.** When the LLM uses retrieved context, link the RAG span to the LLM span using SpanLinks. This creates an explicit relationship between context and response.

**Sample LLM traces appropriately.** LLM traces are large (prompts, responses, context) and expensive to store. Sample 100% for low-traffic features, 10% for high-traffic features.

# Architecture Guidelines

LLM tracing in OpenTelemetry:
1. Create a tracer for the LLM feature: `$tracer = $tracerProvider->getTracer('llm.chat')`
2. Start a root span for the LLM interaction
3. Create child spans for each step: `prompt_preparation`, `context_retrieval`, `llm_api_call`, `guardrail_check`, `response_processing`
4. Add relevant attributes (model, tokens, temperature, cost) to each span
5. Set span status based on success/failure
6. End spans in reverse order of creation

Data flow: Laravel app → OTel SDK → OTLP Exporter → Collector → Tracing backend (Jaeger, Tempo, Datadog)

# Performance Considerations

- **Span creation overhead:** Creating spans for each LLM interaction step adds 1-5ms total. Negligible compared to LLM call duration (1-30s)
- **Payload size:** Prompts and responses can be 10KB-100KB. Storing these as span attributes increases storage significantly
- **Exporter blocking:** If the OTLP exporter blocks while sending trace data, it adds latency to the LLM response. Use async export
- **Sampling impact:** At 100% sampling for high-traffic features, storage grows quickly. High-traffic LLM features need aggressive sampling

# Security Considerations

- **Prompt/response in span attributes:** Full prompts and responses stored in tracing backend. Ensure tracing backend has access control
- **PII in context retrieval:** Retrieved context may contain PII. Redact before storing in spans
- **Guardrail bypass detection:** Trace guardrail checks. If guardrail spans are missing, investigate potential bypass
- **API key leakage:** Never include API keys in span attributes. Ensure model configuration attributes exclude secrets

# Common Mistakes

**One giant span.** Creating a single span for the entire LLM interaction. When debugging, operators cannot tell whether slowness is in the API call, context retrieval, or guardrail evaluation.

**No context link.** RAG spans are created but not linked to the LLM span. Operators cannot determine which context was used for which response.

**Sampling only.** Sampling standard HTTP traces at 5% and applying the same to LLM traces. LLM traces are far more valuable for debugging — sample them at 100%.

# Anti-Patterns

**Storing full prompts outside traced context.** LLM interaction details are lost when the span is exported. Store prompts and responses in dedicated storage (database, object store) with trace ID reference.

**Ignoring agent spans.** Agent-based LLM features treated as single spans. The agent's decision chain (why it chose tool X over tool Y) is invisible.

**No guardrail tracing.** Guardrail evaluations are not traced. When a harmful response slips through, there is no trace of the guardrail state.

# Examples

**LLM span creation:**
```php
$span = $tracer->spanBuilder('llm.chat')
    ->setAttribute('gen_ai.request.model', 'gpt-4')
    ->setAttribute('gen_ai.request.temperature', 0.7)
    ->setAttribute('gen_ai.response.token_count', $tokens)
    ->startSpan();
```

# Related Topics

**Prerequisites:**
- OpenTelemetry Distributed Tracing (span creation, attributes, export)

**Closely Related Topics:**
- AI/LLM Observability (metrics and logging for LLM features)
- Token Usage Monitoring (detailed per-model token tracking)

**Advanced Follow-Up Topics:**
- Agent tracing and decision chain visualization
- RAG quality tracing

**Cross-Domain Connections:**
- Data Engineering — RAG pipeline tracing

# AI Agent Notes

- Separate spans for each LLM step: preparation, retrieval, API call, guardrail, processing
- Include token counts and cost as span attributes
- LLM traces are large — sample 100% for low-traffic, 10% for high-traffic
- Store full prompts/responses separately, reference by trace ID
- Guardrail tracing is essential for safety compliance
- Agent decision chains need separate agent spans
- Async export to avoid adding latency to LLM response
