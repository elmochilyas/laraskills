# Skill: Write a Transaction-Safe Orchestrator with afterCommit Side Effects

## Purpose

Create or refactor an orchestrating service that manages a database transaction boundary while ensuring side effects (emails, webhooks, cache clears) only execute after the transaction commits, preventing phantom operations.

## When To Use

- An orchestrating service calls multiple sub-actions that must all succeed or all fail together.
- Side effects (email sending, event dispatching, API calls) must not execute if the database transaction fails.
- Actions that were previously called standalone are now composed into a transactional workflow.
- Refactoring code where side effects execute inside transactions without `afterCommit`.

## When NOT To Use

- Simple single-operation flows where no side effects exist — a single action suffices.
- Operations where side effects must execute regardless of transaction outcome (audit logging, monitoring).
- The orchestrator calls a single action with no side effects — a transaction adds overhead with no benefit.

## Prerequisites

- An orchestrating class (Service or Action) that coordinates 2+ sub-operations.
- Understanding of savepoint vs nested transaction semantics.
- Knowledge of which sub-actions produce side effects.

## Inputs

- The orchestrating class file.
- List of sub-actions and which produce side effects (email, API calls, cache, events).
- The current transaction boundary (if any).

## Workflow

1. **Identify the transaction boundary.** Determine where the outermost transaction should begin and end. The transaction should cover all database writes that must be atomic. The orchestrator method is the transaction boundary.

2. **Wrap the orchestration in `DB::transaction()`.** Move all sub-action calls inside a `DB::transaction()` callback. The transaction commits when the callback completes without exception. It rolls back when any exception is thrown.
   ```php
   return DB::transaction(function () use ($data) {
       $user = $this->createUser->execute($data);
       $profile = $this->createProfile->execute($user, $data);
       return $user;
   });
   ```

3. **Identify side-effect sub-actions.** Review each sub-action call. If a sub-action sends an email, dispatches an event, calls a webhook, clears cache, or writes to a file — that is a side effect.

4. **Wrap side effects in `DB::afterCommit()`.** For every side-effect call, move it inside a `DB::afterCommit()` callback within the transaction. This defers execution until after the outermost transaction commits.
   ```php
   return DB::transaction(function () use ($data) {
       $user = $this->createUser->execute($data);
       
       DB::afterCommit(fn () => $this->sendWelcomeAction->execute($user));
       DB::afterCommit(fn () => $this->dispatchUserCreatedEvent->execute($user));
       
       return $user;
   });
   ```

5. **Delegate heavy afterCommit callbacks to the queue.** If an afterCommit callback performs a heavyweight operation (API call, file generation, batch email), dispatch a queued job instead of executing inline:
   ```php
   DB::afterCommit(fn () => GenerateReportJob::dispatch($reportData));
   ```

6. **Document the transaction boundary.** Add a docblock to the orchestrator method stating that the transaction boundary is managed here and sub-actions must not create their own transactions.
   ```php
   /**
    * Transaction boundary managed here. All sub-actions called
    * within this transaction must NOT create their own transactions.
    * Side effects must use afterCommit.
    */
   ```

7. **Verify sub-actions are transaction-agnostic.** Check each sub-action called within the transaction. If any sub-action calls `DB::transaction()`, `DB::beginTransaction()`, etc., it will create a savepoint inside the outer transaction. Refactor the sub-action to be transaction-agnostic.

8. **Write tests.** Test the transaction behavior: verify that all operations commit together on success and roll back together on failure. Test that afterCommit callbacks do not fire on rollback. Use `DatabaseTransactions` trait to wrap tests in a transaction.

## Validation Checklist

- [ ] Transaction wraps all related database operations with `DB::transaction()`
- [ ] All side effects use `DB::afterCommit()` — no side effects execute directly inside the transaction
- [ ] Heavy afterCommit callbacks dispatch queued jobs instead of executing inline
- [ ] Sub-actions are transaction-agnostic (no self-managed transactions)
- [ ] Transaction boundary is documented in the method docblock
- [ ] Tests verify rollback does not trigger afterCommit callbacks
- [ ] Tests verify commit triggers afterCommit callbacks in sequence

## Common Failures

- **Side effect inside transaction without afterCommit.** An email is sent, the transaction rolls back — the user receives a confirmation email for a failed operation. Always wrap side effects in `afterCommit`.
- **Sub-action manages its own transaction.** Creates a savepoint inside the outer transaction. The savepoint can roll back independently, creating a partial-commit state. The sub-action must be transaction-agnostic.
- **Heavy afterCommit callback blocks the response.** A 5-second API call inside `afterCommit` delays the HTTP response. Delegate heavy callbacks to the queue.
- **afterCommit without active transaction.** If no transaction is active, `afterCommit` fires the callback immediately. This is documented behavior but can be surprising. In tests, wrap the call in a `DatabaseTransactions` trait to match production behavior.
- **Phantom side effects on rollback.** Side effects that execute directly inside the transaction (without afterCommit) — the transaction rolls back, but the side effect has already happened. This is the most destructive transactional action bug.

