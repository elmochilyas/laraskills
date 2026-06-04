# Knowledge Unit: LiteLLM Proxy

## Metadata

- **ID:** KU-026 (AI Middleware)
- **Subdomain:** AI Middleware & Gateway Architecture
- **Slug:** litellm-proxy
- **Version:** 1.0.0
- **Maturity:** Stable (LiteLLM v1.x)
- **Status:** Published

## Executive Summary

LiteLLM Proxy is an open-source Python-based AI gateway that sits between applications and LLM providers, providing unified API access, centralized key management, rate limiting, cost tracking, and load balancing across 100+ LLM providers. For Laravel applications, it acts as a single endpoint that eliminates per-provider API key management and enables enterprise governance of AI usage.

## Core Concepts

- **Proxy endpoint**: Single `/chat/completions` endpoint that routes to any provider/model based on request parameters
- **Virtual keys**: Application-specific API keys managed centrally — rotate, revoke, or limit without touching application code
- **Provider routing**: Route requests by model name, provider, or custom rules — enables automatic failover and A/B model testing
- **Rate limiting**: Per-key, per-model, per-user rate limits enforced at the proxy before requests reach LLM providers
- **Cost tracking**: Per-request token counting with dollar cost, stored for billing dashboards and budget alerts
- **Model access groups**: Define which models each virtual key can access — restrict expensive models to specific applications
- **Spend logs**: Immutable audit trail of every request, response, token count, cost, and latency

## Mental Models

- **API Gateway for LLMs**: Just as Kong or Nginx manages HTTP API traffic, LiteLLM manages LLM traffic — authentication, rate limiting, routing, logging in one place.
- **Company Credit Card**: Instead of giving every developer their own OpenAI API key (like individual credit cards), LiteLLM gives virtual keys with predefined limits (like corporate cards with spending caps).
- **Router with Toll Booths**: Every request passes through the proxy where it gets authenticated, checked for limits (toll), routed to the correct highway (provider), and logged for billing.

## Internal Mechanics

LiteLLM Proxy runs as a standalone service (Docker, pip, or cloud). When a Laravel application sends a request:

1. Laravel AI SDK sends HTTP POST to `https://litellm-proxy:4000/chat/completions` with a virtual key in the `Authorization` header
2. Proxy authenticates the virtual key, checks rate limits and budget against the key's configuration
3. Proxy reads `model` parameter (e.g., `gpt-4o` or `claude-sonnet-4-20250514`) and maps it to the actual provider endpoint
4. Request is forwarded with the real provider API key (stored in LiteLLM, never exposed to applications)
5. Response is returned to Laravel with additional metadata headers (`x-litellm-spend`, `x-litellm-total-tokens`)
6. Proxy logs the transaction to the spend log database (PostgreSQL, MongoDB, or custom)

Deployment uses `docker-compose` with LiteLLM Proxy + PostgreSQL for spend logs + Redis for rate limiting.

## Patterns

- **Single-endpoint pattern**: Point `AI_BASE_URL` in Laravel to LiteLLM proxy — zero code changes to switch from direct provider access to proxied access
- **Model aliasing**: Define friendly model names in LiteLLM config that map to real models — swap underlying models without application changes
- **Key rotation pattern**: Rotate real API keys in LiteLLM config without redeploying Laravel — zero downtime key rotation
- **Fallback chain**: Configure LiteLLM to try Provider A, on failure fall back to Provider B, then Provider C — all transparent to Laravel
- **Usage budget pattern**: Set monthly spend limits per virtual key — LiteLLM returns 429 when budget exhausted, Laravel catches and shows degraded experience

```php
// config/ai.php — point to LiteLLM proxy
'default' => [
    'driver' => 'openai',
    'base_url' => env('AI_BASE_URL', 'http://litellm-proxy:4000'),
    'api_key' => env('AI_VIRTUAL_KEY'),
],
```

## Architectural Decisions

- **Decision**: Python-based proxy vs. PHP-native proxy → Python. Reason: LiteLLM leverages the Python AI ecosystem (openai, anthropic SDKs) for provider compatibility; rewriting in PHP would lag behind new providers and features.
- **Decision**: Virtual keys vs. single proxy key → Virtual keys. Reason: Enables per-application cost tracking, rate limiting, and access control without coupling to Laravel's auth system.
- **Decision**: PostgreSQL for spend logs vs. in-memory → PostgreSQL. Reason: Spend data must be durable, queryable for billing, and retained for compliance; in-memory would lose data on restart.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Python proxy overhead | Rich provider ecosystem, rapid updates | Additional infrastructure (Docker, Python runtime) |
| Virtual key management | Centralized control, no .env per app | Key provisioning and rotation workflow needed |
| Proxy latency | Caching, connection pooling reduce per-request overhead | ~5-15ms additional hop for every LLM call |

