# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 01-event-tracking
**Knowledge Unit:** middleware-event-tracking
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] terminate() vs handle() middleware hook distinction understood
- [ ] Non-blocking event capture after HTTP response sent implemented via terminate()
- [ ] Synchronous vs async dispatch decision made per event type
- [ ] Request context (URL, IP, user agent, headers) captured in middleware
- [ ] Global vs route middleware registration strategy defined
- [ ] Stateless constraint enforced — no per-request mutable state on middleware instance

---

# Architecture Checklist

- [ ] Tracking middleware uses terminate() to fire event capture after response delivery
- [ ] Event data structure includes request context without coupling to HTTP request class
- [ ] Async queue dispatch used for all non-critical analytics events
- [ ] Synchronous dispatch reserved only for events requiring confirmation before response
- [ ] Middleware registered selectively by route group, not applied globally
- [ ] Queue dispatch is the only side effect in terminate() — no HTTP calls or DB writes

---

# Implementation Checklist

- [ ] terminate() hook wired to fire tracking after $response->send() completes
- [ ] Request context serialized into plain data transfer object before queue dispatch
- [ ] Route middleware applied to intended route groups to prevent double-tracking
- [ ] Event payload made serializable for queue transport (no closures, no resources, no request objects)
- [ ] Global middleware variant catches unauthenticated routes when session tracking needed
- [ ] Middleware excluded on health-check, status, and excluded-path routes

---

# Performance Checklist

- [ ] terminate() middleware adds zero milliseconds to user-facing response time
- [ ] Request context serialization is O(n) on header/URL length — no database query
- [ ] Queue dispatch from terminate() uses delay: 0 for immediate background processing
- [ ] No HTTP client calls made inside terminate() — only memory operations plus queue push
- [ ] Middleware does not block PHP-FPM process termination after response sent
- [ ] Event sampling rate configurable per route for high-traffic endpoints

---

# Security Checklist

- [ ] Raw sensitive headers (Authorization, Cookie) stripped from event context before dispatch
- [ ] IP address captured in raw form only for downstream GDPR anonymization
- [ ] Request validation ensures no malformed or oversized event payloads reach the queue
- [ ] CSRF tokens excluded from event context data
- [ ] Event payload inspected for PII before queue dispatch

---

# Reliability Checklist

- [ ] Exception inside terminate() does not affect response delivery — logged as warning, user unaffected
- [ ] Queue::fake() in testing confirms dispatch called but no real job processed
- [ ] Queue connection failure handled by Laravel worker retry, not by middleware
- [ ] Middleware does not assume session is still available (response already sent, session may close)
- [ ] Missing required context fields trigger logged warning, not thrown exception

---

# Testing Checklist

- [ ] Test terminate() fires after HTTP response is sent, not before
- [ ] Test queue dispatch count and payload content correct from middleware
- [ ] Test middleware excluded routes are not tracked
- [ ] Test middleware handles unauthenticated request gracefully without session
- [ ] Test middleware on routes requiring authentication vs public routes
- [ ] Test event payload serialization round-trip through queue

---

# Maintainability Checklist

- [ ] Tracking middleware in dedicated directory (app/Http/Middleware/Tracking/)
- [ ] Event transformation logic extracted from middleware into dedicated formatter class
- [ ] Middleware registered in Kernel with explicit route group application
- [ ] Tests clearly separate middleware orchestration behavior from event formatting logic
- [ ] Documentation lists all tracked routes and explicitly excluded paths

---

# Anti-Pattern Prevention Checklist

- [ ] Do not use middleware for synchronous HTTP calls to analytics services — use queue
- [ ] Do not attach session-dependent logic in terminate() — session may be closed after response
- [ ] Do not store request object directly in database — serialize only needed fields
- [ ] Do not apply tracking middleware globally if only subset of routes need tracking
- [ ] Do not use terminate() for operations that must complete before response

---

# Production Readiness Checklist

- [ ] Prometheus counter for events dispatched per route per second
- [ ] Logged middleware errors at WARN level (not ERROR — response already delivered)
- [ ] Event sampling rate configurable per route for high-traffic endpoints
- [ ] Middleware excluded from health-check, status, and webhook receiver routes
- [ ] Deploy checklist includes tracking middleware registration verification in Kernel
- [ ] Staging smoke test confirms events appear in analytics after HTTP request

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: terminate() usage, selective registration, stateless design
- [ ] Security requirements satisfied: sensitive header stripping, PII inspection, CSRF exclusion
- [ ] Performance requirements satisfied: zero response-time overhead, no DB/HTTP in terminate()
- [ ] Testing requirements satisfied: dispatch count, payload correctness, excluded routes, session-less handling
- [ ] Anti-pattern checks passed: no sync HTTP, no session in terminate(), no global registration
- [ ] Production readiness verified: metrics per route, WARN-level logging, sampling config, deploy checklist

---

# Related References

- K002 (Queue Dispatching): Direct dependency — middleware hands off to queues
- K018 (Multi-Tenancy Analytics): Extends middleware with tenant resolution
- K022 (GDPR Compliance): IP anonymization and consent checks in middleware
- K034 (Circuit Breaker): Rate limiting and failure protection for tracking pipeline
