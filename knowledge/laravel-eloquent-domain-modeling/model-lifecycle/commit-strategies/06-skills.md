# Skill: Set Up afterCommit() Dispatch for Domain Events in Transactions

## Purpose

Configure job and event dispatch inside database transactions to only fire after the transaction commits, preventing side effects from executing against rolled-back or non-existent data.

## When To Use

- Dispatching domain events or jobs inside a `DB::transaction()` block
- Broadcasting model state changes that depend on persisted data
- Sending notifications that reference the saved model

## When NOT To Use

- The side effect should execute regardless of transaction outcome (audit logs, failure tracking)
- The operation does not use transactions (single query — no need for afterCommit)
- The event listener can handle missing data gracefully

## Prerequisites

- Domain event or job class exists
- Operation is wrapped in `DB::transaction()` or similar

## Inputs

- Event or job class name
- Transaction-wrapped persistence logic

## Workflow

1. Wrap the persistence operation and dispatch inside `DB::transaction()`:
   ```
   DB::transaction(function () use ($order) {
       $order->status = 'placed'
       $order->save()
       dispatch(new ProcessOrder($order->id))->afterCommit()
   })
   ```
2. For cleaner one-liner syntax, use `Bus::dispatchAfterCommit()`:
   ```
   Bus::dispatchAfterCommit(new ProcessOrder($order->id))
   ```
3. For model broadcasts, use `BroadcastsEventsAfterCommit` trait instead of `BroadcastsEvents`
4. Ensure after-commit listeners re-fetch the model to get current state:
   ```
   public function handle(Order $order): void
   {
       $order = Order::find($order->id)
       if ($order === null) { return }
       $order->processPayment()
   }
   ```
5. Document when a method's side effects depend on a wrapping transaction:
   ```
   /**
    * Places the order inside a transaction.
    * All side effects dispatch after commit.
    */
   ```

## Validation Checklist

- [ ] `->afterCommit()` or `Bus::dispatchAfterCommit()` used for dispatches inside transactions
- [ ] `BroadcastsEventsAfterCommit` used instead of `BroadcastsEvents`
- [ ] Side effects that must run regardless of transaction outcome do NOT use afterCommit
- [ ] Listeners receiving after-commit data check model existence before processing
- [ ] Transaction boundaries are documented for methods with after-commit side effects

## Common Failures

- **Missing transaction**: `afterCommit()` silently falls through if no transaction is active. The dispatch fires immediately with no error. Always wrap in `DB::transaction()`.
- **Audit logs skipped**: Using `afterCommit()` for failure tracking means the log record is lost if the transaction rolls back. Audit/compensating actions should not use afterCommit.
- **Stale data in listeners**: Between commit and listener execution, another process may have deleted the model. Always re-fetch or check existence.

## Decision Points

- **afterCommit vs immediate**: Default to `afterCommit()` for all event/job dispatch inside transactions. Use immediate dispatch only for side effects that must execute regardless of transaction outcome.
- **dispatch()->afterCommit vs Bus::dispatchAfterCommit**: Use `dispathAfterCommit()` for readability with simple chains. Use `->afterCommit()` when additional chain methods are needed.

## Performance Considerations

- `afterCommit()` has negligible overhead — just a flag check at dispatch time
- Queued jobs dispatched with afterCommit go to the queue only after commit — no blocking

## Security Considerations

- After-commit dispatch prevents data inconsistency — jobs never see rolled-back data
- Listeners must still handle the case where the model was deleted between commit and execution

## Related Rules

- Rule 1: Always Use `afterCommit()` for Domain Events in Transactions
- Rule 2: Use `BroadcastsEventsAfterCommit` Over `BroadcastsEvents`
- Rule 3: Do Not Use `afterCommit()` for Side Effects That Must Execute Regardless of the Transaction
- Rule 5: Use `dispatchAfterCommit()` on Bus for Readable One-Liners
- Rule 6: Ensure Listeners Receiving After-Commit Events Handle Non-Existence Gracefully

## Related Skills

- Broadcast Events Trait for Real-Time Updates
- Event Control / Quiet Operations for Suppression
- Event Catalog for Lifecycle Events

## Success Criteria

- Events and jobs inside transactions only dispatch after successful commit
- Rolled-back transactions produce no side effects
- Listeners handle model non-existence gracefully
- Audit/compensating actions that must always run are not accidentally gated by afterCommit
