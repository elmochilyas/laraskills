---
id: KU-027 (AI Middleware)
title: "LLM Router Circuit Breaker"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/09-ai-middleware-gateways/llm-router-circuit-breaker/04-standardized-knowledge.md"
---

# LLM Router Circuit Breaker

## Overview

The LLM Router Circuit Breaker pattern provides PHP-side failover chains for AI provider calls, automatically detecting provider failures, rate limits, and timeouts before falling back to alternative providers or models. It implements the circuit breaker pattern adapted for LLM-specific failure modes â€” provider outages, token limits, content moderation blocks â€” ensuring AI feature availability even when primary providers are degraded.

## Core Concepts

- **Circuit breaker**: Three-state machine (Closed, Open, Half-Open) that tracks provider health. Closed = normal, Open = failing (fast-fail), Half-Open = testing recovery
- **Failover chain**: Ordered list of provider/model pairs tried sequentially on failure (e.g., try OpenAI â†’ fall back to Anthropic â†’ fall back to Groq)
- **Failure detection**: Configurable thresholds â€” consecutive failures, error rate over time window, latency degradation
- **Provider health score**: Weighted composite of success rate, average latency, and error type (rate-limit vs. 500 vs. timeout)
- **Model cascade**: Switch to cheaper/faster model on repeated failures (e.g., gpt-4o â†’ gpt-4o-mini â†’ claude-haiku)
- **Budgets and cost-aware routing**: Route to cheaper provider when primary exceeds API budget for the period

## When To Use

- Production applications requiring LLM Router Circuit Breaker functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Exponential backoff on fallback**: Instead of hammering providers in sequence, add delay between fallback attempts (100ms â†’ 500ms â†’ 2s)
- **Stale response fallback**: When all providers fail, return the last successful cached response for the same/similar query â€” degrades gracefully
- **Provider health dashboard**: Expose circuit states, health scores, and failover counts via an Artisan command or Filament widget
- **A/B provider testing**: Use the router to send 5% of traffic to a new provider while monitoring quality before full rollout
- **Cost-aware routing**: Prefer `gpt-4o-mini` for simple queries, escalate to `gpt-4o` only when primary route circuit-breaks

- **Data Center Failover**: Like a load balancer that detects a downed server and routes traffic to the backup. The LLM router detects a failing provider and routes to the backup provider.
- **Fuse Box**: When too many failures flow through, the circuit breaker "trips" (opens) and stops all requests to the failing provider, preventing cascade failures and wasted spend.
- **Airline Rebooking**: If your flight is canceled (provider down), the airline automatically rebooks you on the next available flight (fallback model/provider) â€” the LLM router does the same for AI requests.

## Architecture Guidelines

- **Decision**: PHP-side circuit breaker vs. relying on LiteLLM gateway â†’ Both. Reason: Defense-in-depth â€” LiteLLM handles cross-service routing, PHP-side circuit breaker handles application-specific failover logic that doesn't belong in the gateway (e.g., degrade to cached response).
- **Decision**: Cache-based state storage vs. database â†’ Cache (Redis). Reason: Circuit breaker state changes are high-frequency, low-duration; Redis provides atomic increment, TTL expiry, and sub-millisecond reads.
- **Decision**: Synchronous failover vs. async retry queue â†’ Synchronous for user-facing responses, async for background jobs. Reason: Users won't wait for multiple provider attempts; background jobs can retry with longer timeouts.

## Performance Considerations

- Circuit breaker state check is ~1-10ms (Redis read) â€” negligible overhead
- Failover chain adds latency proportional to number of attempts â€” each failed provider call consumes 2-10s
- Cache circuit breaker state aggressively â€” TTL should match recovery timeout
- Health checks should be async (queued jobs) â€” synchronous health checks during agent calls add latency
- Use `useSmartestModel()` attribute with fallback â€” combines model selection with failover

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Multiple provider fallbacks | High availability despite provider outages | Cost risk: failover to expensive provider |
| Circuit breaker state | Prevents cascading failures, saves tokens | Stale state on cache failure â€” trips unnecessarily |
| PHP-side routing | Application-aware fallback logic | Duplicates gateway routing if LiteLLM also in use |

## Security Considerations

- Tune `failure_threshold` per provider â€” OpenAI's 429 rate limits are transient (retryable), Claude's 529 overloads may require longer cooldown
- Monitor circuit breaker open/close events â€” unexpected trips signal provider issues or misconfiguration
- Alert when all fallbacks are exhausted â€” this is a critical incident for AI-dependent features
- Test circuit breaker behavior with chaos engineering â€” simulate provider failures in staging
- Log every failover event with provider, model, error, and latency â€” build failover analytics
- Implement degradation endpoints â€” when circuit is open, return degraded response instead of error

## Common Mistakes

- Setting `failure_threshold` too low â€” transient rate limits (429) trip the breaker unnecessarily, reducing provider utilization
- Not distinguishing retryable vs. non-retryable errors â€” invalid request errors (400) should not count toward circuit breaker threshold
- Forgetting cache persistence â€” if Redis restarts, all circuits reset to closed state, causing a burst of failures
- Using circuit breaker without fallback â€” if breaker opens and no fallback is configured, requests fail when they could have used an alternative
- Not considering cost implications â€” failover from `gpt-4o` to `claude-opus` could increase cost 5x without warning

## Anti-Patterns

- **Cache failure**: Redis goes down, circuit states reset â€” implement fallback state (closed) or use database-backed store
- **Thundering herd**: All failing requests trip the breaker simultaneously â€” ensure atomic state transitions (Redis `INCR`/`EXPIRE`)
- **Fallback exhaustion**: All providers in chain fail â€” implement "last resort" path: cached response, simplified model, or graceful degradation message
- **Infinite failover loop**: Misconfigured chain with circular provider references â€” validate chain for cycles at router instantiation
- **Split-brain**: Multiple Laravel instances have inconsistent circuit states â€” Redis ensures shared state, but network partition could split opinions

## Examples

The following ecosystem packages provide reference implementations:

- **illuma-law/laravel-llm-router**: Dedicated LLM router package for Laravel (v0.1.4, emerging) â€” circuit breaker, failover chains, health checks
- **Laravel AI SDK `#[UseCheapestModel]` / `#[UseSmartestModel]`**: Built-in model selection that pairs with router for cost-aware failover
- **LiteLLM Proxy**: External proxy with failover â€” use alongside PHP-side router for layered defense
- **OpenRouter**: Multi-model gateway with built-in fallback â€” simpler alternative but less control over circuit breaker logic

## Related Topics

- KU-002: LiteLLM Proxy (external gateway with failover)
- KU-004: Provider Failover Circuit Breaker (provider-level failover)
- KU-013: Multi-Provider Text Generation (what the router orchestrates)
- KU-005: API7 AI Gateway (alternative gateway approach)
- KU-022: Token Tracking & Cost Estimation (cost-aware routing decisions)

## AI Agent Notes

- When asked about LLM Router Circuit Breaker, first determine the specific use case and requirements.
- Reference the core concepts as foundational understanding before diving into implementation.
- Consider the architecture guidelines when designing the solution.
- Review common mistakes and anti-patterns to avoid pitfalls.
- Check related topics for complementary knowledge units.

## Verification

- [ ] Core concepts are understood and applied correctly.
- [ ] Best practices from the patterns section are followed.
- [ ] Architecture guidelines are implemented.
- [ ] Performance implications are accounted for in the design.
- [ ] Security considerations are addressed.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.

