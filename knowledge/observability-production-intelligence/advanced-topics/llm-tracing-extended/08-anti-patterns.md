# ECC Anti-Patterns — LLM Tracing with OpenTelemetry

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Observability & Production Intelligence |
| **Subdomain** | AI/LLM Observability |
| **Knowledge Unit** | LLM Tracing with OpenTelemetry |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Full Prompt in Span Attributes Instead of Events
2. Same Sampling Rate for LLM and General Traffic
3. No Model Version in Cost Metrics
4. Ad-Hoc LLM Instrumentation Without Wrapper Service
5. No PII Redaction on Prompt Recording

---

## Repository-Wide Anti-Patterns

- Hardcoded Configuration
- Duplicate Business Logic

---

## Anti-Pattern 1: Full Prompt in Span Attributes Instead of Events

### Category
Performance

### Description
Recording LLM prompt content as span attributes (indexed, searchable) rather than span events (not indexed), causing oversized payloads, increased storage costs, and degraded trace query performance.

### Warning Signs
- Prompts stored via `setAttribute('gen_ai.prompt', ...)`
- Span size exceeds 10KB+ from prompt text
- Backend storage costs increasing with prompt size
- 100K+ token prompts recorded as attributes

### Why It Is Harmful
Span attributes are indexed and searchable in most backends (Jaeger, Grafana Tempo). Large prompt text as attributes creates oversized indexed payloads, increasing storage cost and degrading query performance. Span events are not indexed and are cheaper to store.

### Real-World Consequences
A chat application with long conversation histories records full prompts as span attributes. Each span is 50KB+. After a week, the tracing backend storage doubles. Querying traces becomes noticeably slower. Monthly storage cost increases by $200.

### Preferred Alternative
Record prompts as span events (`$span->addEvent('gen_ai.prompt', ['content' => $truncatedPrompt])`) with max_length truncation (2KB recommended).

### Refactoring Strategy
1. Replace `setAttribute('gen_ai.prompt', $prompt)` with `addEvent('gen_ai.prompt', ['content' => $truncatedPrompt])`
2. Set truncation: `mb_substr($prompt, 0, 2048)`
3. Verify span size reduced in backend

### Detection Checklist
- [ ] Prompts stored as span attributes
- [ ] Span size > 10KB from prompt content
- [ ] Storage costs increasing with prompt volume

### Related Rules
- (Rule: Always record prompts as span events — not span attributes)

### Related Skills
- (Related: Instrument LLM Calls with OpenTelemetry Tracing)

---

## Anti-Pattern 2: Same Sampling Rate for LLM and General Traffic

### Category
Scalability

### Description
Applying the same low sampling rate (e.g., 10%) to LLM traces as general traffic, losing 90% of cost attribution data and making cost dashboards inaccurate.

### Warning Signs
- LLM traces sampled at same rate as general HTTP traffic
- Cost dashboards show inconsistencies with API billing
- Cannot accurately attribute token costs per feature
- Month-end cost totals don't match provider invoices

### Why It Is Harmful
LLM traces contain token usage data needed for cost attribution. Sampling at 10% means 90% of cost data is lost. Unlike generic traces, LLM traces carry direct business value (cost per user, per feature) and the storage cost is justified by their cost attribution value.

### Real-World Consequences
LLM traces are sampled at 10% alongside general traffic. The monthly cost dashboard shows $500 in LLM costs. The OpenAI invoice shows $4,800. The 10x discrepancy is from undersampling — 90% of cost data was never captured.

### Preferred Alternative
Sample LLM traces at 100% (or near-100%) for accurate cost attribution. Use lower sampling for general traffic.

### Refactoring Strategy
1. Implement head-based or rule-based sampling that differentiates LLM routes
2. Set LLM routes to 100% sampling
3. Keep general traffic at 10% or lower
4. Verify cost dashboards match API provider billing within 5%

### Detection Checklist
- [ ] LLM traces sampled at same rate as general traffic
- [ ] Cost dashboards inaccurate compared to provider invoices
- [ ] No per-feature cost attribution possible

### Related Rules
- (Rule: Sample LLM traces at higher rate than general traffic)

### Related Skills
- (Related: Instrument LLM Calls with OpenTelemetry Tracing — sampling section)

---

## Anti-Pattern 3: No Model Version in Cost Metrics

### Category
Observability

### Description
Recording LLM spans without the `gen_ai.request.model` attribute, making it impossible to correlate performance regressions or cost attribution with specific model versions.

### Warning Signs
- LLM spans missing `gen_ai.request.model` attribute
- Model upgrades performed without observability attribution
- Cannot determine which model version caused a latency regression
- Cost attributed to "unknown model" in dashboards

