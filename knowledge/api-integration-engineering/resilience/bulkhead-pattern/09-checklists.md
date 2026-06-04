# Metadata

**Domain:** api-integration-engineering
**Subdomain:** resilience
**Knowledge Unit:** bulkhead-pattern
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Connection pool limits configured per service
- [ ] Dedicated queue workers per critical integration
- [ ] Per-service pool utilization monitored
- [ ] Assign Dedicated Queue Workers Per Critical Integration
- [ ] Configure Connection Pool Limits Per Service
- [ ] Isolate Critical from Non-Critical Workers
- [ ] Monitor Per-Service Pool Utilization
- [ ] Use Separate Guzzle Client/Connector Per Service
- [ ] Jobs dispatched to correct queue
- [ ] Per-queue backlog monitored with alerts
- [ ] Per-queue retry/timeout configured
- [ ] Alert on bulkhead breaches (queue buildup)
- [ ] Assign integration jobs to their respective queues
- [ ] Configure per-queue worker count and concurrency limits

---

# Architecture Checklist

- [ ] Architecture guidelines defined and followed

---

# Implementation Checklist

- [ ] Alert on bulkhead breaches (queue buildup)
- [ ] Assign integration jobs to their respective queues
- [ ] Configure per-queue worker count and concurrency limits
- [ ] Create separate queue connections per service or group
- [ ] Identify external services with different resource profiles
- [ ] Implement thread/semaphore pools for synchronous calls
- [ ] Monitor per-queue backlog and worker utilization
- [ ] Set queue-specific retry and timeout configurations
- [ ] Assign Dedicated Queue Workers Per Critical Integration
- [ ] Configure Connection Pool Limits Per Service
- [ ] Isolate Critical from Non-Critical Workers
- [ ] Monitor Per-Service Pool Utilization

---

# Performance Checklist

- [ ] Dedicated connection pools increase total connection count but prevent cross-service contention
- [ ] Per-pool monitoring enables capacity planning per service
- [ ] Pool limits prevent runaway concurrency from exhausting system resources (file descriptors, memory)
- [ ] Queue isolation ensures one service's backlog doesn't delay others

---

# Security Checklist

- [ ] Security review completed

---

# Reliability Checklist

- [ ] Not configuring pool limits (unbounded connections cause socket exhaustion)
- [ ] Over-isolation (separate worker per integration for low-traffic services wastes resources)
- [ ] Sharing a single Guzzle client across all services (one service's latency spike exhausts the shared pool)
- [ ] Using a single queue for all integrations (webhook processing backlog delays payment jobs)

---

# Testing Checklist

- [ ] Connection pool limits configured per service
- [ ] Dedicated queue workers per critical integration
- [ ] Jobs dispatched to correct queue
- [ ] Per-queue backlog monitored with alerts
- [ ] Per-queue retry/timeout configured
- [ ] Per-queue worker count and concurrency configured
- [ ] Per-service pool utilization monitored
- [ ] Pool exhaustion in one service doesn't affect others
- [ ] Queue connections configured per service/group
- [ ] Separate Guzzle client/connector per service

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Shared Guzzle Client Across All Services (No Connection Pool Isolation)]
- [ ] [Unbounded Connection Pool (File Descriptor Exhaustion)]
- [ ] [Shared Queue for All Integrations (Backlog Cross-Contamination)]
- [ ] [No Per-Service Pool Utilization Monitoring]

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


