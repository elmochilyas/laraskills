# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** rate-limit-avoidance
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] 429 responses trigger Retry-After respecting pause
- [ ] Backpressure implemented via queue job release
- [ ] Headroom monitored and alerts on low capacity
- [ ] Combine Proactive Limiting with Reactive 429 Handling
- [ ] Monitor Rate Limit Headroom
- [ ] Set Local Safety Margin at 80% of Upstream Limit
- [ ] Use Per-Service Rate Limiters, Not Global
- [ ] Use Redis for Distributed Rate Limit State
- [ ] 429 responses handled with backoff and retry
- [ ] Alerts configured for rate limit threshold approach
- [ ] Queue-based pacing distributes requests evenly
- [ ] Alert when approaching rate limit thresholds
- [ ] Distribute requests evenly across the rate window
- [ ] Implement exponential backoff on rate limit errors

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Alert when approaching rate limit thresholds
- [ ] Distribute requests evenly across the rate window
- [ ] Implement exponential backoff on rate limit errors
- [ ] Implement queue-based pacing: dispatch jobs with delays
- [ ] Log rate limit hits for capacity planning
- [ ] Monitor `X-RateLimit-*` response headers on every response
- [ ] Parse `Retry-After` header on 429 responses
- [ ] Research API rate limits: requests per window, burst allowance, reset behavior
- [ ] Use SaloonPHP's rate limit plugin for automatic header tracking
- [ ] Combine Proactive Limiting with Reactive 429 Handling
- [ ] Monitor Rate Limit Headroom
- [ ] Set Local Safety Margin at 80% of Upstream Limit

---

# Performance Checklist

- [ ] Backpressure adds delay equal to time until next token
- [ ] In-memory limiters are sub-microsecond but not distributed
- [ ] Rate limit check: 1-5ms (Redis) per request
- [ ] Token bucket is fastest (2 Redis calls); sliding window is most accurate (3 calls)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not enabling response header sync (local state drifts from upstream)
- [ ] Not handling 429 responses in queue jobs (blocks worker with sleep)
- [ ] Setting limits too close to upstream cap (frequent 429 at traffic peaks)
- [ ] Single global rate limit for multiple APIs with different limits

---

# Testing Checklist

- [ ] 429 responses handled with backoff and retry
- [ ] 429 responses trigger Retry-After respecting pause
- [ ] Alerts configured for rate limit threshold approach
- [ ] Backpressure implemented via queue job release
- [ ] Headroom monitored and alerts on low capacity
- [ ] Queue-based pacing distributes requests evenly
- [ ] Rate limit headroom monitored via response headers
- [ ] Rate limit hits logged for analysis
- [ ] Rate limiter configured per service with appropriate algorithm
- [ ] Safety margin (80% of upstream limit) configured

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Global Rate Limiter Shared Across All Services]
- [ ] [No Safety Margin (Limits at 100% of Upstream Capacity)]
- [ ] [Proactive-Only Limiting Without Reactive 429 Handling]
- [ ] [In-Memory Rate Limit State in Multi-Worker Deployments]
- [ ] [No Rate Limit Headroom Monitoring]

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


