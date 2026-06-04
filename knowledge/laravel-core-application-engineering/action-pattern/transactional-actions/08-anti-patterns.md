# ECC Anti-Patterns — Transactional Actions

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Transactional Actions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Action Self-Managing Database Transactions
2. Phantom Side Effects (Side Effects Inside Transaction Without afterCommit)
3. Savepoint Confusion (Inner Transaction Inside Outer Transaction)
4. Transaction Only on Happy Path (No Rollback on Exception)

---

## Repository-Wide Anti-Patterns

- Business Logic in Models (implicit transaction in model events)
- Hidden Database Queries (queries inside transaction that should be outside)
- Event Explosion (afterCommit not used for side-effect events)

---

## Anti-Pattern 1: Action Self-Managing Database Transactions

### Category
Architecture | Reliability

### Description
A sub-action calls `DB::transaction()`, `DB::beginTransaction()`, or `DB::commit()` internally, making it unsafe for composition into larger workflows.

### Why It Happens
Developers add `DB::transaction()` to every action "for safety." The action was originally standalone and later composed without removing the transaction.

### Warning Signs
- `DB::transaction()` call in any action that is injected into another class
- Action was originally a console command or standalone entry point
- Inconsistent behavior between standalone and composed execution

### Why It Is Harmful
Creates savepoints (not nested transactions) when called inside an outer transaction. Partial commits possible. The action cannot be safely reused in different composition contexts.

### Real-World Consequences
A refund workflow calls `RefundOrderAction` (with its own transaction) inside a `ProcessRefundService` transaction. The refund "succeeds" (savepoint) while the outer transaction rolls back. Customer is refunded but the order status is not updated.

### Preferred Alternative
Actions must be transaction-agnostic. The outermost orchestrator owns the transaction boundary.

### Refactoring Strategy
1. Remove `DB::transaction()`, `DB::beginTransaction()`, `DB::commit()` from all sub-actions.
2. Ensure the orchestrator wraps the workflow in `DB::transaction()`.
3. Move side-effect calls to `DB::afterCommit()`.
4. Document that this sub-action is transaction-agnostic.

### Detection Checklist
- [ ] Grep `DB::transaction(` in `App\Actions\` files
- [ ] Verify each action that has a transaction is never injected as a dependency

### Related Rules
- Rule: Actions Must Not Manage Their Own Database Transactions

### Related Skills
- Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects

### Related Decision Trees
- Decision: Transaction Ownership — Action vs Orchestrator

---

## Anti-Pattern 2: Phantom Side Effects

### Category
Reliability

### Description
Side effects (emails, webhooks, cache clears, event dispatches) execute inside a database transaction. If the transaction rolls back, the side effects have already occurred — they are "phantom" operations that cannot be undone.

### Why It Happens
Side effects are placed in the natural flow of the code after database writes, without considering that the transaction might roll back after the side effect executes.

### Warning Signs
- `Mail::send()` or event dispatch inside a `DB::transaction()` callback
- Cache clears after `Model::save()` but before `DB::commit()`
- External API calls inside a transaction scope

### Why It Is Harmful
Phantom operations: email sent, but user not created; webhook fired, but order not persisted. The system is in an inconsistent state that cannot be recovered.

### Real-World Consequences
A welcome email is sent after `User::create()` inside a transaction. The transaction rolls back due to a constraint violation on a related table. The user does not exist, but the welcome email was already delivered.

### Preferred Alternative
Use `DB::afterCommit()` to defer all side effects until the outermost transaction commits. If the transaction rolls back, all afterCommit callbacks are discarded.

### Refactoring Strategy
1. Find all side-effect operations inside `DB::transaction()` callbacks.
2. Wrap each side effect in `DB::afterCommit(fn () => ...)`.
3. Verify that afterCommit callbacks are idempotent.
4. Add a test that rolls back the transaction and asserts no side effects occurred.

### Detection Checklist
- [ ] Grep for `Mail::`, `event(`, `Cache::`, `Http::` inside `DB::transaction()` closures
- [ ] Check if afterCommit is used for side effects

### Related Rules
- Rule: Always Use `DB::afterCommit()` for Side-Effecting Operations

### Related Skills
- Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects

### Related Decision Trees
- Decision: Transaction Ownership — Action vs Orchestrator
