# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.24 Schema and data migration separation (data changes in separate files/jobs)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Migration dispatches job applied
- [ ] Separate files in migrations directory applied
- [ ] Defer data migration applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running a heavy UPDATE in a schema migration**: A schema migration adds a column, then runs `User::query()->update(['slug' => '...'])`. This locks the table, blocks the deploy, and may time out. prevented
- [ ] Not making data migrations async**: A data migration that takes 10 minutes runs synchronously in the deploy pipeline. All other servers deploy faster and start using the new schema before the data migration completes on the first server. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Schema migrations run synchronously in milliseconds
- [ ] Data migrations run asynchronously via queue
- [ ] Failed data migrations are retried automatically

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Migration dispatches job applied
- [ ] Separate files in migrations directory applied
- [ ] Defer data migration applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Create the schema migration file: `2026_06_02_000001_add_slug_to_articles.php` — contains only `Schema::table()` DDL completed
- [ ] Create the data migration file: `2026_06_02_000002_backfill_article_slugs.php` — `up()` dispatches a `BackfillSlugs` job to a queue completed
- [ ] The `BackfillSlugs` job handles chunked processing of existing rows completed
- [ ] The schema migration runs synchronously in the deploy pipeline (fast, milliseconds) completed
- [ ] The data migration also runs in the pipeline but only dispatches a job (fast) completed

---

# Performance Checklist

- [ ] Performance: - Schema migrations are fast (ms to seconds) and can run synchronously in the deploy pipeline.
- [ ] Performance: - Data migrations should use chunked processing with configurable sleep intervals. A backfill on a 10M-row table at 1000 rows per chunk takes ~10,0...
- [ ] Performance: - Queue workers processing backfill jobs consume database connections. Backfill workers should use a separate connection pool to avoid starving app...
- [ ] Performance: - The `low-priority` queue in Laravel uses less resources but may delay completion. Monitor backfill completion time against the deploy window.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Running a heavy UPDATE in a schema migration**: A schema migration adds a column, then runs `User::query()->update(['slug' => '...'])`. This locks the table, blocks the deploy, and may time out. prevented
- [ ] Not making data migrations async**: A data migration that takes 10 minutes runs synchronously in the deploy pipeline. All other servers deploy faster and start using the new schema before the data migration completes on the first server. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Schema migration contains only DDL operations
- [ ] Data migration's up() only dispatches a queue job
- [ ] Data migration is idempotent and retryable
- [ ] Schema and data migrations have sequential filenames
- [ ] Backfill uses chunkById or similar stable cursor
- [ ] Schema migrations run synchronously in milliseconds
- [ ] Data migrations run asynchronously via queue
- [ ] Failed data migrations are retried automatically
- [ ] Schema and data migrations are independently rollback-able
- [ ] Column additions are nullable until backfill completes

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
- [ ] ### Heavy UPDATE in schema migration prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running a heavy UPDATE in a schema migration**: A schema migration adds a column, then runs `User::query()->update(['slug' => '...'])`. This locks the table, blocks the deploy, and may time out. prevented
- [ ] Not making data migrations async**: A data migration that takes 10 minutes runs synchronously in the deploy pipeline. All other servers deploy faster and start using the new schema before the data migration completes on the first server. prevented

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
