# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Schema Design & Migration Engineering
**Knowledge Unit:** 1-28 Migration Testing in CI
**Generated:** 2026-06-03

---

# Decision Inventory

* SQLite vs production-matching database in CI
* Fresh vs incremental migration testing
* Rollback testing in CI pipeline

---

# Architecture-Level Decision Trees

---

## CI Migration Testing Strategy

---

## Decision Context

Choosing the correct database engine and testing approach in CI to catch migration issues before production deployment.

---

## Decision Criteria

* performance: spinning up DB containers adds 10-30s to CI startup
* architectural: production DB engine must match CI test environment
* maintainability: matrix builds for multiple DB versions add complexity
* security: no direct impact

---

## Decision Tree

Testing migrations in CI?
↓
Is SQLite sufficient (no MySQL/PostgreSQL-specific features used)?
YES → SQLite is acceptable for basic testing
    → Risk: MySQL-specific syntax (after(), fullText()) silently ignored
    → Risk: schema dump compatibility issues
NO → Use Docker container matching production DB
    ↓
    Test both migration paths:
    1. Fresh: migrate:fresh from scratch (catches ordering issues)
    2. Incremental: apply migrations one batch at a time (catches intermediate state issues)
    ↓
    Test rollback?
    YES → Run migrate:rollback --step=1 and verify schema state
        → Catches missing/broken down() methods
    NO → Rollback untested = production rollback risk
    ↓
    Multiple production DB versions?
    → Use CI matrix: test against ALL supported versions

---

## Rationale

SQLite as the test database misses engine-specific migration behavior. Using a Docker container with the exact production database engine and version catches issues early. Testing both fresh and incremental migration paths covers different failure modes. Rollback testing is essential for deployment safety.

---

## Recommended Default

**Default:** Docker container with production-matching DB version, test both fresh and incremental migrations, include rollback
**Reason:** Catches engine-specific issues, ordering dependencies, and broken rollback paths before production.

---

## Risks Of Wrong Choice

* SQLite-only testing: MySQL-specific syntax silently produces wrong schema
* Testing only fresh migrations: misses ordering dependencies that only appear incrementally
* Not testing rollback: broken down() discovered only during production rollback incident
* Wrong database version: migration uses feature not available in production version

---

## Related Rules

* Always test migrations against the same database engine and version as production
* Test both fresh and incremental migration paths

---

## Related Skills

* Test migrations in CI against production-matching databases
