# Metadata

**Domain:** DevOps & Infrastructure
**Subdomain:** Queue Deployment Safety
**Knowledge Unit:** queue-deployment-safety-operations
**Generated:** 2026-06-22

---

# Decision Inventory

* Worker Restart Strategy: Graceful vs Hard
* Code vs Migration Deployment Order
* Feature Flag vs Direct Deployment for Risky Changes
* Staggered vs Single-Group Worker Deployment
* Phased vs Immediate Migration for Large Tables

---

# Architecture-Level Decision Trees

---

## Worker Restart Strategy: Graceful vs Hard

---

### Decision Context

Choose between gracefully terminating workers (`horizon:terminate`) or hard-killing them (`kill -9`, `systemctl stop`) during deployment.

---

### Decision Criteria

* In-flight job criticality (is data loss acceptable?)
* Use of locking mechanisms (WithoutOverlapping, ShouldBeUnique)
* Transaction integrity requirements
* Deployment speed requirements
* Recovery capability for failed jobs

---

### Decision Tree

Do in-flight jobs hold database locks or cache locks (WithoutOverlapping, ShouldBeUnique)?
YES → Graceful termination REQUIRED (horizon:terminate). Hard kill orphans locks → manual recovery.
NO → Is transaction integrity critical for in-flight jobs?
    YES → Graceful termination (let transactions commit or rollback cleanly)
    NO → Is this an emergency deployment where data consistency can be temporarily sacrificed?
        YES → Hard kill acceptable with explicit acknowledgment and recovery plan
        NO → Graceful termination (default — no reason to hard kill)

---

### Rationale

Graceful termination allows workers to finish their current jobs, commit transactions, and release locks. Hard kill leaves the system in an inconsistent state that requires manual intervention. Emergency deployments may warrant hard kill, but this must be an explicit decision with a documented recovery procedure.

---

### Recommended Default

**Default:** Always use `horizon:terminate` for graceful shutdown.

**Reason:** The additional few seconds of wait time are far cheaper than recovering from stale locks, partial transactions, and lost jobs. Hard kill should only be used in documented emergency procedures.

---

### Risks Of Wrong Choice

Hard kill → stale WithoutOverlapping locks, ShouldBeUnique keys never released, partial DB transactions, jobs permanently lost. Graceful with too-short timeout → same as hard kill after timeout expires.

---

### Related Rules

- graceful-horizon-terminate-with-timeout

---

### Related Skills

- Execute Safe Queue Deployments

---

## Code vs Migration Deployment Order

---

### Decision Context

Whether to deploy application code or run database migrations first during a deployment.

---

### Decision Criteria

* Schema change type (additive vs destructive)
* Backward compatibility of new code with old schema
* In-flight job sensitivity to schema state
* Rollback capability

---

### Decision Tree

Does the migration add columns (NOT NULL without defaults) or drop columns?
YES → Deploy code FIRST. Code handles both old and new schema. Then run migrations.
NO → Are the migrations purely additive (new nullable columns, new tables, new indexes)?
    YES → Order is less critical, but deploy code first for consistency.
    NO → Are the migrations purely non-schema (seeders, cache operations)?
        YES → Either order is safe. Code first recommended for consistency.

---

### Rationale

Code-first deployment ensures that all running workers can handle the current schema state. When migrations run, the new code already handles both old and new states. Schema-first deployment risks old workers encountering unknown columns or missing columns.

---

### Recommended Default

**Default:** Deploy code → restart workers → verify → run migrations.

**Reason:** This order guarantees workers can handle any schema state encountered. It's the only order that's safe for destructive schema changes and is safe for all other changes as well.

---

### Risks Of Wrong Choice

Migrations first, code second: old workers crash when they encounter new NOT NULL columns they don't populate, or missing columns they still reference. Data integrity issues from failed writes.

---

### Related Rules

- deploy-code-before-migrations

---

### Related Skills

- Execute Safe Queue Deployments
- Manage Database Migrations

---

## Feature Flag vs Direct Deployment for Risky Changes

---

### Decision Context

Whether to use feature flags to gate risky job logic changes or deploy the change directly.

---

### Decision Criteria

* Risk profile of the code change (probability × impact of failure)
* Rollback speed requirement
* Complexity of maintaining both code paths
* Feature flag infrastructure maturity

---

### Decision Tree

Is the change High risk (payment processing, billing, data mutations)?
YES → Use feature flag. Instant rollback by disabling flag. No redeploy needed.
NO → Is the change Medium risk (notification delivery, report generation, external integrations)?
    YES → Use feature flag if infrastructure is mature; direct deploy if flag overhead is high.
    NO → Is the change Low risk (logging, metrics, cosmetic changes)?
        YES → Direct deploy. Feature flag overhead not justified.
        NO → Use feature flag (conservative approach).

