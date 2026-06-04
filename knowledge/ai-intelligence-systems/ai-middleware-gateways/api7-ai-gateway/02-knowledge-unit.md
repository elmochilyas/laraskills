# Knowledge Unit: API7 AI Gateway

## Metadata

- **ID:** KU-029 (AI Middleware)
- **Subdomain:** AI Middleware & Gateway Architecture
- **Slug:** api7-ai-gateway
- **Version:** 1.0.0
- **Maturity:** Stable (API7 Enterprise)
- **Status:** Published

## Executive Summary

API7 AI Gateway is an enterprise-grade API gateway built on Apache APISIX that provides AI-specific traffic management, security enforcement, and observability for LLM API calls. It operates as a reverse proxy between Laravel applications and AI providers, offering semantic caching, prompt/response inspection, multi-tenant rate limiting, and AI-specific plugin architecture — designed for organizations that need compliance, governance, and security at the network layer rather than the application layer.

## Core Concepts

- **AI plugin architecture**: Specialized APISIX plugins for LLM traffic — prompt inspection, response moderation, token counting, model routing
- **Semantic caching**: Cache LLM responses based on embedding similarity, not exact string match — semantically identical prompts return cached results
- **Prompt inspection plugin**: Inspects request body for injection patterns, PII, and policy violations before forwarding to provider
- **Response moderation plugin**: Scans LLM responses against content policies, blocking or flagging prohibited content
- **Consumer-based rate limiting**: Rate limit per API consumer (tenant, application, user) with model-specific quotas
- **Multi-model routing**: Route requests to different providers/models based on consumer tier, request content, or cost budget

## Mental Models

- **Security Guard Post**: Like a building security desk that checks IDs (consumer authentication), inspects packages (prompt inspection), and logs visitors (observability), all before allowing entry to the office floor (LLM provider).
- **Library Reference Desk**: The reference librarian (API gateway) checks what you're asking (prompt), checks if the answer is already in the reference collection (semantic cache), and directs you to the right section (model routing) — all without you seeing the internal library organization.
- **Customs and Border Protection**: Every request (traveler) passes through customs where luggage is inspected (prompt scanning), identity is verified (API keys), and entry may be denied (content blocking).

## Internal Mechanics

API7 AI Gateway runs on Apache APISIX, an Nginx-based dynamic gateway. AI-specific plugins are Lua scripts that hook into the request lifecycle:

1. **Authentication phase**: Extract API key from header, resolve consumer identity from APISIX's consumer management
2. **Pre-request phase**: AI prompt inspection plugin scans request body; semantic cache plugin computes embedding and checks for cached responses
3. **Routing phase**: Model routing plugin selects upstream provider based on consumer tier, request attributes, and routing rules
4. **Proxy phase**: Forward request to LLM provider with transformed headers (API key substitution, rate limit headers)
5. **Post-response phase**: Response moderation plugin scans output; token counter plugin records usage; cache plugin stores response embedding

```yaml
# API7 AI Gateway route configuration
routes:
  - uri: /v1/chat/completions
    plugins:
      ai-prompt-inspection:
        rules:
          - pattern: "ignore all previous instructions"
            action: block
          - pattern: "email|ssn|credit_card"
            action: redact
      ai-semantic-cache:
        ttl: 3600
        similarity: 0.95
      ai-model-router:
        default: openai/gpt-4o
        consumers:
          - tier: basic → openai/gpt-4o-mini
          - tier: pro → openai/gpt-4o
      ai-token-counter:
        log_to: kafka
    upstream:
      type: roundrobin
      nodes:
        - host: api.openai.com
```

## Patterns

- **Layered inspection**: Combine API7 gateway-level inspection with Laravel middleware-level inspection for defense-in-depth
- **Consumer tier routing**: Map Laravel subscription plans to API7 consumers — basic plan routes to cheaper models
- **Semantic cache with invalidation**: Invalidate cached responses when source data changes — cache key includes source version hash
- **Audit trail gateway**: Log ALL AI requests/responses at the gateway layer — immutable audit for compliance, separate from application logs
- **Canary routing**: Route 5% of traffic to new model/provider via API7, monitor quality metrics before full rollout

## Architectural Decisions

- **Decision**: Lua-based plugins vs. sidecar container → Lua. Reason: Lua runs in the APISIX/Nginx process, avoiding additional network hops; sidecar would add latency to every AI call.
- **Decision**: Embedding-based semantic cache vs. exact-match cache → Embedding-based. Reason: Exact match is insufficient for LLM prompts — users phrase the same question differently; semantic cache captures paraphrases.
- **Decision**: API7 vs. custom Laravel middleware for compliance → Both. Reason: API7 enforces network-layer policy that can't be bypassed by application code; Laravel middleware handles application-specific logic like user context and business rules.

