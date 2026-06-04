# Rule 1: Create Separate Spans for Each LLM Interaction Step

**Condition:** Tracing LLM interactions in production.

**Action:** Create distinct spans for prompt preparation, context retrieval (RAG), LLM API call, guardrail checks, and response processing. Each span has a clear name (`llm.prompt_build`, `llm.rag_retrieval`, `llm.api_call`, `llm.guardrail`) and relevant attributes.

**Consequence:** Granular spans enable targeted performance analysis. When an LLM feature is slow, operators can see whether the bottleneck is the API call, context retrieval, response processing, or guardrail evaluation.

# Rule 2: Include Token Counts as Span Attributes

**Condition:** Creating LLM API call spans.

**Action:** Add `gen_ai.request.token_count` and `gen_ai.response.token_count` attributes to the LLM API call span. Add `gen_ai.response.model` and `gen_ai.response.cost_usd` for cost attribution.

**Consequence:** Token attributes enable cost dashboards and token usage alerts directly from trace data. Without them, cost tracking requires a separate data pipeline.

# Rule 3: Link RAG Spans to LLM Spans

**Condition:** LLM features that retrieve context before generation.

**Action:** Create a RAG span for context retrieval. Use SpanLinks to link the RAG span to the subsequent LLM API call span. Include retrieved chunk count and relevance scores in RAG span attributes.

**Consequence:** Span links create explicit relationships between retrieved context and generated responses. Debugging "LLM doesn't know about X" becomes a trace query: "Show RAG spans for this response."

# Rule 4: Sample LLM Traces at Higher Rate Than Standard Traces

**Condition:** Configuring trace sampling for LLM features.

**Action:** Sample LLM traces at 100% for low-traffic features (<100 RPM). For high-traffic features, sample at 10-25% — significantly higher than standard HTTP traces (1-5%). LLM traces are more valuable for debugging.

**Consequence:** Higher sampling rates for LLM traces provide better coverage for quality debugging. LLM responses are non-deterministic — you cannot replay a failed request and expect the same response.

# Rule 5: Store Full Prompts/Responses Separately

**Condition:** LLM interaction details are too large for span attributes.

**Action:** Store full prompts and responses in dedicated storage (database table, object store). Include trace_id and span_id for correlation. Store only metadata (token count, model, duration) in the span.

**Consequence:** Separating large payloads from spans keeps trace export efficient while maintaining the ability to retrieve full interaction details for debugging.

# Rule 6: Trace Guardrail Evaluations

**Condition:** Implementing LLM input and output guardrails.

**Action:** Create guardrail spans that record the rules evaluated, verdict (pass/fail), elapsed time, and triggered rule details. Set span status to Error if guardrail fails.

**Consequence:** Guardrail tracing provides audit trail for safety compliance. If a harmful response reaches a user, the guardrail traces show which rules were evaluated and why the response was allowed.

# Rule 7: Use Async Export for LLM Traces

**Condition:** Exporting LLM traces from the application.

**Action:** Configure the OTLP exporter to use non-blocking/async export. LLM traces are large (prompts, responses) and export can add latency to the response. Async export eliminates this latency.

**Consequence:** Async export prevents trace export from adding to LLM response time. Without async export, the user waits for both the LLM response and the trace export before the request completes.

# Rule 8: Set Appropriate Span Duration Limits

**Condition:** Collectors and exporters configured with default duration limits.

**Action:** Increase span duration limits to accommodate LLM calls (30-60s). Default limits (1-5s) cause LLM spans to be truncated or dropped. Configure exporter and collector timeouts accordingly.

**Consequence:** Proper duration limits ensure complete LLM spans reach the tracing backend. Without adjustment, long-running LLM calls are invisible in traces.
