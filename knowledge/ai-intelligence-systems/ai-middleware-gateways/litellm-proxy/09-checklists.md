# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** ai-middleware-gateways
**Knowledge Unit:** litellm-proxy
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] API Gateway for LLMs
- [ ] Company Credit Card
- [ ] Fallback chain
- [ ] Key rotation pattern
- [ ] Model aliasing
- [ ] Architecture guidelines are implemented.
- [ ] Best practices from the patterns section are followed.
- [ ] Core concepts are understood and applied correctly.
- [ ] Rules for LiteLLM Proxy

---

# Architecture Checklist

- [ ] PostgreSQL for spend logs vs. in
- [ ] Python
- [ ] Virtual keys vs. single proxy key â†’ Virtual keys. Reason: Enables per
- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure provider selection via environment variables
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads

---

# Implementation Checklist

- [ ] API Gateway for LLMs
- [ ] Company Credit Card
- [ ] Fallback chain
- [ ] Key rotation pattern
- [ ] Model aliasing
- [ ] Router with Toll Booths
- [ ] Single-endpoint pattern
- [ ] Usage budget pattern
- [ ] Rules for LiteLLM Proxy

---

# Performance Checklist

- [ ] Benchmark: LiteLLM handles ~1000 req/s on a 2-CPU instance with PostgreSQL + Redis
- [ ] Connection pooling to upstream providers is handled by the proxy, reducing TLS handshake overhead for repeated calls
- [ ] LiteLLM adds 5-15ms latency per request in the same network; cross-region adds 50-200ms â€” deploy LiteLLM in same region as Laravel workers
- [ ] Rate limiting uses Redis â€” ensure Redis cluster is sufficiently provisioned for peak throughput
- [ ] Spend log writes are asynchronous by default â€” configure sync logging only for compliance-required audit trails

---

# Security Checklist

- [ ] Configure database backups for spend logs â€” these are critical for billing and compliance
- [ ] Implement rate limit alerts â€” when virtual keys approach limits, notify before users hit 429s
- [ ] Run LiteLLM as a systemd service or Docker container with auto-restart â€” a proxy outage blocks all AI features
- [ ] Set up LiteLLM health check endpoint and monitor in Laravel â€” failover to direct provider call if proxy is unreachable
- [ ] Use environment-specific LiteLLM instances (dev/staging/prod) with different virtual keys and budgets
- [ ] Version control LiteLLM `config.yaml` â€” track proxy configuration changes alongside Laravel code

---

# Reliability Checklist

- [ ] Deploying LiteLLM in a different region than Laravel â€” adds 100ms+ latency to every AI call
- [ ] Forgetting `proxy_buffering off` for streaming through LiteLLM â€” SSE streams buffer in Nginx
- [ ] Not configuring request timeouts in LiteLLM â€” a hanging upstream provider holds proxy connections indefinitely
- [ ] Not monitoring LiteLLM disk space â€” spend logs can grow to GBs per week in production
- [ ] Using the master API key instead of virtual keys in Laravel â€” loses all per-application tracking and limiting

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
- [ ] Key rotation pattern
- [ ] Single-endpoint pattern
- [ ] Usage budget pattern

---

# Anti-Pattern Prevention Checklist

- [ ] [Deploying Without LiteLLM Proxy â€” Direct Provider Calls]
- [ ] [No Model-Specific Rate Limiting at Proxy]
- [ ] [Proxy Without Cost Tracking â€” Can't Attribute Spend]
- [ ] [No Provider Failover Configured in Proxy]
- [ ] [Proxy Not Monitored for Latency and Errors]
- [ ] Proxy outage
- [ ] Redis failure
- [ ] Spend log DB full
- [ ] Upstream provider outage
- [ ] Virtual key exhausted

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


