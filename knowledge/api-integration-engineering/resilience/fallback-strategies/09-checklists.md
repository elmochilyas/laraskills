# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** fallback-strategies
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Circuit breaker state triggers fallback path
- [ ] Fallback events logged with reason and timestamp
- [ ] Fallback path defined for each critical integration
- [ ] Design Fallbacks for Reads, Not Writes
- [ ] Fallback Based on Circuit Breaker State, Not Single Failures
- [ ] Implement Provider Failover for Critical Integrations
- [ ] Indicate Degraded Mode in Response Headers
- [ ] Never Fallback Silently â€” Always Log
- [ ] Alerts configured for frequent fallback use
- [ ] Alternative provider switchover implemented
- [ ] Cache fallback: stale data served with indicator headers
- [ ] Alert on frequent fallback activation
- [ ] Choose fallback strategy per call:
- [ ] Classify API calls: critical vs non-critical, reads vs writes

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Alert on frequent fallback activation
- [ ] Choose fallback strategy per call:
- [ ] Classify API calls: critical vs non-critical, reads vs writes
- [ ] Implement try-primary-then-fallback pattern in service layer
- [ ] Log each fallback activation for monitoring
- [ ] Set fallback TTL for cache-based fallbacks
- [ ] Test fallback behavior with simulated primary failures
- [ ] Design Fallbacks for Reads, Not Writes
- [ ] Fallback Based on Circuit Breaker State, Not Single Failures
- [ ] Implement Provider Failover for Critical Integrations
- [ ] Indicate Degraded Mode in Response Headers
- [ ] Never Fallback Silently â€” Always Log

---

# Performance Checklist

- [ ] Fallback path should be faster than primary (no network call)
- [ ] Provider failover: adds latency of secondary provider call
- [ ] Queue fallback: negligible (job dispatch is fast)
- [ ] Stale cache fallback: 1-5ms (Redis)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Fallback to another API without verifying secondary is also degraded (cascading failure)
- [ ] Only implementing primary path, no fallback (operation fails when primary is down)
- [ ] Serving stale data without indication (consumers don't know data is stale)
- [ ] Silent fallback without logging (hard to debug when stale data served)
- [ ] Design Fallbacks for Reads, Not Writes
- [ ] Fallback Based on Circuit Breaker State, Not Single Failures
- [ ] Implement Provider Failover for Critical Integrations
- [ ] Indicate Degraded Mode in Response Headers
- [ ] Never Fallback Silently â€” Always Log
- [ ] Use Stale Cache as Primary Fallback for Reads

---

# Testing Checklist

- [ ] Alerts configured for frequent fallback use
- [ ] Alternative provider switchover implemented
- [ ] Cache fallback: stale data served with indicator headers
- [ ] Circuit breaker state triggers fallback path
- [ ] Default values returned for non-critical calls
- [ ] Fallback activation logged
- [ ] Fallback behavior tested with simulated failures
- [ ] Fallback events logged with reason and timestamp
- [ ] Fallback path defined for each critical integration
- [ ] Fallback paths tested in CI

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Silent Fallback Without Logging]
- [ ] [Falling Back on Single Failures (Not Circuit Breaker Aware)]
- [ ] [No Stale Cache Fallback for Read Operations]
- [ ] [Silently Falling Back on Write Operations]
- [ ] [No Fallback Response Headers (Degraded Mode Invisible)]

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


