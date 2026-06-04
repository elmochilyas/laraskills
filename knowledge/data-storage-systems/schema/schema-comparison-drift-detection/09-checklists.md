# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.30 Schema comparison and drift detection
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Scheduled drift check applied
- [ ] Pre-deployment drift check applied
- [ ] Drift correction migration applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Correcting drift manually**: Manually altering the database to match the expected state. This creates further drift because the manual correction isn't in a migration. Always create a migration to correct drift. prevented
- [ ] Ignoring minor drift**: A column default that differs by 1 character is ignored. It indicates that someone manually altered the database, which may have done other undetected changes. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema drift is detected within 24 hours of occurrence
- [ ] All drift corrections use new migration files
- [ ] Pre-deployment checks catch drift before migrations run

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Scheduled drift check applied
- [ ] Pre-deployment drift check applied
- [ ] Drift correction migration applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Generate the expected schema: `php artisan schema:dump` or generate a fresh database from migrations completed
- [ ] Query the actual schema: `SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHE... completed
- [ ] Compare expected vs actual: columns present in one but not the other, type mismatches, default differences, extra or missing indexes completed
- [ ] For structural drift (columns, types, indexes): create a new migration to correct the drift completed
- [ ] For metadata drift (auto-increment values, statistics): log and ignore — these are not structural changes completed

---

# Performance Checklist

- [ ] Performance: Schema comparison queries on `INFORMATION_SCHEMA` are lightweight for individual database checks — typically completing in under a second. For mult...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Correcting drift manually**: Manually altering the database to match the expected state. This creates further drift because the manual correction isn't in a migration. Always create a migration to correct drift. prevented
- [ ] Ignoring minor drift**: A column default that differs by 1 character is ignored. It indicates that someone manually altered the database, which may have done other undetected changes. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Drift detection runs on a regular schedule
- [ ] Pre-deployment drift check is part of the CI/CD pipeline
- [ ] Structural drift corrected via new migrations, not manual ALTER
- [ ] Metadata drift distinguished from structural drift
- [ ] Drift alerts are actionable and routed to the right team
- [ ] Schema drift is detected within 24 hours of occurrence
- [ ] All drift corrections use new migration files
- [ ] Pre-deployment checks catch drift before migrations run
- [ ] False positives from metadata drift are filtered out
- [ ] Drift is trending toward zero over time

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
- [ ] ### Correcting drift manually prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Correcting drift manually**: Manually altering the database to match the expected state. This creates further drift because the manual correction isn't in a migration. Always create a migration to correct drift. prevented
- [ ] Ignoring minor drift**: A column default that differs by 1 character is ignored. It indicates that someone manually altered the database, which may have done other undetected changes. prevented

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
