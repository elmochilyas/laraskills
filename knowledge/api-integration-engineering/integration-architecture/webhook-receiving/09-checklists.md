# Metadata

**Domain:** api-integration-engineering
**Subdomain:** integration-architecture
**Knowledge Unit:** webhook-receiving
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Events are versioned for schema evolution
- [ ] Projectors build correct read models from event stream
- [ ] Replay produces identical state to original processing
- [ ] Keep Reactors Asynchronous
- [ ] Record Receipt Event Before Processing
- [ ] Store Raw Payload in Event, Never Modify
- [ ] Test Replay Capability Regularly
- [ ] Use Projectors for Read Models, Not Event Store
- [ ] 200 returned promptly
- [ ] Failure handling with retry and dead-letter
- [ ] Monitoring for receipt rate, latency, errors
- [ ] Add monitoring: receipt rate, processing latency, error rate
- [ ] Define POST route with CSRF exclusion
- [ ] Dispatch processing job to queue

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Add monitoring: receipt rate, processing latency, error rate
- [ ] Define POST route with CSRF exclusion
- [ ] Dispatch processing job to queue
- [ ] Handle failures: retry with backoff, dead-letter
- [ ] Implement signature verification middleware
- [ ] Return 200 immediately after validation and queue
- [ ] Store raw payload for audit trail
- [ ] Validate payload schema against expected format
- [ ] Keep Reactors Asynchronous
- [ ] Record Receipt Event Before Processing
- [ ] Store Raw Payload in Event, Never Modify
- [ ] Test Replay Capability Regularly

---

# Performance Checklist

- [ ] Event store write: ~5-15ms per event
- [ ] Full replay O(n) over all events; snapshot-driven for efficiency
- [ ] HTTP receipt completes in 10-50ms (no processing in request lifecycle)
- [ ] Projector update: ~5-20ms per event

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Store Raw Payload in Event, Never Modify

---

# Testing Checklist

- [ ] 200 returned promptly
- [ ] Events are versioned for schema evolution
- [ ] Failure handling with retry and dead-letter
- [ ] Monitoring for receipt rate, latency, errors
- [ ] Payload schema validated
- [ ] POST route defined with CSRF exclusion
- [ ] Processing dispatched to queue
- [ ] Projectors build correct read models from event stream
- [ ] Raw payload stored for audit
- [ ] Replay produces identical state to original processing

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Processing Webhooks in the HTTP Request Lifecycle]
- [ ] [Recording Receipt Event After Processing Instead of Before]
- [ ] [Modifying Raw Payload After Recording]
- [ ] [Querying Event Store Directly Instead of Using Projectors]
- [ ] [Synchronous Reactors Blocking the Projection Pipeline]

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


