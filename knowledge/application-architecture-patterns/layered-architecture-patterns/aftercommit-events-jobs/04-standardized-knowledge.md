# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Layered Architecture Patterns |
| Knowledge Unit | After-commit events, jobs, and side effects |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel transactions, Queue system, Eloquent events |
| Related KUs | Billing webhook queues, Queue deployment safety, Billing queue topology |
| Source | domain-analysis.md |

# Overview

Side effects that depend on committed database state — notifications, queued jobs, external API calls, cache invalidation — must execute AFTER the database transaction commits, not inside it. Laravel provides three mechanisms: `dispatchAfterCommit()` for queued jobs, `afterCommit()` on events that trigger queued listeners, and `DB::afterCommit()` for arbitrary callbacks. Dispatching inside an uncommitted transaction risks executing a side effect that must not happen if the transaction rolls back, or a side effect whose visibility to external systems depends on the transaction succeeding.

# Core Concepts

- **`dispatchAfterCommit()`**: Flags a queued job to be dispatched only after the surrounding database transaction commits. Without it, the job may be picked up and processed before the transaction is visible to the job's own database connection.
- **`event(new OrderPlaced($order))->afterCommit()`**: Defers event dispatch (and thus any queued listeners) until the transaction commits. Synchronous listeners still execute immediately; this only affects queued listeners.
- **`DB::afterCommit(fn () => ...)`**: Registers a callback that executes after the outermost transaction commits. If no transaction is active, the callback runs immediately.
- **Race condition gap**: Even with `dispatchAfterCommit()`, the job may execute before the transaction is fully visible to the job's own database connection (replication lag, write buffer flush). Mitigation: retry logic, or a `dispatched_in_transaction` flag checked inside the job.
- **Inside-transaction dispatching (deliberate)**: Only when the side effect MUST NOT happen if the transaction rolls back AND the side effect's success is not observable by other concurrent processes.

# When To Use

- Sending email notifications after order/payment state change
- Dispatching queued jobs that depend on newly created database records
- Calling external APIs (Stripe, Mailgun, Twilio) after database state is committed
- Invalidating cache entries that depend on committed state
- Triggering webhooks to downstream services after data persistence
- Creating audit log entries that reference committed records
- Any side effect during SaaS billing operations (team creation, subscription changes, payment state transitions, role changes, ownership transfer, invitation acceptance, feature entitlement updates)

# When NOT To Use

- When the side effect's success is critical and must be rolled back with the transaction (use in-transaction + compensating action)
- For synchronous, in-process side effects that do not depend on external systems (these can run inside the transaction)
- When the side effect must be atomic with the transaction and cannot be retried (e.g., deduplication key generation tied to the record being created)

# Best Practices (WHY)

