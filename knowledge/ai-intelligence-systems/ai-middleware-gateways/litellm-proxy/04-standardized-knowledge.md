---
id: KU-026 (AI Middleware)
title: "LiteLLM Proxy"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/09-ai-middleware-gateways/litellm-proxy/04-standardized-knowledge.md"
---

# LiteLLM Proxy

## Overview

LiteLLM Proxy is an open-source Python-based AI gateway that sits between applications and LLM providers, providing unified API access, centralized key management, rate limiting, cost tracking, and load balancing across 100+ LLM providers. For Laravel applications, it acts as a single endpoint that eliminates per-provider API key management and enables enterprise governance of AI usage.

## Core Concepts

- **Proxy endpoint**: Single `/chat/completions` endpoint that routes to any provider/model based on request parameters
- **Virtual keys**: Application-specific API keys managed centrally â€” rotate, revoke, or limit without touching application code
- **Provider routing**: Route requests by model name, provider, or custom rules â€” enables automatic failover and A/B model testing
- **Rate limiting**: Per-key, per-model, per-user rate limits enforced at the proxy before requests reach LLM providers
- **Cost tracking**: Per-request token counting with dollar cost, stored for billing dashboards and budget alerts
- **Model access groups**: Define which models each virtual key can access â€” restrict expensive models to specific applications
- **Spend logs**: Immutable audit trail of every request, response, token count, cost, and latency

## When To Use

- Production applications requiring LiteLLM Proxy functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Single-endpoint pattern**: Point `AI_BASE_URL` in Laravel to LiteLLM proxy â€” zero code changes to switch from direct provider access to proxied access
- **Model aliasing**: Define friendly model names in LiteLLM config that map to real models â€” swap underlying models without application changes
- **Key rotation pattern**: Rotate real API keys in LiteLLM config without redeploying Laravel â€” zero downtime key rotation
- **Fallback chain**: Configure LiteLLM to try Provider A, on failure fall back to Provider B, then Provider C â€” all transparent to Laravel
- **Usage budget pattern**: Set monthly spend limits per virtual key â€” LiteLLM returns 429 when budget exhausted, Laravel catches and shows degraded experience

```php
// config/ai.php â€” point to LiteLLM proxy
'default' => [
    'driver' => 'openai',
    'base_url' => env('AI_BASE_URL', 'http://litellm-proxy:4000'),
    'api_key' => env('AI_VIRTUAL_KEY'),
],
```

- **API Gateway for LLMs**: Just as Kong or Nginx manages HTTP API traffic, LiteLLM manages LLM traffic â€” authentication, rate limiting, routing, logging in one place.
- **Company Credit Card**: Instead of giving every developer their own OpenAI API key (like individual credit cards), LiteLLM gives virtual keys with predefined limits (like corporate cards with spending caps).
- **Router with Toll Booths**: Every request passes through the proxy where it gets authenticated, checked for limits (toll), routed to the correct highway (provider), and logged for billing.

## Architecture Guidelines

- **Decision**: Python-based proxy vs. PHP-native proxy â†’ Python. Reason: LiteLLM leverages the Python AI ecosystem (openai, anthropic SDKs) for provider compatibility; rewriting in PHP would lag behind new providers and features.
- **Decision**: Virtual keys vs. single proxy key â†’ Virtual keys. Reason: Enables per-application cost tracking, rate limiting, and access control without coupling to Laravel's auth system.
- **Decision**: PostgreSQL for spend logs vs. in-memory â†’ PostgreSQL. Reason: Spend data must be durable, queryable for billing, and retained for compliance; in-memory would lose data on restart.

## Performance Considerations

- LiteLLM adds 5-15ms latency per request in the same network; cross-region adds 50-200ms â€” deploy LiteLLM in same region as Laravel workers
- Connection pooling to upstream providers is handled by the proxy, reducing TLS handshake overhead for repeated calls
- Rate limiting uses Redis â€” ensure Redis cluster is sufficiently provisioned for peak throughput
- Spend log writes are asynchronous by default â€” configure sync logging only for compliance-required audit trails
- Benchmark: LiteLLM handles ~1000 req/s on a 2-CPU instance with PostgreSQL + Redis

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Python proxy overhead | Rich provider ecosystem, rapid updates | Additional infrastructure (Docker, Python runtime) |
| Virtual key management | Centralized control, no .env per app | Key provisioning and rotation workflow needed |
| Proxy latency | Caching, connection pooling reduce per-request overhead | ~5-15ms additional hop for every LLM call |

## Security Considerations

- Run LiteLLM as a systemd service or Docker container with auto-restart â€” a proxy outage blocks all AI features
- Use environment-specific LiteLLM instances (dev/staging/prod) with different virtual keys and budgets
- Configure database backups for spend logs â€” these are critical for billing and compliance
- Set up LiteLLM health check endpoint and monitor in Laravel â€” failover to direct provider call if proxy is unreachable
- Version control LiteLLM `config.yaml` â€” track proxy configuration changes alongside Laravel code
- Implement rate limit alerts â€” when virtual keys approach limits, notify before users hit 429s

## Common Mistakes

- Deploying LiteLLM in a different region than Laravel â€” adds 100ms+ latency to every AI call
- Using the master API key instead of virtual keys in Laravel â€” loses all per-application tracking and limiting
- Not configuring request timeouts in LiteLLM â€” a hanging upstream provider holds proxy connections indefinitely
- Forgetting `proxy_buffering off` for streaming through LiteLLM â€” SSE streams buffer in Nginx
- Not monitoring LiteLLM disk space â€” spend logs can grow to GBs per week in production

## Anti-Patterns

- **Proxy outage**: LiteLLM service crashes â€” all AI calls fail; implement circuit-breaker that falls back to direct provider call
- **Redis failure**: Rate limiting disabled, requests pass without limits â€” configure Redis persistence and replica
- **Spend log DB full**: PostgreSQL disk full â€” LiteLLM returns 500; set log retention and implement archiving
- **Virtual key exhausted**: Key hits budget limit â€” returns 429; catch in Laravel and show graceful degradation rather than error
- **Upstream provider outage**: LiteLLM forwards correctly, but provider returns errors â€” implement provider-level fallback in LiteLLM config

## Examples

The following ecosystem packages provide reference implementations:

- **LiteLLM Proxy**: Open-source Python proxy (GitHub: BerriAI/litellm) â€” 10k+ stars, active development
- **Laravel AI SDK + LiteLLM**: Point `base_url` in `config/ai.php` to LiteLLM endpoint â€” seamless integration
- **illuma-law/laravel-llm-router**: PHP-side circuit-breaker that pairs with LiteLLM for defense-in-depth
- **Laravel Forge + LiteLLM**: Deploy LiteLLM as a Forge service with Nginx reverse proxy
- **Docker Compose**: Typical stack: LiteLLM + PostgreSQL + Redis + Nginx, deployed alongside Laravel Sail

## Related Topics

- KU-001: Laravel AI SDK Architecture (how Laravel connects to providers)
- KU-003: LLM Router Circuit Breaker (PHP-side failover complementing LiteLLM)
- KU-004: AI Bridge (alternative gateway approach)
- KU-005: API7 AI Gateway (API7 alternative to LiteLLM)
- KU-002: Multi-Provider Text Generation (what gets routed through the proxy)

## AI Agent Notes

- When asked about LiteLLM Proxy, first determine the specific use case and requirements.
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

