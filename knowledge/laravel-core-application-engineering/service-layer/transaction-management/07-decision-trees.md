# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Service Layer Pattern
**Knowledge Unit:** Transaction Management
**Generated:** 2026-06-03

---

# Decision Inventory

* Service-Level Transactions vs Action-Level Transactions
* Closure-Based Transactions vs Manual beginTransaction/commit/rollBack
* Deadlock Retry Configuration vs Single-Attempt Transactions
* External API Calls Inside vs Outside Transaction Boundaries

---

# Architecture-Level Decision Trees

---

## Decision 1: Service-Level Transactions vs Action-Level Transactions

---

## Decision Context

Whether the database transaction boundary should be set at the service orchestration level or inside individual action classes.

---

## Decision Criteria

* Whether the orchestration must be atomic (all steps succeed or roll back)
* Whether actions are called standalone or only as part of orchestration
* Whether nested transactions compose correctly

---

## Decision Tree

Is the operation a multi-step orchestration that must be atomic?
↓
YES → Service-level transaction — `DB::transaction()` wraps the entire orchestration method
NO → Is the operation a single-step action called independently?
    ↓
    YES → Action-level transaction — the action manages its own transaction when used standalone
    NO → Is the action always called from within a service transaction?
        ↓
        YES → NO action-level transaction — let the parent service manage the boundary
        NO → Action-level transaction — action doesn't know its caller; must protect itself
YES → Are there multiple actions composed in the orchestration?
    ↓
    YES → Service-level transaction ONLY — actions should not nest their own transactions
    NO → Service-level transaction — single action called from service: let service manage the boundary
NO → Does the action modify state (write) or only read?
    ↓
    YES → Service-level transaction — any write operation benefits from transactional wrapping
    NO → No transaction needed — read-only operations don't need transactions

---

## Rationale

Laravel's nested transaction handling uses a counter — only the outermost `commit()` actually writes to the database. However, if an action rolls back its inner transaction, the counter decrements but the parent transaction may not be aware. The rule: set the boundary at the highest level that needs atomicity (the service). Actions should NOT manage transactions when they are part of a service orchestration.

---

## Recommended Default

**Default:** Service-level transactions for all orchestration methods. Action-level transactions only for standalone-use actions.
**Reason:** The service knows the full workflow boundary. Actions cannot know whether they're called standalone or composed.

---

## Risks Of Wrong Choice

* Action-level with service-level: Nested counter confusion; action's rollback may not roll back parent's changes
* No transaction in orchestration: First step writes, second step fails — database in inconsistent state
* Action-level transaction in composed action: Action wraps a transaction, but the service also wraps one — double wrapping; only outermost commits
* No transaction anywhere: All writes are auto-committed; no atomicity guarantee

---

## Related Rules

* Enforce Service-Level Transaction Boundaries
* Enforce Deadlock Retry for High-Contention Operations

---

## Related Skills

* Set Transaction Boundaries at the Service Orchestration Level
* Use DB::transaction() Closure for Simple Atomic Operations

---

---

## Decision 2: Closure-Based Transactions vs Manual beginTransaction/commit/rollBack

---

## Decision Context

Whether to use `DB::transaction(callback)` (closure) or manual `DB::beginTransaction()`, `commit()`, `rollBack()`.

---

## Decision Criteria

* Whether the transaction wraps a single closure of code
* Whether the transaction spans multiple methods
* Whether the transaction needs conditional commit/rollback

---

## Decision Tree

Does the transaction wrap a single block of sequential code?
↓
YES → Closure-based `DB::transaction()` — simpler, automatic rollback on exception, no manual commit
NO → Does the transaction span multiple method calls in the service?
    ↓
    YES → Manual control — `beginTransaction()`, method calls, `commit()`/`rollBack()` — because closure can't span methods
    NO → Does the transaction need conditional commit (commit only if condition met)?
        ↓
        YES → Manual control — closure auto-commits on success; conditional commit requires manual control
        NO → Closure-based — if everything is in one block with no conditionals, use closure
YES → Does the transaction need deadlock retry?
    ↓
    YES → Closure-based — `DB::transaction(callback, 3)` handles retry; manual control requires custom retry logic
    NO → Closure-based — simpler; less boilerplate
NO → Does the transaction need to catch specific exceptions?
    ↓
    YES → Manual control — closure hides exception handling; manual gives fine-grained error handling
    NO → Closure-based — automatic rollback on any exception

---

## Rationale

Closure-based transactions (`DB::transaction(fn () => ...)`) are simpler — they auto-commit on success and auto-rollback on exception. They also support deadlock retry (second parameter). Manual transactions are needed when: the transaction spans multiple methods, needs conditional commit, or needs fine-grained exception handling. Manual transactions do NOT support deadlock retry natively.

---

## Recommended Default

**Default:** Closure-based `DB::transaction()` for all simple transactions. Manual control for multi-method or conditional transactions.
**Reason:** Closures are simpler, auto-handle commit/rollback, and support deadlock retry. Manual is only needed for complexity.

---

## Risks Of Wrong Choice

* Closure for multi-method transaction: Closure captures scope; methods called inside closure can't be reused outside the transaction
* Manual for simple transaction: Boilerplate; forgot rollback on exception — transaction stays open; connection stuck
* Closure for conditional commit: `DB::transaction()` always commits — can't conditionally rollback; use manual
* Closure without retry for deadlock-prone: Default retry = 1 (no retry); add `, 3` for deadlock-prone operations

---

## Related Rules

* Enforce Service-Level Transaction Boundaries
* Enforce Deadlock Retry for High-Contention Operations

---

## Related Skills

