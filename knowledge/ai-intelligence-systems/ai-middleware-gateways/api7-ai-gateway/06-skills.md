# Skills

## Skill 1: Configure API7 AI Gateway for enterprise LLM traffic governance

### Purpose
Deploy API7 AI Gateway (Apache APISIX-based) as a reverse proxy between Laravel applications and AI providers, providing semantic caching, prompt inspection, response moderation, multi-tenant rate limiting, and multi-model routing at the network layer.

### When To Use
- Use when you need enterprise-grade compliance and governance for AI API calls
- Use when network-layer security (prompt inspection, response moderation) is required
- Use when you need semantic caching for LLM responses to reduce cost and latency
- Use when enforcing multi-tenant rate limiting with model-specific quotas
- Use when defense-in-depth (gateway + application middleware) is needed for security

### When NOT To Use
- Do NOT use for simple single-provider integrations — overkill
- Do NOT use without understanding that gateway-level inspection lacks application context
- Do NOT use when you cannot maintain a separate gateway infrastructure
- Do NOT use when TTL-based cache invalidation is insufficient for your data volatility

### Prerequisites
- API7 or Apache APISIX gateway instance deployed (Docker/Kubernetes)
- Laravel application configured to route AI requests through the gateway
- AI provider API keys configured in the gateway
- Understanding of APISIX plugin architecture
- SSL/TLS configured between all endpoints

### Inputs
- API7 gateway configuration (routes, plugins, upstreams)
- Laravel AI request configuration (base URL pointing to gateway)
- Semantic cache settings (embedding model, similarity threshold)
- Rate limit and budget configurations per consumer

### Workflow
1. Deploy API7 gateway with AI-specific plugins enabled
2. Configure upstream services pointing to AI providers (OpenAI, Anthropic, etc.)
3. Set up routes that match `/v1/chat/completions` and similar AI endpoints
4. Enable prompt inspection plugin with injection pattern rules and PII detection
5. Enable response moderation plugin with content policy rules
6. Configure semantic caching:
   - Set embedding model for similarity comparison
   - Configure similarity threshold (e.g., 0.95 for exact, 0.85 for semantic)
   - Implement cache key: `cache:semantic:{query_hash}:{source_version_hash}`
7. Configure consumer-based rate limiting per tenant with model-specific quotas
8. Set up multi-model routing based on consumer tier, content type, or cost budget
9. Implement layered inspection: API7 for network-layer, Laravel agent middleware for application-layer

### Validation Checklist
- [ ] Gateway routes AI requests to correct provider endpoints
- [ ] Prompt inspection blocks injection patterns before reaching provider
- [ ] Response moderation blocks policy-violating content before reaching users
- [ ] Semantic cache returns cached responses for similar queries
- [ ] Cache invalidation triggers on source data changes, not just TTL
- [ ] Rate limits enforce correctly per consumer and per model
- [ ] Multi-model routing works (tier-based, content-based, cost-based)
- [ ] Layered inspection operates correctly (gateway + Laravel middleware)
- [ ] SSL termination is configured correctly

### Common Failures
- **Single-layer security**: Only gateway inspection, no application-layer context — bypass via application vulnerabilities
- **Stale semantic cache**: TTL-only invalidation serves outdated responses — implement version-hash key
- **Rate limit bypass**: Rate limit on wrong key — use consumer authentication, not IP
- **Gateway as bottleneck**: All AI traffic through single gateway — deploy multiple gateways with load balancing
- **Plugin conflict**: Multiple plugins modify the same request attribute — test plugin interactions

### Decision Points
- **Cache similarity threshold**: Higher (0.95) for exact responses, lower (0.85) for semantic similarity
- **Inspection depth**: Full prompt inspection vs. metadata-only — full inspection adds latency
- **Consumer identification**: API key, JWT, or IP-based — API key is most reliable for multi-tenant
- **Fail-over strategy**: YARP-mode (active-passive) for high availability

### Performance Considerations
- Semantic cache hit reduces latency from seconds to <50ms
- Prompt inspection adds latency proportional to input size — optimize regex patterns
- Gateway adds network hop (1-5ms) — negligible compared to LLM call time (1-5s)
- Response moderation for streaming requires chunk-by-chunk processing
- Cache hit rates of 20-50% are achievable with appropriate similarity thresholds

### Security Considerations
- Layered inspection: gateway blocks network-layer attacks (injection), middleware blocks application-layer (authorization)
- Gateway logs contain prompt data — ensure logs are encrypted and access-restricted
- Semantic cache may store sensitive responses — encrypt cache entries
- Consumer authentication must be cryptographically verifiable
- Gateway configuration changes must be reviewed and version-controlled

### Related Rules
- R1: Implement layered inspection — API7 gateway-level and Laravel middleware-level together
- R2: Implement semantic cache invalidation based on source data version, not just TTL

### Related Skills
- Implement agent middleware pipeline for AI concerns
- Implement semantic caching for LLM responses
- Implement prompt injection defense with semantic firewalls
- Configure multi-provider failover with circuit breakers

### Success Criteria
- Gateway handles all AI traffic with <5ms added latency
- Semantic cache achieves 20%+ hit rate within first week
- Prompt inspection catches 95%+ of known injection patterns
- Response moderation blocks 100% of policy-violating content
- Rate limits enforced accurately per consumer
- Layered inspection passes security audit
- Cache invalidation responds to data changes within 1 minute
