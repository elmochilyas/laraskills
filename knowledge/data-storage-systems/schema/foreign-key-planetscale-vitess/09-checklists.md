# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.29 Foreign key constraint management in PlanetScale/Vitess environments
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Skip FKs in migrations applied
- [ ] Manual delete handling applied
- [ ] Cross-shard join limitations applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Assuming FK cascade works in Vitess**: CASCADE operations may not propagate across shards. Related records in a different shard remain undeleted. prevented
- [ ] Relying on FK for data integrity**: In Vitess, the application must enforce all referential integrity. Missing application-level cleanup causes orphaned records. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] No database-level FK constraints in Vitess deployments
- [ ] Application-level cleanup handles all cascade scenarios
- [ ] Related tables are co-located via shared shard keys

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Skip FKs in migrations applied
- [ ] Manual delete handling applied
- [ ] Cross-shard join limitations applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Omit `->constrained()` from migrations — do not create database-level FK constraints completed
- [ ] Use `foreignId('user_id')` without `->constrained()` — just the column, no FK completed
- [ ] Implement referential integrity in application code: use Eloquent relationships for querying, manual cleanup via model events completed
- [ ] For cascade deletes, use `deleting` model events to clean up related records completed
- [ ] Ensure related tables share the same shard key for Vitess co-location completed

---

# Performance Checklist

- [ ] Performance: - Foreign key enforcement in PlanetScale/Vitess goes through VTGate (the Vitess proxy), adding latency compared to direct MySQL FK enforcement. Eac...
- [ ] Performance: - The Vitess-level FK implementation requires additional locking and communication with the MySQL server. High-concurrency workloads may experience...
- [ ] Performance: - Disabling FK checks entirely (`SET FOREIGN_KEY_CHECKS=0`) in Vitess environments avoids the performance overhead but shifts all integrity respons...
- [ ] Performance: - Batch operations (bulk inserts, mass updates) that trigger FK checks in Vitess should be chunked to avoid overwhelming the VTGate query planner.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Assuming FK cascade works in Vitess**: CASCADE operations may not propagate across shards. Related records in a different shard remain undeleted. prevented
- [ ] Relying on FK for data integrity**: In Vitess, the application must enforce all referential integrity. Missing application-level cleanup causes orphaned records. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No `->constrained()` in migration files for Vitess deployments
- [ ] Application-level cleanup handles related records on delete
- [ ] Related tables share shard keys for co-location
- [ ] Cascade operations are implemented in app code, not DB
- [ ] PlanetScale deploy request workflow is used for schema changes
- [ ] No database-level FK constraints in Vitess deployments
- [ ] Application-level cleanup handles all cascade scenarios
- [ ] Related tables are co-located via shared shard keys
- [ ] PlanetScale deploy request workflow is followed
- [ ] Data integrity audits confirm no orphaned records

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
- [ ] ### Assuming FK cascade works in Vitess prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Assuming FK cascade works in Vitess**: CASCADE operations may not propagate across shards. Related records in a different shard remain undeleted. prevented
- [ ] Relying on FK for data integrity**: In Vitess, the application must enforce all referential integrity. Missing application-level cleanup causes orphaned records. prevented

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
