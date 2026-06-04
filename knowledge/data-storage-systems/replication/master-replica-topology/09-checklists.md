# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.1 Master-replica topology (async, semi-sync, sync replication)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Semi-sync for production applied
- [ ] Async for read replicas applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Async replication for critical data**: Primary fails before replica syncs → data loss. Use semi-sync for production writes. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Replication lag < 1 second (async) or zero (sync)
- [ ] Read traffic served from replicas, write traffic to primary
- [ ] Failover procedure tested and documented

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Semi-sync for production applied
- [ ] Async for read replicas applied
- [ ] Always Monitor Replica Lag followed
- [ ] Configure primary for replication: enable binlog (MySQL) or WAL archiving (PostgreSQL) completed
- [ ] Provision replica server with same database version and configuration completed
- [ ] Configure replication: point replica to primary, start replication completed
- [ ] Monitor initial sync: replica catches up to primary completed
- [ ] Configure Laravel read/write connections: primary for writes, replicas for reads completed

---

# Performance Checklist

- [ ] Performance: Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Async replication for critical data**: Primary fails before replica syncs → data loss. Use semi-sync for production writes. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Replication is active (IO and SQL threads running)
- [ ] Data written to primary appears on replica
- [ ] Laravel read/write splitting works correctly
- [ ] Failover procedure is documented and tested
- [ ] Replication mode matches RPO requirements
- [ ] Replication lag < 1 second (async) or zero (sync)
- [ ] Read traffic served from replicas, write traffic to primary
- [ ] Failover procedure tested and documented
- [ ] RPO met for chosen replication mode
- [ ] Write latency within budget

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Replication lag causes stale reads prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Async replication for critical data**: Primary fails before replica syncs → data loss. Use semi-sync for production writes. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

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
