# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.9 Partitioning in Laravel migrations (syntax, limitations)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Partition migration template applied
- [ ] Partition management in separate migrations applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Partitioning after data exists**: `ALTER TABLE ... PARTITION BY ...` locks table and rebuilds data. For large tables, use pt-online-schema-change or gh-ost. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Migration creates partitioned table correctly
- [ ] Partition management works via migrations and scheduled commands
- [ ] Rollback of partition addition works (DROP PARTITION)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Partition migration template applied
- [ ] Partition management in separate migrations applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Create the table using `Schema::create`, then apply partitioning with raw SQL: completed
- [ ] For partition management, create separate migrations: completed
- [ ] Schedule partition management in Laravel: completed
- [ ] For MySQL, ensure partitioning is applied before any data exists (cannot partition with data without rebuild) completed
- [ ] Test migrations: `php artisan migrate --pretend` to preview SQL completed

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

- [ ] Partitioning after data exists**: `ALTER TABLE ... PARTITION BY ...` locks table and rebuilds data. For large tables, use pt-online-schema-change or gh-ost. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Migration creates partitioned table successfully
- [ ] Partition management migrations run and rollback correctly
- [ ] Scheduled partition creation works
- [ ] Scheduled partition archival works
- [ ] `php artisan migrate` runs without errors
- [ ] Migration creates partitioned table correctly
- [ ] Partition management works via migrations and scheduled commands
- [ ] Rollback of partition addition works (DROP PARTITION)
- [ ] Partition creation automated in all environments

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
- [ ] Cannot partition existing table with data â€” use pt-online-schema-change prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Partitioning after data exists**: `ALTER TABLE ... PARTITION BY ...` locks table and rebuilds data. For large tables, use pt-online-schema-change or gh-ost. prevented

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
