# Metadata

**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Database Testing Lifecycle
**Generated:** 2026-06-03

---

# Decision Inventory

1. RefreshDatabase vs DatabaseMigrations vs DatabaseTruncation
2. SQLite locally vs production-equivalent DB locally
3. Parallel database isolation strategy
4. Scoped vs global lifecycle trait application

---

# Architecture-Level Decision Trees

---

## Decision Name: RefreshDatabase vs DatabaseMigrations vs DatabaseTruncation

---

## Decision Context

Choose the database lifecycle strategy based on test requirements.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Test modifies database schema (DDL)?
↓
YES → Use `DatabaseMigrations` (full migrate:rollback)
NO → Continue

↓
Database supports nested transactions (MySQL InnoDB, PostgreSQL)?
↓
YES → Use `RefreshDatabase` (transaction rollback, <1ms overhead)
NO → Use `DatabaseTruncation` (table truncation, 5-50ms overhead)

↓
Speed requirement?
Performance-critical suite → `RefreshDatabase` (fastest)
DDL compatibility needed → `DatabaseMigrations` (slowest but safest)
Non-transactional DB → `DatabaseTruncation`

---

## Rationale

`RefreshDatabase` wraps each test in a transaction rolled back after the test (~1ms). `DatabaseMigrations` runs full migrate/rollback (100-5000ms). `DatabaseTruncation` truncates tables (5-50ms). The fastest option that meets compatibility requirements should win.

---

## Recommended Default

**Default:** `RefreshDatabase` for 95%+ of tests
**Reason:** Transaction rollback is 10-100x faster than migration rollback. Sufficient for virtually all tests.

---

## Risks Of Wrong Choice

`DatabaseMigrations` for all tests makes suite 10-100x slower. No trait causes state leakage between tests.

---

## Related Rules

Rule 1: Default to `RefreshDatabase` for 95% of tests
Rule 2: Never run tests without any database isolation trait
Rule 6: Scope `DatabaseMigrations` trait only to schema-modifying tests

---

## Related Skills

Configure Database Testing Lifecycle Strategy

---

## Decision Name: SQLite Locally vs Production-Equivalent DB Locally

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
Tests use JSON queries, full-text search, or explicit locking?
↓
YES → Use production-equivalent DB locally (behavioral differences matter)
NO → Use SQLite locally (2-3x faster, zero setup)

↓
CI includes production-equivalent DB in matrix?
↓
YES → SQLite locally is fine (CI catches engine issues)
NO → Use production DB locally (must catch engine issues before CI)

---

## Rationale

SQLite is 2-3x faster and requires zero setup. However, JSON queries, full-text search, locking, and some SQL syntax differ between SQLite and MySQL/PostgreSQL.

---

## Recommended Default

**Default:** SQLite locally; production-equivalent DB in CI
**Reason:** Fastest local TDD feedback; CI catches engine-specific bugs.

---

## Risks Of Wrong Choice

SQLite-only CI misses engine-specific bugs. Production DB locally slows TDD cycle.

---

## Related Rules

Rule 3: Use production-equivalent database in CI

---

## Related Skills

Configure Database Testing Lifecycle Strategy

---

## Decision Name: Parallel Database Isolation Strategy

---

## Decision Context

Choose how to ensure database isolation between parallel test workers.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

Using SQLite with `:memory:` database?
↓
YES → Automatic isolation (each process has own in-memory DB)
NO → Using MySQL or PostgreSQL?
↓
YES → Configure `ParallelTesting()` facade for process-specific DB names
NO → Shared database without isolation?
↓
Risk: Deadlocks and data collisions — must configure isolation

---

## Rationale

Without process-specific databases, parallel workers write to the same tables concurrently. Transaction isolation alone is insufficient — different workers' transactions run simultaneously.

---

## Recommended Default

**Default:** SQLite in-memory for automatic isolation; ParallelTesting facade for MySQL/PostgreSQL
**Reason:** SQLite needs no setup. MySQL/PostgreSQL require explicit per-process database creation.

---

## Risks Of Wrong Choice

No isolation: deadlocks, transaction conflicts, and random test failures in parallel mode.

---

## Related Rules

Rule 4: Configure process-specific databases for parallel execution

---

## Related Skills

Configure Database Testing Lifecycle Strategy
