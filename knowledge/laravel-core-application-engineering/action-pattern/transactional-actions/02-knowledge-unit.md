# Transactional Actions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Actions Pattern
- **Knowledge Unit:** Transactional Actions
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Transactional actions govern whether and how an action class interacts with database transaction boundaries. The core architectural decision is that actions should NOT manage their own transactions — they delegate transaction control to the orchestrator that calls them. This enables flexible composition: the same action can participate in a single-operation transaction, a multi-action workflow transaction, or no transaction at all, without changing its code.

The engineering significance is that transaction ownership is the primary architectural signal distinguishing actions from services. A service method typically owns its transaction. An action method typically does not. Violating this distinction by making actions transactional creates composition inflexibility — the action cannot be safely composed into a larger workflow without risking savepoint confusion or partial commits.

---

## Core Concepts

### Transaction Ownership Inversion
Services and actions have opposite transaction ownership patterns:

```
Service: ─── owns transaction ─── calls operations
Action:  ─── performs operation ─── does not own transaction
```

A service method wraps its operations in `DB::transaction()` because the service owns the workflow. An action method performs its single operation without `DB::transaction()` because the action does not know whether it is the root of the workflow or a leaf in a larger tree.

### The Composition Rule for Transactions
If an action might ever be composed into a larger transaction (called from a service, called from another action, called from a queued job orchestrator), it must NOT manage its own transaction. The rule is: an action should be transaction-agnostic by default.

### Savepoint vs Nested Transaction
When a sub-action that manages its own transaction is called within an outer transaction, the sub-action's `DB::transaction()` call creates a savepoint — a rollback marker inside the existing transaction, not a true nested transaction. The savepoint can roll back the sub-action's changes without aborting the outer transaction, but the database is still in a transaction. This is confusing because the API looks like nesting but the behavior is not:

```php
// Outer transaction
DB::transaction(function () {
    // Inner "transaction" — actually a savepoint
    DB::transaction(function () {
        DB::table('logs')->insert(['message' => 'step 1']);
        throw new \Exception('rollback inner');
    });
    // Logs insert is rolled back, but outer transaction continues
    DB::table('users')->insert(['name' => 'user 1']);
    // This insert succeeds — outer transaction commits
});
```

The inner `throw` only rolls back to the savepoint. The outer transaction commits. This is almost never the intended behavior for a composed action.

---

## Mental Models

### Action as Leaf Node
An action is a leaf in the call tree. It does not know the tree's structure. It receives input, performs one operation, and returns a result. The transaction boundary is managed by whichever node is the root of the tree. The leaf should not attempt to be its own root.

### Transaction as Orchestrator Concern
A developer reading an orchestrated workflow should see exactly one `DB::transaction()` call — at the service level. If sub-actions also wrap themselves in transactions, the orchestration code implies a single boundary but executes with multiple savepoints. The transaction is an architectural concern, not an action concern.

### afterCommit as Post-Transaction Protocol
`DB::afterCommit()` is the only mechanism an action should use to schedule post-operation side effects. It is the action's way of saying "run this after whatever transaction I am inside commits." This mechanism is transparent to the orchestrator — the action registers the callback, and the outermost commit triggers it.

---

## Internal Mechanics

### afterCommit Registration and Execution
When `DB::afterCommit()` is called inside an action that is inside a service's transaction, the callback is queued on the connection's transaction manager:

1. Action calls `DB::afterCommit(fn () => dispatch(new Event))`
2. The callback is stored in `DatabaseTransactionsManager::$callbacks`
3. The service's outermost `DB::transaction()` closure executes all composed actions
4. The outermost transaction commits
5. After commit, all queued callbacks fire in registration order

If the outermost transaction rolls back, all `afterCommit` callbacks are discarded — regardless of which action registered them.

### Savepoint Semantics in Practice
MySQL and PostgreSQL support savepoints. SQLite does not. When a sub-action calls `DB::transaction()` inside an outer transaction on SQLite, Laravel does not create a savepoint — it silently reuses the existing transaction. The sub-action's "rollback" does nothing because there is no savepoint to roll back to. This means transactional actions can silently become no-ops on SQLite (commonly used in testing).

