# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.8 Migration squashing (schema:dump, database/schema directory)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Squash before major releases applied
- [ ] Keep schema dump in CI applied
- [ ] --prune only after full confidence applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Pruning too early**: Deleting original migration files with `--prune` before the team has pulled the latest changes prevents their local migrations from matching the schema dump. prevented
- [ ] Quietly accepting an incorrect dump**: If the database client (mysqldump/pg_dump) is not installed on the CI server, `schema:dump` fails silently. Verify the dump file is generated and valid. prevented
- [ ] Forgetting to regenerate**: After significant schema changes, the schema dump becomes stale. New migrations build on the dump, but the dump should be regenerated periodically. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Fresh migrations execute in seconds using the schema dump
- [ ] Dump file is committed and version-controlled
- [ ] Team coordinates before pruning original files

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Squash before major releases applied
- [ ] Keep schema dump in CI applied
- [ ] --prune only after full confidence applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Ensure all migrations have been run and the schema is up to date completed
- [ ] Verify that all existing migrations are immutable and will not be edited completed
- [ ] Run `php artisan schema:dump` to generate `database/schema/{connection}.sql` completed
- [ ] Commit the generated dump file to version control completed
- [ ] Optionally add `--prune` to delete original migration files (only after team-wide coordination) completed

---

# Performance Checklist

- [ ] Performance: - Fresh migration time drops from minutes to seconds on large migration histories.
- [ ] Performance: - Schema dump files can be large (thousands of lines) on complex schemas, but execute as a single batch.
- [ ] Performance: - Existing environments see zero performance change — they continue individual migration execution.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Pruning too early**: Deleting original migration files with `--prune` before the team has pulled the latest changes prevents their local migrations from matching the schema dump. prevented
- [ ] Quietly accepting an incorrect dump**: If the database client (mysqldump/pg_dump) is not installed on the CI server, `schema:dump` fails silently. Verify the dump file is generated and valid. prevented
- [ ] Forgetting to regenerate**: After significant schema changes, the schema dump becomes stale. New migrations build on the dump, but the dump should be regenerated periodically. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Schema dump file is generated and committed to VC
- [ ] Dump was generated from the production-matching database engine
- [ ] `--prune` is only used after coordinating with the entire team
- [ ] CI pipeline executes the dump faster than individual migrations
- [ ] Schema dump regenerated after significant schema changes
- [ ] Fresh migrations execute in seconds using the schema dump
- [ ] Dump file is committed and version-controlled
- [ ] Team coordinates before pruning original files
- [ ] CI pipeline benefits from faster schema loading
- [ ] Dump is regenerated after major schema changes

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
- [ ] ### Pruning too early prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Pruning too early**: Deleting original migration files with `--prune` before the team has pulled the latest changes prevents their local migrations from matching the schema dump. prevented
- [ ] Quietly accepting an incorrect dump**: If the database client (mysqldump/pg_dump) is not installed on the CI server, `schema:dump` fails silently. Verify the dump file is generated and valid. prevented
- [ ] Forgetting to regenerate**: After significant schema changes, the schema dump becomes stale. New migrations build on the dump, but the dump should be regenerated periodically. prevented

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
