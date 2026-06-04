# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7-8 Replica Promotion Failover
**Generated:** 2026-06-04
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Failover procedure documented
- [ ] Failover tested in staging
- [ ] RTO measured and met
- [ ] RPO measured and met
- [ ] Application connects to new primary automatically
- [ ] Old primary demoted or rebuilt correctly

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Quiesce writes on the primary applied
- [ ] Wait for replication lag to reach zero applied
- [ ] Promote replica applied
- [ ] Point application to new primary applied
- [ ] Verify application writes succeed on new primary applied
- [ ] Repoint old primary as replica applied
- [ ] Always Check Lag Before Promoting Replica followed

---

# Performance Checklist

- [ ] Promotion takes seconds to minutes depending on WAL/binlog replay
- [ ] Application must handle connection failures during failover

---

# Security Checklist

- [ ] Failover must not expose data to unauthorized access
- [ ] Split-brain prevention (STONITH)

---

# Reliability Checklist

- [ ] Never Promote A Replica With Lag > RPO followed
- [ ] Always Test Failover In Staging followed

---

# Testing Checklist

- [ ] Failover procedure documented
- [ ] Failover tested in staging environment
- [ ] RTO (Recovery Time Objective) measured and met
- [ ] RPO (Recovery Point Objective) measured and met
- [ ] Application connects to new primary automatically
- [ ] Old primary either demoted or rebuilt correctly
- [ ] Manual vs automatic failover
- [ ] Orchestrator vs ProxySQL vs application-level failover
- [ ] DNS update vs VIP vs load balancer update

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Replica promoted with remaining lag — data loss prevented
- [ ] Split-brain: old primary comes back and accepts writes prevented
- [ ] No failover testing prevented
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
