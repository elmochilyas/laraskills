# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Action Pattern
**Knowledge Unit:** Action Composition
**Generated:** 2026-06-03

---

# Decision Inventory

* Action Composition Depth — Action vs Service Orchestrator
* Data Flow Between Actions — Return Values vs Shared State
* Transaction Ownership — Action vs Orchestrator

---

# Architecture-Level Decision Trees

---

## Decision 1: Action Composition Depth — Action vs Service Orchestrator

---

## Decision Context

Whether a class that coordinates multiple sub-actions should remain an action (composing) or be extracted to a service (orchestrating).

---

## Decision Criteria

* Number of action dependencies in the constructor
* Whether the class manages a transaction boundary
* Whether the class coordinates execution order vs delegates sub-operations

---

## Decision Tree

How many action dependencies does the class have?
↓
0-3 → Action composition: clean, single-responsibility maintained
4+ → Extract to Service — the class is orchestrating, not composing
    Create `{Domain}Service` with the 4+ action dependencies
    Service may have multiple public methods (one per workflow)
NO → Does the class manage a `DB::transaction()` boundary?
    YES → Service — transaction ownership is a service responsibility
    NO → Action — no transaction, single operation
NO → Does the class have more than one public method?
    YES → Service — actions must have exactly one public method
    NO → Action

---

## Rationale

The number of action dependencies is the primary architectural signal distinguishing composition from orchestration. Below 4 dependencies, the action's single responsibility is clear. At 4+, the class is coordinating multiple sub-operations — a service responsibility.

---

## Recommended Default

**Default:** Action for 1-3 action dependencies; Service for 4+ or when transaction ownership is needed
**Reason:** 3 dependencies keep the action focused and testable. Beyond 3, the class has crossed from composing to orchestrating.

---

## Risks Of Wrong Choice

* 5+ deps in action: Tower of actions, hard to trace, violates single responsibility
* Service with 1-2 deps: Over-engineering for simple composition
* Transaction in action: Creates savepoint confusion when composed

---

## Related Rules

* Limit Composition Depth to 3 Action Dependencies (05-rules.md)
* Sub-Actions Must Not Manage Their Own Transactions (05-rules.md)

---

## Related Skills

* Skill: Compose Actions into a Workflow
* Skill: Refactor an Over-Composed Action to a Service

---

## Decision 2: Data Flow Between Actions — Return Values vs Shared State

---

## Decision Context

How to pass data between composed actions — through explicit return values or through shared mutable state (static properties, singleton services).

---

## Decision Criteria

* Whether the data is the result of one action needed by another
* Whether shared state is read-only or mutable
* Whether the composition chain runs in a long-lived process (Octane)

---

## Decision Tree

Does sub-action A produce data that sub-action B needs?
↓
YES → Return value: `$result = $actionA->execute($data); $actionB->execute($result);`
NO → Do sub-actions share a singleton service?
    YES → Does the singleton hold mutable state?
        YES → Refactor: pass data through return values instead
            Shared mutable state creates temporal coupling and leaks across requests in Octane
        NO → Read-only singletons (config, cached settings) are safe to share
    NO → No data sharing needed — actions are independent
NO → Do sub-actions need to communicate intermediate results?
    YES → Return values exclusively. Never write to shared state.
    NO → Independent execution is fine

---

## Rationale

Shared mutable state creates implicit temporal coupling — sub-action A must execute before sub-action B, but this ordering is hidden. In long-lived processes (Octane), shared mutable state leaks across requests. Return values make data flow explicit and testable.

---

## Recommended Default

**Default:** Pass data through return values exclusively. Never use shared mutable state between composed actions.
**Reason:** Return values make data flow explicit, testable, and safe in long-lived processes. Shared mutable state creates hidden coupling and cross-request leakage.

---

## Risks Of Wrong Choice

* Shared mutable state: Hidden execution order dependencies, Octane data leakage
* Read-only singleton for mutable data: Same action reads stale data from previous request

---

## Related Rules

* Pass Data Through Return Values, Not Shared Mutable State (05-rules.md)
* Do Not Compose Actions with Shared Singleton Mutable State (05-rules.md)

---

## Related Skills

* Skill: Compose Actions into a Workflow

---

## Decision 3: Transaction Ownership — Action vs Orchestrator

---

## Decision Context

Whether a sub-action should manage its own database transaction or defer to the orchestrator.

---

## Decision Criteria

* Whether the sub-action is ever composed into a larger workflow
* Whether the sub-action is a standalone entry point (scheduled command)
* Whether the sub-action produces side effects (email, webhook, event)

---

## Decision Tree

Is the sub-action called from an orchestrator that already has a transaction?
↓
YES → Sub-action must NOT manage its own transaction
    Inner `DB::transaction()` creates a savepoint, not a nested transaction
    Savepoints can roll back independently — partial commits possible
NO → Is the sub-action a standalone entry point (scheduled command, console command)?
    YES → MAY manage its own transaction — but document that it is standalone
    NO → Default: no transaction — keep transaction-agnostic for future composability
NO → Does the sub-action produce side effects (email, webhook, cache clear)?
    YES → Use `DB::afterCommit()` to defer side effects until transaction commits
    NO → No transaction needed

---

## Rationale

An action that manages its own transaction cannot be safely composed into a larger workflow. If called inside an outer transaction, its `DB::transaction()` creates a savepoint with confusing semantics and partial-commit risks.

---

## Recommended Default

**Default:** Sub-actions are transaction-agnostic (never call DB::transaction). The outermost orchestrator owns the transaction boundary. Side effects use `DB::afterCommit()`.
**Reason:** Transaction-agnostic actions are composable into any workflow. `afterCommit` prevents phantom side effects on rollback.

---

## Risks Of Wrong Choice

* Sub-action with own transaction: Savepoint confusion, partial commits possible
* Side effect without afterCommit: Phantom email sent on rolled-back transaction
* Orchestrator without transaction: No atomicity for multi-action workflows

---

## Related Rules

* Actions Must Not Manage Their Own Database Transactions (05-rules.md)
* Always Use `DB::afterCommit()` for Side-Effecting Operations (05-rules.md)
* Make Sub-Action Execution Order Explicit (05-rules.md)

---

## Related Skills

* Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects
