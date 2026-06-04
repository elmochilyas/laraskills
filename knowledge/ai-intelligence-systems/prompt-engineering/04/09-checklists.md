# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Embed the schema in the prompt
- [ ] Provide a markdown template
- [ ] Request the model to output in a code block
- [ ] Specify output constraints explicitly
- [ ] Use example-based formatting
- [ ] Correction loop retries with validation error feedback (capped at 3 iterations).
- [ ] Native structured output is preferred over prompt-based structure when available.
- [ ] Output format failure rate is monitored.
- [ ] Rules for Token Budget Allocation
- [ ] Correction loop retries with validation error feedback (capped at 1 iteration)
- [ ] Native structured output is preferred over prompt-based structure when available
- [ ] Output format failure rate is monitored
- [ ] **Add format rules**: Include explicit format rules: "Return ONLY valid JSON. Do not include any text outside the JSON. Use null for missing fields. For enum fields, use ONLY the allowed values listed."
- [ ] **Check provider structured output support**: If the provider supports native structured output (JSON mode, constrained decoding, tool calling), use that instead of prompt-based structure. Only use prompt-based as fallback.
- [ ] **Embed the schema in the system prompt**: Add the JSON Schema or type definition to the system message (not user message â€” users could override). Include field descriptions, allowed values, and format constraints.
- [ ] >95% of responses are valid machine-parseable JSON matching the schema
- [ ] Format failure alerts trigger when rate exceeds 5% threshold
- [ ] Format failure rate is <5% (prompt-based) or <1% (native structured output)

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering
- [ ] Implement input validation, output sanitization, and PII handling
- [ ] Implement response caching with appropriate TTL and invalidation strategy

---

# Implementation Checklist

- [ ] Embed the schema in the prompt
- [ ] Provide a markdown template
- [ ] Request the model to output in a code block
- [ ] Specify output constraints explicitly
- [ ] Use example-based formatting
- [ ] Validate output server-side
- [ ] **Add format rules**: Include explicit format rules: "Return ONLY valid JSON. Do not include any text outside the JSON. Use null for missing fields. For enum fields, use ONLY the allowed values listed."
- [ ] **Check provider structured output support**: If the provider supports native structured output (JSON mode, constrained decoding, tool calling), use that instead of prompt-based structure. Only use prompt-based as fallback.
- [ ] **Embed the schema in the system prompt**: Add the JSON Schema or type definition to the system message (not user message â€” users could override). Include field descriptions, allowed values, and format constraints.
- [ ] **Fall back on persistent failure**: If retry also fails, log the failure, fall back to a default/empty response, and alert. Don't crash or return unparsed output to the user.
- [ ] **Implement response extraction**: Create a `StructuredResponseExtractor` that handles multiple formats: JSON in code block, raw JSON, JSON embedded in text, and markdown tables. Try formats in order of reliability.
- [ ] **Monitor format failure rate**: Track the percentage of responses that fail validation. Set alerts if the rate exceeds 5%. Investigate and adjust the prompt or model.

---

# Performance Checklist

- [ ] Multi-step extraction (generate â†’ extract) doubles latency and cost. Use single-step where possible.
- [ ] Response extraction (regex for code blocks) adds <0.1ms.
- [ ] Schema in prompt: cache the schema text (it doesn't change per request).
- [ ] Self-correction loops: 1-2 correction iterations typically resolve format issues. Cap at 3 to prevent infinite loops.
- [ ] Structured output prompting adds tokens for the schema definition (100-500 tokens depending on schema complexity).
- [ ] Multi-step extraction doubles latency and cost

---

# Security Checklist

- [ ] Output validation:
- [ ] Prompt-based format override:
- [ ] Schema injection:
- [ ] Schema leakage:
- [ ] Self-correction safety:
- [ ] Correction prompts have the same attack surface as the original â€” validate retry output too
- [ ] Schema in prompt: 100-500 tokens depending on complexity
- [ ] Schema validation: 1-5ms depending on schema complexity

---

# Reliability Checklist

- [ ] Embedding the schema in the user message (which can be overridden) instead of the system message.
- [ ] Not handling the case where the model outputs valid JSON but with wrong field types or values.
- [ ] Not providing examples for complex schemas â€” the model struggles to infer the structure from a schema alone.
- [ ] Requesting JSON without specifying the exact fields â€” the model invents its own structure.
- [ ] Using only prompt-based structure when the provider supports native structured output â€” native is more reliable.

---

# Testing Checklist

- [ ] >95% of responses are valid machine-parseable JSON matching the schema
- [ ] Correction loop retries with validation error feedback (capped at 1 iteration)
- [ ] Correction loop retries with validation error feedback (capped at 3 iterations).
- [ ] Format failure alerts trigger when rate exceeds 5% threshold
- [ ] Format failure rate is <5% (prompt-based) or <1% (native structured output)
- [ ] Native structured output is preferred over prompt-based structure when available
- [ ] Native structured output is preferred over prompt-based structure when available.
- [ ] Native structured output is used when available, with prompt-based fallback
- [ ] Output format failure rate is monitored
- [ ] Output format failure rate is monitored.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date
- [ ] Request the model to output in a code block

---

# Anti-Pattern Prevention Checklist

- [ ] [No Prompt Injection Defense â€” User Can Override Instructions]
- [ ] [Sensitive Data in Prompts â€” PII Sent to Provider]
- [ ] [System Prompt Not Protected from User Discovery]
- [ ] [No Output Validation â€” LLM Generating Arbitrary Content]
- [ ] [Prompt Injection Detection Not Implemented]
- [ ] Format Obsession:
- [ ] No Format Fallback:
- [ ] Over-Specification:
- [ ] Post-Process-Only:
- [ ] Schema in Every Turn:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


