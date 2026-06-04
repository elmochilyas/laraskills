# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7-15 MariaDB / MySQL Differences
**Generated:** 2026-06-04
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replication works with your database version combination
- [ ] GTID format matches database vendor
- [ ] Cross-replication (if needed) tested and validated
- [ ] Parallel replication configured per vendor
- [ ] Crash-safe settings correct for the database

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Understand GTID format differences applied
- [ ] Configure GTID mode correctly per vendor applied
- [ ] Configure multi-source per vendor applied
- [ ] Configure parallel replication per vendor applied
- [ ] Configure crash-safe settings applied
- [ ] Never Replicate MySQL From MariaDB followed
- [ ] Always Use Vendor-Specific Parallel Replication Settings followed

---

# Performance Checklist

- [ ] MariaDB parallel replication: optimistic mode
- [ ] MySQL LOGICAL_CLOCK parallel replication

---

# Security Checklist

- [ ] Mixed replication uses TLS
- [ ] Replication user has minimal grants

---

# Reliability Checklist

- [ ] Always Test Cross-Version Replication Before Production followed
- [ ] Same major version across topology

---

# Testing Checklist

- [ ] Replication works with database version combination
- [ ] GTID format matches the database vendor
- [ ] Cross-replication tested and validated
- [ ] Parallel replication configured for vendor and version
- [ ] Crash-safe settings correct for database
- [ ] Database vendor selection decision made
- [ ] Cross-vendor replication feasibility checked

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] MySQL-to-MariaDB replication GTID mismatch prevented
- [ ] MariaDB-to-MySQL replication prevented
- [ ] Different default collation mismatch prevented
- [ ] Parallel replication incompatibility prevented
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
