# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** prompt-engineering
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Iterate with A/B testing.
- [ ] Measure before optimizing.
- [ ] Prefer removal over compression.
- [ ] Set token budgets per section.
- [ ] Test quality after every optimization.
- [ ] A/B testing capability exists for comparing optimized vs. original prompts.
- [ ] Optimization targets the highest-volume or longest prompts (measured first).
- [ ] Prompt optimization is revisited periodically (models and use cases evolve).
- [ ] Rules for Context Window Management
- [ ] A/B testing capability exists for comparing optimized vs. original prompts
- [ ] Optimization targets the highest-volume or longest prompts (measured first)
- [ ] Prompt optimization is revisited periodically
- [ ] **A/B test optimized prompt**: Run optimized prompt against baseline on a held-out test set. Measure quality metrics (format compliance, relevance, accuracy). Only deploy if quality is maintained or improved.
- [ ] **Compress RAG context**: For long RAG context (>2000 tokens), use extractive or abstractive compression. Extract key sentences (keep entities, numbers, facts). Use a smaller/cheaper model for compression.
- [ ] **Compress the system prompt**: Keep only essential persona, constraints, safety, and format instructions. Move rarely-used instructions to a separate "extended" prompt that's only included when needed.
- [ ] A/B testing validates optimized prompt maintains or improves quality
- [ ] Context utilization is logged and alerted (>80% triggers warning)
- [ ] Optimization ROI positive (savings > optimization effort cost) at 3-month horizon

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

- [ ] Iterate with A/B testing.
- [ ] Measure before optimizing.
- [ ] Prefer removal over compression.
- [ ] Set token budgets per section.
- [ ] Test quality after every optimization.
- [ ] Use prompt compression selectively.
- [ ] **A/B test optimized prompt**: Run optimized prompt against baseline on a held-out test set. Measure quality metrics (format compliance, relevance, accuracy). Only deploy if quality is maintained or improved.
- [ ] **Compress RAG context**: For long RAG context (>2000 tokens), use extractive or abstractive compression. Extract key sentences (keep entities, numbers, facts). Use a smaller/cheaper model for compression.
- [ ] **Compress the system prompt**: Keep only essential persona, constraints, safety, and format instructions. Move rarely-used instructions to a separate "extended" prompt that's only included when needed.
- [ ] **Implement sliding window for conversation history**: For multi-turn conversations, summarize older turns into a condensed representation after every 10 turns. Keep recent 2-3 turns verbatim.
- [ ] **Measure current state**: Track prompt token counts per feature. Identify the highest-volume and longest prompts. Record current quality metrics as a baseline.
- [ ] **Monitor and iterate**: Track prompt token count per version. Set alerts for token count growth. Periodically review (quarterly) and re-optimize as models and use cases evolve.

---

# Performance Checklist

- [ ] Few-shot optimization: reducing from 5 examples to 2 saves ~500 tokens per request.
- [ ] Prompt compression with an LLM adds 100-500ms latency. Only compress when the savings exceed the cost.
- [ ] System prompt optimization: saving 100 tokens on a high-volume feature (1M requests/month) saves significant cost at scale.
- [ ] Token counting must be fast (<0.1ms). Use a cached tokenizer.
- [ ] Truncation is faster than compression (O(1) vs. O(n) for LLM compression). Prefer truncation for time-sensitive paths.
- [ ] Anonymize test sets used for A/B optimization evaluation (may contain sensitive data)
- [ ] Context utilization monitoring: <0.1ms overhead per request
- [ ] Few-shot reduction: saving 300 tokens at 1M requests/month saves significant cost at scale

---

# Security Checklist

- [ ] A/B testing data:
- [ ] Compression of safety instructions:
- [ ] Context truncation:
- [ ] Optimization model security:
- [ ] Optimization rollback:
- [ ] Few-shot reduction: saving 300 tokens at 1M requests/month saves significant cost at scale
- [ ] If using an LLM for compression, ensure it runs in a secure environment (no data leakage)
- [ ] Token counting: <0.1ms with cached tokenizer

---

# Reliability Checklist

- [ ] Assuming token count is the only optimization metric â€” output quality and latency matter more.
- [ ] Compressing safety-critical instructions â€” the model may become unsafe.
- [ ] Not testing optimized prompts against the original quality baseline.
- [ ] Optimizing prompts that are already efficient â€” focus on the biggest cost drivers first.
- [ ] Over-truncating context â€” the model lacks information to answer correctly.

---

# Testing Checklist

- [ ] A/B testing capability exists for comparing optimized vs. original prompts
- [ ] A/B testing capability exists for comparing optimized vs. original prompts.
- [ ] A/B testing validates optimized prompt maintains or improves quality
- [ ] Context utilization is logged and alerted (>80% triggers warning)
- [ ] Optimization ROI positive (savings > optimization effort cost) at 3-month horizon
- [ ] Optimization targets the highest-volume or longest prompts (measured first)
- [ ] Optimization targets the highest-volume or longest prompts (measured first).
- [ ] Output token limits set per task type (classification: 10, chat: 500, etc.)
- [ ] Prompt optimization is revisited periodically
- [ ] Prompt optimization is revisited periodically (models and use cases evolve).

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Evaluation Dataset â€” Subjective Prompt Assessment]
- [ ] [Evaluating Only on Happy Path]
- [ ] [No Automated Evaluation â€” Manual Review for Every Change]
- [ ] [Evaluation Metrics Not Defined Before Prompt Writing]
- [ ] [No Regression Testing â€” Prompt Change Breaks Previously Working Cases]
- [ ] Compression-for-Compression's-Sake:
- [ ] Ignoring the KV-Cache:
- [ ] Manual Optimization Only:
- [ ] Quality Slippage:
- [ ] Single-Pass Optimization:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Context utilization monitoring: <0.1ms overhead per request
- [ ] Optimized prompts must be versioned for immediate rollback if quality regresses
- [ ] Truncated context may cause hallucinations if critical information is removed â€” log truncation events

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


