# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.28 Migration testing in CI (same engine and version as production)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] GitHub Actions matrix applied
- [ ] Docker-based CI applied
- [ ] Schema comparison test applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using SQLite for migration tests**: `after()` modifier (MySQL-specific) silently ignored in SQLite. Migration passes in CI but produces incorrect schema in production. prevented
- [ ] Testing migrations against wrong database version**: CI runs MySQL 8.3 but production runs MySQL 5.7. Migration uses `ALGORITHM=INSTANT` which doesn't exist in 5.7. prevented
- [ ] Not testing rollback**: CI tests `migrate --force` but not `migrate:rollback`. A migration with incorrect `down()` passes CI but fails during production rollback. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] CI database container matches production engine and version
- [ ] Forward migration and rollback both tested in CI
- [ ] Engine-specific features (after, fullText, INSTANT) validated

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] GitHub Actions matrix applied
- [ ] Docker-based CI applied
- [ ] Schema comparison test applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Configure a CI service container matching the production database engine and version (e.g., `image: mysql:8.0.36`) completed
- [ ] Add a CI step that runs `php artisan migrate --force` on the container database completed
- [ ] Add a CI step that seeds test data and runs the new migrations completed
- [ ] Add a CI step that runs `php artisan migrate:rollback --step=1 --force` to test rollback completed
- [ ] Optionally add a schema comparison step comparing the resulting schema against an expected schema file completed

---

# Performance Checklist

- [ ] Performance: - Spinning up a database container in CI adds 10-30 seconds to job startup time. Use Docker layer caching to pre-pull database images.
- [ ] Performance: - Running `migrate:fresh` with 200+ migrations can take 30-60 seconds. Use `schema:dump` for faster initial schema loading.
- [ ] Performance: - Running migration tests in parallel across multiple database versions multiplies compute cost. Use CI matrix builds to parallelize.
- [ ] Performance: - Database container resource limits affect migration speed. Allocate sufficient CPU/memory for the container to avoid false test failures due to t...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using SQLite for migration tests**: `after()` modifier (MySQL-specific) silently ignored in SQLite. Migration passes in CI but produces incorrect schema in production. prevented
- [ ] Testing migrations against wrong database version**: CI runs MySQL 8.3 but production runs MySQL 5.7. Migration uses `ALGORITHM=INSTANT` which doesn't exist in 5.7. prevented
- [ ] Not testing rollback**: CI tests `migrate --force` but not `migrate:rollback`. A migration with incorrect `down()` passes CI but fails during production rollback. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] CI database engine matches production exactly (version, storage engine, SQL mode)
- [ ] `migrate --force` runs successfully against the CI database
- [ ] Rollback is tested: `migrate:rollback` works correctly
- [ ] Database-specific features work (after(), fullText(), ALGORITHM=INSTANT)
- [ ] Data integrity is verified after migration
- [ ] CI database container matches production engine and version
- [ ] Forward migration and rollback both tested in CI
- [ ] Engine-specific features (after, fullText, INSTANT) validated
- [ ] Schema comparison detects drift between expected and actual
- [ ] Matrix builds cover multiple supported database engines

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
- [ ] ### Using SQLite for migration tests prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using SQLite for migration tests**: `after()` modifier (MySQL-specific) silently ignored in SQLite. Migration passes in CI but produces incorrect schema in production. prevented
- [ ] Testing migrations against wrong database version**: CI runs MySQL 8.3 but production runs MySQL 5.7. Migration uses `ALGORITHM=INSTANT` which doesn't exist in 5.7. prevented
- [ ] Not testing rollback**: CI tests `migrate --force` but not `migrate:rollback`. A migration with incorrect `down()` passes CI but fails during production rollback. prevented

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
