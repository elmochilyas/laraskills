# ECC Standardized Knowledge — Transactional Actions

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Action Pattern |
| **Knowledge Unit** | Transactional Actions |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — Business Logic Organization |
| **Last Updated** | 2026-06-02 |

---

## Overview

Transactional actions govern whether and how an action class interacts with database transaction boundaries. The core architectural decision is that actions should NOT manage their own transactions — they delegate transaction control to the orchestrator that calls them. This enables flexible composition: the same action can participate in a single-operation transaction, a multi-action workflow transaction, or no transaction at all, without changing its code.

The engineering significance is that transaction ownership is the primary architectural signal distinguishing actions from services. A service method typically owns its transaction. An action method typically does not. Violating this distinction by making actions transactional creates composition inflexibility — the action cannot be safely composed into a larger workflow without risking savepoint confusion or partial commits.

---

## Core Concepts

### Transaction Ownership Inversion

Services and actions have opposite transaction ownership patterns. A service wraps its operations in `DB::transaction()` because the service owns the workflow. An action performs its single operation without `DB::transaction()` because the action does not know whether it is the root of the workflow or a leaf in a larger tree.

### The Composition Rule for Transactions

If an action might ever be composed into a larger transaction (called from a service, called from another action, called from a queued job orchestrator), it must NOT manage its own transaction. The rule is: an action should be transaction-agnostic by default.

### Savepoint vs Nested Transaction

When a sub-action that manages its own transaction is called within an outer transaction, the sub-action's `DB::transaction()` call creates a savepoint — a rollback marker inside the existing transaction, not a true nested transaction. The savepoint can roll back the sub-action's changes without aborting the outer transaction, but the database is still in a transaction. This is confusing because the API looks like nesting but the behavior is not.

### afterCommit Protocol

`DB::afterCommit()` is the mechanism an action should use to schedule post-operation side effects. It is the action's way of saying "run this after whatever transaction I am inside commits." The callback is queued on the connection's transaction manager and fires after the outermost transaction commits. If the outermost transaction rolls back, all afterCommit callbacks are discarded.

---

## When To Use

- **Actions without transaction management** — this is the default and recommended pattern for almost all actions.
- **Actions with afterCommit side effects** — when an action must trigger side effects (email, event, webhook) that should only execute after the database change is durable.
- **Standalone action with its own transaction** — only when the action is guaranteed to always be the top-level caller (scheduled command, console command, maintenance operation) and will never be composed into a larger workflow.

---

## When NOT To Use

- Do NOT make an action manage its own transaction if it might ever be composed into a larger workflow. The safe default is no transaction.
- Do NOT use `DB::transaction()` inside an action that is called from a service that already manages the transaction — this creates a savepoint, not a nested transaction, and the behavior difference is nearly always unintended.
- Do NOT call `DB::afterCommit()` with heavy callbacks (API calls, large file operations) inside a tight loop that executes many times inside a single transaction — the callbacks accumulate and fire sequentially after commit, potentially delaying the response.

---

## Best Practices (WHY)

- **Actions should not manage their own transactions.** The orchestrator owns the transaction boundary. This keeps actions composable into any transaction scope and prevents savepoint confusion.
- **Always use afterCommit for side effects.** Every side-effecting action (email, event dispatch, cache clear, webhook call) should use `DB::afterCommit()` by default. This ensures correctness even when the action is called inside a transaction. Without afterCommit, a rolled-back transaction can result in phantom side effects (email sent for an operation that did not happen).
- **Test afterCommit actions within a transaction.** In tests, wrap afterCommit-dependent actions in `DatabaseTransactions` to ensure the callback fires in the expected sequence. Without an active transaction, afterCommit callbacks fire immediately — which may not match production behavior.
- **Document the transaction boundary.** The outermost orchestrating method should have a clear comment: "The transaction boundary is managed here. Sub-actions should not create their own transactions."

---

## Architecture Guidelines

- **Transaction ownership:** Service owns the transaction (calls `DB::transaction()`). Action does not own the transaction (is called inside or outside one).
- **Standalone action exception:** Actions that are guaranteed to be top-level callers (scheduled commands, maintenance operations) MAY manage their own transaction. This is an exception, not the default.
- **Savepoint education:** Teams that allow transactional actions must educate developers that `DB::transaction()` inside an action creates a savepoint, not a true nested transaction. The behavior differs from the API expectation.
- **afterCommit in Octane:** In Octane, afterCommit callbacks may persist across requests if the transaction manager instance is reused. Ensure callbacks are scoped correctly for long-lived processes.
- **SQLite differences:** In testing (SQLite by default in Laravel), nested `DB::transaction()` calls do not create savepoints. The inner "transaction" is a no-op. Test with MySQL or PostgreSQL if the team uses transactional actions.
- **Heavy afterCommit chains:** Delegate heavy afterCommit callbacks to the queue: `DB::afterCommit(fn () => dispatch(new ProcessOrderJob($orderId)))`.

