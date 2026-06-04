# Knowledge Unit: LLM Router Circuit Breaker

## Metadata

- **ID:** KU-027 (AI Middleware)
- **Subdomain:** AI Middleware & Gateway Architecture
- **Slug:** llm-router-circuit-breaker
- **Version:** 1.0.0
- **Maturity:** Emerging (v0.1.4, illuma-law/laravel-llm-router)
- **Status:** Published

## Executive Summary

The LLM Router Circuit Breaker pattern provides PHP-side failover chains for AI provider calls, automatically detecting provider failures, rate limits, and timeouts before falling back to alternative providers or models. It implements the circuit breaker pattern adapted for LLM-specific failure modes — provider outages, token limits, content moderation blocks — ensuring AI feature availability even when primary providers are degraded.

## Core Concepts

- **Circuit breaker**: Three-state machine (Closed, Open, Half-Open) that tracks provider health. Closed = normal, Open = failing (fast-fail), Half-Open = testing recovery
- **Failover chain**: Ordered list of provider/model pairs tried sequentially on failure (e.g., try OpenAI → fall back to Anthropic → fall back to Groq)
- **Failure detection**: Configurable thresholds — consecutive failures, error rate over time window, latency degradation
- **Provider health score**: Weighted composite of success rate, average latency, and error type (rate-limit vs. 500 vs. timeout)
- **Model cascade**: Switch to cheaper/faster model on repeated failures (e.g., gpt-4o → gpt-4o-mini → claude-haiku)
- **Budgets and cost-aware routing**: Route to cheaper provider when primary exceeds API budget for the period

## Mental Models

- **Data Center Failover**: Like a load balancer that detects a downed server and routes traffic to the backup. The LLM router detects a failing provider and routes to the backup provider.
- **Fuse Box**: When too many failures flow through, the circuit breaker "trips" (opens) and stops all requests to the failing provider, preventing cascade failures and wasted spend.
- **Airline Rebooking**: If your flight is canceled (provider down), the airline automatically rebooks you on the next available flight (fallback model/provider) — the LLM router does the same for AI requests.

## Internal Mechanics

The `illuma-law/laravel-llm-router` package implements:

1. **Router Service**: Central service that wraps `Ai::call()` with failover logic
2. **Circuit Breaker Store**: Backend storage for circuit state (Cache facade, Redis recommended)
3. **Failure Classifier**: Distinguishes between retryable errors (429 rate limit, 503 service unavailable) and non-retryable errors (401 auth, 400 invalid request)
4. **Health Checker**: Periodic async check against provider health endpoints
5. **Fallback Chain**: Iterates through configured provider/model pairs until one succeeds or all are exhausted

```php
$router = app(LlmRouter::class);

$result = $router->call('What is the capital of France?', [
    'failover' => [
        'provider' => 'openai',
        'model' => 'gpt-4o',
        'fallbacks' => [
            ['provider' => 'anthropic', 'model' => 'claude-sonnet-4-20250514'],
            ['provider' => 'groq', 'model' => 'llama-3.3-70b'],
        ],
        'circuit_breaker' => [
            'failure_threshold' => 5,
            'recovery_timeout' => 30, // seconds
        ],
    ],
]);
```

## Patterns

- **Exponential backoff on fallback**: Instead of hammering providers in sequence, add delay between fallback attempts (100ms → 500ms → 2s)
- **Stale response fallback**: When all providers fail, return the last successful cached response for the same/similar query — degrades gracefully
- **Provider health dashboard**: Expose circuit states, health scores, and failover counts via an Artisan command or Filament widget
- **A/B provider testing**: Use the router to send 5% of traffic to a new provider while monitoring quality before full rollout
- **Cost-aware routing**: Prefer `gpt-4o-mini` for simple queries, escalate to `gpt-4o` only when primary route circuit-breaks

## Architectural Decisions