## Tradeoffs

| Tradeoff | Pro | Con |
|----------|-----|-----|
| Lua plugin ecosystem | High performance, native APISIX integration | Developer availability: Lua expertise is rare |
| Semantic cache | Dramatic cost savings on repetitive queries | Cache misses look similar to hits — monitoring complexity |
| Network-layer enforcement | Bypass-proof, centralized governance | Adds network hop; must deploy per-region for latency |

## Performance Considerations

- API7 adds 2-10ms latency per request (same host) — negligible compared to LLM generation time
- Semantic cache lookup: ~50ms (embedding + vector search) — configure cache TTL aggressively for high-hit-rate patterns
- Prompt inspection via regex is ~1ms; inspection via LLM-based classifier is 500ms+ — use regex for fast-path blocking
- APISIX handles 10k+ req/s on commodity hardware — AI gateway rarely becomes the bottleneck
- Stream responses pass through the gateway without buffering — configure `proxy_buffering off` for SSE

## Production Considerations

- Deploy API7 per region alongside Laravel workers to minimize cross-region latency
- Configure semantic cache storage (Redis with vector search module, or standalone vector DB)
- Monitor AI plugin error rates separately from gateway error rates — plugin bugs crash the gateway
- Version control gateway configuration (APISIX Admin API or declarative YAML files)
- Implement gateway health checks that test end-to-end AI route (send known prompt, verify response)
- Plan for gateway upgrade — APISIX rolling upgrades should not drop active AI connections
- Set up cost dashboards on API7's token counting data for cross-team chargeback

## Common Mistakes

- Using API7 semantic cache without invalidation strategy — stale responses served indefinitely after source data changes
- Not configuring consumer timeouts per model — complex models may need 60s+ timeouts; default 30s causes frequent errors
- Bypassing API7 in development but expecting identical behavior in production — API7 plugins modify requests in ways that can't be replicated locally
- Over-reliance on gateway prompt inspection without Laravel-side middleware — gateway sees raw prompts, but application context (user roles, session data) is invisible at the gateway
- Forgetting to configure WebSocket/SSE streaming through the gateway — streaming requires specific APISIX configuration (chunked transfer encoding, buffering disabled)

## Failure Modes

- **Plugin crash**: Bug in AI plugin crashes the gateway worker — APISIX automatically respawns but drops in-flight requests; test plugins thoroughly in staging
- **Semantic cache poisoning**: Malicious prompt with high semantic similarity to a cached benign response — implement cache key salting with consumer ID
- **Rate limit misconfiguration**: Consumer-level rate limit too low — blocks legitimate users; implement rate limit alerts and burst allowances
- **Gateway configuration drift**: Admin API changes not reflected in version control — implement GitOps with APISIX declarative config
- **Provider credential leak**: Gateway logs provider API keys in error logs — configure log scrubbing for auth headers

## Ecosystem Usage

- **API7.ai**: Enterprise AI Gateway (Apache APISIX-based) — AI plugins for prompt inspection, semantic cache, model routing, token counting
- **Apache APISIX**: Open-source dynamic API gateway (CNCF incubating project) — foundation for API7
- **Laravel + API7**: Laravel application sends AI requests to API7 endpoint instead of directly to providers; API7 enforces policy and routes to providers
- **Alternative**: LiteLLM Proxy (similar role, Python-based, more LLM-focused, less gateway/security-focused)
- **Alternative**: Azure OpenAI Gateway (Microsoft-managed, Azure-specific)

## Related Knowledge Units

- KU-002: LiteLLM Proxy (comparison: API7 vs LiteLLM)
- KU-001: Agent Middleware Pipeline (application-layer complement to API7)
- KU-026: Prompt Injection Defense (prompt inspection at gateway level)
- KU-004: AI Bridge (BYOK-focused alternative)
- KU-003: LLM Router Circuit Breaker (application-side routing that pairs with API7 routing)

## Research Notes

- Source: API7.ai — "How AI Gateways Enforce Security and Compliance for LLMs" (Nov 2025)
- Source: Apache APISIX documentation — AI plugin reference
- Source: Solo.io — "Mitigating Indirect Prompt Injection Attacks on LLMs" (Jun 2025)
- API7 is primarily enterprise-focused; the open-source APISIX community has fewer AI-specific plugins
- The semantic caching approach (embedding-based) is unique to AI gateways — traditional API gateways only support exact-match caching
- For Laravel deployments, the typical choice is LiteLLM (simpler, Python-based, faster iterations) vs. API7 (more enterprise features, Lua plugins, higher performance at scale)
- API7 excels in regulated industries (finance, healthcare) where network-layer policy enforcement is a compliance requirement
