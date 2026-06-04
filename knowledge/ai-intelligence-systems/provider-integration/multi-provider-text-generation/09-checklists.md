# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** provider-integration
**Knowledge Unit:** multi-provider-text-generation
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Agent-level binding
- [ ] Database driver for AI
- [ ] Env-based routing
- [ ] HTTP client abstraction
- [ ] Provider override per call
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Always Handle Provider-Specific 400 Errors
- [ ] Cache Provider Driver Instances
- [ ] Configure Provider Timeouts and Retries per Provider
- [ ] Use Ai::call() via Env-Driven Provider Selection
- [ ] `Ai::call()` used with env-driven provider selection (not hardcoded provider strings)
- [ ] `Ai::fake()` used in tests with `preventStrayPrompts()`
- [ ] Environment-specific model selection configured (cheap in dev, capable in prod)
- [ ] Cache provider driver instances via the service container
- [ ] Configure per-provider timeouts and retries in config
- [ ] Configure providers in `config/ai.php` with env-driven API keys
- [ ] Errors are handled with provider-specific exceptions
- [ ] Provider drivers are cached and not re-instantiated per request

---

# Architecture Checklist

- [ ] Config
- [ ] Driver
- [ ] Unified message format vs. pass
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Agent-level binding
- [ ] Database driver for AI
- [ ] Env-based routing
- [ ] HTTP client abstraction
- [ ] Provider override per call
- [ ] Cache provider driver instances via the service container
- [ ] Configure per-provider timeouts and retries in config
- [ ] Configure providers in `config/ai.php` with env-driven API keys
- [ ] Handle provider-specific exceptions with try-catch blocks
- [ ] Install `laravel/ai` via Composer
- [ ] Set `AI_PROVIDER` environment variable for default provider selection
- [ ] Set up environment-specific models (cheap in dev, capable in prod)

---

# Performance Checklist

- [ ] First call to each provider driver resolves and caches the driver instance
- [ ] HTTP connection pooling via Guzzle â€” concurrent calls reuse connections
- [ ] Normalized errors vs. provider-specific error details
- [ ] Response times vary 2-10x across providers for equivalent models â€” benchmark for latency-sensitive paths
- [ ] Token limits vary per provider â€” `MaxTokens` attribute caps output length
- [ ] Unified abstraction vs. provider-specific features
- [ ] Provider driver instances should be cached (container singletons)
- [ ] Use read-only database connections in agent tools

---

# Security Checklist

- [ ] Configure timeouts per provider â€” some providers are slower than others
- [ ] Monitor per-provider latency and error rates â€” switch default provider if degradation detected
- [ ] Respect provider rate limits â€” implement queue-based throttling for high-throughput paths
- [ ] Set retry logic at the HTTP client level (Guzzle middleware) â€” provider 429/503 errors are common
- [ ] Use custom base URLs for proxy/gateway routing (LiteLLM, Azure OpenAI Gateway)
- [ ] Log provider errors at appropriate severity; never log raw API keys
- [ ] Never hardcode API keys in config files; always use environment variables

---

# Reliability Checklist

- [ ] Assuming all providers support the same features (e.g., tool calling, JSON mode) â€” check the support matrix in `config/ai.php`
- [ ] Hardcoding provider credentials in config â€” always use env vars
- [ ] Ignoring token limits across models â€” switching models without checking context window breaks prompts
- [ ] Not handling provider-specific 400 errors â€” malformed request for one provider works on another
- [ ] Provider hardcoded
- [ ] Real API calls in tests
- [ ] Secret exposed in config
- [ ] Timeout too short
- [ ] Unhandled provider exception
- [ ] Always Handle Provider-Specific 400 Errors

---

# Testing Checklist

- [ ] `Ai::call()` used with env-driven provider selection (not hardcoded provider strings)
- [ ] `Ai::fake()` used in tests with `preventStrayPrompts()`
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Environment-specific model selection configured (cheap in dev, capable in prod)
- [ ] Errors are handled with provider-specific exceptions
- [ ] Performance implications are accounted for in the design.
- [ ] Per-provider timeouts and retries configured in `config/ai.php`
- [ ] Production deployment follows recommended practices.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Hardcoded Provider Selection Without Fallback]
- [ ] [Ignoring Provider-Specific Rate Limits Per Model]
- [ ] [Same Retry Policy Across All Providers]
- [ ] [Not Accounting for Provider Response Format Differences]
- [ ] [Routing All Traffic to One Provider Without Health Checks]
- [ ] Credential rotation
- [ ] Model rotation
- [ ] Provider outage
- [ ] Rate limit exhaustion

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Log provider errors at appropriate severity; never log raw API keys

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


