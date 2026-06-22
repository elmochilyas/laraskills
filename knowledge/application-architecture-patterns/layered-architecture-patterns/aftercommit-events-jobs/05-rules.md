# Rules: After-Commit Events, Jobs & Side Effects

**Domain:** Application Architecture Patterns
**Subdomain:** Layered Architecture Patterns
**Knowledge Unit:** After-Commit Events, Jobs & Side Effects

---

## Rule 1: Defer External Side Effects Until After the Transaction Commits

**Category:** Data Integrity

**Rule:** Side effects that depend on committed database state — sending emails, dispatching queued jobs that read the database, calling external APIs (Stripe, mail providers, webhooks) — must execute after the database transaction commits. Use `dispatchAfterCommit()`, `event(...)->afterCommit()`, or `DB::afterCommit()`.

**Reason:** If a side effect executes inside an uncommitted transaction that later rolls back, the external system has already processed it — the email was sent, the Stripe charge was created, the third-party API was called. The database rollback cannot undo external side effects. This creates a permanent desynchronization between your database and the external world.

**Bad Example:**
```php
// DANGER: job dispatched inside transaction without afterCommit
DB::transaction(function () use ($team, $user) {
    $team->save();
    $user->teams()->attach($team, ['role' => 'owner']);

    // If transaction rolls back, this job still runs — team doesn't exist
    ProvisionTeamResources::dispatch($team);
});
```

**Good Example:**
```php
// Correct: job dispatched only after transaction commits
DB::transaction(function () use ($team, $user) {
    $team->save();
    $user->teams()->attach($team, ['role' => 'owner']);
});

// Safe: dispatched only after the transaction commits
ProvisionTeamResources::dispatch($team)->afterCommit();
```

**Exceptions:** Side effects that must be atomic with the transaction and have compensating actions. Example: recording a deduplication key inside the transaction that, if rolled back, leaves no trace — this is safe because there's no external state to desynchronize.

**Consequences Of Violation:** Phantom emails sent for orders that don't exist. Stripe charges created for failed payments. Cache invalidated for data that was never committed. External systems reflect state that the database doesn't contain.

---

## Rule 2: Add Retry Logic to After-Commit Dispatched Jobs

**Category:** Reliability

**Rule:** Jobs dispatched with `dispatchAfterCommit()` or `->afterCommit()` must include retry logic (`#[Tries(n)]`, `#[Backoff]`) because a race condition exists: the transaction commits but the job's database connection may not yet see the committed data (replication lag, write buffer). The first execution attempt may fail with "record not found."

**Reason:** `dispatchAfterCommit()` guarantees the job is dispatched after commit, but it does NOT guarantee that the job's database read will see the committed data immediately. On read replicas, there's replication lag. Even on the same database, write buffers may not have flushed.

**Bad Example:**
```php
// DANGER: no retry — first attempt may fail with "record not found"
ProvisionTeamResources::dispatch($team)->afterCommit();

class ProvisionTeamResources implements ShouldQueue
{
    public function handle(): void
    {
        $team = Team::findOrFail($this->team->id); // May fail on read replica
        // Provision resources...
    }
}
```

**Good Example:**
```php
// Correct: retry logic handles the race condition gap
ProvisionTeamResources::dispatch($team)->afterCommit();

#[Tries(5)]
#[Backoff([1, 3, 10, 30, 60])]
class ProvisionTeamResources implements ShouldQueue
{
    public function handle(): void
    {
        $team = Team::findOrFail($this->team->id);
        // Provision resources...
    }
}
```

**Exceptions:** Jobs that don't read the database (e.g., pure computation, external API call with no database dependency). Even then, a retry is cheap insurance.

**Consequences Of Violation:** Jobs fail on first execution with "No query results for model" errors. If no retry is configured, the job is lost. The provisioned resources (Stripe customer, search index, external service) are never created.

---

## Rule 3: External API Calls Must Have Compensating Actions — Never Rely on Transaction Rollback

**Category:** Data Integrity

**Rule:** If an external API call (Stripe charge, email send, third-party webhook) happens after commit, the caller must implement a compensating action for the failure case. If the external call fails, update the local database to reflect the failure. Never rely on transaction rollback to undo an external API call — it cannot.

