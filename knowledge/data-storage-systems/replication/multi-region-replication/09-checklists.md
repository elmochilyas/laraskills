# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.10 Multi-region replication (cross-region replicas, latency considerations)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Active-passive multi-region applied
- [ ] Active-active (multi-primary) applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Expecting low lag on cross-region replicas**: 100ms RTT means minimum 100ms lag. Add apply time: 200ms-5s typical. Design for eventual consistency. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Cross-region read latency <20ms for in-region users
- [ ] Replication lag <5s during normal operation
- [ ] DR failover completed within RTO

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Active-passive multi-region applied
- [ ] Active-active (multi-primary) applied
- [ ] Always Monitor Replica Lag followed
- [ ] Provision replica server in target region (same DB version, spec as primary) completed
- [ ] Configure async replication: primary binlog → replica over cross-region link completed
- [ ] Enable TLS for cross-region replication traffic completed
- [ ] Monitor initial sync completion completed
- [ ] Configure application routing: route reads to nearest region's replica completed

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

- [ ] Expecting low lag on cross-region replicas**: 100ms RTT means minimum 100ms lag. Add apply time: 200ms-5s typical. Design for eventual consistency. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Replication active across regions (IO and SQL threads running)
- [ ] Cross-region replica lag within expected range (1-5s typical)
- [ ] Application reads served from nearest region
- [ ] Failover procedure tested and documented
- [ ] Data residency compliance verified
- [ ] Cross-region read latency <20ms for in-region users
- [ ] Replication lag <5s during normal operation
- [ ] DR failover completed within RTO
- [ ] Topology meets RPO and RTO requirements
- [ ] No data divergence in active-active (verified with consistency checks)

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
- [ ] Expecting sub-second lag across intercontinental links (physical limits apply) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Expecting low lag on cross-region replicas**: 100ms RTT means minimum 100ms lag. Add apply time: 200ms-5s typical. Design for eventual consistency. prevented

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