## Performance Considerations

- LiteLLM adds 5-15ms latency per request in the same network; cross-region adds 50-200ms — deploy LiteLLM in same region as Laravel workers
- Connection pooling to upstream providers is handled by the proxy, reducing TLS handshake overhead for repeated calls
- Rate limiting uses Redis — ensure Redis cluster is sufficiently provisioned for peak throughput
- Spend log writes are asynchronous by default — configure sync logging only for compliance-required audit trails
- Benchmark: LiteLLM handles ~1000 req/s on a 2-CPU instance with PostgreSQL + Redis

## Production Considerations

- Run LiteLLM as a systemd service or Docker container with auto-restart — a proxy outage blocks all AI features
- Use environment-specific LiteLLM instances (dev/staging/prod) with different virtual keys and budgets
- Configure database backups for spend logs — these are critical for billing and compliance
- Set up LiteLLM health check endpoint and monitor in Laravel — failover to direct provider call if proxy is unreachable
- Version control LiteLLM `config.yaml` — track proxy configuration changes alongside Laravel code
- Implement rate limit alerts — when virtual keys approach limits, notify before users hit 429s

## Common Mistakes

- Deploying LiteLLM in a different region than Laravel — adds 100ms+ latency to every AI call
- Using the master API key instead of virtual keys in Laravel — loses all per-application tracking and limiting
- Not configuring request timeouts in LiteLLM — a hanging upstream provider holds proxy connections indefinitely
- Forgetting `proxy_buffering off` for streaming through LiteLLM — SSE streams buffer in Nginx
- Not monitoring LiteLLM disk space — spend logs can grow to GBs per week in production

## Failure Modes

- **Proxy outage**: LiteLLM service crashes — all AI calls fail; implement circuit-breaker that falls back to direct provider call
- **Redis failure**: Rate limiting disabled, requests pass without limits — configure Redis persistence and replica
- **Spend log DB full**: PostgreSQL disk full — LiteLLM returns 500; set log retention and implement archiving
- **Virtual key exhausted**: Key hits budget limit — returns 429; catch in Laravel and show graceful degradation rather than error
- **Upstream provider outage**: LiteLLM forwards correctly, but provider returns errors — implement provider-level fallback in LiteLLM config

## Ecosystem Usage

- **LiteLLM Proxy**: Open-source Python proxy (GitHub: BerriAI/litellm) — 10k+ stars, active development
- **Laravel AI SDK + LiteLLM**: Point `base_url` in `config/ai.php` to LiteLLM endpoint — seamless integration
- **illuma-law/laravel-llm-router**: PHP-side circuit-breaker that pairs with LiteLLM for defense-in-depth
- **Laravel Forge + LiteLLM**: Deploy LiteLLM as a Forge service with Nginx reverse proxy
- **Docker Compose**: Typical stack: LiteLLM + PostgreSQL + Redis + Nginx, deployed alongside Laravel Sail

## Related Knowledge Units

- KU-001: Laravel AI SDK Architecture (how Laravel connects to providers)
- KU-003: LLM Router Circuit Breaker (PHP-side failover complementing LiteLLM)
- KU-004: AI Bridge (alternative gateway approach)
- KU-005: API7 AI Gateway (API7 alternative to LiteLLM)
- KU-002: Multi-Provider Text Generation (what gets routed through the proxy)

## Research Notes

- Source: LiteLLM Proxy Documentation — https://litellm.vercel.app/docs/proxy/quick_start
- Source: LiteLLM GitHub — BerriAI/litellm
- Source: "How AI Gateways Enforce Security and Compliance for LLMs" — API7.ai (Nov 2025)
- The proxy pattern is recommended for production deployments with >5 developers using AI features
- Virtual keys should be rotated quarterly as a security best practice
- LiteLLM supports OpenAI-compatible endpoints, which means any provider with an OpenAI-compatible API (Ollama, vLLM, Groq, etc.) works without special configuration
