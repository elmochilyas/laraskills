# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Unit of Work pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Eloquent UoW trust vs custom UoW implementation
* Decision 2: UoW scope — request-bound vs explicit transaction control
* Decision 3: Cross-model atomicity — Eloquent auto-save vs explicit transaction

---

# Architecture-Level Decision Trees

---

## Decision: Eloquent UoW Trust vs Custom UoW Implementation

---

## Decision Context

Choose whether to rely on Eloquent's built-in change tracking (Unit of Work) or implement a custom UoW for explicit change management.

---

## Decision Criteria

* performance considerations: Eloquent UoW stores original values per model (memory); custom UoW adds tracking overhead
* architectural considerations: Eloquent UoW is sufficient for most cases; custom UoW enables bulk operations and explicit flushing
* security considerations: custom UoW can enforce security checks on commit; Eloquent's auto-save may bypass them
* maintainability considerations: Eloquent UoW requires no additional code; custom UoW adds significant infrastructure

---

## Decision Tree

Does the application require bulk operations (insert/update hundreds of records in one transaction)?
↓
YES → Can Eloquent's chunk/insert/upsert methods handle the load?
    YES → Eloquent's built-in UoW is sufficient (use `insert()`, `upsert()`, `chunk()`)
    NO → Custom UoW with explicit change tracking and batch flush
NO → Does the domain require explicit `flush()` control (commit all changes at once)?
    YES → Custom UoW with change tracking and explicit `commit()`/`rollback()`
    NO → Is there a need to track changes across non-Eloquent objects (plain PHP domain objects)?
        YES → Custom UoW to manage domain object state alongside persistence
        NO → Eloquent's built-in UoW is sufficient
    ↓
    Is the application performance-critical with hundreds of model changes per request?
    YES → Evaluate custom UoW for batch operations (but benchmark first)
    NO → Eloquent's UoW is fine

---

## Rationale

Eloquent's built-in change tracking (dirty attribute detection on `save()`) is a fully functional Unit of Work for most Laravel applications. Custom UoW implementations are only justified when (1) bulk operations need optimization, (2) explicit flush control is required, or (3) non-Eloquent domain objects need change tracking.

---

## Recommended Default

**Default:** Rely on Eloquent's built-in UoW (dirty tracking on `save()`). Implement custom UoW only for bulk operations or non-Eloquent domain objects.

**Reason:** Eloquent's UoW is mature, tested, and requires zero additional code. Custom UoW adds significant infrastructure costs (tracking, flushing, identity mapping) that are rarely justified.

---

## Risks Of Wrong Choice

Custom UoW for simple apps: massive over-engineering, more files, harder to debug. Eloquent UoW for bulk operations: N queries instead of batch insert, performance problems.

---

## Related Rules

- Rule 1: Eloquent's built-in change tracking IS a Unit of Work — use it by default
- Rule 2: For cross-entity transactions, wrap in `DB::transaction()` even if UoW tracks changes

---

## Related Skills

- Apply Unit of Work with Eloquent
- Implement Custom Unit of Work

---

## Decision: UoW Scope — Request-Bound vs Explicit Transaction Control

---

## Decision Context

Choose whether the Unit of Work spans the entire request (accumulating changes until end) or is explicitly scoped per transaction.

---

## Decision Criteria

* performance considerations: request-bound UoW holds references for entire request; explicit scoping releases memory earlier
* architectural considerations: request-bound is conventional; explicit control is more predictable
* security considerations: explicit control prevents accidental persistence of unintended changes
* maintainability considerations: request-bound is simpler; explicit control requires disciplined begin/commit

---

## Decision Tree

Does the request modify models at different points and need all changes saved atomically?
↓
YES → Request-bound UoW (changes accumulate, commit at request end if not already saved)
    ↓
    Is this a write-heavy request with 10+ model changes?
    YES → Consider explicit transaction scope to prevent partial saves if exception occurs mid-request
    NO → Request-bound is fine