- **Default to after-commit for all external side effects**: Reason: External systems should never see uncommitted state. A queued notification sent inside a transaction that later rolls back is a phantom notification.
- **Use `dispatchAfterCommit()` on every queued job that depends on the transaction's data**: Reason: The worker may pick up the job before the transaction is committed, resulting in a "record not found" or stale-read error.
- **Add retry logic to jobs dispatched after commit**: Reason: The race condition gap (transaction committed but not yet visible to the job's connection) means the first execution attempt may fail. Retry with backoff solves this.
- **Consider a `dispatched_in_transaction` flag**: Reason: When the job runs, check if its source record has a flag like `dispatched_at` set. If not, the transaction may not be visible yet — delay and retry.
- **Never call Stripe, send mail, or dispatch queue jobs from inside an uncommitted transaction unless there is a deliberate reason and mitigation (compensating action)**.

# Architecture Guidelines

- **Transaction boundary awareness**: Code that dispatches jobs or events must know whether it is running inside a transaction. Use `DB::transactionLevel()` to check.
- **Event auto-discovery considerations**: Queued event listeners are automatically deferred when the event is dispatched with `afterCommit()`. Synchronous listeners are not.
- **Callback ordering**: Multiple `DB::afterCommit()` callbacks execute in the order registered. Do not rely on ordering between `afterCommit()` and `dispatchAfterCommit()` — they are independent queues.
- **Nested transactions**: `afterCommit()` and `dispatchAfterCommit()` wait for the outermost transaction to commit, not just the current savepoint.

# Performance Considerations

- After-commit dispatching adds no measurable overhead to transaction commit time. The dispatch is a lightweight callback registration.
- The real performance concern is the race condition gap: jobs retrying because the committed state isn't visible yet. Mitigate with short initial delays or a `dispatched_in_transaction` check rather than aggressive retry backoff.
- `DB::afterCommit()` callbacks should be lightweight. Heavy work belongs in a queued job dispatched after commit.

# Security Considerations

- Do not store sensitive data in serialized job payloads. Use `SerializesModels` to store only the model's ID, not its attributes.
- After-commit external API calls must use the same authentication context as the original request (user identity, tenant scope). Ensure the job's constructor receives and stores this context.
- Rate-limit after-commit external API calls the same way you would rate-limit synchronous API calls. After-commit does not bypass rate limits.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Dispatching jobs inside a transaction without `dispatchAfterCommit()` | Default behavior of `dispatch()` | Job executes before transaction commits, sees stale/missing data | Use `dispatchAfterCommit()` on all jobs that depend on transaction state |
| Assuming `afterCommit()` affects synchronous listeners | Misunderstanding of event dispatching | Side effects still execute inside transaction | For synchronous listeners that must run after commit, use `DB::afterCommit()` instead |
| Sending emails inside a transaction | Convenience of inline code | User receives email for a record that gets rolled back | Dispatch a queued notification after commit |
| Calling Stripe API inside a transaction | Desire for atomicity | Stripe charge succeeds but database record rolls back (or vice versa) | Defer Stripe call to after-commit; implement compensating charge/refund for rollback |
| No retry logic on after-commit dispatched jobs | Assuming commit is instantly visible | Job fails on first attempt with "record not found" | Add retries with `#[Tries(5)]` and exponential `#[Backoff]` |
| Multiple after-commit callbacks with ordering assumptions | Registering callbacks in sequence | Non-deterministic side effect ordering | Queue a single job that orchestrates all side effects in deterministic order |

# Anti-Patterns

- **Fire-and-forget inside transaction**: `$order->save(); Mail::send(...);` inside a `DB::transaction()`. Always defer mail to after commit.
- **Stripe charge inside transaction**: `DB::transaction(fn () => { $payment = Payment::create([...]); $stripe->charge(...); });`. The charge survives even if the payment record rollback fails.
- **Nested transaction + after-commit assumption**: Assuming `afterCommit()` fires at the savepoint boundary instead of the outermost transaction. It always fires at the outermost commit.
- **Cache invalidation inside transaction**: `Cache::forget('user:'.$id)` before the transaction commits. Another process reads the fresh cache and sees stale data from inside the still-uncommitted transaction.

# Examples

**Before (wrong): Job dispatched inside transaction without afterCommit**
```php
DB::transaction(function () use ($team, $user) {
    $team->save();
    $user->teams()->attach($team, ['role' => 'owner']);

    // DANGER: Job may execute before transaction commits
    ProvisionTeamResources::dispatch($team);
});
```

**After (correct): Job dispatched after commit**
```php
DB::transaction(function () use ($team, $user) {
    $team->save();
    $user->teams()->attach($team, ['role' => 'owner']);
});

// Safe: dispatched only after the transaction commits
ProvisionTeamResources::dispatch($team)->afterCommit();
```

**Before (wrong): Event with queued listeners inside transaction**
```php
DB::transaction(function () use ($subscription) {
    $subscription->update(['plan' => 'enterprise', 'status' => 'active']);

    // DANGER: Queued listeners execute before transaction commits
    event(new SubscriptionUpgraded($subscription));
});
```

**After (correct): Event deferred to after commit**
```php
DB::transaction(function () use ($subscription) {
    $subscription->update(['plan' => 'enterprise', 'status' => 'active']);
});

// Safe: queued listeners only execute after commit
event(new SubscriptionUpgraded($subscription))->afterCommit();
```

**Before (wrong): Stripe call inside transaction**
```php
DB::transaction(function () use ($user, $plan, $paymentMethod) {
    $subscription = Subscription::create([
        'user_id' => $user->id,
        'plan' => $plan->slug,
        'status' => 'pending',
    ]);

    // DANGER: Stripe charge survives even if DB rollback
    $stripeSub = Stripe::subscriptions()->create([
        'customer' => $user->stripe_id,
        'items' => [['price' => $plan->stripe_price_id]],
        'payment_behavior' => 'default_incomplete',
        'metadata' => ['subscription_id' => $subscription->id],
    ]);

    $subscription->update([
        'stripe_id' => $stripeSub->id,
        'status' => $stripeSub->status,
    ]);
});
```

**After (correct): Defer Stripe to after-commit with compensating action**
```php
$subscription = DB::transaction(function () use ($user, $plan) {
    return Subscription::create([
        'user_id' => $user->id,
        'plan' => $plan->slug,
        'status' => 'pending',
    ]);
});

// Defer Stripe call to after commit
DB::afterCommit(function () use ($subscription, $user, $plan) {
    try {
        $stripeSub = Stripe::subscriptions()->create([
            'customer' => $user->stripe_id,
            'items' => [['price' => $plan->stripe_price_id]],
            'metadata' => ['subscription_id' => $subscription->id],
        ]);

        $subscription->update([
            'stripe_id' => $stripeSub->id,
            'status' => $stripeSub->status,
        ]);
    } catch (\Exception $e) {
        // Compensating action: mark subscription as failed
        $subscription->update(['status' => 'failed']);
        Log::error('Stripe subscription creation failed', [
            'subscription_id' => $subscription->id,
            'error' => $e->getMessage(),
        ]);
    }
});
```

**Using DB::afterCommit for general callbacks**
```php
DB::transaction(function () use ($order) {
    $order->markAsPaid();
    $order->invoice()->create(['amount' => $order->total]);

    DB::afterCommit(function () use ($order) {
        // Safe: only runs after the transaction commits
        Cache::tags(['orders', 'user:'.$order->user_id])->flush();
        UpdateDashboardMetrics::dispatch()->afterCommit();
    });
});
```

# Related Topics

- Billing webhook queues (dedicated queue design for Stripe webhooks)
- Queue deployment safety (worker lifecycle during deploys)
- Billing queue topology (queue separation by concern)
- Laravel events vs event sourcing (differentiating domain events from lifecycle signals)
- Retry strategies for queued jobs
- Transaction isolation levels and race conditions

# AI Agent Notes

- When generating billing or subscription code, ALWAYS use `dispatchAfterCommit()` or `afterCommit()` for jobs and events that depend on the transaction's data.
- Never generate code that calls Stripe, sends email, or dispatches jobs from inside an uncommitted transaction unless the user explicitly requests it with a valid rationale.
- When a user asks about side effects and transactions, first check whether the side effect is external (needs after-commit) or internal (can stay in transaction).
- For SaaS billing operations, always recommend the after-commit pattern with compensating actions for external API failures.
- When code review identifies a job dispatch or external API call inside a transaction, flag it as a P0 issue requiring after-commit refactoring.

# Verification

- [ ] All queued jobs that depend on transaction data use `dispatchAfterCommit()` or `->afterCommit()`
- [ ] All events that trigger queued listeners use `->afterCommit()` when dispatched inside a transaction
- [ ] No external API calls (Stripe, mail, HTTP) are made from inside uncommitted transactions
- [ ] After-commit dispatched jobs have retry logic configured (`#[Tries]`, `#[Backoff]`)
- [ ] Compensating actions exist for after-commit external API call failures (e.g., mark subscription as failed)
- [ ] Cache invalidation is deferred to after-commit or uses dedicated cache tags flushed after commit
- [ ] Race condition gap is accounted for (retry, dispatched_in_transaction flag, or short initial delay)
- [ ] No fire-and-forget side effects inside `DB::transaction()` blocks
