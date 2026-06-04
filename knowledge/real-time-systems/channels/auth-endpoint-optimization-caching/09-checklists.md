# Metadata

**Domain:** real-time-systems
**Subdomain:** channels
**Knowledge Unit:** auth-endpoint-optimization-caching
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Auth cache can be invalidated when user permissions change
- [ ] Auth callback executes at most 1 database query
- [ ] Auth decisions are cached with appropriate TTL
- [ ] Always Apply Rate Limiting to the Auth Endpoint
- [ ] Always Cache Authorization Decisions
- [ ] Always Implement Cache Stampede Prevention
- [ ] Always Keep Auth Callback Database Queries to at Most One
- [ ] Always Monitor Auth Endpoint Latency Separately
- [ ] Auth callback executes at most 1 database query
- [ ] Auth decisions cached with `Cache::remember()` and appropriate TTL
- [ ] Auth endpoint P95 latency <50ms under load
- [ ] Apply `throttle` middleware to `Broadcast::routes()` with separate limits per guard
- [ ] Audit existing auth callbacks for database query count and complexity
- [ ] Delegate complex authorization to Gates or Policies
- [ ] Auth cache hits serve the majority of authorization requests
- [ ] Auth endpoint P95 latency <50ms under expected peak load
- [ ] Cache stampede prevented during simultaneous cache expiry

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Apply `throttle` middleware to `Broadcast::routes()` with separate limits per guard
- [ ] Audit existing auth callbacks for database query count and complexity
- [ ] Delegate complex authorization to Gates or Policies
- [ ] Implement jitter in TTL to prevent cache stampede: `random_int(240, 360)`
- [ ] Monitor auth failure rates for security anomalies
- [ ] Pre-warm auth caches before planned deployments
- [ ] Reduce database queries to at most one per callback
- [ ] Test with simulated reconnection storm load
- [ ] Track auth endpoint P50/P95/P99 latency as a distinct metric
- [ ] Wrap each callback in `Cache::remember()` with an appropriate TTL (300s default)
- [ ] Always Apply Rate Limiting to the Auth Endpoint
- [ ] Always Cache Authorization Decisions

---

# Performance Checklist

- [ ] Cache stampede: simultaneous expiry of auth cache entries causes mass database queries
- [ ] Database queries in auth callbacks are the primary bottleneck; each callback should execute at most 1 query
- [ ] During reconnection storms, auth endpoint throughput must match peak reconnect rate
- [ ] Redis-based cache lookup adds ~1-3ms; database queries add 5-50ms depending on complexity
- [ ] Target auth endpoint response time: <50ms at P95 under load
- [ ] Cache keys must include user and channel identifiers to prevent cross-user auth bypass
- [ ] Redis cache lookup adds ~1-3ms; database queries add 5-50ms
- [ ] Target auth endpoint latency: <50ms at P95 under load

---

# Security Checklist

- [ ] Auth endpoint should be rate-limited per IP and per user
- [ ] Cache keys must include user and channel identifiers to prevent cross-user auth bypass
- [ ] Cached auth decisions may serve stale results if user permissions change between cache writes
- [ ] Monitor auth failure rates for security anomalies (brute-force attempts)
- [ ] Rate limiting must handle legitimate reconnection traffic without false positives
- [ ] Cache keys must include user and channel identifiers to prevent cross-user auth bypass
- [ ] Monitor auth failure rates for brute-force attempts
- [ ] Target auth endpoint latency: <50ms at P95 under load

---

# Reliability Checklist

- [ ] Auth endpoint slow under load
- [ ] Cache stampede on reconnect
- [ ] Rate limiting false positives
- [ ] Stale authorization served
- [ ] Always Apply Rate Limiting to the Auth Endpoint
- [ ] Always Cache Authorization Decisions
- [ ] Always Implement Cache Stampede Prevention
- [ ] Always Keep Auth Callback Database Queries to at Most One
- [ ] Always Monitor Auth Endpoint Latency Separately
- [ ] Always Set Separate Rate Limits for Web Session vs. API Token Auth

---

# Testing Checklist

- [ ] Auth cache can be invalidated when user permissions change
- [ ] Auth cache hits serve the majority of authorization requests
- [ ] Auth callback executes at most 1 database query
- [ ] Auth decisions are cached with appropriate TTL
- [ ] Auth decisions cached with `Cache::remember()` and appropriate TTL
- [ ] Auth endpoint metrics are monitored separately from application metrics
- [ ] Auth endpoint P95 latency <50ms under expected peak load
- [ ] Auth endpoint P95 latency <50ms under load
- [ ] Auth endpoint P95 latency is <50ms under load
- [ ] Cache can be invalidated when user permissions change

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [No Rate Limiting on Auth Endpoint]
- [ ] [Complex Permission Trees in Auth Callbacks]
- [ ] [No Auth Caching â€” Repeated Database Queries]
- [ ] [Generic Rate Limits Applied to Auth Endpoint]
- [ ] [Cache Stampede Vulnerability â€” All Entries Expire Simultaneously]
- [ ] Complex permission trees in callbacks
- [ ] Eternal cache TTL
- [ ] Generic auth endpoint middleware
- [ ] No rate limiting on auth endpoint

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined
- [ ] Monitor auth failure rates for brute-force attempts

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


