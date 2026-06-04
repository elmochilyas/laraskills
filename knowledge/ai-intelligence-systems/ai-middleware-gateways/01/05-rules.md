---
id: ku-01
title: "AI Gateway Fundamentals - Rules"
subdomain: "ai-middleware-gateway"
ku-type: "foundation"
date-created: "2026-06-02"
---

## Rules for AI Gateway Fundamentals

### R1: Route by task type, not by model name
- **Category:** Architecture
- **Rule:** Define gateway routing rules based on task type (chat, embedding, summarization, code) and map each task type to model configurations; never hardcode model names in application code.
- **Reason:** Task-based routing abstracts model selection, allowing model swaps without code changes. Hardcoded model names tie the application to specific providers and versions.
- **Bad Example:** Application code calling `Ai::chat($prompt, model: 'gpt-4o')` directly in multiple controllers.
- **Good Example:** A gateway config: `'chat' => ['provider' => 'openai', 'model' => 'gpt-4o']` referenced by task key.
- **Exceptions:** Advanced use cases where specific model features are required and abstraction is not beneficial.
- **Consequences of Violation:** Model changes require searching and updating every call site; A/B testing new models requires code changes.

### R2: Always implement provider failover with max retry limit and circuit breaker
- **Category:** Reliability
- **Rule:** Configure a failover chain (primary → secondary → tertiary) with a circuit breaker that opens after N consecutive failures and a maximum retry count before failing permanently.
- **Reason:** Without failover, a single provider outage takes down all AI features. Without circuit breaker, the gateway continuously retries a failing provider, wasting time and money.
- **Bad Example:** Single-provider configuration with no fallback; a provider outage blocks all AI features for hours.
- **Good Example:** Gateway config with primary=`openai/gpt-4o`, failback=`anthropic/claude-sonnet`, circuit breaker at 5 failures/30s cooldown, max 2 retries.
- **Exceptions:** Applications with contractual provider exclusivity.
- **Consequences of Violation:** Complete AI feature downtime during any provider outage; user-facing application appears broken.

### R3: Implement semantic caching with configurable similarity threshold before deploying to production
- **Category:** Cost Management
- **Rule:** Enable semantic caching at the gateway level with a default similarity threshold of 0.95 and a TTL; tune the threshold based on production traffic analysis.
- **Reason:** Semantic caching provides the highest-cost ROI of any optimization — 20-50% cache hit rates are achievable. Without it, every repeated query incurs full LLM cost.
- **Bad Example:** A production gateway with no caching; the same user asking "What is your return policy?" 100 times triggers 100 full LLM calls.
- **Good Example:** Cache middleware with `similarityThreshold: 0.92`, `ttl: 3600`, hit rate monitoring, and automatic cache warming for common queries.
- **Exceptions:** Highly personalized or dynamic queries where semantic similarity is inherently low.
- **Consequences of Violation:** Paying full price and latency for repeated queries that could be served from cache at near-zero cost.
