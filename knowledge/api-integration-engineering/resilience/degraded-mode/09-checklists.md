# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** degraded-mode
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automatic recovery from degraded mode on health check success
- [ ] Degraded mode tested in staging with simulated failures
- [ ] Degraded mode triggers defined and configured
- [ ] Communicate Degraded State to Users
- [ ] Define Clear Degradation Criteria Per Service
- [ ] Require Consecutive Successes Before Exiting Degraded Mode
- [ ] Store Degraded Mode State in Redis
- [ ] Test Degraded Mode in Staging with Simulated Failures
- [ ] Automatic recovery on upstream availability
- [ ] Degraded mode tested with simulated failures
- [ ] Degraded-mode features identified
- [ ] Automatically recover when upstream becomes available
- [ ] Communicate degraded state to users via UI banners
- [ ] Configure fallback data: cached responses, defaults, empty states

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Automatically recover when upstream becomes available
- [ ] Communicate degraded state to users via UI banners
- [ ] Configure fallback data: cached responses, defaults, empty states
- [ ] Detect upstream failure via circuit breaker or timeout
- [ ] Identify features with acceptable degraded behavior
- [ ] Implement health endpoint for monitoring degraded state
- [ ] Switch to degraded mode: serve fallback, show warning banner
- [ ] Test degraded mode behavior with simulated failures
- [ ] Communicate Degraded State to Users
- [ ] Define Clear Degradation Criteria Per Service
- [ ] Require Consecutive Successes Before Exiting Degraded Mode
- [ ] Store Degraded Mode State in Redis

---

# Performance Checklist

- [ ] Degraded mode checks: single cache read (~1-5ms) per operation
- [ ] Feature flag checks add negligible overhead
- [ ] Reduced external API calls in degraded mode lower upstream load and costs
- [ ] Serving cached data is faster than API calls (1-5ms vs 50-5000ms)

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Building degraded mode after the system is in production (too late; outages force hasty implementation)
- [ ] Entering degraded mode on transient blips (multiple circuit breaker timeouts should trigger, not single failures)
- [ ] Exiting degraded mode immediately on first successful probe (consecutive successes needed)
- [ ] Not communicating degraded state to users (they think the system is fully functional with missing data)
- [ ] Not testing degraded mode behavior (untested fallback paths fail under real pressure)
- [ ] Communicate Degraded State to Users
- [ ] Define Clear Degradation Criteria Per Service
- [ ] Require Consecutive Successes Before Exiting Degraded Mode
- [ ] Store Degraded Mode State in Redis
- [ ] Test Degraded Mode in Staging with Simulated Failures

---

# Testing Checklist

- [ ] Automatic recovery from degraded mode on health check success
- [ ] Automatic recovery on upstream availability
- [ ] Degraded mode tested in staging with simulated failures
- [ ] Degraded mode tested with simulated failures
- [ ] Degraded mode triggers defined and configured
- [ ] Degraded-mode features identified
- [ ] Fallback data configured (cache, defaults, empty state)
- [ ] Feature flags for manual degraded mode activation
- [ ] Health endpoint reports degraded status
- [ ] Time in degraded mode monitored and alerted

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Triggering Degraded Mode on Single Failures]
- [ ] [In-Memory Degraded State in Multi-Server Deployments]
- [ ] [Exiting Degraded Mode on First Successful Probe]
- [ ] [No User-Facing Degraded Mode Indicator]
- [ ] [Degraded Mode Added Post-Production (Never Tested)]
- [ ] [No Degradation Criteria Definition]

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


