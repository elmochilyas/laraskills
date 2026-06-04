# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** fuse-circuit-breaker
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Circuit transitions logged and monitored
- [ ] Fallback response for open circuit state
- [ ] Half-open probe requests test recovery
- [ ] Implement Half-Open with Probe Requests
- [ ] Log Every State Transition
- [ ] Set Conservative Thresholds Initially
- [ ] Store State in Shared Cache for Multi-Server
- [ ] Use Sliding Window Failure Counting
- [ ] API calls wrapped with circuit breaker
- [ ] Cache driver set for state persistence
- [ ] Circuit breaker configured per external service
- [ ] Configure cache driver for state storage
- [ ] Configure circuit breaker per external service
- [ ] Handle OpenCircuitException with fallback

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Configure cache driver for state storage
- [ ] Configure circuit breaker per external service
- [ ] Handle OpenCircuitException with fallback
- [ ] Install package and publish config
- [ ] Monitor circuit state via cache keys
- [ ] Set failure threshold and open timeout
- [ ] Test circuit states with mock failure sequences
- [ ] Wrap API calls with fuse circuit breaker
- [ ] Implement Half-Open with Probe Requests
- [ ] Log Every State Transition
- [ ] Set Conservative Thresholds Initially
- [ ] Store State in Shared Cache for Multi-Server

---

# Performance Checklist

- [ ] Cache-based state avoids shared mutable state issues
- [ ] Fail-fast is near-instantaneous vs waiting for timeout
- [ ] Half-open probes add one extra request per cooldown period
- [ ] State check adds ~1ms (cache lookup)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Circuit breaker per request instead of per service
- [ ] Lack of monitoring on circuit transitions
- [ ] Not resetting failure count on success (permanently open circuit)
- [ ] Too-short cooldown period (flapping between open/closed)
- [ ] Using request count without time window (corner case accumulation)

---

# Testing Checklist

- [ ] API calls wrapped with circuit breaker
- [ ] Cache driver set for state persistence
- [ ] Circuit breaker configured per external service
- [ ] Circuit states tested end-to-end
- [ ] Circuit transitions logged and monitored
- [ ] Failure threshold and timeout configured
- [ ] Fallback response for open circuit state
- [ ] Half-open probe requests test recovery
- [ ] OpenCircuitException handled with fallback
- [ ] Package installed and configured

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Lifetime Failure Count Instead of Sliding Window]
- [ ] [No Half-Open Probing]
- [ ] [In-Memory State in Multi-Server Deployments]
- [ ] [Aggressive Thresholds (False Trips on Normal Variability)]
- [ ] [No State Transition Event Listeners]

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


