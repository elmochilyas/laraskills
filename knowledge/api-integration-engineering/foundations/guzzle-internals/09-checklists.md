# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** guzzle-internals
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connection pool configured with max connections per host
- [ ] Guzzle client configured with appropriate timeouts
- [ ] Handler stack created per service, not globally mutated
- [ ] Avoid Mutable State Inside Middleware Closures
- [ ] Configure Timeouts via Guzzle Client, Not Each Request
- [ ] Create Handler Stack Per Service
- [ ] Order Middleware Correctly (Auth Inside Retry)
- [ ] Use tap() for Clean Stack Composition
- [ ] Connection pooling configured for high-throughput
- [ ] Custom handler stack configured with middleware
- [ ] Mock handler available for testing
- [ ] Add circuit breaker middleware for fault tolerance
- [ ] Add logging middleware for request/response debugging
- [ ] Add middleware: `$stack->push($retryMiddleware, 'retry')`

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add circuit breaker middleware for fault tolerance
- [ ] Add logging middleware for request/response debugging
- [ ] Add middleware: `$stack->push($retryMiddleware, 'retry')`
- [ ] Configure concurrent request pools with `Pool` for performance
- [ ] Configure connection pooling with persistent connections
- [ ] Create Guzzle client with custom `HandlerStack`
- [ ] Set default headers, timeout, and connection settings
- [ ] Test handler stack with Guzzle's mock handler
- [ ] Avoid Mutable State Inside Middleware Closures
- [ ] Configure Timeouts via Guzzle Client, Not Each Request
- [ ] Create Handler Stack Per Service
- [ ] Order Middleware Correctly (Auth Inside Retry)

---

# Performance Checklist

- [ ] Connection reuse reduces latency by 1-2 RTT per subsequent request
- [ ] cURL multi-handle overhead is negligible for concurrent requests
- [ ] cURL option CURLOPT_TCP_NODELAY disables Nagle's algorithm for latency-sensitive calls
- [ ] CURLOPT_TIMEOUT bounds total request time; CURLOPT_CONNECTTIMEOUT bounds TCP handshake
- [ ] Handler stack adds ~0.1ms per middleware per request

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Mutable state in middleware causing race conditions
- [ ] Not using `tap()` for clean stack composition
- [ ] Overwriting default cURL options instead of merging
- [ ] Pushing middleware in wrong order (auth after retry causes auth on each retry)
- [ ] Using global handler stack mutation affecting other services
- [ ] Avoid Mutable State Inside Middleware Closures
- [ ] Configure Timeouts via Guzzle Client, Not Each Request
- [ ] Create Handler Stack Per Service
- [ ] Order Middleware Correctly (Auth Inside Retry)

---

# Testing Checklist

- [ ] Connection pool configured with max connections per host
- [ ] Connection pooling configured for high-throughput
- [ ] Custom handler stack configured with middleware
- [ ] Guzzle client configured with appropriate timeouts
- [ ] Handler stack created per service, not globally mutated
- [ ] Middleware order correct (auth inside retry, monitoring outside)
- [ ] Mock handler available for testing
- [ ] Pools used for concurrent requests
- [ ] Retry/circuit breaker middleware added where needed
- [ ] TCP_NODELAY enabled for latency-sensitive calls

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Global Handler Stack Mutation Across Services]
- [ ] [Wrong Middleware Order (Auth After Retry)]
- [ ] [Mutable State Inside Middleware Closures]
- [ ] [Per-Request Timeout Instead of Client-Level Default]
- [ ] [Overwriting Default cURL Options Instead of Merging]

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


