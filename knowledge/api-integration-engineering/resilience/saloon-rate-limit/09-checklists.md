# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** saloon-rate-limit
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Auto-delay enabled or custom handling implemented
- [ ] Cache prefix per connector for isolation
- [ ] Per-connector rate limits configured
- [ ] Configure Per-Connector Rate Limiters
- [ ] Enable Auto-Delay for Non-Time-Sensitive Operations
- [ ] Monitor Rate Limit Hit Rate for Tuning
- [ ] Test Rate Limiter Behavior Under Expected Load
- [ ] Use Redis Cache for Distributed Rate Limit State
- [ ] `RateLimitPlugin` added to Saloon Connector
- [ ] `RateLimitReachedException` handled
- [ ] Plugin throttles requests automatically
- [ ] Add `RateLimitPlugin` to Connector
- [ ] Configure rate limiter class (e.g., `StoreRateLimiter`)
- [ ] Configure store driver (cache, database)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add `RateLimitPlugin` to Connector
- [ ] Configure rate limiter class (e.g., `StoreRateLimiter`)
- [ ] Configure store driver (cache, database)
- [ ] Handle `RateLimitReachedException` for fallback
- [ ] Map response headers to rate limit configuration
- [ ] Monitor rate limit state via plugin accessors
- [ ] Plugin automatically delays requests when approaching limit
- [ ] Test rate limit behavior with mocked rate limit headers
- [ ] Configure Per-Connector Rate Limiters
- [ ] Enable Auto-Delay for Non-Time-Sensitive Operations
- [ ] Monitor Rate Limit Hit Rate for Tuning
- [ ] Test Rate Limiter Behavior Under Expected Load

---

# Performance Checklist

- [ ] Auto-delay adds wait time but prevents 429 responses
- [ ] Cache lookup per request adds ~1-2ms (Redis)
- [ ] Separate instances don't share overhead
- [ ] Token bucket O(1) computation negligible

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not monitoring rate limit hit rate for tuning
- [ ] Not testing rate limiter behavior under load
- [ ] Setting tokens_per_second too high (rate limiting ineffective)
- [ ] Using file/database cache for rate limit state (wrong for multi-server)
- [ ] Using same cache keys for different connectors

---

# Testing Checklist

- [ ] `RateLimitPlugin` added to Saloon Connector
- [ ] `RateLimitReachedException` handled
- [ ] Auto-delay enabled or custom handling implemented
- [ ] Cache prefix per connector for isolation
- [ ] Per-connector rate limits configured
- [ ] Plugin throttles requests automatically
- [ ] Rate limit behavior tested with mock headers
- [ ] Rate limit hit rate monitored
- [ ] Rate limit state monitored
- [ ] Rate limiter configured with correct store

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Rate Limiter on Connector (Manual Throttling Needed)]
- [ ] [File/Database Cache for Rate Limit State (Per-Server Counters)]
- [ ] [Shared Rate Limiter Across Multiple Connectors]
- [ ] [Auto-Delay Enabled for User-Facing Requests]
- [ ] [No Rate Limit Hit Monitoring]

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


