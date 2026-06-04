# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** rag-retrieval-augmented-generation
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Handle the "no context" case.
- [ ] Include metadata with each document.
- [ ] Instruct the LLM to cite sources.
- [ ] Set a token budget for context.
- [ ] Use the system prompt for RAG instructions.
- [ ] "I don't know" case is handled when retrieved documents are insufficient.
- [ ] Citation post-processing verifies that cited indices exist in the retrieved set.
- [ ] Context token budget is configured and enforced (truncation or compression).
- [ ] Enforce a Context Token Budget
- [ ] Format Retrieved Documents with Clear Delimiters
- [ ] Handle the No-Results Case
- [ ] Instruct the LLM to Use Retrieved Context
- [ ] Order Documents by Relevance
- [ ] Context token budget configured (30-70% of context window)
- [ ] Context truncated when budget exceeded (lowest-relevance documents removed)
- [ ] Documents ordered by relevance score (most relevant first)
- [ ] Documents clearly attributable with structured citation metadata
- [ ] Empty retrieval produces "I don't know" responses (no hallucination)
- [ ] LLM consistently uses retrieved context for answers (measured via citation rate)

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Handle the "no context" case.
- [ ] Include metadata with each document.
- [ ] Instruct the LLM to cite sources.
- [ ] Set a token budget for context.
- [ ] Use the system prompt for RAG instructions.
- [ ] Wrap each document in clear delimiters.
- [ ] Enforce a Context Token Budget
- [ ] Format Retrieved Documents with Clear Delimiters
- [ ] Handle the No-Results Case
- [ ] Instruct the LLM to Use Retrieved Context
- [ ] Order Documents by Relevance
- [ ] Validate Citations Post-Generation

---

# Performance Checklist

- [ ] Citation validation: lightweight regex check (<0.1ms) to verify cited indices exist in the retrieved set.
- [ ] Context compression (summarizing retrieved documents) adds significant latency (500ms+). Use only when context exceeds budget.
- [ ] Context formatting adds <0.1ms â€” negligible.
- [ ] Multi-turn context caching: store retrieved document IDs and skip re-retrieval for identical queries (improves latency by 200-500ms).
- [ ] Token counting for budget enforcement: use the same tokenizer as the LLM model. Cache token counts for repeated context.

---

# Security Checklist

- [ ] Citation validation:
- [ ] Context budget enforcement:
- [ ] Context sanitization:
- [ ] Metadata integrity:
- [ ] Multi-turn context:
- [ ] Apply PII redaction to retrieved content before injection
- [ ] More context = higher per-query cost (LLM pricing per token)
- [ ] Sanitize retrieved documents for prompt injection before formatting

---

# Reliability Checklist

- [ ] Dumping all retrieved documents as raw text without delimiters or structure.
- [ ] Exceeding the context window â€” the model either truncates or errors.
- [ ] Including irrelevant documents in the context â€” distracts the LLM from relevant information.
- [ ] Not handling the case where retrieval returns zero results â€” the model hallucinates instead of saying "I don't know."
- [ ] Not including source metadata â€” the LLM can't cite sources or evaluate authority.
- [ ] Not instructing the LLM to use the context â€” it may rely on its training data instead.
- [ ] Handle the No-Results Case

---

# Testing Checklist

- [ ] "I don't know" case is handled when retrieved documents are insufficient.
- [ ] Citation post-processing verifies that cited indices exist in the retrieved set.
- [ ] Context token budget configured (30-70% of context window)
- [ ] Context token budget is configured and enforced (truncation or compression).
- [ ] Context truncated when budget exceeded (lowest-relevance documents removed)
- [ ] Documents are ordered by relevance (most relevant first).
- [ ] Documents clearly attributable with structured citation metadata
- [ ] Documents ordered by relevance score (most relevant first)
- [ ] Each document wrapped in clear delimiters with source metadata
- [ ] Empty retrieval case handled with "I don't know" response

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No RAG Evaluation â€” Quality Unknown]
- [ ] [Evaluating Only Retrieval (Recall@K), Not Generation (Answer Correctness)]
- [ ] [Manual Evaluation on a Few Examples â€” Not Representative]
- [ ] [No Regression Testing â€” RAG Changes Break Previously Working Queries]
- [ ] [Not Evaluating with Real User Queries]
- [ ] Citation Overload:
- [ ] Context Dump:
- [ ] Ignoring Context Order:
- [ ] No Context Budget:
- [ ] Repeated Context:

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


