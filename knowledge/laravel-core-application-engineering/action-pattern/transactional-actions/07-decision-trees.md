# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Transactional Actions
**Generated:** 2026-06-03

---

# Decision Inventory

* Action Transaction Ownership — Standalone vs Composed
* Side Effect Strategy — afterCommit vs Direct Execution
* afterCommit vs Queue Dispatch for Heavy Callbacks

---

# Architecture-Level Decision Trees

---

## Decision 1: Action Transaction Ownership — Standalone vs Composed

---

## Decision Context

Whether an action should manage its own database transaction with `DB::transaction()` or remain transaction-agnostic.

---

## Decision Criteria

* Whether the action is ever composed into a larger workflow
* Whether the action is a standalone entry point (scheduled command)
* Whether the action is called from a service that owns the transaction

---

## Decision Tree

Is the action called from an orchestrator that already has a transaction (service, another action, or caller)?
↓
YES → Action must NOT manage its own transaction
    `DB::transaction()` inside a transaction creates a savepoint, not a nested transaction
    Savepoint confusion: partial commits possible, isolation not guaranteed
NO → Is the action a standalone entry point (scheduled command, console command)?
    YES → MAY manage its own transaction — but document this assumption
    NO → Is the action ALWAYS the top-level caller?
        YES → MAY manage its own transaction
        NO → Stay transaction-agnostic (default)
NO → Could the action be composed into a larger workflow in the future?
    YES → Stay transaction-agnostic — defer transaction ownership to future orchestrator
    NO → Manage own transaction if standalone

---

## Rationale

An action that manages its own transaction cannot be safely composed into a larger workflow. The safe default is transaction-agnostic. Standalone actions (scheduled commands, maintenance operations) may manage their own transaction but must document that assumption.

---

## Recommended Default

**Default:** Actions are transaction-agnostic. The outermost orchestrator owns the transaction boundary.
**Reason:** Transaction-agnostic actions are composable into any workflow. Transaction ownership in sub-actions creates savepoint confusion and partial-commit risks.

---

## Risks Of Wrong Choice

* Sub-action with own transaction: Savepoint created inside outer transaction, partial commits possible
* Standalone action without transaction: No atomicity for multi-step standalone operation
* Transaction in composable action: Cannot be safely reused in different contexts

---

## Related Rules

* Actions Must Not Manage Their Own Database Transactions (05-rules.md)
* Sub-Actions Must Not Create Savepoints Inside Parent Transactions (05-rules.md)

---

## Related Skills

* Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects

---

## Decision 2: Side Effect Strategy — afterCommit vs Direct Execution

---

## Decision Context

Whether a side-effecting action (email, event, webhook, cache clear) should use `DB::afterCommit()` to defer execution or execute directly.

---

## Decision Criteria

* Whether the side effect is inside a database transaction
* Whether the side effect would be incorrect if the transaction rolls back
* Whether the side effect should execute regardless of transaction outcome

---

## Decision Tree

Is the action called inside a database transaction (current or potential)?
↓
YES → Would the side effect be incorrect if the transaction rolls back?
    YES → Use `DB::afterCommit()` — deferred until transaction commits
    NO → Is the side effect an audit log or monitoring metric that should fire even on rollback?
        YES → Execute directly (not wrapped in afterCommit) — document this exception
        NO → Use `DB::afterCommit()` — safe default for all side effects
NO → Is there a possibility the action will be called inside a transaction in the future?
    YES → Use `DB::afterCommit()` — future-proof, fires immediately if no transaction is active
    NO → Execute directly — no transaction context to worry about
NO → Is the side effect heavy (>5ms, API call, file generation)?
    YES → afterCommit with queued job: `DB::afterCommit(fn() => DispatchJob::dispatch())`
    NO → afterCommit with inline callback

---

## Rationale

Without afterCommit, a side effect that executes during a transaction persists even if the transaction later rolls back — creating phantom side effects. afterCommit ensures side effects only execute after the outermost transaction commits.

---

## Recommended Default

**Default:** Use `DB::afterCommit()` for all side effects. Execute directly only for audit logging that must fire on rollback.
**Reason:** afterCommit prevents phantom side effects on rolled-back transactions. It is the safe default that works in any transaction context.

---

## Risks Of Wrong Choice

* Direct execution in transaction: Phantom email sent on rollback
* afterCommit for audit log: Audit trail lost when transaction rolls back
* Heavy callback in afterCommit: Blocks HTTP response

---

## Related Rules

* Always Use `DB::afterCommit()` for Side-Effecting Operations (05-rules.md)
* Prevent Phantom Side Effects on Transaction Rollback (05-rules.md)

---

## Related Skills

* Skill: Test afterCommit Behavior in Actions

---

## Decision 3: afterCommit vs Queue Dispatch for Heavy Callbacks

---

## Decision Context

Whether to execute a heavy afterCommit callback inline (blocking the HTTP response) or dispatch it to the queue (asynchronous execution).

---

## Decision Criteria

* Execution time of the callback
* Whether the callback result is needed for the response
* Whether the callback is idempotent (safe for queue retry)

---

## Decision Tree

Does the callback execute in under 5ms (cache clear, single email, simple event dispatch)?
↓
YES → afterCommit inline — lightweight, no queue overhead
NO → Is the callback an API call, file generation, batch email, or report compilation?
    YES → Queue dispatch inside afterCommit:
        ```php
        DB::afterCommit(fn() => HeavyJob::dispatch($data));
        ```
    NO → Is the callback result needed for the HTTP response?
        YES → afterCommit inline (response must wait) — but reconsider if it can be deferred
        NO → Queue dispatch
NO → Is the callback idempotent (safe to retry on queue failure)?
    YES → Queue dispatch with retries
    NO → afterCommit inline (avoid duplicate side effects on retry) or queue without retries

---

## Rationale

Heavy afterCommit callbacks execute sequentially after the transaction commits, blocking the HTTP response. A 30-second report generation inside afterCommit delays the response by 30 seconds. Dispatch to queue returns immediately and executes on the worker.

---

## Recommended Default

**Default:** Lightweight callbacks (<5ms) inline in afterCommit; heavy callbacks dispatched to queue inside afterCommit
**Reason:** Queue dispatch keeps HTTP responses fast. Inline afterCommit is fine for fast, simple operations.

---

## Risks Of Wrong Choice

* Heavy callback inline: Blocks HTTP response for seconds/minutes
* Queue dispatch for required response: Response sent before callback completes
* Inline for 100+ callbacks: Sequential execution after commit delays response linearly

---

## Related Rules

* Delegate Heavy `afterCommit` Callbacks to the Queue (05-rules.md)

---

## Related Skills

* Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects
