# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.5 Partition pruning (how the optimizer eliminates irrelevant partitions)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Verify pruning via EXPLAIN applied
- [ ] Partition key in WHERE applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Function wrapping partition key**: `WHERE YEAR(created_at) = 2024` — MySQL cannot prune with function wrapper. Use range comparison: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] All queries with partition key in WHERE prune correctly
- [ ] Function wrappers eliminated from partition key conditions
- [ ] EXPLAIN shows specific partitions (not ALL) for filtered queries

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Verify pruning via EXPLAIN applied
- [ ] Partition key in WHERE applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Identify the partition key for the target table completed
- [ ] Write queries that include the partition key in WHERE with supported conditions: completed
- [ ] Verify pruning with EXPLAIN: completed
- [ ] If pruning fails: completed
- [ ] Document query patterns that achieve pruning for the team completed

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

- [ ] Function wrapping partition key**: `WHERE YEAR(created_at) = 2024` — MySQL cannot prune with function wrapper. Use range comparison: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] EXPLAIN shows specific partitions (not ALL)
- [ ] Partition key appears in WHERE without function wrapper
- [ ] Range queries use direct column comparison
- [ ] Hash partition queries use equality on partition key
- [ ] OR conditions don't bypass partition pruning
- [ ] All queries with partition key in WHERE prune correctly
- [ ] Function wrappers eliminated from partition key conditions
- [ ] EXPLAIN shows specific partitions (not ALL) for filtered queries
- [ ] Pruning behavior documented for common query patterns

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Include Partition Key In WHERE prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Function wrapper on partition key â€” pruning disabled prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Function wrapping partition key**: `WHERE YEAR(created_at) = 2024` — MySQL cannot prune with function wrapper. Use range comparison: `WHERE created_at >= '2024-01-01' AND created_at < '2025-01-01'`. prevented

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
