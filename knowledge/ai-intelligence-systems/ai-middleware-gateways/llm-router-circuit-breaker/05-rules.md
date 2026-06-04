---
id: KU-027 (AI Middleware)
title: "LLM Router & Circuit Breaker - Rules"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for LLM Router & Circuit Breaker

### R1: Never route based solely on model name — always consider functional equivalence
- **Category:** Architecture
- **Rule:** Instead of routing to a specific model (e.g., `gpt-4o`), route to a capability profile (e.g., `high-quality-chat`) and let the router resolve it to the cheapest currently-healthy model that satisfies the profile.
- **Reason:** Model-specific routing breaks when the model is deprecated, rate-limited, or replaced by a better/cheaper alternative. Capability-based routing is resilient to provider changes.
- **Bad Example:** Application code calling `Ai::chat(messages: [...], model: 'gpt-4o')`.
- **Good Example:** Application code calling `Ai::chat(messages: [...], capability: 'high-quality-chat')`; the router maps this to the preferred available model.
- **Exceptions:** When a specific model's unique feature (e.g., Claude's 200K context window) is required.
- **Consequences of Violation:** Model deprecation breaks all routing automatically; changing the model requires editing every call site.

### R2: Implement per-model circuit breakers with shared state, not monolithic global breaker
- **Category:** Reliability
- **Rule:** Configure a separate circuit breaker per model deployment (e.g., `gpt-4o-monthly-v1`) with failure thresholds, cooldown, and half-open probe intervals; share state across instances via Redis.
- **Reason:** Different models have different error characteristics. A monolithic breaker for "all OpenAI" trips gpt-4o-mini (working fine) because gpt-4o (overloaded) is failing. Per-model breakers isolate failures.
- **Bad Example:** A single `OpenAiCircuitBreaker` that opens for all OpenAI models when gpt-4o returns 429 errors.
- **Good Example:** `gpt-4o` breaker: 5 failures, 60s timeout. `gpt-4o-mini` breaker: 10 failures, 30s timeout. Separate keys in Redis.
- **Exceptions:** Models with identical failure patterns deployed by the same provider.
- **Consequences of Violation:** Healthy models are taken out of rotation because of an unrelated model's failure; reduced overall throughput during partial outages.

### R3: Implement cost-weighted routing to minimize cost within acceptable quality boundaries
- **Category:** Cost Management
- **Rule:** When multiple models satisfy the same capability profile, route to the cheapest one that is currently healthy and meets the minimum quality threshold (measured by evals); periodically rebalance based on cost data.
- **Reason:** LLM pricing varies by orders of magnitude. Routing to the cheapest adequate model can reduce costs by 50-90% without perceptible quality loss for most tasks.
- **Bad Example:** All chat traffic routed to gpt-4o even when gpt-4o-mini meets the quality bar for the specific use case.
- **Good Example:** A router that sends 80% of chat traffic to gpt-4o-mini, 20% to gpt-4o for quality sampling; cost tracked and routing adjusted weekly.
- **Exceptions:** Tasks that require the highest quality (code generation, complex reasoning) where gpt-4o-mini has measurably lower performance.
- **Consequences of Violation:** AI costs 2-10x higher than necessary; budget consumed on premium models for tasks that don't require their capabilities.
