# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** rate-limiting-algorithms
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Algorithm chosen based on workload characteristics
- [ ] Distributed state for multi-server deployments
- [ ] Graceful queue/delay on rate limit hit
- [ ] Always Respect Upstream Retry-After Headers
- [ ] Choose Algorithm Based on Workload
- [ ] Implement Graceful Queue/Delay on Rate Limit Hit
- [ ] Persist Rate Limiter State Across Restarts
- [ ] Use Redis for Distributed Rate Limiter State
- [ ] Algorithm chosen (token/leaky bucket) based on traffic pattern
- [ ] Bucket capacity and refill/drain rate configured
- [ ] Cache used for state storage (Redis)
- [ ] Check rate limit before each request: consume token or queue
- [ ] Choose algorithm: token bucket (bursty traffic) or leaky bucket (smooth traffic)
- [ ] Delay or queue request when limit reached

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Check rate limit before each request: consume token or queue
- [ ] Choose algorithm: token bucket (bursty traffic) or leaky bucket (smooth traffic)
- [ ] Delay or queue request when limit reached
- [ ] For leaky bucket: configure bucket capacity, drain rate
- [ ] For token bucket: configure capacity, refill rate, refill interval
- [ ] Integrate with SaloonPHP rate limit plugin
- [ ] Monitor rate limit utilization and headroom
- [ ] Store state in cache (Redis recommended for atomic operations)
- [ ] Always Respect Upstream Retry-After Headers
- [ ] Choose Algorithm Based on Workload
- [ ] Implement Graceful Queue/Delay on Rate Limit Hit
- [ ] Persist Rate Limiter State Across Restarts

---

# Performance Checklist

- [ ] Fixed window: O(1) per request, simplest but least precise
- [ ] Leaky bucket: O(1) per request, queue memory proportional to buffer
- [ ] Sliding window: O(log N) per request with Redis sorted sets
- [ ] Token bucket: O(1) per request, memory ~16 bytes per limiter

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Ignoring upstream Retry-After headers
- [ ] Not persisting rate limiter state across restarts
- [ ] Single-server bucket in multi-server deployment (inaccurate)
- [ ] Too-aggressive limiting reducing throughput unnecessarily
- [ ] Using fixed window without understanding boundary burst issue
- [ ] Always Respect Upstream Retry-After Headers

---

# Testing Checklist

- [ ] Algorithm chosen (token/leaky bucket) based on traffic pattern
- [ ] Algorithm chosen based on workload characteristics
- [ ] Bucket capacity and refill/drain rate configured
- [ ] Cache used for state storage (Redis)
- [ ] Distributed state for multi-server deployments
- [ ] Graceful queue/delay on rate limit hit
- [ ] Persisted state across restarts
- [ ] Rate limit checked before each request
- [ ] Rate limit hit rate monitored for tuning
- [ ] Rate limit utilization monitored

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Fixed Window Rate Limiting (Boundary Burst Issue)]
- [ ] [In-Memory Rate Limiter in Multi-Server Deployments]
- [ ] [Ignoring Upstream Retry-After Headers]
- [ ] [Dropping Rate-Limited Requests Instead of Queueing]
- [ ] [Wrong Algorithm for Workload Type]

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


