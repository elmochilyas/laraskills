# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Test Framework & Runner Infrastructure
**Knowledge Unit:** Testing Environment Management
**Generated:** 2026-06-03

---

# Decision Inventory

1. Local database engine: SQLite vs production-equivalent
2. env value source: phpunit.xml vs .env.testing vs CI env vars
3. Service driver selection: null vs log vs real
4. Config caching in testing

---

# Architecture-Level Decision Trees

---

## Decision Name: Local Database Engine: SQLite vs Production-Equivalent

---

## Decision Context

Choose which database engine to use for local development testing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Production uses SQLite?
↓
YES → Use SQLite everywhere (consistent behavior)
NO → Continue

↓
Tests use JSON queries, full-text search, or locking?
↓
YES → Use production-equivalent DB locally (behavior differences matter)
NO → Use SQLite locally (2-3x faster, no setup)

↓
CI uses production-equivalent DB?
↓
YES → SQLite locally is fine (CI catches engine issues)
NO → Use production DB everywhere

---

## Rationale

SQLite is 2-3x faster and requires no setup. However, JSON queries, full-text search, and locking behavior differ between SQLite and MySQL/PostgreSQL.

---

## Recommended Default

**Default:** SQLite for local, production-equivalent DB in CI
**Reason:** Fastest local feedback; CI catches engine-specific issues before production.

---

## Risks Of Wrong Choice

SQLite everywhere misses engine-specific bugs. Production DB locally is slower for development.

---

## Related Rules

Rule 5: Use SQLite for local testing, production-equivalent DB in CI

---

## Related Skills

Configure Testing Environment

---

## Decision Name: Environment Value Source Selection

---

## Decision Context

Choose where to define each environment variable for the test environment.

---

## Decision Criteria

* security
* maintainability

---

## Decision Tree

Value is a secret (password, API key)?
↓
YES → Inject via CI secrets; never commit to any config file
NO → Continue

↓
Value is a testing-specific default override?
↓
YES → Set in phpunit.xml `<php><env>` (highest precedence)
NO → Set in .env.testing (shared defaults)

↓
Value varies between local and CI?
↓
YES → Set CI-specific overrides via CI environment variables
NO → Single source is sufficient

---

## Rationale

phpunit.xml env vars have the highest precedence. CI secrets must never be committed. .env.testing is for shared non-sensitive defaults.

---

## Recommended Default

**Default:** Non-sensitive defaults in phpunit.xml; secrets in CI env vars
**Reason:** phpunit.xml is version-controlled and sets reliable defaults. Secrets stay out of repo.

---

## Risks Of Wrong Choice

Committing secrets in .env.testing exposes credentials. Skipping APP_ENV=testing prevents .env.testing from loading.

---

## Related Rules

Rule 1: Always set APP_ENV=testing in phpunit.xml
Rule 6: Never commit real secrets to .env.testing

---

## Related Skills

Configure Testing Environment

---

## Decision Name: Service Driver Selection for Testing

---

## Decision Context

Choose which driver to use for mail, queue, cache, session, and broadcast services in testing.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Test explicitly verifies service behavior (e.g., mail assertions)?
↓
YES → Use array driver (stores in memory for assertion)
NO → Continue

↓
Test needs to verify job dispatch or queue behavior?
↓
YES → Use sync driver (jobs execute immediately)
NO → Use array/null driver (no side effects)

↓
Integration test for real service interaction?
↓
YES → Use real driver, but mark as integration test (separate suite)
NO → Use array/null/log driver (safe defaults)

---

## Rationale

Real drivers cause side effects, slow tests, and depend on external service availability. Array/sync drivers provide testability without side effects.

---

## Recommended Default

**Default:** array for mail/cache/session/broadcast, sync for queue
**Reason:** Prevents real external service calls while supporting assertions.

---

## Risks Of Wrong Choice

Real drivers send emails, queue jobs, or hit external services during tests. Tests become flaky and slow.

---

## Related Rules

Rule 4: Set null drivers for mail, queue, cache, session, and broadcast in testing

---

## Related Skills

Configure Testing Environment
