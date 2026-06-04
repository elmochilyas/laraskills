# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** circuit-breaker
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Event listeners on state transitions for alerting
- [ ] Failure classification excludes 429/401/403
- [ ] Half-open probes test recovery automatically
- [ ] Classify Failures Correctly (5xx Trips, 4xx Does Not)
- [ ] Implement Half-Open for Automatic Recovery
- [ ] Register Event Listeners on State Transitions
- [ ] Set Minimum Requests Before Evaluating Rate
- [ ] Use Redis for Distributed State
- [ ] Circuit transitions logged (Closed â†’ Open â†’ Half-Open â†’ Closed)
- [ ] Failure threshold configured
- [ ] Half-open state limits probe requests
- [ ] After timeout, transition to half-open (allow probe requests)
- [ ] Close circuit on successful probe requests
- [ ] Define failure threshold (e.g., 5 consecutive failures)

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] After timeout, transition to half-open (allow probe requests)
- [ ] Close circuit on successful probe requests
- [ ] Define failure threshold (e.g., 5 consecutive failures)
- [ ] Define open timeout (e.g., 30 seconds before half-open)
- [ ] Define success threshold (e.g., 3 consecutive successes in half-open)
- [ ] Log all circuit state transitions for monitoring
- [ ] Open circuit when threshold exceeded â†’ fast-fail all requests
- [ ] Track failure count per circuit (API endpoint or service)
- [ ] Classify Failures Correctly (5xx Trips, 4xx Does Not)
- [ ] Implement Half-Open for Automatic Recovery
- [ ] Register Event Listeners on State Transitions
- [ ] Set Minimum Requests Before Evaluating Rate

---

# Performance Checklist

- [ ] Cache operations for state management should use Redis for sub-millisecond latency
- [ ] Half-Open probing: single request per timeout period, negligible overhead
- [ ] Open state: request rejected in ~1ms vs waiting for timeout (30s+)
- [ ] State check: single cache read (~1-5ms)

---

# Security Checklist

- [ ] Circuit breaker state should not be manipulated via unauthenticated endpoints
- [ ] Half-Open probes should not execute sensitive operations (use lightweight health check)
- [ ] Manual override (force Open/Closed) should require admin authentication

---

# Reliability Checklist

- [ ] Reliability measures implemented

---

# Testing Checklist

- [ ] Circuit transitions logged (Closed â†’ Open â†’ Half-Open â†’ Closed)
- [ ] Event listeners on state transitions for alerting
- [ ] Failure classification excludes 429/401/403
- [ ] Failure threshold configured
- [ ] Half-open probes test recovery automatically
- [ ] Half-open state limits probe requests
- [ ] Minimum requests configured before threshold evaluation
- [ ] Open state fast-fails all requests
- [ ] Open timeout configured
- [ ] Probe success closes circuit

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Counting 4xx/429 as Circuit Breaker Failures]
- [ ] [Minimum Requests Too Low (False Trip on First Failure)]
- [ ] [No Half-Open Probing (Stuck in Open State Forever)]
- [ ] [In-Memory State in Multi-Server Deployments]
- [ ] [No State Transition Event Listeners]
- [ ] [Retry Without Circuit Breaker (Hammering During Outage)]
- [ ] Global Circuit Breaker
- [ ] No Half-Open
- [ ] Retry Without Breaker
- [ ] Synchronous-Only

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