---

### Rationale

Feature flags provide instant rollback — disabling a flag restores the old code path in seconds without a redeploy or `queue:restart`. This is critical for high-risk changes where a bug could cause financial loss or data corruption. The tradeoff is code complexity from maintaining both paths.

---

### Recommended Default

**Default:** Feature flag for High-risk changes. Direct deploy for Low-risk changes. Judgment call for Medium-risk.

**Reason:** The cost of a feature flag (conditional branch, cleanup overhead) is far lower than the cost of an emergency redeploy for a buggy high-risk change. The instant rollback capability is worth the code complexity for risky changes.

---

### Risks Of Wrong Choice

Feature flag for trivial change: unnecessary code complexity, forgotten cleanup, branching logic for no benefit. Direct deploy for high-risk change: bug discovered, must cycle through code deploy + queue:restart + migration — 10+ minute rollback while damage accumulates.

---

### Related Rules

None specific — architectural decision.

---

### Related Skills

- Execute Safe Queue Deployments

---

## Staggered vs Single-Group Worker Deployment

---

### Decision Context

Whether to deploy new code to all worker groups simultaneously or stagger deployment across worker groups.

---

### Decision Criteria

* Blast radius tolerance
* Worker group isolation (separate queues, separate infrastructure)
* Rollback complexity across groups
* Deployment pipeline maturity

---

### Decision Tree

Are worker groups isolated (separate queues, separate servers)?
YES → Can workers in different groups handle each other's payloads during the transition?
    YES → Staggered deployment (canary). Group A first, verify, then Group B.
    NO → Full deployment required (payload incompatibility across groups).
NO → Single group deployment (all workers on same infrastructure).
    ↓
    Is this a high-risk change with potential for cascading failures?
    YES → Staggered preferred if infrastructure supports it.
    NO → Single group sufficient.

---

### Rationale

Staggered deployments reduce blast radius — if the new code has a bug, only one group is affected. The other group continues processing with old code. But both groups must handle each other's payloads during the transition window, which adds complexity.

---

### Recommended Default

**Default:** Single group deployment for most changes. Staggered for high-risk changes with isolated worker groups.

**Reason:** Staggered deployment adds infrastructure complexity (multiple groups, compatibility windows). Most changes don't justify this overhead. For high-risk changes where a bug could be catastrophic, the reduced blast radius justifies the complexity.

---

### Risks Of Wrong Choice

Single group for high-risk: all workers affected simultaneously — no safe harbor. Staggered for low-risk: unnecessary infrastructure complexity, dual-compatibility maintenance overhead.

---

### Related Skills

- Execute Safe Queue Deployments

---

## Phased vs Immediate Migration for Large Tables

---

### Decision Context

Whether to run database migrations in phases (add column → deploy code → backfill → add constraint → remove old column) or as a single migration.

---

### Decision Criteria

* Table size (row count)
* Migration duration and table lock impact
* In-flight job sensitivity to column presence
* Deployment window constraints

---

### Decision Tree

Does the table have more than 10 million rows?
YES → Phased migration (add nullable column, deploy code, backfill, add NOT NULL, remove old column)
NO → Does the migration involve adding a NOT NULL column to a table with 1M+ rows?
    YES → Phased migration (nullable → code → backfill → NOT NULL)
    NO → Does the migration involve dropping or renaming a column?
        YES → Phased migration (add new column, deploy code, verify, drop old column)
        NO → Immediate migration is safe for simple additive changes

---

### Rationale

Large-table migrations (adding columns with constraints, dropping columns) can lock tables for minutes or hours — blocking all writes. Phased migrations break these into non-blocking steps: add nullable column (instant), deploy code that uses new column, backfill data in batches, add constraint, eventually drop old column in a separate deploy.

---

### Recommended Default

**Default:** Phased migration for any change affecting tables > 10M rows or any NOT NULL / DROP column change on tables > 1M rows. Immediate migration for simple additive changes on smaller tables.

**Reason:** The cost of a phased migration (2-3 deploys over days) is far lower than the cost of a table-locked production database for hours.

---

### Risks Of Wrong Choice

Immediate migration on large table: table-locked for minutes/hours, all writes blocked, queue jobs waiting, cascading failures. Phased migration for small table: unnecessary overhead, deployment complexity for no benefit.

---

### Related Rules

- deploy-code-before-migrations

---

### Related Skills

- Execute Safe Queue Deployments
- Manage Database Migrations
