---
id: KU-029 (AI Middleware)
title: "API7 AI Gateway"
subdomain: "ai-middleware-gateways"
ku-type: "implementation"
date-created: "2026-06-02"
domain-maturity: "stable"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/09-ai-middleware-gateways/api7-ai-gateway/04-standardized-knowledge.md"
---

# API7 AI Gateway

## Overview

API7 AI Gateway is an enterprise-grade API gateway built on Apache APISIX that provides AI-specific traffic management, security enforcement, and observability for LLM API calls. It operates as a reverse proxy between Laravel applications and AI providers, offering semantic caching, prompt/response inspection, multi-tenant rate limiting, and AI-specific plugin architecture â€” designed for organizations that need compliance, governance, and security at the network layer rather than the application layer.

## Core Concepts

- **AI plugin architecture**: Specialized APISIX plugins for LLM traffic â€” prompt inspection, response moderation, token counting, model routing
- **Semantic caching**: Cache LLM responses based on embedding similarity, not exact string match â€” semantically identical prompts return cached results
- **Prompt inspection plugin**: Inspects request body for injection patterns, PII, and policy violations before forwarding to provider
- **Response moderation plugin**: Scans LLM responses against content policies, blocking or flagging prohibited content
- **Consumer-based rate limiting**: Rate limit per API consumer (tenant, application, user) with model-specific quotas
- **Multi-model routing**: Route requests to different providers/models based on consumer tier, request content, or cost budget

## When To Use

- Production applications requiring API7 AI Gateway functionality.
- Teams building AI-powered features within Laravel applications.
- Scenarios where structured AI interactions benefit from this pattern.

## When NOT To Use

- Simple applications that can rely on direct provider calls without abstraction.
- Prototypes or experiments where this KU's overhead isn't justified.
- Use cases that don't require the specific capabilities this KU provides.

## Best Practices

- **Layered inspection**: Combine API7 gateway-level inspection with Laravel middleware-level inspection for defense-in-depth
- **Consumer tier routing**: Map Laravel subscription plans to API7 consumers â€” basic plan routes to cheaper models
- **Semantic cache with invalidation**: Invalidate cached responses when source data changes â€” cache key includes source version hash
- **Audit trail gateway**: Log ALL AI requests/responses at the gateway layer â€” immutable audit for compliance, separate from application logs
- **Canary routing**: Route 5% of traffic to new model/provider via API7, monitor quality metrics before full rollout

- **Security Guard Post**: Like a building security desk that checks IDs (consumer authentication), inspects packages (prompt inspection), and logs visitors (observability), all before allowing entry to the office floor (LLM provider).
- **Library Reference Desk**: The reference librarian (API gateway) checks what you're asking (prompt), checks if the answer is already in the reference collection (semantic cache), and directs you to the right section (model routing) â€” all without you seeing the internal library organization.
- **Customs and Border Protection**: Every request (traveler) passes through customs where luggage is inspected (prompt scanning), identity is verified (API keys), and entry may be denied (content blocking).

## Architecture Guidelines

- **Decision**: Lua-based plugins vs. sidecar container â†’ Lua. Reason: Lua runs in the APISIX/Nginx process, avoiding additional network hops; sidecar would add latency to every AI call.
- **Decision**: Embedding-based semantic cache vs. exact-match cache â†’ Embedding-based. Reason: Exact match is insufficient for LLM prompts â€” users phrase the same question differently; semantic cache captures paraphrases.
- **Decision**: API7 vs. custom Laravel middleware for compliance â†’ Both. Reason: API7 enforces network-layer policy that can't be bypassed by application code; Laravel middleware handles application-specific logic like user context and business rules.

## Performance Considerations

- API7 adds 2-10ms latency per request (same host) â€” negligible compared to LLM generation time
- Semantic cache lookup: ~50ms (embedding + vector search) â€” configure cache TTL aggressively for high-hit-rate patterns
- Prompt inspection via regex is ~1ms; inspection via LLM-based classifier is 500ms+ â€” use regex for fast-path blocking
- APISIX handles 10k+ req/s on commodity hardware â€” AI gateway rarely becomes the bottleneck
- Stream responses pass through the gateway without buffering â€” configure `proxy_buffering off` for SSE

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Lua plugin ecosystem | High performance, native APISIX integration | Developer availability: Lua expertise is rare |
| Semantic cache | Dramatic cost savings on repetitive queries | Cache misses look similar to hits â€” monitoring complexity |
| Network-layer enforcement | Bypass-proof, centralized governance | Adds network hop; must deploy per-region for latency |

## Security Considerations

- Deploy API7 per region alongside Laravel workers to minimize cross-region latency
- Configure semantic cache storage (Redis with vector search module, or standalone vector DB)
- Monitor AI plugin error rates separately from gateway error rates â€” plugin bugs crash the gateway
- Version control gateway configuration (APISIX Admin API or declarative YAML files)
- Implement gateway health checks that test end-to-end AI route (send known prompt, verify response)
- Plan for gateway upgrade â€” APISIX rolling upgrades should not drop active AI connections
- Set up cost dashboards on API7's token counting data for cross-team chargeback

## Common Mistakes

- Using API7 semantic cache without invalidation strategy â€” stale responses served indefinitely after source data changes
- Not configuring consumer timeouts per model â€” complex models may need 60s+ timeouts; default 30s causes frequent errors
- Bypassing API7 in development but expecting identical behavior in production â€” API7 plugins modify requests in ways that can't be replicated locally
- Over-reliance on gateway prompt inspection without Laravel-side middleware â€” gateway sees raw prompts, but application context (user roles, session data) is invisible at the gateway
- Forgetting to configure WebSocket/SSE streaming through the gateway â€” streaming requires specific APISIX configuration (chunked transfer encoding, buffering disabled)

## Anti-Patterns

- **Plugin crash**: Bug in AI plugin crashes the gateway worker â€” APISIX automatically respawns but drops in-flight requests; test plugins thoroughly in staging
- **Semantic cache poisoning**: Malicious prompt with high semantic similarity to a cached benign response â€” implement cache key salting with consumer ID
- **Rate limit misconfiguration**: Consumer-level rate limit too low â€” blocks legitimate users; implement rate limit alerts and burst allowances
- **Gateway configuration drift**: Admin API changes not reflected in version control â€” implement GitOps with APISIX declarative config
- **Provider credential leak**: Gateway logs provider API keys in error logs â€” configure log scrubbing for auth headers

## Examples

The following ecosystem packages provide reference implementations:

- **API7.ai**: Enterprise AI Gateway (Apache APISIX-based) â€” AI plugins for prompt inspection, semantic cache, model routing, token counting
- **Apache APISIX**: Open-source dynamic API gateway (CNCF incubating project) â€” foundation for API7
- **Laravel + API7**: Laravel application sends AI requests to API7 endpoint instead of directly to providers; API7 enforces policy and routes to providers
- **Alternative**: LiteLLM Proxy (similar role, Python-based, more LLM-focused, less gateway/security-focused)
- **Alternative**: Azure OpenAI Gateway (Microsoft-managed, Azure-specific)

## Related Topics

- KU-002: LiteLLM Proxy (comparison: API7 vs LiteLLM)
- KU-001: Agent Middleware Pipeline (application-layer complement to API7)
- KU-026: Prompt Injection Defense (prompt inspection at gateway level)
- KU-004: AI Bridge (BYOK-focused alternative)
- KU-003: LLM Router Circuit Breaker (application-side routing that pairs with API7 routing)

## AI Agent Notes

- When asked about API7 AI Gateway, first determine the specific use case and requirements.
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

