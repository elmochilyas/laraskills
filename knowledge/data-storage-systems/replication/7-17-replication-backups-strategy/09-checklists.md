# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7-17 Replication and Backups Strategy
**Generated:** 2026-06-04
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Backups run on replica (not primary)
- [ ] Replica lag during backup stays acceptable
- [ ] Backup includes GTID/binlog position
- [ ] Backup restores successfully
- [ ] Retention policy applied
- [ ] Backup monitoring and alerting configured

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Choose backup source applied
- [ ] For physical backups on replica applied
- [ ] For logical backups on replica applied
- [ ] Integrate with replication monitoring applied
- [ ] Verify backup applied
- [ ] Always Backup From Replica, Not Primary followed
- [ ] Never Forget GTID/Binlog Position followed

---

# Performance Checklist

- [ ] Physical backup: faster, needs same disk space
- [ ] Logical backup: slower, more portable
- [ ] Backup on replica: zero impact on primary

---

# Security Checklist

- [ ] Backup storage encrypted (at rest and in transit)
- [ ] Backup files access restricted
- [ ] Backups stored in different region

---

# Reliability Checklist

- [ ] Always Test Backup Restore quarterly followed
- [ ] Backup includes replication position

---

# Testing Checklist

- [ ] Backups run on replica (not primary)
- [ ] Replica lag during backup stays within range
- [ ] Backup includes GTID/binlog position
- [ ] Backup restores and replication works
- [ ] Retention policy applied
- [ ] Backup monitoring and alerting configured
- [ ] Replica vs primary decision for backup source
- [ ] Physical vs logical backup decision

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Running backup on primary prevented
- [ ] Backup on replica stops replication IO prevented
- [ ] Backup doesn't record GTID position prevented
- [ ] Binary logs expire before backup prevented
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
