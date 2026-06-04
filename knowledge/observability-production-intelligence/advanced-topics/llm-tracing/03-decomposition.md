# LLM Tracing — Decomposition

## Metadata
- **Domain:** Observability & Production Intelligence
- **Subdomain:** 09-advanced-topics
- **Knowledge Unit:** llm-tracing
- **Last Updated:** 2026-06-04

---

## Topic Overview

LLM tracing applies distributed tracing concepts to large language model interactions. Each LLM request becomes a trace with spans for prompt preparation, API call, response processing, guardrail checks, and context retrieval (RAG). This enables end-to-end visibility into AI-powered features, covering multi-step agent workflows, RAG pipelines, and guardrail evaluations.

---

## Decomposition Strategy

This KU is atomic — it covers a single well-bounded concept (tracing LLM interactions with OTel spans) with independent decisions, tradeoffs, and architecture guidance. Sub-topics (span types, attribute conventions, sampling strategies, streaming instrumentation) are integral to the single concept and do not warrant separate KUs.

---

## Proposed Folder Structure

```
llm-tracing/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
  05-rules.md
  06-skills.md
  07-decision-trees.md
  08-anti-patterns.md
  09-checklists.md
```

---

## Knowledge Unit Inventory

### LLM Tracing (single unit)
- **Purpose:** Instrumenting LLM interactions with OTel spans for end-to-end visibility into AI features including agent workflows, RAG, and guardrail evaluations
- **Difficulty:** Advanced
- **Dependencies:** OpenTelemetry Distributed Tracing, AI/LLM Observability

---

## Dependency Graph

**Depends on:**
- OpenTelemetry Distributed Tracing (span creation, attributes, export)
- AI/LLM Observability (metrics and logging for LLM features)

**Depended by:**
- Token Usage Monitoring (detailed per-model token tracking)
- Agent tracing and decision chain visualization
- RAG quality tracing

---

## Boundary Analysis

**In scope:**
- LLM span types (API call, RAG, agent, guardrail, prompt template)
- Semantic conventions and attribute naming
- Token count and cost attribution on spans
- Streaming and non-streaming instrumentation patterns
- Sampling strategies for LLM traces

**Out of scope:**
- Token cost calculation and budget management (covered in Token Usage Monitoring)
- Guardrail implementation logic (covered in AI/LLM Observability)
- LLM provider-specific client configuration

---

## Future Expansion Opportunities

- Agent tracing patterns for multi-step LLM workflows
- RAG pipeline tracing with context retrieval spans
- LLM-as-judge evaluation tracing
