# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** connection-pooling
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Individual pool request errors handled gracefully
- [ ] Named keys used for response correlation
- [ ] Pool concurrency configured based on upstream capacity
- [ ] Implement Timeout for the Entire Pool
- [ ] Reuse Same Client Instance for Connection Pooling
- [ ] Separate Pools Per Service for Failure Isolation
- [ ] Set Connection Pool Limits
- [ ] Use Named Pool Keys for Response Correlation
- [ ] Connection exhaustion errors handled gracefully
- [ ] Connection limits configured per remote host
- [ ] Guzzle client reused across requests (not created per request)
- [ ] Configure Guzzle with `curl` handler for connection pooling
- [ ] Configure idle connection timeout to prevent stale connections
- [ ] For SaloonPHP: configure connector's Guzzle client to reuse pool

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure Guzzle with `curl` handler for connection pooling
- [ ] Configure idle connection timeout to prevent stale connections
- [ ] For SaloonPHP: configure connector's Guzzle client to reuse pool
- [ ] Handle connection pool exhaustion errors
- [ ] Monitor pool statistics (active, idle, total connections)
- [ ] Reuse Guzzle client instance across requests (connection reuse)
- [ ] Set `CURLOPT_TCP_KEEPALIVE` and `CURLOPT_KEEPALIVE_TIME`
- [ ] Set appropriate connection limit per host
- [ ] Implement Timeout for the Entire Pool
- [ ] Reuse Same Client Instance for Connection Pooling
- [ ] Separate Pools Per Service for Failure Isolation
- [ ] Set Connection Pool Limits

---

# Performance Checklist

- [ ] Connection reuse saves 1-2 RTT (50-200ms) per subsequent request to same host
- [ ] Each concurrent connection uses a file descriptor; monitor for EMFILE limits
- [ ] Response buffering: all in-flight response bodies held in memory until consumed
- [ ] Wall-clock time for N independent requests with concurrency C: ~ceil(N/C) Ã— avg_latency

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Assuming pool response order matches request order (use named keys)
- [ ] Concurrency too high for rate-limited APIs (causing 429 errors)
- [ ] Creating new connector instance per request (loses connection pooling benefit)
- [ ] Not handling individual pool request errors (uncaught promise rejections)
- [ ] Using concurrency for sequential-dependent requests (wasteful)
- [ ] Implement Timeout for the Entire Pool

---

# Testing Checklist

- [ ] Connection exhaustion errors handled gracefully
- [ ] Connection limits configured per remote host
- [ ] Guzzle client reused across requests (not created per request)
- [ ] Idle connection timeout prevents stale connections
- [ ] Individual pool request errors handled gracefully
- [ ] Keep-Alive enabled with appropriate timeouts
- [ ] Named keys used for response correlation
- [ ] Pool concurrency configured based on upstream capacity
- [ ] Pool statistics monitored
- [ ] Pool timeout configured for bounded execution

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Creating New Client Instance Per Request]
- [ ] [Unbounded Connection Pools Without Limits]
- [ ] [Shared Connection Pool Across Services (No Bulkhead)]
- [ ] [Missing Pool-Level Timeout]
- [ ] [Ignoring Response Order Indeterminacy in Pooled Requests]

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


