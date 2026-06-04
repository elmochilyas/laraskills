# Metadata

**Domain:** api-integration-engineering
**Subdomain:** foundations
**Knowledge Unit:** laravel-http-facade
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] `->throw()` used or HTTP errors explicitly handled
- [ ] `Http::fake()` used in integration tests
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] Always Set Timeouts
- [ ] Always Use ->throw()
- [ ] Always Use Http::pool() for Concurrent Requests
- [ ] Enable Http::preventStrayRequests() in Tests
- [ ] Use Http::macro() for Service-Specific Defaults
- [ ] `->throw()` used or HTTP errors explicitly handled
- [ ] `Http::fake()` used in integration tests
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] Always chain `->throw()` or explicitly handle HTTP error status codes
- [ ] Always set timeouts: `->timeout(30)->connectTimeout(10)`
- [ ] Handle responses: `->body()`, `->json()`, `->status()`, `->header()`

---

# Architecture Checklist

- [ ] >Http::fake() with wildcard catch-all
- [ ] >Http::fake(['stripe.com/*' => Http::response(...)])

---

# Implementation Checklist

- [ ] Always chain `->throw()` or explicitly handle HTTP error status codes
- [ ] Always set timeouts: `->timeout(30)->connectTimeout(10)`
- [ ] Handle responses: `->body()`, `->json()`, `->status()`, `->header()`
- [ ] Use `->retry(3, 100)` for transient failure handling
- [ ] Use `Http::fake()` in tests with `Http::preventStrayRequests()`
- [ ] Use `Http::get()`, `Http::post()`, `Http::withHeaders()` for requests
- [ ] Use `Http::macro()` for service-specific defaults (base URL, headers, auth)
- [ ] Use `Http::pool()` for concurrent requests instead of sequential loops
- [ ] Always Set Timeouts
- [ ] Always Use ->throw()
- [ ] Always Use Http::pool() for Concurrent Requests
- [ ] Enable Http::preventStrayRequests() in Tests

---

# Performance Checklist

- [ ] Each fakeable assertion serializes the request for comparison
- [ ] Facade overhead is negligible (~0.01ms per call)
- [ ] Pool requests share the same Guzzle client for connection reuse
- [ ] Response body is a string until parsed (streaming large responses possible)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Missing `->throw()` and silently ignoring 4xx/5xx responses
- [ ] Not cleaning up `Http::preventStrayRequests()` in tests
- [ ] Sequential `Http::get()` in loops instead of `Http::pool()`
- [ ] Using `Http::withOptions()` where facade methods suffice (over-configuration)
- [ ] Using global `Http::fake()` instead of scoped fake for specific requests
- [ ] Always Set Timeouts
- [ ] Always Use ->throw()
- [ ] Always Use Http::pool() for Concurrent Requests
- [ ] Enable Http::preventStrayRequests() in Tests

---

# Testing Checklist

- [ ] `->throw()` used or HTTP errors explicitly handled
- [ ] `Http::fake()` used in integration tests
- [ ] `Http::preventStrayRequests()` enabled in test suites
- [ ] Macros defined for service-specific defaults
- [ ] Pool used for concurrent requests instead of sequential loops
- [ ] Timeouts set on all outgoing requests

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Missing Timeouts on Outbound HTTP Requests]
- [ ] [Silent Failure: Not Using ->throw() or Error Handling]
- [ ] [Sequential HTTP Calls in Loops Instead of Pools]
- [ ] [Missing preventStrayRequests() in Test Suites]
- [ ] [Repeated Configuration Without Using Http::macro()]

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


