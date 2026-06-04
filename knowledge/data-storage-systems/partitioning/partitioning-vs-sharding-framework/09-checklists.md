# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.18 Partitioning vs. sharding decision framework
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Partitioning-first approach applied
- [ ] Shard + partition applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Premature sharding when partitioning suffices**: 100GB table on a 2TB-capable server. Sharding adds complexity. Partitioning alone handles lifecycle management. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Always Include Partition Key In WHERE followed
- [ ] Decision between partitioning and sharding based on data size and throughput
- [ ] Partitioning-first approach when possible (simpler, adequate for most cases)
- [ ] Sharding chosen only when data exceeds single server capacity

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Partitioning-first approach applied
- [ ] Shard + partition applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed

---

# Performance Checklist

- [ ] Performance: Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Premature sharding when partitioning suffices**: 100GB table on a 2TB-capable server. Sharding adds complexity. Partitioning alone handles lifecycle management. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Always Include Partition Key In WHERE followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Data size fits single server (partitioning) or requires multiple servers (sharding)
- [ ] Write throughput within single server capability (partitioning)
- [ ] Query patterns support partition pruning (partitioning) or shard key routing (sharding)
- [ ] Operational team can handle chosen complexity
- [ ] Migration path exists from partitioning to sharding (if data grows)
- [ ] Decision between partitioning and sharding based on data size and throughput
- [ ] Partitioning-first approach when possible (simpler, adequate for most cases)
- [ ] Sharding chosen only when data exceeds single server capacity
- [ ] Migration plan from partitioning to sharding documented (if needed)
- [ ] Combined approach used when both lifecycle management and horizontal scale needed

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Choose High-Cardinality Shard Key prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Premature sharding: 100GB table on 2TB-capable server â€” unnecessary complexity prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Premature sharding when partitioning suffices**: 100GB table on a 2TB-capable server. Sharding adds complexity. Partitioning alone handles lifecycle management. prevented

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