- **Decision**: PHP-side circuit breaker vs. relying on LiteLLM gateway → Both. Reason: Defense-in-depth — LiteLLM handles cross-service routing, PHP-side circuit breaker handles application-specific failover logic that doesn't belong in the gateway (e.g., degrade to cached response).
- **Decision**: Cache-based state storage vs. database → Cache (Redis). Reason: Circuit breaker state changes are high-frequency, low-duration; Redis provides atomic increment, TTL expiry, and sub-millisecond reads.
- **Decision**: Synchronous failover vs. async retry queue → Synchronous for user-facing responses, async for background jobs. Reason: Users won't wait for multiple provider attempts; background jobs can retry with longer timeouts.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Multiple provider fallbacks | High availability despite provider outages | Cost risk: failover to expensive provider |
| Circuit breaker state | Prevents cascading failures, saves tokens | Stale state on cache failure — trips unnecessarily |
| PHP-side routing | Application-aware fallback logic | Duplicates gateway routing if LiteLLM also in use |

## Performance Considerations

- Circuit breaker state check is ~1-10ms (Redis read) — negligible overhead
- Failover chain adds latency proportional to number of attempts — each failed provider call consumes 2-10s
- Cache circuit breaker state aggressively — TTL should match recovery timeout
- Health checks should be async (queued jobs) — synchronous health checks during agent calls add latency
- Use `useSmartestModel()` attribute with fallback — combines model selection with failover

## Production Considerations

- Tune `failure_threshold` per provider — OpenAI's 429 rate limits are transient (retryable), Claude's 529 overloads may require longer cooldown
- Monitor circuit breaker open/close events — unexpected trips signal provider issues or misconfiguration
- Alert when all fallbacks are exhausted — this is a critical incident for AI-dependent features
- Test circuit breaker behavior with chaos engineering — simulate provider failures in staging
- Log every failover event with provider, model, error, and latency — build failover analytics
- Implement degradation endpoints — when circuit is open, return degraded response instead of error

## Common Mistakes

- Setting `failure_threshold` too low — transient rate limits (429) trip the breaker unnecessarily, reducing provider utilization
- Not distinguishing retryable vs. non-retryable errors — invalid request errors (400) should not count toward circuit breaker threshold
- Forgetting cache persistence — if Redis restarts, all circuits reset to closed state, causing a burst of failures
- Using circuit breaker without fallback — if breaker opens and no fallback is configured, requests fail when they could have used an alternative
- Not considering cost implications — failover from `gpt-4o` to `claude-opus` could increase cost 5x without warning

## Failure Modes

- **Cache failure**: Redis goes down, circuit states reset — implement fallback state (closed) or use database-backed store
- **Thundering herd**: All failing requests trip the breaker simultaneously — ensure atomic state transitions (Redis `INCR`/`EXPIRE`)
- **Fallback exhaustion**: All providers in chain fail — implement "last resort" path: cached response, simplified model, or graceful degradation message
- **Infinite failover loop**: Misconfigured chain with circular provider references — validate chain for cycles at router instantiation
- **Split-brain**: Multiple Laravel instances have inconsistent circuit states — Redis ensures shared state, but network partition could split opinions

## Ecosystem Usage

- **illuma-law/laravel-llm-router**: Dedicated LLM router package for Laravel (v0.1.4, emerging) — circuit breaker, failover chains, health checks
- **Laravel AI SDK `#[UseCheapestModel]` / `#[UseSmartestModel]`**: Built-in model selection that pairs with router for cost-aware failover
- **LiteLLM Proxy**: External proxy with failover — use alongside PHP-side router for layered defense
- **OpenRouter**: Multi-model gateway with built-in fallback — simpler alternative but less control over circuit breaker logic

## Related Knowledge Units

- KU-002: LiteLLM Proxy (external gateway with failover)
- KU-004: Provider Failover Circuit Breaker (provider-level failover)
- KU-013: Multi-Provider Text Generation (what the router orchestrates)
- KU-005: API7 AI Gateway (alternative gateway approach)
- KU-022: Token Tracking & Cost Estimation (cost-aware routing decisions)

## Research Notes

- Source: illuma-law/laravel-llm-router on Packagist (v0.1.4)
- Source: Laravel AI SDK documentation — multi-provider arrays for basic failover
- Source: OpenRouter documentation — multi-model endpoint routing
- The circuit breaker pattern is adapted from Michael Nygard's "Release It!" but tuned for LLM-specific failure modes
- OpenAI's 429 errors include a `Retry-After` header — the router should respect this rather than counting it as a failure
- As of mid-2026, this package is still emerging (v0.x) — production use should include thorough testing and potential fallback to the SDK's native multi-provider support