**Reason:** After-commit means the database transaction has already committed. If the external API call succeeds but the subsequent logic fails, the database has a record that the external call succeeded but the external system may or may not have processed it. Compensating actions (mark as failed, schedule retry) provide a path to eventual consistency.

**Bad Example:**
```php
// DANGER: no compensating action — if Stripe fails, local state is wrong
DB::transaction(function () use ($subscription) {
    $subscription->update(['status' => 'active']);
});

DB::afterCommit(function () use ($subscription) {
    // If this fails, subscription is marked active locally but doesn't exist in Stripe
    $this->stripe->subscriptions->create([
        'customer' => $subscription->team->stripe_id,
        'items' => [['price' => $subscription->plan->stripe_price_id]],
    ]);
});
```

**Good Example:**
```php
// Correct: compensating action if external call fails
DB::transaction(function () use ($subscription) {
    $subscription->update(['status' => 'pending']);
});

DB::afterCommit(function () use ($subscription) {
    try {
        $stripeSub = $this->stripe->subscriptions->create([...]);
        $subscription->update(['stripe_id' => $stripeSub->id, 'status' => $stripeSub->status]);
    } catch (\Exception $e) {
        // Compensating action: mark as failed so operators can investigate
        $subscription->update(['status' => 'failed']);
        \Log::error('Stripe subscription creation failed after commit', [
            'subscription_id' => $subscription->id,
            'error' => $e->getMessage(),
        ]);
    }
});
```

**Exceptions:** Idempotent read-only operations (fetching data for display, status checks) don't need compensating actions because they don't change state.

**Consequences Of Violation:** A Stripe subscription is marked active locally but doesn't exist in Stripe — orphaned billing state. External API errors go undetected. Database state reflects "success" when the external system never received the request.

---

## Rule 4: Multiple Side Effects Should Be Orchestrated by a Single After-Commit Job

**Category:** Architecture

**Rule:** When a transaction needs to trigger multiple side effects (send email, update search index, sync to CRM, invalidate caches), dispatch a single orchestration job after commit rather than dispatching multiple jobs or using multiple `DB::afterCommit()` callbacks. This ensures deterministic ordering and single failure point for retries.

**Reason:** Multiple independent `DB::afterCommit()` callbacks or jobs have non-deterministic ordering and independent failure modes. If cache invalidation succeeds but CRM sync fails, the system is in a partially-consistent state. A single orchestrating job can handle ordering, partial failures, and retries atomically.

**Bad Example:**
```php
// DANGER: multiple independent after-commit callbacks — no ordering guarantee
DB::transaction(function () use ($order) {
    $order->markAsPaid();
    $order->invoice()->create([...]);

    DB::afterCommit(fn () => Mail::to($order->user)->send(new OrderConfirmation($order)));
    DB::afterCommit(fn () => AnalyticsService::track('order_paid', $order));
    DB::afterCommit(fn () => SearchIndex::update($order));
    DB::afterCommit(fn () => Cache::tags(['orders'])->flush());
});
```

**Good Example:**
```php
// Correct: single job orchestrates all side effects
DB::transaction(function () use ($order) {
    $order->markAsPaid();
    $order->invoice()->create([...]);
});

ProcessOrderPaidSideEffects::dispatch($order)->afterCommit();

class ProcessOrderPaidSideEffects implements ShouldQueue
{
    #[Tries(3)]
    #[Backoff(10)]
    public function handle(): void
    {
        Mail::to($this->order->user)->send(new OrderConfirmation($this->order));
        AnalyticsService::track('order_paid', $this->order);
        SearchIndex::update($this->order);
        Cache::tags(['orders', "user:{$this->order->user_id}"])->flush();
    }
}
```

**Exceptions:** Independent side effects where failure of one should not block others. Cache invalidation + audit logging can be separate — audit log failure shouldn't prevent cache invalidation. Use judgment.

**Consequences Of Violation:** Non-deterministic side effect ordering makes debugging inconsistent state difficult. No single point to retry on failure. Partial failures leave the system in inconsistent state with no orchestrated recovery.
