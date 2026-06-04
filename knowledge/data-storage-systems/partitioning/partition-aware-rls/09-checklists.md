# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.17 Partition-aware Row-Level Security (PostgreSQL)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Partitioning + RLS for multi-tenant + retention applied
- [ ] RLS on detached partitions applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming RLS bypasses pruning**: RLS evaluates per-row. Partition pruning still applies. Best: query includes both partition key and tenant_id for optimal performance. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] RLS policy propagates to all partitions
- [ ] Partition pruning works before RLS filtering
- [ ] New partitions automatically receive the RLS policy

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Partitioning + RLS for multi-tenant + retention applied
- [ ] RLS on detached partitions applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Create the partitioned table on the partition key (e.g., month): completed
- [ ] Create partitions: completed
- [ ] Enable RLS on the parent table: completed
- [ ] Create RLS policy using tenant context: completed
- [ ] Verify partition pruning works with RLS: completed

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

- [ ] Assuming RLS bypasses pruning**: RLS evaluates per-row. Partition pruning still applies. Best: query includes both partition key and tenant_id for optimal performance. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] RLS enabled on the parent partitioned table
- [ ] RLS policy propagates to all partitions
- [ ] Partition pruning works before RLS filtering (verify with EXPLAIN)
- [ ] New partitions automatically get the RLS policy
- [ ] Detached partitions do not retain the RLS policy
- [ ] RLS policy propagates to all partitions
- [ ] Partition pruning works before RLS filtering
- [ ] New partitions automatically receive the RLS policy
- [ ] Query performance acceptable (pruning + RLS indexing)
- [ ] Detached partitions secured separately

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
- [ ] RLS enabled only on parent but not checked on child partitions (PostgreSQL handles this correctly) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming RLS bypasses pruning**: RLS evaluates per-row. Partition pruning still applies. Best: query includes both partition key and tenant_id for optimal performance. prevented

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