---

## Performance

Opening a `DB::transaction()` for a single action adds approximately 0.1-0.5ms for the begin/commit round trip. For composed actions where each sub-action also opens a transaction (with savepoints), the overhead multiplies — each savepoint adds a database round trip. Heavy afterCommit chains can delay the response by the total execution time of all callbacks. The savepoint performance impact on very large transactions (thousands of rows modified) is proportional to the transaction size.

---

## Security

Database transactions can affect security in scenarios involving concurrent access and isolation. An action that performs authorization checks inside a transaction may see stale data (depending on the isolation level) if the transaction reads data modified by another concurrent transaction. Ensure authorization checks happen before the transaction begins or use the appropriate isolation level (READ COMMITTED is the Laravel default and is sufficient for most cases).

---

## Common Mistakes

- **Action both owns a transaction and composes sub-actions.** The class is neither a clean action nor a clean service. It manages a transaction AND orchestrates — it should be a service.
- **Assuming savepoint isolation.** A developer writes an action that wraps its work in `DB::transaction()`, assuming the inner operation is isolated from the outer. Savepoints do not provide the isolation that a true nested transaction would.
- **afterCommit without checking for active transaction.** If an action calls `DB::afterCommit()` when no transaction is active, the callback fires immediately. This is documented behavior but can be surprising.
- **Phantom side effects on rollback.** An action sends an email directly (without afterCommit), the orchestrator's transaction rolls back. The email was sent but the database was not updated.
- **SQLite silent no-op in testing.** Nested `DB::transaction()` calls on SQLite do not create savepoints. Tests pass, but production behavior differs.

---

## Anti-Patterns

- **Action that both owns a transaction and composes sub-actions.** The worst anti-pattern in the transactional actions space. Creates savepoint chains that are nearly impossible to reason about correctly.
- **Savepoint rollback without outer rollback.** Sub-action creates a savepoint, throws an exception that is caught by the orchestrator. The savepoint is released but the outer transaction continues. The sub-action's changes are rolled back, but the service's other operations commit — a partially applied state.
- **Phantom side effects on rollback.** Sending a welcome email inside an action that does not use afterCommit. The transaction rolls back, but the email was already sent. The user gets a welcome email but their account does not exist.
- **Nested transaction assumption.** Multiple levels of `DB::transaction()` calls in a composition chain, each assuming they create independent nested transactions. Each call creates a savepoint, not an independent transaction.

---

## Examples

### Action Without Transaction (Recommended)
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

### Action With afterCommit Side Effects
```php
class SendWelcomeAction
{
    public function execute(User $user): void
    {
        DB::afterCommit(fn () => Mail::to($user)->send(new WelcomeMail));
        // Fires after outermost transaction commits
        // Fires immediately if no transaction is active
    }
}
```

### Orchestrator With Transaction Boundary
```php
class RegisterUserService
{
    public function __construct(
        private CreateUserAction $createUser,
        private SendWelcomeAction $sendWelcome,
    ) {}

    public function register(array $data): User
    {
        return DB::transaction(function () use ($data) {
            $user = $this->createUser->execute($data);
            DB::afterCommit(fn () => $this->sendWelcome->execute($user));
            return $user;
        });
    }
}
```

---

## Related Topics

- **Action Class Design** (prerequisite) — single-method structure and constructor injection.
- **Transaction Management (Service Layer)** (prerequisite) — savepoint semantics, transaction isolation, afterCommit mechanics.
- **Action Composition** — how transaction ownership interacts with composition depth.
- **Service Orchestration** — how orchestrators manage transaction boundaries for composed actions.
- **Stateless Service Design** — how state management affects transaction isolation in long-lived processes.
- **Queued Actions** — how transactions interact with async dispatched actions.

---

## AI Agent Notes

- **Source:** This KU is atomic and well-bounded. No further decomposition needed.
- **Dependencies:** Action Class Design, Transaction Management (prerequisites). Serves as prerequisite for Queued Actions, Service Orchestration.
- **Core rule:** Actions should not manage their own transactions. Delegate to orchestrator.
- **Savepoint awareness:** `DB::transaction()` inside a transaction creates a savepoint, not a nested transaction. This is the most common source of bugs.
- **afterCommit is the default side effect strategy.** Every side-effecting action should use it.
- **SQLite testing gap:** Nested transactions are no-ops on SQLite. Test with MySQL/PostgreSQL if transactional actions are used.

---

## Verification

| Criterion | Status |
|---|---|
| Metadata complete | ✓ |
| Transaction ownership inversion clear | ✓ |
| When to use / when NOT to use | ✓ |
| Best practices with rationale | ✓ |
| Savepoint vs nested transaction documented | ✓ |
| Performance analysis | ✓ |
| Security considerations | ✓ |
| Common mistakes identified | ✓ |
| Anti-patterns documented | ✓ |
| Code examples for each pattern | ✓ |
| Related topics mapped | ✓ |