### Why It Is Harmful
GPT-4o and GPT-4o-mini have a 20x cost difference. Without model version, cost dashboards use blended averages that are inaccurate. A performance regression cannot be attributed to a model upgrade, causing misdiagnosis.

### Real-World Consequences
A team upgrades from GPT-4o-mini to GPT-4o for a chat feature. Latency increases 3x and cost increases 20x. But no model attribute was recorded on spans. The team spends 2 days investigating application code before discovering the model upgrade caused the regression.

### Preferred Alternative
Always set `gen_ai.request.model` attribute with the full model identifier on every LLM span.

### Refactoring Strategy
1. Add `$span->setAttribute('gen_ai.request.model', $modelVersion)` to all LLM spans
2. Standardize model identifiers across providers
3. Use model attribute in cost dashboards for per-model cost breakdown

### Detection Checklist
- [ ] LLM spans missing model attribute
- [ ] Cannot correlate regressions with model upgrades
- [ ] Cost attribution uses default/unknown model

### Related Rules
- (Rule: Always include gen_ai.request.model attribute on every LLM span)

### Related Skills
- (Related: Monitor LLM Token Usage and Cost — model dimension)

---

## Anti-Pattern 4: Ad-Hoc LLM Instrumentation Without Wrapper Service

### Category
Code Organization

### Description
Instrumenting LLM calls directly in controllers or services without a centralized wrapper, creating inconsistent span names, missing attributes, and unrecoverable instrumentation gaps.

### Warning Signs
- LLM instrumentation scattered across controllers
- Different span names for the same LLM operation
- Some LLM calls instrumented, some not
- Inconsistent attribute naming (`model` vs `llm_model` vs `ai_model`)

### Why It Is Harmful
Without a centralized wrapper, each developer instruments LLM calls differently. Some forget attributes, some use different span names, some skip error handling. The result is inconsistent, incomplete traces that cannot be aggregated or compared across features.

### Real-World Consequences
Controller A instruments an OpenAI call with `$span->setAttribute('model', 'gpt-4o')`. Controller B uses `$span->setAttribute('llm_model', 'claude-sonnet')`. The dashboard shows "model=gpt-4o" with 50% of data and "llm_model=claude-sonnet" with the other 50%. Cannot aggregate cost across models.

### Preferred Alternative
Create a centralized `LlmService` wrapper class that all LLM calls go through with consistent instrumentation.

### Refactoring Strategy
1. Create a service class that wraps all LLM API calls
2. Move instrumentation into the wrapper (span creation, attributes, error handling)
3. Refactor all controllers to use the wrapper
4. Verify all LLM calls produce consistent spans

### Detection Checklist
- [ ] LLM instrumentation in multiple controllers
- [ ] Inconsistent span attributes across calls
- [ ] Some LLM calls not instrumented
- [ ] No centralized LLM client class

### Related Rules
- (Rule: Use a wrapper service for all LLM calls to ensure consistent instrumentation)

### Related Skills
- (Related: Instrument LLM Calls with OpenTelemetry Tracing — workflow section)

---

## Anti-Pattern 5: No PII Redaction on Prompt Recording

### Category
Security

### Description
Recording raw LLM prompts and completions as span events without PII redaction, potentially exposing customer personal data, secrets, or proprietary business information in the observability backend.

### Warning Signs
- Raw user messages stored in span events
- No PII redaction filter before span export
- Prompts containing email addresses, names, or credentials visible in traces
- Compliance audit reveals PII in observability backends

### Why It Is Harmful
User prompts often contain PII (names, emails, addresses), proprietary business data, or API keys. Recording these without redaction creates GDPR/CCPA compliance violations and data leaks in the observability system.

### Real-World Consequences
A customer enters their email address and SSN in an AI assistant prompt. The prompt is recorded in full without redaction. A developer viewing traces sees the PII. Compliance audit discovers PII in the tracing backend. GDPR violation reported.

### Preferred Alternative
Implement PII redaction on all LLM prompt and completion content before recording as span events.

### Refactoring Strategy
1. Implement a redaction service that filters PII patterns (email, SSN, phone, API keys)
2. Apply redaction before `$span->addEvent('gen_ai.prompt', ...)`
3. Test with known PII patterns to verify redaction
4. Document redaction policy for AI feature teams

### Detection Checklist
- [ ] No PII redaction on LLM prompt content
- [ ] Raw user messages visible in traces
- [ ] No redaction policy documented

### Related Rules
- (Rule: Never record full prompts in production without PII redaction)