* Set Transaction Boundaries at the Service Orchestration Level
* Use DB::transaction() Closure for Simple Atomic Operations

---

---

## Decision 3: Deadlock Retry Configuration vs Single-Attempt Transactions

---

## Decision Context

Whether to configure deadlock retry on `DB::transaction()` or use the default single attempt.

---

## Decision Criteria

* Whether the transaction modifies highly-contested tables (inventory, balances, counters)
* Whether the application has concurrent users (many simultaneous requests)
* Whether the transaction runs in a high-traffic environment

---

## Decision Tree

Does the transaction modify contested tables (inventory counts, account balances, reservation seats)?
↓
YES → Configure retry — `DB::transaction(callback, 3)` — contested tables are deadlock-prone
NO → Does the application serve concurrent users (+100 simultaneous)?
    ↓
    YES → Configure retry — concurrent requests conflict on shared rows; deadlock probability increases
    NO → Does the transaction run in a high-traffic API?
        ↓
        YES → Configure retry — high throughput means more concurrent transactions; deadlock probability increases
        NO → Single attempt — low concurrency makes deadlock unlikely
YES → Does the transaction touch multiple tables?
    ↓
    YES → Configure retry — multi-table transactions acquire more locks; higher deadlock probability
    NO → Does the transaction hold locks for significant time (external API calls inside)?
        ↓
        YES → DON'T increase retry — FIX the root cause (move API calls outside transaction)
        NO → Configure retry — simple multi-row updates still benefit from retry
NO → Is data consistency critical (financial, inventory)?
    ↓
    YES → Configure retry — failed transactions in critical paths cause data inconsistency
    NO → Single attempt — non-critical operations can fail and be retried manually

---

## Rationale

Deadlocks are inevitable in concurrent database systems. `DB::transaction(callback, 3)` automatically retries up to 3 times on deadlock. Without retry, the `DeadlockException` propagates as a 500 error. The retry callback must be idempotent — re-executing the same code should produce the same result (or be safe to re-run).

---

## Recommended Default

**Default:** `DB::transaction(callback, 3)` for ALL write transactions in production.
**Reason:** Deadlocks are inevitable. Retry on deadlock is automatic and transparent. The performance cost of retry is near-zero for non-deadlocked transactions.

---

## Risks Of Wrong Choice

* No retry on deadlock: `DeadlockException` → 500 error; user sees error; operation fails
* Retry on non-idempotent callback: `DB::transaction(fn() => $user->increment('views'), 3)` — retry increments views 3 times
* Retry count too high: 5+ retries on a deadlocked system — retry storm; adds load; makes deadlocks worse
* Retry on external API calls inside transaction: API call made before retry — duplicate API side-effects

---

## Related Rules

* Enforce Service-Level Transaction Boundaries
* Enforce Deadlock Retry for High-Contention Operations

---

## Related Skills

* Set Transaction Boundaries at the Service Orchestration Level
* Use DB::transaction() Closure for Simple Atomic Operations

---

---

## Decision 4: External API Calls Inside vs Outside Transaction Boundaries

---

## Decision Context

Whether to include external API calls (HTTP requests, email sending, queue dispatch) inside the database transaction or move them outside.

---

## Decision Criteria

* Whether the API call is slow (network latency)
* Whether the API call has side effects that should not be rolled back
* Whether the API call is idempotent

---

## Decision Tree

Is the API call slow (>100ms typical response time)?
↓
YES → Move OUTSIDE the transaction — slow API calls hold database locks; increase deadlock probability
NO → Does the API call have side effects that cannot be rolled back (email sent, payment charged)?
    ↓
    YES → Move OUTSIDE the transaction — transaction rollback cannot undo the API side effect
    NO → Is the API call idempotent (safe to retry)?
        ↓
        YES → Can stay inside — idempotent API call is safe; if transaction fails, API side effect is idempotent
        NO → Move OUTSIDE — non-idempotent API call inside transaction: rollback doesn't undo the API call
YES → Should the transaction fail if the API call fails?
    ↓
    YES → Two-phase approach: call API first (outside transaction), then perform DB writes in transaction
    NO → Move OUTSIDE — API call is non-critical; don't hold up transaction for it
NO → Is the API call a queue dispatch (fast, no network latency)?
    ↓
    YES → `dispatch()` after commit — use `dispatchAfterResponse()` or queue after commit hook
    NO → Move OUTSIDE — any non-database operation should be outside the transaction

---

## Rationale

Database transactions hold locks until commit. Including slow external API calls inside the transaction means locks are held during network latency, increasing deadlock probability. Non-idempotent API calls inside transactions can't be undone by rollback. The pattern: perform DB operations in the transaction, perform external calls after commit.

---

## Recommended Default

**Default:** ALL external API calls, email sends, and queue dispatches OUTSIDE the transaction.
**Reason:** Transactions should only include database operations. External calls hold locks, can't be rolled back, and increase deadlock risk.

---

## Risks Of Wrong Choice

* API call inside transaction: 500ms API latency → transaction holds locks for 500ms → deadlock on contested rows
* Email inside transaction: Transaction succeeds but email fails — user doesn't get email but DB writes are committed
* Payment inside transaction: Transaction fails after payment is charged — user is charged but order is not created
* Queue dispatch inside transaction: Job dispatched; transaction later fails — job executes with data that doesn't exist in DB yet
* Dispatch after commit: Use `dispatch()` normally — Laravel dispatches after commit by default (since 9.x); verify behavior

---

## Related Rules

* Enforce Service-Level Transaction Boundaries
* Enforce Deadlock Retry for High-Contention Operations

---

## Related Skills

* Set Transaction Boundaries at the Service Orchestration Level
* Use DB::transaction() Closure for Simple Atomic Operations