NO → Does each operation within the request need its own transaction boundary?
    YES → Explicit transaction per operation (wrap each operation in `DB::transaction()`)
    ↓
    Are operations independent (one failing shouldn't roll back others)?
    YES → Definitely explicit per-operation transactions
    NO → Request-bound UoW with one overarching transaction
NO → Does long-running process (queue job, Octane request) accumulate stale model references?
    YES → Explicit scope: release UoW after each transaction (`refresh()` models)
    NO → Request-bound is fine

---

## Rationale

Request-bound UoW works for most web requests where changes happen sequentially. Explicit transaction scope is needed for (1) independent operations within a request, (2) long-running processes where stale references accumulate, and (3) operations requiring precise rollback boundaries.

---

## Recommended Default

**Default:** Request-bound UoW for standard web requests. Explicit `DB::transaction()` scoping for independent operations or long-running processes.

**Reason:** Request-bound UoW is conventional, zero-config, and matches the typical request lifecycle. Explicit scoping prevents stale reference accumulation and provides precise rollback control.

---

## Risks Of Wrong Choice

Request-bound for long processes: identity map growth, stale model references, memory issues. Explicit for everything: verbose begin/commit, accidental scope omissions, partial persistence.

---

## Related Rules

- Rule 4: In long-running processes (queues, Octane), refresh models or use explicit UoW scoping

---

## Related Skills

- Scope Database Transactions
- Manage Model Freshness in Octane

---

## Decision: Cross-Model Atomicity — Eloquent Auto-Save vs Explicit Transaction

---

## Decision Context

Choose how to ensure atomicity when modifying multiple models — rely on Eloquent's auto-save or wrap in explicit transactions.

---

## Decision Criteria

* performance considerations: explicit transactions increase locking duration; auto-save is immediate
* architectural considerations: auto-save may cause partial persistence if mid-save exception occurs
* security considerations: explicit transactions ensure all-or-nothing for security-critical operations
* maintainability considerations: explicit transactions are more code but clearer intent

---

## Decision Tree

Are multiple models being modified in a single request/operation?
↓
YES → Do all modifications need to succeed or fail together?
    YES → Wrap in `DB::transaction()` — never rely on Eloquent auto-save for atomicity
    ↓
    Can mid-operation failures leave data in an inconsistent state?
    YES → Explicit `DB::transaction()` is mandatory
    NO → Consider explicit transaction anyway (safe default for multi-model operations)
    NO → Individual saves are fine (no atomicity requirement)
NO → Is this a single-model modification?
    YES → Eloquent `save()` is sufficient (single operation is inherently atomic)
    ↓
    Does the model have side effects (events, relationships, observers) that must be atomic?
    YES → Wrap in `DB::transaction()` to ensure event-driven side effects are consistent
    NO → Simple `save()` is sufficient

---

## Rationale

Eloquent's auto-save on individual models is not a substitute for explicit transactions when multiple models are involved. Without `DB::transaction()`, an exception after the first `save()` leaves the first model persisted while the second was never written. Always wrap multi-model changes in `DB::transaction()`.

---

## Recommended Default

**Default:** `DB::transaction()` for any operation that modifies 2+ models. Single model → `save()` is sufficient unless side effects must be atomic.

**Reason:** Eloquent's `save()` commits to the database immediately. Without a wrapping transaction, partial persistence occurs on mid-operation failure. `DB::transaction()` guarantees atomicity.

---

## Risks Of Wrong Choice

No transaction for multi-model changes: partial persistence, inconsistent data, debugging nightmares. Transaction for single model saves: unnecessary locking, code verbosity.

---

## Related Rules

- Rule 3: Always use `DB::transaction()` for multi-model modifications
- Rule 2: For cross-entity transactions, wrap in `DB::transaction()`

---

## Related Skills

- Manage Database Transactions
- Apply Unit of Work with Eloquent
