# Skills

## Skill 1: Implement capability-based LLM routing with per-model circuit breakers

### Purpose
Build a PHP-side LLM routing and circuit breaker system that routes AI requests by capability profile (not model name), with per-model circuit breakers using shared Redis state for automatic failover, provider health tracking, and cost-aware model selection.

### When To Use
- Use when you need resilience against provider outages and rate limits
- Use when you want to route requests to the cheapest healthy model that meets capability requirements
- Use when using multiple providers for redundancy and cost optimization
- Use when model-specific failures should not affect other models from the same provider
- Use when you need automatic failover between providers without application-level code changes

### When NOT To Use
- Do NOT use for single-provider, single-model applications — unnecessary complexity
- Do NOT use when model-specific features are required (e.g., Claude's 200K context)
- Do NOT use without understanding circuit breaker state machine (Closed, Open, Half-Open)
- Do NOT use when all providers share the same failure domain (e.g., same upstream API)

### Prerequisites
- Laravel AI SDK or similar multi-provider AI integration
- Redis for shared circuit breaker state across instances
- At least two provider/model options per capability profile
- Understanding of circuit breaker patterns (failure thresholds, cooldown, half-open probes)
- Capability profile definitions mapping task types to acceptable models

### Inputs
- AI request with capability profile (e.g., 'high-quality-chat', 'fast-summary')
- Available provider models and their capability mappings
- Circuit breaker state per model (from Redis)
- Provider health scores (success rate, latency, error types)

### Workflow
1. Define capability profiles mapping task types to acceptable models:
   - `high-quality-chat` → `{ gpt-4o, claude-sonnet-4, gemini-1.5-pro }`
   - `fast-summary` → `{ gpt-4o-mini, claude-haiku, groq-llama3 }`
   - `embedding` → `{ text-embedding-3-small, cohere-embed }`
2. Implement per-model circuit breakers stored in Redis:
   - Each model has an independent breaker with its own thresholds, cooldown, and half-open interval
   - Shared state via Redis keys: `circuit_breaker:{model}:state`, `circuit_breaker:{model}:failure_count`
3. Configure failure detection:
   - Consecutive failures threshold (e.g., 5 for gpt-4o, 10 for gpt-4o-mini)
   - Error rate over time window
   - Latency degradation detection
4. Build a model resolver that maps capability profile to the cheapest currently-healthy model
5. Implement failover chain: try primary model -> fallback models on circuit open
6. Add cost-aware routing: route to cheaper provider when primary exceeds API budget
7. Create a health dashboard showing circuit breaker states and failover events
8. Set up alerts for circuit breaker state changes (model goes Open)

### Validation Checklist
- [ ] Capability profiles are defined and map to multiple models
- [ ] Per-model circuit breakers operate independently
- [ ] Redis stores shared circuit breaker state across instances
- [ ] Failure thresholds are configured per model (not global)
- [ ] Failover chain works sequentially on failure
- [ ] Circuit breaker transitions correctly: Closed -> Open -> Half-Open -> Closed
- [ ] Health scores composite works (success rate + latency + error type)
- [ ] Cost-aware routing selects cheapest healthy model
- [ ] Dashboard shows circuit breaker states in real-time

### Common Failures
- **Monolithic breaker**: One breaker for all OpenAI models — gpt-4o failure trips gpt-4o-mini; always per-model
- **Model-based routing**: Hardcoded model names break on deprecation — use capability profiles
- **No shared state**: Breaker state per-PHP-instance — request to unhealthy instance still fails; use Redis
- **Half-open probe failure**: Probe request to recovering model times out — model stays Open longer
- **Fallback to same failure**: All models in capability profile share the same provider — failover doesn't help

### Decision Points
- **Failure threshold per model**: More generous for cheap/resilient models, stricter for expensive ones
- **Cooldown duration**: Shorter (30s) for transient issues, longer (5min) for sustained outages
- **Half-open probe interval**: How often to test a recovering model — balance recovery speed with cost of probe requests
- **Capability granularity**: Coarse (3-5 profiles) or fine-grained (10+) — balance simplicity with routing flexibility

### Performance Considerations
- Redis read for breaker state adds <1ms — negligible overhead
- Capability-to-model resolution should be cached with short TTL (5-10s)
- Half-open probe requests count against provider rate limits — limit probe frequency
- Circuit breaker state transitions should be monitored to detect persistent provider issues

### Security Considerations
- Circuit breaker state could reveal provider usage patterns — protect Redis access
- Fallback to different providers must maintain the same data privacy guarantees
- Cost-aware routing should not reveal budget limits to unauthenticated users
- Audit log all failover events for compliance

### Related Rules
- R1: Never route based solely on model name — always consider functional equivalence
- R2: Implement per-model circuit breakers with shared state, not monolithic global breaker

### Related Skills
- Deploy and configure LiteLLM Proxy for centralized gateway
- Optimize AI costs using model routing and task-based selection
- Implement budget enforcement with pre-flight cost estimation
- Set up OpenTelemetry tracing for AI request lifecycle

### Success Criteria
- Circuit breakers isolate model failures within 30 seconds
- Failover chain completes in <2 seconds total (includes retry + fallback)
- Capability profiles abstract model selection from application code
- Health dashboard shows all breaker states with real-time updates
- Cost-aware routing reduces spend by 20-40% vs. single model usage
- No cascading failures from one model affecting other models
