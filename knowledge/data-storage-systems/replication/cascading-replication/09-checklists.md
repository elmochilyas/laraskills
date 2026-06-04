# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.12 Cascading replication (replica → replica chain)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Cascade for read scaling applied
- [ ] Multi-region cascade applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Deep cascade chains (>3 levels)**: High lag, complex failure diagnosis. Each intermediate replica failure breaks all downstream replicas. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Primary binlog dump connections ≤ number of intermediate replicas
- [ ] Lag at deepest downstream replica within acceptable range (e.g., <5s)
- [ ] Topology documented with clear naming and monitoring

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Cascade for read scaling applied
- [ ] Multi-region cascade applied
- [ ] Always Monitor Replica Lag followed
- [ ] Configure primary → intermediate replica (standard replication) completed
- [ ] Configure intermediate replica to log binlog (`log_slave_updates=ON` in MySQL) completed
- [ ] For each downstream replica: point replication at intermediate replica, not primary completed
- [ ] Verify replication chain: primary → intermediate → downstream completed
- [ ] Monitor lag at each level (lag accumulates: hop1 + hop2 + ...) completed

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

- [ ] Deep cascade chains (>3 levels)**: High lag, complex failure diagnosis. Each intermediate replica failure breaks all downstream replicas. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Primary binlog dump connections reduced (only to intermediate replicas)
- [ ] All downstream replicates show positive lag but within limits
- [ ] Intermediate replicas have `log_slave_updates` enabled
- [ ] Topology diagram documented and accessible
- [ ] Cross-region replicas replicate from primary-region intermediate, not primary
- [ ] Primary binlog dump connections ≤ number of intermediate replicas
- [ ] Lag at deepest downstream replica within acceptable range (e.g., <5s)
- [ ] Topology documented with clear naming and monitoring
- [ ] All regions serve reads from local replicas
- [ ] Lag within SLAs for every region

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
- [ ] Deep chains (>3 levels): lag grows too large, failure diagnosis complex prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Deep cascade chains (>3 levels)**: High lag, complex failure diagnosis. Each intermediate replica failure breaks all downstream replicas. prevented

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
