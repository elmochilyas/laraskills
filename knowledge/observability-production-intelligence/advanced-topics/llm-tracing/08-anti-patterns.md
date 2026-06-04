# Anti-Pattern 1: Monolithic LLM Span

**Name:** One span for the entire LLM interaction

**Problem:** Creating a single span for the complete LLM interaction (prompt building → context retrieval → API call → guardrails → response processing). When the interaction is slow, operators cannot tell which step is the bottleneck. A 10-second total time could be 9.5s LLM API + 0.5s context retrieval, but the single span shows only 10s total.

**Detection:** All LLM traces show one span. Cannot identify which step takes the most time. "Our LLM calls are slow" but no breakdown available.

**Remediation:** Create separate spans for each step: prompt preparation, context retrieval, LLM API call, guardrail check, response processing.

**Prevention:** If an LLM interaction involves multiple steps, each step needs its own span. The root span covers the entire interaction; child spans cover individual steps.

# Anti-Pattern 2: No RAG Context Linking

**Name:** Context retrieval is invisible

**Problem:** RAG context retrieval spans exist but are not linked to the LLM call span they influenced. When debugging a bad response, operators cannot determine which context chunks were used. The context retrieval might have returned irrelevant documents, but there is no trace of which documents were retrieved.

**Detection:** RAG traces show context retrieval happened but cannot identify which response used which context.

**Remediation:** Use SpanLinks to link each RAG retrieval span to the downstream LLM call span. Add retrieved chunk count and relevance scores as RAG span attributes.

**Prevention:** Always link RAG spans to LLM spans when one produces context consumed by the other. Use SpanLinks for explicit cross-span relationships.

# Anti-Pattern 3: LLM Traces Sampled Too Aggressively

**Name:** LLM traces sampled at 1% like HTTP traces

**Problem:** Applying the same sampling rate to LLM traces as standard HTTP traces (1-5%). LLM responses are non-deterministic — the same prompt can produce different responses. When a quality issue is reported, the trace for that specific interaction was sampled out.

**Detection:** Quality issue reported. Trace for the specific interaction does not exist because it was sampled out. Cannot debug without the trace.

**Remediation:** Increase LLM trace sampling rate to 25-100% depending on traffic volume. Adjust storage capacity to accommodate higher sampling.

**Prevention:** LLM trace sampling rate should be 5-10x higher than standard HTTP trace sampling. Non-deterministic responses cannot be replayed.

# Anti-Pattern 4: No Guardrail Tracing

**Name:** Guardrails are invisible in traces

**Problem:** Guardrail checks execute but are not traced. When a harmful response slips through, operators cannot determine whether the guardrail was bypassed, evaluated incorrectly, or not executed at all. Safety compliance requirements are not met.

**Detection:** Post-incident analysis cannot answer "what guardrails were evaluated for this request?" Guardrail evaluation is a black box.

**Remediation:** Create guardrail spans that record rules evaluated, verdict, elapsed time, and triggered rule details. Log all guardrail evaluations with trace ID.

**Prevention:** Guardrail spans are non-optional for LLM features that serve user-facing content. Guardrail tracing is not a nice-to-have — it is a safety and compliance requirement.
