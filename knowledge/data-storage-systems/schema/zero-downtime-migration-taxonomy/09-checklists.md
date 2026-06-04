# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.1 Zero-downtime migration taxonomy (expand-contract, online DDL, shadow tables)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Expand-contract for risky migrations applied
- [ ] Online DDL for simple additions applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Blocking ALTER TABLE in production**: `ALTER TABLE ... ALGORITHM=COPY` locks table for minutes/hours. Production outage. Always check algorithm. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Migration approach is correctly matched to the operation
- [ ] No production downtime during schema changes
- [ ] Rollback path exists and is tested

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Expand-contract for risky migrations applied
- [ ] Online DDL for simple additions applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Classify the schema change by operation type and risk level completed
- [ ] If the operation supports native online DDL (INSTANT, INPLACE), use it for simple changes completed
- [ ] If the operation requires a table rebuild on a large table, choose a shadow-table tool (gh-ost, pt-osc, pgroll) completed
- [ ] If the change is complex (rename, type change, multi-table), use the expand-contract pattern completed
- [ ] For additive changes on small tables, standard DDL during a brief maintenance window is acceptable completed

---

# Performance Checklist

- [ ] Performance: Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Blocking ALTER TABLE in production**: `ALTER TABLE ... ALGORITHM=COPY` locks table for minutes/hours. Production outage. Always check algorithm. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Migration approach matches the operation type and risk profile
- [ ] Native online DDL preferred for supported operations
- [ ] Shadow-table tools used for large-table rebuilds
- [ ] Expand-contract used for complex or risky changes
- [ ] Rollback path is documented and tested
- [ ] Migration approach is correctly matched to the operation
- [ ] No production downtime during schema changes
- [ ] Rollback path exists and is tested
- [ ] Database engine capabilities are fully leveraged
- [ ] Table size and write throughput inform tool selection

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Blocking ALTER TABLE on large tables prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Blocking ALTER TABLE in production**: `ALTER TABLE ... ALGORITHM=COPY` locks table for minutes/hours. Production outage. Always check algorithm. prevented

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