## Decision Points

- **afterCommit ordering:** `afterCommit` callbacks execute in the order they are registered. If callback A must execute before callback B, register them in the correct order within the transaction closure.

## Performance Considerations

- Opening a `DB::transaction()` adds ~0.1-0.5ms for the begin/commit round trip.
- Heavy afterCommit callbacks block the HTTP response. Use the queue for callbacks that take >5ms.
- In Octane, afterCommit callbacks may persist across requests if the transaction manager instance is reused. Ensure callbacks are scoped correctly.

## Security Considerations

- Authorization checks should happen before the transaction begins, not inside it. Stale read results from concurrent transactions can lead to incorrect authorization.
- afterCommit callbacks that dispatch queued jobs should include authorization context if the worker must re-check authorization.

## Related Rules

- Rule: Actions Must Not Manage Their Own Database Transactions (transactional-actions/05-rules.md)
- Rule: Always Use `DB::afterCommit()` for Side-Effecting Operations (transactional-actions/05-rules.md)
- Rule: Document the Transaction Boundary at the Orchestrator Level (transactional-actions/05-rules.md)
- Rule: Test `afterCommit` Actions Within an Active Transaction (transactional-actions/05-rules.md)
- Rule: Delegate Heavy `afterCommit` Callbacks to the Queue (transactional-actions/05-rules.md)
- Rule: Prevent Phantom Side Effects on Transaction Rollback (transactional-actions/05-rules.md)
- Rule: Sub-Actions Must Not Create Savepoints Inside Parent Transactions (transactional-actions/05-rules.md)

## Related Skills

- Compose Actions into a Workflow (action-composition/06-skills.md)
- Refactor an Over-Composed Action to a Service (action-composition/06-skills.md)
- Test afterCommit Behavior in Actions (transactional-actions/06-skills.md)

## Success Criteria

- All sub-actions within the transaction commit atomically or roll back together.
- No side effect (email, webhook, cache) executes if the transaction fails.
- afterCommit callbacks execute correctly — after commit in production, immediately when no transaction is active.
- The orchestrator method has a clear docblock documenting the transaction boundary.
- Test coverage proves that rollbacks do not produce phantom side effects.

---

# Skill: Test afterCommit Behavior in Actions

## Purpose

Verify that actions using `DB::afterCommit()` correctly defer side effects until after the database transaction commits, and that no phantom side effects occur on rollback.

## When To Use

- Testing an action that uses `DB::afterCommit()` to schedule side effects.
- Verifying that afterCommit callbacks do not fire when the transaction rolls back.
- Testing the ordering of multiple afterCommit callbacks.
- Ensuring that afterCommit behavior in tests matches production behavior.

## When NOT To Use

- The action does not use `DB::afterCommit()` — no transaction-specific testing needed.
- Testing the internal logic of the afterCommit callback itself (e.g., that a specific email is sent) — test the callback separately.
- Testing afterCommit with lightweight callbacks that execute in <1ms — the transactional test adds overhead that may not be justified.

## Prerequisites

- An action that uses `DB::afterCommit()` to schedule side effects.
- PHPUnit or Pest with `DatabaseTransactions` trait or the ability to manually manage transactions.
- Understanding that without an active transaction, `afterCommit` fires immediately.

## Inputs

- The action class that uses `DB::afterCommit()`.
- The expected afterCommit callback behavior (what side effect should be deferred).
- The transaction boundary (which orchestrator manages it).

## Workflow

1. **Set up the test with an active transaction.** Use the `DatabaseTransactions` trait (or manually begin a transaction) to ensure afterCommit behavior matches production. Without an active transaction, afterCommit fires immediately — the test would not detect production issues.
   ```php
   use DatabaseTransactions;
   
   public function test_it_defers_email_until_after_commit(): void
   {
       // ...
   }
   ```

2. **Execute the action.** Call the action's method inside the test. If using `DatabaseTransactions`, the test itself is wrapped in a transaction — the afterCommit callback is deferred.

3. **Assert that the side effect has NOT executed yet.** After calling the action but before the transaction commits, verify the side effect did not execute:
   ```php
   Mail::fake();
   $action = new SendWelcomeAction();
   $user = User::factory()->create();
   
   $action->execute($user);
   
   // Email was NOT sent yet — afterCommit deferred
   Mail::assertNothingSent();
   ```

