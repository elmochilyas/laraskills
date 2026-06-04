# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.16 Read replica sizing (matching replica capacity to primary write volume)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Same instance size for replicas applied
- [ ] Larger replicas for read-heavy workloads applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Under-provisioned replicas**: Small replicas fall behind during peak write hours. Lag accumulates, never catches up. Always match primary's spec minimally. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Replica lag < 1s at peak write load
- [ ] Replica resource utilization < 70% across all metrics
- [ ] Zero lag accumulation over 24-hour cycle

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Same instance size for replicas applied
- [ ] Larger replicas for read-heavy workloads applied
- [ ] Always Monitor Replica Lag followed
- [ ] Measure primary write throughput at peak: binlog bytes/second and write queries/second completed
- [ ] Measure replica resource utilization at peak: CPU, disk IOPS, memory pressure completed
- [ ] If replica CPU > 80%: increase CPU (larger instance) — replay + reads exceed capacity completed
- [ ] If replica IOPS > 80%: increase IOPS (provisioned IOPS or faster storage) — binlog replay is I/O heavy completed
- [ ] If replica memory > 90% with buffer pool evictions: increase RAM — larger buffer pool reduces disk reads completed

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

- [ ] Under-provisioned replicas**: Small replicas fall behind during peak write hours. Lag accumulates, never catches up. Always match primary's spec minimally. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Replica CPU < 70% at peak write hours
- [ ] Replica IOPS < 70% of provisioned maximum
- [ ] Replica buffer pool hit ratio > 95%
- [ ] Replica lag < 1 second during peak
- [ ] Replica sizing documented with rationale
- [ ] Replica lag < 1s at peak write load
- [ ] Replica resource utilization < 70% across all metrics
- [ ] Zero lag accumulation over 24-hour cycle
- [ ] Read latency p99 < 100ms at peak
- [ ] Buffer pool hit ratio > 95% on all replicas

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
- [ ] Under-provisioned replica: lag grows during peak and never catches up prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Under-provisioned replicas**: Small replicas fall behind during peak write hours. Lag accumulates, never catches up. Always match primary's spec minimally. prevented

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
