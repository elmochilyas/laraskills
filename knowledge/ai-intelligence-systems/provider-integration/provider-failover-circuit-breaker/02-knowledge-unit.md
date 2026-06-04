# Knowledge Unit: Provider Failover & Circuit Breaker

## Metadata

- **ID:** KU-004
- **Subdomain:** LLM Provider Abstraction & Integration
- **Slug:** provider-failover-circuit-breaker
- **Version:** 1.0.0
- **Maturity:** Stable (Laravel AI SDK) / Emerging (llm-router)
- **Status:** Published

## Executive Summary

Provider failover ensures AI availability by switching between providers when the primary is degraded. The Laravel AI SDK supports multi-provider arrays where the SDK tries providers sequentially until one succeeds. For advanced circuit breaker patterns, the `illuma-law/laravel-llm-router` package provides configurable failure thresholds, health checks, and automatic recovery.

## Core Concepts

- **Failover chain**: Ordered list of providers; SDK tries each in sequence until one returns a successful response
- **Circuit breaker**: Monitoring failure counts per provider; after threshold, automatically skip degraded provider for cooldown period
- **Health check**: Periodic probe to verify provider availability
- **Fallback logic**: Degrade to cheaper/faster model when premium provider is unavailable
- **Provider array syntax**: `#[Provider('openai')]` and `#[Model]` accept arrays for failover

## Mental Models

- **Database read replicas**: Like configuring multiple database replicas with automatic failover — AI providers are interchangeable backends
- **Circuit breaker pattern**: Same as Laravel's cache or queue failover — degraded provider is temporarily removed from rotation

## Internal Mechanics

When the Laravel AI SDK receives a provider array:
1. SDK iterates through providers in declared order
2. Each provider attempt wraps in try/catch for connection errors, 5xx, 429, timeout
3. On success, return response immediately
4. On failure, log error and try next provider in chain
5. If all providers fail, throw `ProviderException`

Circuit breaker (llm-router package) adds:
- Failure counter per provider (sliding window)
- Open state: skip provider after threshold failures
- Half-open state: probe after cooldown period
- Closed state: normal operation restored after successful probe

## Patterns

- **Ordered failover**: Primary provider first, cheaper/lower-quality fallback second
- **Cost-aware failover**: `UseCheapestModel` attribute — auto-selects cheapest model across providers
- **Smart failover**: llm-router with circuit breaker prevents cascading failures
- **Graceful degradation**: Failover to a smaller model (e.g., gpt-4o-mini) vs. complete outage

## Architectural Decisions

- **Decision**: Client-side failover vs. gateway-side → SDK provides basic sequential failover; circuit breaker is a community package. Reason: Most teams need simple failover; circuit breaker adds complexity justified only at higher scale.
- **Decision**: Failover at provider level vs. model level → Laravel AI SDK supports both. Provider-level for complete provider outages; model-level for cost/quality tiering.

## Tradeoffs

- **Cost amplification**: Failover to expensive model (e.g., Claude Opus) during primary outage causes budget spike. Mitigation: Use `UseCheapestModel` attribute.
- **Latency impact**: Sequential failover adds RTT for each failed attempt. Mitigation: Circuit breaker pre-vents failing providers from being attempted.
- **Feature inconsistency**: Fallback model may not support tools/structured output. Mitigation: Validate feature matrix across failover chain.

## Performance Considerations

- Failover chain attempts are sequential — each adds provider round-trip time
- Circuit breaker state checks are in-memory (or Redis-backed) — negligible latency
- Health check probes add background HTTP traffic — schedule at 30-60s intervals, not per-request

## Production Considerations

- Define failover chains in `config/ai.php` for observability — not scattered across agent classes
- Set `MaxSteps` lower on failover agents — retry loops compound token costs
- Monitor failover frequency — rising failover rate signals provider degradation
- Implement alerting on failover activations — silent failover masks provider problems
- Test failover paths in staging — don't discover broken fallback during production outage

## Common Mistakes

- Defining failover chains with providers that don't support the same features (e.g., tool calling on all providers)
- No failover at all — single provider dependency leads to complete AI outage
- Failover to costlier model without budget guardrails — unexpected bills during outages
- Circuit breaker with too-aggressive thresholds — unnecessary failovers from transient errors
- Not testing failover paths — broken fallback discovered during real outage

## Failure Modes

- **All providers degraded**: No failover can recover — surface user-friendly error message
- **Circuit breaker false positive**: Transient latency spike triggers open state — tune threshold with historical data
- **Model continuity failure**: Primary model deprecated, fallback model uses different tokenizer — embedding/context mismatch
- **Rate limit cascade**: Primary provider throttles → failover to secondary → secondary also throttles (shared API pattern)

## Ecosystem Usage

- `illuma-law/laravel-llm-router`: v0.1.4, circuit breaker + health checks + configurable thresholds
- OpenRouter: Server-side failover across providers hosting the same model
- LiteLLM proxy: Centralized failover and routing for multiple applications

## Related Knowledge Units

- KU-002: Multi-Provider Text Generation
- KU-003: OpenRouter Multi-Model Gateway
- KU-010: AI Middleware & Gateway Architecture
- KU-030: LLM Router Circuit-Breaker

## Research Notes

- Laravel AI SDK natively supports provider arrays for failover since v0.1.0
- `illuma-law/laravel-llm-router` is emerging (v0.1.4) — only circuit breaker package in PHP ecosystem
- TrueFoundry and Bifrost provide gateway-level failover for non-PHP stacks — patterns applicable to Laravel via LiteLLM proxy
- Cost modeling for multi-provider failover chains is a documented gap in the ecosystem