4. **Manually commit the transaction to trigger afterCommit.** To verify that the afterCommit callback fires on commit, manually commit the transaction:
   ```php
   DB::commit();
   Mail::assertSent(WelcomeMail::class);
   ```

5. **Test rollback behavior.** Verify that afterCommit callbacks do NOT fire when the transaction rolls back:
   ```php
   public function test_it_does_not_send_email_on_rollback(): void
   {
       Mail::fake();
       DB::beginTransaction();
       
       $action = new SendWelcomeAction();
       $user = User::factory()->create();
       $action->execute($user);
       
       DB::rollBack();
       
       // afterCommit is discarded — no email sent
       Mail::assertNothingSent();
   }
   ```

6. **Test afterCommit callback ordering.** If the action registers multiple afterCommit callbacks, verify they execute in the correct order:
   ```php
   public function test_after_commit_callbacks_execute_in_order(): void
   {
       $order = [];
       DB::transaction(function () use (&$order) {
           DB::afterCommit(fn () => $order[] = 'first');
           DB::afterCommit(fn () => $order[] => 'second');
       });
       
       $this->assertEquals(['first', 'second'], $order);
   }
   ```

7. **Test without an active transaction (document the difference).** Write a test that calls the action outside a transaction and documents that afterCommit fires immediately:
   ```php
   public function test_email_sent_immediately_when_no_transaction(): void
   {
       Mail::fake();
       
       $action = new SendWelcomeAction();
       $user = User::factory()->create();
       $action->execute($user); // No active transaction
       
       // afterCommit fires immediately
       Mail::assertSent(WelcomeMail::class);
   }
   ```

## Validation Checklist

- [ ] Test uses `DatabaseTransactions` or manually manages a transaction
- [ ] Side effect is verified NOT executed before commit
- [ ] Side effect is verified executed after commit
- [ ] Rollback test proves side effect does NOT execute on rollback
- [ ] Multiple afterCommit callback ordering is tested (if applicable)
- [ ] Behavior without active transaction is tested and documented
- [ ] Tests pass on MySQL/PostgreSQL (not just SQLite)

## Common Failures

- **Testing without an active transaction.** `afterCommit` fires immediately when no transaction is active. The test passes but production behavior (where a transaction IS active) is different. Always wrap in a transaction.
- **SQLite testing gap.** Nested transactions and savepoints are no-ops on SQLite. `DatabaseTransactions` works differently on SQLite vs MySQL/PostgreSQL. Run transactional tests on the production database driver.
- **Not testing rollback.** Only the commit path is tested. The rollback path (afterCommit callbacks discarded) is never verified — a phantom side effect bug goes undetected.
- **Asserting on side effect without waiting for commit.** `Mail::assertSent(WelcomeMail)` after `$action->execute($user)` but before `DB::commit()` will fail because the afterCommit callback has not fired yet. Manually commit before asserting.
- **Using `RefreshDatabase` instead of `DatabaseTransactions`.** `RefreshDatabase` migrates and tears down the database for each test — it is slower and does not provide the transaction wrapper needed for afterCommit testing. Use `DatabaseTransactions`.

## Decision Points

- **Manual transaction management vs `DatabaseTransactions`:** `DatabaseTransactions` wraps the entire test in a transaction that rolls back on teardown. For tests that need to manually commit (to trigger afterCommit), use `DB::beginTransaction()` and `DB::commit()` explicitly within the test, and roll back on teardown.

## Performance Considerations

- `DatabaseTransactions` adds ~1-3ms per test (no migration cost). Still fast enough for an action test suite.
- Manual transaction management adds no additional overhead beyond the `DatabaseTransactions` approach.

## Security Considerations

- Testing afterCommit with queued jobs inside the callback: verify that the job is dispatched to the correct queue only after the transaction commits. Use `Queue::fake()` and assert the job was dispatched after commit.

## Related Rules

- Rule: Test `afterCommit` Actions Within an Active Transaction (transactional-actions/05-rules.md)
- Rule: Always Use `DB::afterCommit()` for Side-Effecting Operations (transactional-actions/05-rules.md)
- Rule: Prevent Phantom Side Effects on Transaction Rollback (transactional-actions/05-rules.md)

## Related Skills

- Write a Transaction-Safe Orchestrator with afterCommit Side Effects (transactional-actions/06-skills.md)
- Write a Pure Unit Test for an Action (action-testing/06-skills.md)

## Success Criteria

- The test proves that afterCommit callbacks are deferred until the transaction commits.
- The test proves that afterCommit callbacks are discarded on rollback — no phantom side effects.
- The test verifies callback ordering when multiple callbacks are registered.
- The tests run reliably on the same database driver as production (MySQL/PostgreSQL).
