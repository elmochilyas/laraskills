# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7-9 Automatic Failover
**Generated:** 2026-06-04
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Orchestration tool installed and configured
- [ ] Health checks running and detecting failures
- [ ] Automatic failover tested
- [ ] Application reconnects automatically
- [ ] False failover prevented
- [ ] Monitoring alerts for failover events

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Choose orchestration tool based on stack applied
- [ ] Configure health checks applied
- [ ] Configure failover policies applied
- [ ] Test automatic failover applied
- [ ] Always Validate Health Checks Before Automatic Failover followed
- [ ] Never Allow Split-Brain In Automatic Failover followed

---

# Performance Checklist

- [ ] Health check frequency: 500ms-5s
- [ ] Failover time: 5-30 seconds

---

# Security Checklist

- [ ] Orchestrator must use encrypted connections
- [ ] Orchestration tool access restricted

---

# Reliability Checklist

- [ ] Never Allow Split-Brain In Automatic Failover followed
- [ ] Always Test Automatic Failover Monthly followed

---

# Testing Checklist

- [ ] Orchestration tool installed and configured
- [ ] Health checks running and detecting failures
- [ ] Automatic failover tested (primary killed, replica promoted)
- [ ] Application reconnects to new primary automatically
- [ ] False failover prevented during network partitions
- [ ] Monitoring alerts for failover events
- [ ] Automatic vs semi-automatic failover decision
- [ ] Which replica to promote criteria defined

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] False positive failover prevented
- [ ] Split-brain prevented
- [ ] Application connection pool doesn't retry prevented
- [ ] Orchestrator promoted wrong replica prevented
- [ ] Production Blindness prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
