# Metadata

**Domain:** Data & Storage Systems
**Subdomain:** Production Schema Operations
**Knowledge Unit:** 11-12 Migration Locking
**Generated:** 2026-06-03

---

# Decision Inventory

* Kill Long-Running Queries vs Wait for Completion Before DDL
* Advisory Lock vs Application-Level Migration Isolation
* ALGORITHM=INSTANT vs Lock-Tolerant Migration Strategy

---

# Architecture-Level Decision Trees

---

## Kill Long-Running Queries vs Wait for Completion Before DDL

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer preparing to run DDL on a busy MySQL table must decide whether to kill blocking queries or wait for them to finish.

---

## Decision Criteria

* performance considerations: query completion time, work lost on kill
* architectural considerations: query criticality, migration urgency
* security considerations: transaction rollback effects
* maintainability considerations: user impact, stakeholder notification

---

## Decision Tree

Will the blocking query complete within the migration window?
↓
YES → Wait for completion, then run DDL
NO → Is the query a write transaction (important to preserve)?
    YES → Wait and reschedule migration
    NO → Kill the query (KILL QUERY), then run DDL

---

## Rationale

Killing a query loses any work it has done and forces the transaction to roll back. For long-running analytical SELECTs, this is low-risk. For write transactions, killing may lose important changes. The decision depends on whether the query can finish within the acceptable migration window. If it can't, and the DDL is urgent, killing may be necessary — but always understand what you're killing.

---

## Recommended Default

**Default:** Wait for completion if within window, kill SELECTs, reschedule for writes
**Reason:** SELECT queries can be safely killed with minimal impact. Write transactions should be allowed to complete or the migration should be rescheduled. Never kill queries without identifying their purpose.

---

## Risks Of Wrong Choice

Killing a write transaction causes lost data and application errors. Waiting too long for a query means the migration window is missed, delaying the deploy.

---

## Related Rules

Check for blocking queries before DDL. Use INSTANT algorithm to avoid MDL.

---

## Related Skills

Prevent Metadata Lock Contention During MySQL Migrations

---

## Advisory Lock vs Application-Level Migration Isolation

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

In a multi-node deployment, the engineer must ensure only one server runs the migration at a time.

---

## Decision Criteria

* performance considerations: lock overhead, cache dependency
* architectural considerations: database vs cache availability
* security considerations: lock visibility across nodes
* maintainability considerations: lock cleanup, monitoring

---

## Decision Tree

Is the cache layer (Redis/Memcached) reliable and available?
↓
YES → Use application-level isolation (--isolated flag, cache-based lock)
NO → Use database advisory lock (GET_LOCK() — no external dependency)

---

## Rationale

Application-level isolation using the cache driver is simpler and integrates with existing Laravel tooling (`--isolated` flag). Database advisory locks (`GET_LOCK()`) avoid cache dependency but require a database connection and are MySQL-specific. Choose advisory locks when the cache may not be available during migrations (e.g., cache server is being redeployed alongside the app).

---

## Recommended Default

**Default:** Application-level isolation with --isolated flag
**Reason:** The --isolated flag is built into Laravel, uses the existing cache driver, and is easy to implement. Use advisory locks only when cache availability during migrations is a concern.

---

## Risks Of Wrong Choice

Cache-based lock fails if the cache server is down during migration, potentially allowing concurrent migrations. Advisory lock fails to prevent concurrent migrations if the database connection pool uses connection-based locking incorrectly.

---

## Related Rules

Check for blocking queries before DDL. Set lock_wait_timeout for fail-fast behavior.

---

## Related Skills

Prevent Metadata Lock Contention During MySQL Migrations

---

## ALGORITHM=INSTANT vs Lock-Tolerant Migration Strategy

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

An engineer planning a MySQL migration must choose between using INSTANT (avoids MDL entirely) or preparing for potential MDL contention.

---

## Decision Criteria

* performance considerations: lock avoidance vs preparation overhead
* architectural considerations: MySQL version support, operation type
* security considerations: no direct impact
* maintainability considerations: migration complexity

---

## Decision Tree

Does the operation support ALGORITHM=INSTANT (metadata-only)?
↓
YES → Use INSTANT (avoid MDL entirely, no lock preparation needed)
NO → Does the operation support ALGORITHM=INPLACE with LOCK=NONE?
    YES → Check for blockers first, then use INPLACE
    NO → Schedule during maintenance window, expect exclusive lock

---

## Rationale

INSTANT operations require no metadata lock on the table (MySQL 8.0.12+). They complete in milliseconds and cannot cause MDL contention. INPLACE operations require exclusive metadata lock during table rebuild but allow concurrent DML. For INPLACE, checking and handling blocking queries before execution is essential. COPY operations require full table lock — they should be avoided in production or scheduled during maintenance.

---

## Recommended Default

**Default:** ALGORITHM=INSTANT when supported, else ALGORITHM=INPLACE with blocker checks
**Reason:** INSTANT avoids all locking concerns. INPLACE is the next best option but requires MDL preparation. COPY should rarely be used in production.

---

## Risks Of Wrong Choice

Using INPLACE on a table with long-running queries causes cascading MDL lockouts. INSTANT on an unsupported operation throws an error rather than falling back gracefully.

---

## Related Rules

Always specify explicit ALGORITHM and LOCK. Prefer INSTANT, then INPLACE with LOCK=NONE.

---

## Related Skills

Prevent Metadata Lock Contention During MySQL Migrations