### Transaction Retry Caveats
When a transaction is retried due to deadlock (Laravel's `$attempts` parameter), all code inside the closure re-executes. If an action inside the closure has side effects outside the database (API calls, file writes, email sends), those side effects repeat on each retry. Actions that manage transactions and have external side effects risk double execution.

---

## Patterns

### Action Without Transaction (Recommended)
The action performs its operation without wrapping in `DB::transaction()`:

```php
class CreateUserAction
{
    public function __construct(private UserRepository $users) {}

    public function execute(array $data): User
    {
        return $this->users->create($data);
        // No transaction — delegate to orchestrator
    }
}
```

- **Purpose**: Keep the action composable into any transaction scope.
- **Benefits**: Maximum flexibility; the orchestrator decides the transaction boundary.
- **Tradeoffs**: The action's single operation is not individually atomic — if the action's operation has multiple database writes, the orchestrator must wrap them.

### Action With afterCommit Side Effects
The action schedules post-commit work without knowing whether it is inside a transaction:

```php
class SendWelcomeAction
{
    public function execute(User $user): void
    {
        DB::afterCommit(fn () => Mail::to($user)->send(new WelcomeMail));
        // Callback fires after the outermost transaction commits
        // If no transaction is active, fires immediately
    }
}
```

- **Purpose**: Ensure side effects only fire after the database change is durable.
- **Benefits**: Safe for both transactional and non-transactional contexts.
- **Tradeoffs**: The side effect is decoupled from the action's return — the caller cannot know whether the side effect executed.

### Stateful Transaction for Standalone Actions
An action that is guaranteed to always be the top-level caller (never composed) MAY manage its own transaction:

```php
class PurgeExpiredTokensAction
{
    public function execute(): int
    {
        return DB::transaction(function () {
            return DB::table('tokens')->where('expires_at', '<', now())->delete();
        });
    }
}
```

- **Purpose**: Wrap a standalone maintenance operation that is never composed.
- **Benefits**: Self-contained atomicity; no orchestrator required.
- **Tradeoffs**: If the action is later composed into a larger workflow, the transaction must be removed. This is an assumption that can become invalid.

---

## Architectural Decisions

### When to Break the "No Transaction" Rule
The "actions should not manage transactions" rule has one exception: actions that are guaranteed to be standalone top-level callers. This includes scheduled commands, console commands, and maintenance operations. For all other actions, the rule stands.

How to determine: "Could this action ever be called from a service that wraps multiple actions?" If yes, no transaction. The safe default is no transaction — adding a transaction later is easier than removing one.

### Savepoint Awareness
Teams that allow transactional actions must educate developers about savepoint behavior. The expectation that `DB::transaction()` inside an action creates an independent nested transaction is wrong for every supported database. Savepoints are markers, not boundaries.

### afterCommit as Default Side Effect Strategy
Every side-effecting action (email, event dispatch, cache clear, webhook call) should use `DB::afterCommit()` by default. This ensures correctness even when the action is called inside a transaction. The cost is a minor indirection in the execution order — the side effect fires slightly later than an immediate call would.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Composable actions — flexible transaction scope | No per-action atomicity guarantee | Orchestrator must manage atomicity for multi-action workflows |
| afterCommit prevents phantom side effects | afterCommit adds temporal indirection | Design actions so side effects are not time-sensitive |
| Savepoints allow partial rollback in nesting | Savepoints differ from nested transactions mentally | Educate team about savepoint vs nesting semantics |
| Standalone actions can own their transaction | If standalone assumption becomes invalid, refactoring needed | Prefer no transaction as the default; add only when proven necessary |

---

## Performance Considerations

### Transaction Overhead Per Action
Opening a `DB::transaction()` for a single-action operation adds approximately 0.1-0.5ms for the begin/commit round trip. For standalone actions, this is negligible. For composed actions where each sub-action also opens a transaction (with savepoints), the overhead multiplies — each savepoint adds a database round trip.

### afterCommit Callback Queue Size
Each `DB::afterCommit()` call appends to the transaction manager's callback array. After the transaction commits, the callbacks fire sequentially. If 50 actions each register an afterCommit callback, they all fire after commit — potentially delaying the response by the total execution time of all callbacks. Heavy afterCommit chains should be queued:

```php
DB::afterCommit(fn () => dispatch(new ProcessOrderJob($orderId))); // Delegate to queue
```

### Savepoint Performance on Large Transactions
Creating savepoints in a very large transaction (thousands of rows modified, many indexes) adds overhead proportional to the transaction size. Each savepoint records the state of the entire transaction. In practice, this is rarely a concern for typical Laravel workflows.

---

## Production Considerations

### afterCommit in Octane
In Octane, `DB::afterCommit()` callbacks may persist across requests if the transaction manager instance is reused. Callbacks registered in one request can fire during the next request's commit cycle. Always ensure afterCommit callbacks are scoped correctly for long-lived processes.

### Testing Transactional Actions
When testing an action that uses `DB::afterCommit()`, wrap the test in `DatabaseTransactions` or `RefreshDatabase` to ensure transaction state is clean. If the test does not use a transaction, afterCommit callbacks fire immediately after the action's database operation, which may not match production behavior.

### Monitoring Savepoint Usage
If the team allows transactional actions (savepoints), monitor for "savepoint within savepoint" chains in logs. Chains deeper than 2-3 levels indicate a composition problem — an action inside a service inside another service creates a tower of savepoints that is hard to reason about.

---

## Common Mistakes

### Action Both Owns Transaction and Composes
An action that calls `DB::transaction()` and also calls other actions creates a hybrid that is neither a clean action nor a clean service. The action has side effects (transaction management) and orchestration (calling sub-actions) — it should be a service.

### Assuming Savepoint Isolation
A developer writes an action that wraps its work in `DB::transaction()`, assuming the inner operation is isolated from the outer. When the inner operation "commits" (releases savepoint), the data is not visible to other connections — MySQL's InnoDB default isolation level (REPEATABLE READ) means the outer transaction still sees the snapshot from when it began.

### afterCommit Without Active Transaction
If an action calls `DB::afterCommit()` when no transaction is active, the callback fires immediately. This is documentation: "If there is no active transaction, the callbacks will be executed immediately" (Laravel docs). An action that expects its callback to be deferred will not get that behavior when called outside a transaction.

---

## Failure Modes

### Phantom Side Effects on Rollback
An action sends an email directly (without `DB::afterCommit()`), the orchestrator's transaction rolls back. The email was sent but the database was not updated. The user receives a confirmation for an operation that did not happen. Always use `DB::afterCommit()` for side effects in transactional contexts.

### Savepoint Rollback Without Outer Rollback
A transactional action called inside a service creates a savepoint. The action throws an exception, which is caught by the service. The savepoint is released but the outer transaction continues. The action's database changes are rolled back, but the service's other operations commit. The overall state is partially applied — the action's changes are lost, but the workflow continues as if they succeeded.

### SQLite Savepoint Silent No-Op
In testing (SQLite by default in Laravel), nested `DB::transaction()` calls do not create savepoints. The inner "transaction" is a no-op. Tests pass. Production (MySQL/PostgreSQL) uses savepoints. The test passes, but the production behavior is different. Test with MySQL or PostgreSQL if the team uses transactional actions.

---

## Ecosystem Usage

### Laravel Framework
The `DatabaseTransactionsManager` class manages the `afterCommit` callback queue. The `ManagesTransactions` trait on the connection class provides `transaction()`, `beginTransaction()`, `commit()`, and `rollBack()` methods. The framework intentionally does not provide a "transactional action" pattern — transaction management is a connection-level concern.

### Spatie QueueableAction
The `QueueableAction` trait does not provide transaction management. Actions using this trait must manage transactions through the orchestrator, staying consistent with the "action does not own transaction" pattern.

### Laravel Jetstream
Jetstream actions do not manage their own transactions. The Jetstream controllers (or Livewire components) call actions within controller-level transactions when needed. This matches the recommended pattern.

---

## Related Knowledge Units

### Prerequisites
- Action Class Design — understanding the single-method structure is prerequisite to understanding transaction boundaries
- Transaction Management (Service Layer) — deeper coverage of savepoint semantics, transaction isolation, and afterCommit mechanics

### Related Topics
- Action Composition — how transaction ownership interacts with action composition depth
- Service Orchestration — how orchestrators manage transaction boundaries for composed actions

### Advanced Follow-up Topics
- Stateless Service Design — how state management affects transaction isolation in long-lived processes
- Queued Actions — how transactions interact with async dispatched actions

---

## Research Notes

- The "action should not own its transaction" rule is widely documented but inconsistently applied in practice. Many production codebases have actions with `DB::transaction()` that happen to never be composed — they work correctly only by coincidence.
- Laravel's savepoint implementation uses `SAVEPOINT` on MySQL/PostgreSQL but silently ignores nesting on SQLite. This creates a testing blind spot — behavior differs between test (SQLite) and production (MySQL/PostgreSQL).
- `DB::afterCommit()` was added in Laravel 8. Before Laravel 8, there was no standard way to schedule post-commit work. The Action pattern (which predates Laravel 8 in the community) used events or immediate side effects, which were incorrect for transactional contexts.
- The `afterCommit` callback fires immediately if no transaction is active. This is documented but surprising — an action written for transactional contexts behaves differently when called outside one. Actions that depend on deferred execution must explicitly check `DB::transactionLevel() > 0`.