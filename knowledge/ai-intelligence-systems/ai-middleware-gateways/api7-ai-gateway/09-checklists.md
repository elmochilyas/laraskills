# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** api7-ai-gateway
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Audit trail gateway
- [ ] Canary routing
- [ ] Consumer tier routing
- [ ] Customs and Border Protection
- [ ] Layered inspection
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for API7 AI Gateway

---

# Architecture Checklist

- [ ] API7 vs. custom Laravel middleware for compliance â†’ Both. Reason: API7 enforces network
- [ ] Embedding
- [ ] Lua
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] Audit trail gateway
- [ ] Canary routing
- [ ] Consumer tier routing
- [ ] Customs and Border Protection
- [ ] Layered inspection
- [ ] Library Reference Desk
- [ ] Security Guard Post
- [ ] Semantic cache with invalidation
- [ ] Rules for API7 AI Gateway

---

# Performance Checklist

- [ ] API7 adds 2-10ms latency per request (same host) â€” negligible compared to LLM generation time
- [ ] APISIX handles 10k+ req/s on commodity hardware â€” AI gateway rarely becomes the bottleneck
- [ ] Prompt inspection via regex is ~1ms; inspection via LLM-based classifier is 500ms+ â€” use regex for fast-path blocking
- [ ] Semantic cache lookup: ~50ms (embedding + vector search) â€” configure cache TTL aggressively for high-hit-rate patterns
- [ ] Stream responses pass through the gateway without buffering â€” configure `proxy_buffering off` for SSE

---

# Security Checklist

- [ ] Configure semantic cache storage (Redis with vector search module, or standalone vector DB)
- [ ] Deploy API7 per region alongside Laravel workers to minimize cross-region latency
- [ ] Implement gateway health checks that test end-to-end AI route (send known prompt, verify response)
- [ ] Monitor AI plugin error rates separately from gateway error rates â€” plugin bugs crash the gateway
- [ ] Plan for gateway upgrade â€” APISIX rolling upgrades should not drop active AI connections
- [ ] Set up cost dashboards on API7's token counting data for cross-team chargeback
- [ ] Version control gateway configuration (APISIX Admin API or declarative YAML files)

---

# Reliability Checklist

- [ ] Bypassing API7 in development but expecting identical behavior in production â€” API7 plugins modify requests in ways that can't be replicated locally
- [ ] Forgetting to configure WebSocket/SSE streaming through the gateway â€” streaming requires specific APISIX configuration (chunked transfer encoding, buffering disabled)
- [ ] Not configuring consumer timeouts per model â€” complex models may need 60s+ timeouts; default 30s causes frequent errors
- [ ] Over-reliance on gateway prompt inspection without Laravel-side middleware â€” gateway sees raw prompts, but application context (user roles, session data) is invisible at the gateway
- [ ] Using API7 semantic cache without invalidation strategy â€” stale responses served indefinitely after source data changes

---

# Testing Checklist

- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Performance implications are accounted for in the design.
- [ ] Production deployment follows recommended practices.
- [ ] Related KUs are consulted for additional guidance.
- [ ] Security considerations are addressed.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Rate Limiting at Gateway Level]
- [ ] [No API Key Rotation Through Gateway]
- [ ] [Gateway Without Request/Response Logging]
- [ ] [No Caching at Gateway for Repeated Queries]
- [ ] [Gateway Without Provider Failover]
- [ ] Gateway configuration drift
- [ ] Plugin crash
- [ ] Provider credential leak
- [ ] Rate limit misconfiguration
- [ ] Semantic cache poisoning

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

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


