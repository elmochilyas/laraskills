# Decomposition: LLM Tracing with OpenTelemetry

## Topic Overview
As Laravel applications increasingly integrate with OpenAI, Claude, and other LLM APIs, observability for AI features is emerging as a critical subdomain. OpenTelemetry semantic conventions for LLM (stable in 2026) define standard attributes for prompts, completions, token usage, model parameters, and latency. Manual instrumentation using the OTel SDK enables tracing LLM calls within the context of the HTTP request that triggered them, correlated with downstream database queries and cache ope...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
ai-llm-observability/llm-tracing/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### LLM Tracing with OpenTelemetry
- **Purpose:** As Laravel applications increasingly integrate with OpenAI, Claude, and other LLM APIs, observability for AI features is emerging as a critical subdomain. OpenTelemetry semantic conventions for LLM (stable in 2026) define standard attributes for prompts, completions, token usage, model parameters, and latency. Manual instrumentation using the OTel SDK enables tracing LLM calls within the context of the HTTP request that triggered them, correlated with downstream database queries and cache ope...
- **Difficulty:** Advanced
- **Dependencies:
  - Token Usage & Cost Monitoring (cost tracking companion)
  - OpenTelemetry PHP SDK (span creation for LLM calls)
  - OpenTelemetry Ecosystem (auto-instrumentation may eventually cover LLM clients)

## Dependency Graph
**Depends on:**
  - Token Usage & Cost Monitoring (cost tracking companion)
  - OpenTelemetry PHP SDK (span creation for LLM calls)
  - OpenTelemetry Ecosystem (auto-instrumentation may eventually cover LLM clients)

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - LLM span
  - Semantic conventions
  - Token counting
  - Prompt/completion tracing
  - Provider-agnostic attributes

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization