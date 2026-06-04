# Skill: Manage Implicit Transactions in Laravel

## Purpose

Understand when Laravel and its ecosystem implicitly start transactions (model events, package writes) and manage their impact on transaction duration and nesting.

## When To Use

- Using Eloquent model events (saved, created, updated)
- Using Laravel Horizon or Telescope in production
- Writing event listeners that perform slow operations
- Dispatching queued jobs after model save
- Debugging unexpected transaction nesting or long lock duration

## When NOT To Use

- Simple CRUD without event listeners
- No package that starts implicit transactions
- All event listeners are fast (DB-only, no external calls)

## Prerequisites

- Understanding of Laravel model events
- Understanding of transaction length management

## Inputs

- Application code with model events
- Event listener code
- Package configuration (Horizon, Telescope)

## Workflow (numbered steps)

1. Understand implicit transaction sources:
   - Model `saved`, `created`, `updated` events fire inside the same transaction as the save
   - If an event listener throws, the entire model transaction rolls back
   - Package writes: Horizon monitoring data, Telescope request dumps may be transactional

2. Keep event listeners fast:
   ```php
   // ❌ Slow event listener (extends transaction duration)
   User::saved(function ($user) {
       Mail::send($user->email, 'Welcome'); // 2 second API call in transaction!
   });

   // ✅ Queue the email (fast, no external call)
   User::saved(function ($user) {
       dispatch(new SendWelcomeEmail($user)); // instant
   });
   ```

3. Use `afterCommit` for deferred job dispatch:
   ```php
   // Job dispatched immediately (even if transaction rolls back)
   dispatch(new ProcessOrder($order));

   // Job dispatched only after outer transaction commits
   dispatch(new ProcessOrder($order))->afterCommit();

   // Or using the helper
   dispatch_if(true, new ProcessOrder($order))->afterCommit();
   ```

4. Monitor for long-running event listeners:
   - If an event listener takes > 100ms, it should be queued
   - If an event listener might throw (API call), wrap in try/catch to prevent transaction rollback

5. For packages (Horizon, Telescope):
   - Telescope: consider disabling in production (uses DB writes)
   - Horizon: monitoring data writes may be in separate connection

## Validation Checklist

- [ ] Event listeners are fast (< 100ms) or handled asynchronously
- [ ] Queue jobs use `afterCommit()` to avoid dispatching before commit
- [ ] No external API calls in synchronous event listeners
- [ ] Event listener exceptions don't cause unexpected transaction rollbacks
- [ ] Package writes (Horizon/Telescope) don't extend application transaction duration
- [ ] Transaction duration monitored with and without event listeners

## Common Failures

- Email sending in `saved` event — 2 second lock hold
- Job dispatched before commit — job runs but transaction rolls back
- Event listener throws — entire parent transaction rolls back
- Horizon/Telescope writes inside application transaction — increased contention
- Multiple event listeners chained — unpredictable transaction duration

## Decision Points

- Synchronous vs queued event listeners
- `afterCommit()` vs immediate job dispatch
- Package writes: separate connection vs same connection
- Transaction nesting with model events (implicit savepoints)

## Performance Considerations

- Event listeners extend transaction duration even if not writing to DB
- API calls in event listeners: 100-2000ms additional lock time
- `afterCommit`: job waits for transaction commit, not dispatched immediately
- Package writes: Horizon/Telescope add query overhead

## Security Considerations

- Event listeners have same access as the caller
- Rollback from event listener exception affects all prior operations in the transaction
- Use `dispatch_if` or try/catch to prevent security-sensitive operations from rolling back on trivial listener failures

## Related Rules

- 9-21-1: Always Use afterCommit for Jobs Dispatched in Events
- 9-21-2: Never Make External API Calls in Synchronous Event Listeners

## Related Skills

- Scope Transactions in Laravel
- Queue Event Listeners
- Manage Transaction Length with Model Events

## Success Criteria

- All slow event listeners are queued
- Jobs dispatched in events use `afterCommit()`
- No external API calls in synchronous event listeners
- Transaction duration not impacted by event listeners
- Package writes not extending application transaction scope
