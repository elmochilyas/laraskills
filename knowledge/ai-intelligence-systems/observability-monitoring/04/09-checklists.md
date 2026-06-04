# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** observability-monitoring
**Knowledge Unit:** ku-04
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Attribute tokens to categories
- [ ] Log token breakdown per request
- [ ] Monitor context utilization
- [ ] Set token budgets per feature
- [ ] Track prompt and completion tokens separately.
- [ ] Context utilization percentage is monitored per request.
- [ ] Prompt and completion tokens are tracked separately.
- [ ] Token analytics data has a retention policy.
- [ ] Rules for Token Usage & Cost Tracking

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

- [ ] Attribute tokens to categories
- [ ] Log token breakdown per request
- [ ] Monitor context utilization
- [ ] Set token budgets per feature
- [ ] Track prompt and completion tokens separately.
- [ ] Track wasted tokens
- [ ] Rules for Token Usage & Cost Tracking

---

# Performance Checklist

- [ ] Batch token counting for older data: process from logs or database in background jobs.
- [ ] Pre-aggregation queries over millions of requests: use summary tables or materialized views.
- [ ] Storing per-request token data at scale: if each request generates 200 bytes of token metadata, 10M requests/month = 2GB/month. Plan storage accordingly.
- [ ] Token counting in streaming responses: count tokens as chunks arrive (cumulative). Don't wait for the full response.
- [ ] Tokenization adds <0.1ms per 1000 tokens. Negligible for most applications.

---

# Security Checklist

- [ ] Data retention:
- [ ] Granularity control:
- [ ] Manipulated token counts:
- [ ] Token attribution leakage:
- [ ] Token data confidentiality:

---

# Reliability Checklist

- [ ] Ignoring tool schema tokens â€” verbose tool descriptions burn thousands of tokens per request.
- [ ] Not attributing tokens to categories â€” system prompt waste is invisible without category attribution.
- [ ] Not tracking context utilization â€” only noticing context limits when requests start failing.
- [ ] Only tracking total tokens, not the prompt/completion split â€” misses the biggest optimization opportunity (prompt reduction).
- [ ] Using provider-reported token counts exclusively â€” providers may change tokenization algorithms.

---

# Testing Checklist

- [ ] Context utilization percentage is monitored per request.
- [ ] Prompt and completion tokens are tracked separately.
- [ ] Token analytics data has a retention policy.
- [ ] Token budgets are set per feature with growth alerts.
- [ ] Token counting uses a tokenizer library (not just provider-reported counts).
- [ ] Token data is stored for historical trend analysis.
- [ ] Tokens are attributed to categories (system, user, tool, context).

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [[Token Obsession Without Quality Validation](#1-token-obsession-without-quality-validation)]
- [ ] [[Vanity Token Metrics](#2-vanity-token-metrics)]
- [ ] [[Ignoring Provider Tokenization Differences](#3-ignoring-provider-tokenization-differences)]
- [ ] [[Optimizing Without a Baseline](#4-optimizing-without-a-baseline)]
- [ ] [[Per-Request Over-Analysis](#5-per-request-over-analysis)]
- [ ] Ignoring Provider Differences:
- [ ] No Baseline:
- [ ] Per-Request Over-Analysis:
- [ ] Token Obsession:
- [ ] Vanity Token Metrics:

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


