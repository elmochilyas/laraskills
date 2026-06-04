---
id: KU-004
title: "Provider Failover & Circuit Breaker"
subdomain: "llm-provider-abstraction"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/01-provider-integration/provider-failover-circuit-breaker/04-standardized-knowledge.md"
---

# Provider Failover & Circuit Breaker

## Overview

Provider failover ensures AI availability by switching between providers when the primary is degraded. The Laravel AI SDK supports multi-provider arrays where the SDK tries providers sequentially until one succeeds. For advanced circuit breaker patterns, the `illuma-law/laravel-llm-router` package provides configurable failure thresholds, health checks, and automatic recovery.

## Core Concepts

- **Failover chain**: Ordered list of providers; SDK tries each in sequence until one returns a successful response
- **Circuit breaker**: Monitoring failure counts per provider; after threshold, automatically skip degraded provider for cooldown period
- **Health check**: Periodic probe to verify provider availability
- **Fallback logic**: Degrade to cheaper/faster model when premium provider is unavailable
- **Provider array syntax**: `#[Provider('openai')]` and `#[Model]` accept arrays for failover

## When To Use

- Production applications requiring Provider Failover & Circuit Breaker functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Ordered failover**: Primary provider first, cheaper/lower-quality fallback second
- **Cost-aware failover**: `UseCheapestModel` attribute â€” auto-selects cheapest model across providers
- **Smart failover**: llm-router with circuit breaker prevents cascading failures
- **Graceful degradation**: Failover to a smaller model (e.g., gpt-4o-mini) vs. complete outage

- **Database read replicas**: Like configuring multiple database replicas with automatic failover â€” AI providers are interchangeable backends
- **Circuit breaker pattern**: Same as Laravel's cache or queue failover â€” degraded provider is temporarily removed from rotation

## Architecture Guidelines

- **Decision**: Client-side failover vs. gateway-side â†’ SDK provides basic sequential failover; circuit breaker is a community package. Reason: Most teams need simple failover; circuit breaker adds complexity justified only at higher scale.
- **Decision**: Failover at provider level vs. model level â†’ Laravel AI SDK supports both. Provider-level for complete provider outages; model-level for cost/quality tiering.

## Performance Considerations

- Failover chain attempts are sequential â€” each adds provider round-trip time
- Circuit breaker state checks are in-memory (or Redis-backed) â€” negligible latency
- Health check probes add background HTTP traffic â€” schedule at 30-60s intervals, not per-request

- **Cost amplification**: Failover to expensive model (e.g., Claude Opus) during primary outage causes budget spike. Mitigation: Use `UseCheapestModel` attribute.
- **Latency impact**: Sequential failover adds RTT for each failed attempt. Mitigation: Circuit breaker pre-vents failing providers from being attempted.
- **Feature inconsistency**: Fallback model may not support tools/structured output. Mitigation: Validate feature matrix across failover chain.

## Security Considerations

- Define failover chains in `config/ai.php` for observability â€” not scattered across agent classes
- Set `MaxSteps` lower on failover agents â€” retry loops compound token costs
- Monitor failover frequency â€” rising failover rate signals provider degradation
- Implement alerting on failover activations â€” silent failover masks provider problems
- Test failover paths in staging â€” don't discover broken fallback during production outage

## Common Mistakes

- Defining failover chains with providers that don't support the same features (e.g., tool calling on all providers)
- No failover at all â€” single provider dependency leads to complete AI outage
- Failover to costlier model without budget guardrails â€” unexpected bills during outages
- Circuit breaker with too-aggressive thresholds â€” unnecessary failovers from transient errors
- Not testing failover paths â€” broken fallback discovered during real outage

## Anti-Patterns

- **All providers degraded**: No failover can recover â€” surface user-friendly error message
- **Circuit breaker false positive**: Transient latency spike triggers open state â€” tune threshold with historical data
- **Model continuity failure**: Primary model deprecated, fallback model uses different tokenizer â€” embedding/context mismatch
- **Rate limit cascade**: Primary provider throttles â†’ failover to secondary â†’ secondary also throttles (shared API pattern)

## Examples

The following ecosystem packages provide reference implementations:

- `illuma-law/laravel-llm-router`: v0.1.4, circuit breaker + health checks + configurable thresholds
- OpenRouter: Server-side failover across providers hosting the same model
- LiteLLM proxy: Centralized failover and routing for multiple applications

## Related Topics

- KU-002: Multi-Provider Text Generation
- KU-003: OpenRouter Multi-Model Gateway
- KU-010: AI Middleware & Gateway Architecture
- KU-030: LLM Router Circuit-Breaker

## AI Agent Notes

- When asked about Provider Failover & Circuit Breaker, first determine the specific use case and requirements.
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

