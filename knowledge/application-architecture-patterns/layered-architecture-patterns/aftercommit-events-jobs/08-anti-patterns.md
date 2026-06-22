# Anti-Patterns for After-Commit Events, Jobs & Side Effects

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Layered Architecture Patterns |
| Knowledge Unit | After-Commit Events, Jobs & Side Effects |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

| ID | Anti-Pattern | Severity | Frequency |
|----|-------------|----------|-----------|
| AP-AC-001 | Stripe Charge Inside Transaction | Critical | Medium |
| AP-AC-002 | Fire-and-Forget Email Inside Transaction | High | High |
| AP-AC-003 | After-Commit Job Without Retry | High | Medium |
| AP-AC-004 | Assuming afterCommit() Defers Synchronous Listeners | Medium | High |
| AP-AC-005 | Cache Invalidation Inside Transaction | Medium | Medium |

---

## Repository-Wide Anti-Patterns

The following anti-patterns from related KUs are also relevant here:
- AP-WQD-001 (Synchronous Webhook Processing) — from Webhook Queue Design
- AP-QDS-001 (Kill -9 on Queue Workers) — from Queue Deployment Safety

---

## AP-AC-001: Stripe Charge Inside Transaction

### Category
Data Integrity | Billing

### Description
Calling the Stripe API (or any external payment API) from inside a `DB::transaction()` block. The Stripe charge is created in Stripe's system, but if the database transaction rolls back, the charge persists in Stripe with no corresponding local record. This creates an orphaned charge — the customer is billed but the application has no record of it.

### Why It Happens
- Desire for atomicity: the developer wants the charge and the DB record to succeed or fail together
- Convenience of inline code: it feels natural to call Stripe right after creating the payment record
- Misunderstanding of transaction scope: the developer assumes the transaction can "undo" the Stripe call
- No awareness of `DB::afterCommit()` or `->afterCommit()`

### Warning Signs
- `Stripe::` or `$this->stripe->` calls inside a `DB::transaction()` closure
- External HTTP calls (`Http::post()`, `Mail::send()`) inside a transaction block
- Code review comments about "what happens if the transaction rolls back after the Stripe call" are dismissed with "it won't roll back"
- No compensating action (mark as failed) for external API call failures

### Why Harmful
The database transaction's rollback only affects the local database. External API calls are irreversible from the transaction's perspective. A Stripe charge created inside a rolling-back transaction is a real charge on a real customer's card. The application has no record of it, so the customer is billed with no corresponding subscription, invoice, or receipt. This is a financial incident requiring manual Stripe dashboard intervention and potential customer chargebacks.

### Real-World Consequences
- A SaaS platform creates a subscription in the DB and calls Stripe to create the charge inside the same transaction. The DB insert succeeds, the Stripe charge succeeds, but a subsequent DB operation (creating the invoice record) fails, rolling back the entire transaction. The subscription record is gone, the invoice is gone, but the customer's card was charged. The customer sees the charge on their statement with no corresponding subscription. Support receives a dispute.

### Preferred Alternative
Defer the Stripe call to after the transaction commits using `DB::afterCommit()`. If the Stripe call fails after commit, implement a compensating action: mark the local subscription record as `failed` so operators can investigate and manually resolve. The local DB always reflects the true state of the external system.

### Refactoring Strategy
1. Search the codebase for `DB::transaction` blocks containing `Stripe::`, `Http::`, `Mail::`, or any external API call.
2. Move the external call outside the transaction, wrapped in `DB::afterCommit()`.
3. Add a try/catch around the external call with a compensating action (update local state to `failed`).
4. Add retry logic to the after-commit callback or dispatch a queued job for the external call.
5. Write a test that simulates the external call failing and verifies the compensating action fires.

### Detection Checklist
- [ ] `Stripe::`, `$this->stripe->`, or `Http::post()` calls found inside `DB::transaction()` blocks
- [ ] No `DB::afterCommit()` or `->afterCommit()` wrapping around external API calls
- [ ] No compensating action for external API call failures
- [ ] No retry logic on external API calls made after commit

### Related Rules
- Defer External Side Effects Until After the Transaction Commits
- External API Calls Must Have Compensating Actions

---

## AP-AC-002: Fire-and-Forget Email Inside Transaction

### Category
Data Integrity | User Experience

### Description
Sending email (`Mail::send()`, `Mail::to()->send()`, `Notification::send()`) from inside a `DB::transaction()` block. If the transaction rolls back, the email is already sent — the customer receives a notification (order confirmation, welcome email, password reset) for an action that didn't actually happen.

### Why It Happens
- Convenience: it feels natural to send the email right after creating the record
- No awareness that mail sending is an external side effect that can't be rolled back
- The mail driver is `log` or `array` in development, so the issue is invisible until production
- Copy-paste from tutorial code that doesn't use transactions

### Warning Signs
- `Mail::send()` or `Mail::to()->send()` inside a `DB::transaction()` closure
- `Notification::send()` inside a transaction
- Users reporting "I got a welcome email but my account wasn't created"
- Email volume higher than account creation volume (phantom emails from rolled-back transactions)

### Why Harmful
A customer who receives an order confirmation for an order that doesn't exist loses trust in the platform. A customer who receives a password reset email but their password wasn't actually changed is confused and may attempt to log in with the old password, failing repeatedly. In billing scenarios, a "payment received" email for a rolled-back payment is a financial miscommunication that can lead to disputes.

### Real-World Consequences
- An e-commerce platform sends an order confirmation email inside the transaction that creates the order. A concurrent inventory check fails, rolling back the transaction. The customer receives "Your order has been confirmed!" but the order doesn't exist. They click "Track Order" and see nothing. Support ticket volume spikes.

### Preferred Alternative
Dispatch a queued notification after the transaction commits. Use `SendOrderConfirmation::dispatch($order)->afterCommit()` or fire an event `event(new OrderPlaced($order))->afterCommit()` with a queued listener that sends the email. The email only sends if the transaction succeeds.

### Refactoring Strategy
1. Search for `Mail::` and `Notification::` calls inside `DB::transaction()` blocks.
2. Move the mail/notification call outside the transaction.
3. Either dispatch a queued job with `->afterCommit()` or fire an event with `->afterCommit()`.
4. Test: start a transaction, trigger the mail, force a rollback, verify no email was sent.

### Detection Checklist
- [ ] `Mail::send()` or `Mail::to()->send()` found inside `DB::transaction()` blocks
- [ ] `Notification::send()` found inside transaction blocks
- [ ] No `->afterCommit()` on mail-sending job dispatches
- [ ] Users have reported receiving emails for actions that didn't complete

### Related Rules
- Defer External Side Effects Until After the Transaction Commits

---

## AP-AC-003: After-Commit Job Without Retry

### Category
Reliability | Race Conditions

### Description
Dispatching a job with `->afterCommit()` but not configuring retry logic (`#[Tries]`, `#[Backoff]`). The job is correctly deferred until after commit, but the first execution attempt may fail because the committed data isn't yet visible to the job's database connection (replication lag, write buffer flush). Without retries, the job is permanently lost.

### Why It Happens
- The developer correctly identified the need for `afterCommit()` but didn't know about the visibility gap
- In development (single connection, no replicas), the job always succeeds on the first attempt — the issue is invisible
- The default `tries` for a queued job may be 1 (no retry) depending on queue configuration
- The race condition is intermittent — it works 95% of the time, masking the problem

### Warning Signs
- Jobs dispatched with `->afterCommit()` but no `#[Tries]` attribute
- Intermittent "No query results for model [App\Models\Team]" exceptions in production
- Failed jobs table entries for after-commit jobs with "record not found" errors
- The issue only appears in production (with read replicas) and never in staging (single connection)

### Why Harmful
The job was correctly deferred to after commit — the developer did the right thing. But the visibility gap means the job's `findOrFail()` fails on the first attempt. Without retry, the job goes to the failed jobs table. For billing operations (provision team resources, sync subscription), this means the side effect never happens. The customer's team is created but never provisioned. Their subscription is created but never synced with Stripe.

### Real-World Consequences
- A SaaS platform dispatches `ProvisionTeamResources::dispatch($team)->afterCommit()`. The team is created and committed. The job runs immediately, but the read replica hasn't caught up yet — `Team::findOrFail($id)` throws. No retry configured. The job fails permanently. The team exists in the DB but has no Stripe customer, no search index entry, and no welcome email. The customer sees a blank dashboard.

### Preferred Alternative
Always configure retry logic on after-commit jobs that read from the database: `#[Tries(5)]` `#[Backoff([1, 3, 10, 30, 60])]`. The short initial delay (1 second) gives the replica time to catch up. Five retries cover even slow replication lag.

### Refactoring Strategy
1. Search for jobs dispatched with `->afterCommit()` and check for `#[Tries]` attribute.
2. Add `#[Tries(3)]` or `#[Tries(5)]` with appropriate `#[Backoff]` to any after-commit job missing retry config.
3. For jobs using read replicas, verify the retry count accounts for worst-case replication lag.
4. Add a test that simulates a "record not found" on first attempt and verifies the retry succeeds.

### Detection Checklist
- [ ] Jobs dispatched with `->afterCommit()` have no `#[Tries]` attribute
- [ ] Intermittent "No query results for model" errors in production logs
- [ ] After-commit jobs in the failed_jobs table with "record not found" exceptions
- [ ] Issue only manifests in production (with read replicas) or under load

### Related Rules
- Add Retry Logic to After-Commit Dispatched Jobs

---

## AP-AC-004: Assuming afterCommit() Defers Synchronous Listeners

### Category
Architecture | Misunderstanding

### Description
Using `event(new MyEvent($model))->afterCommit()` and assuming that ALL listeners (including synchronous ones) will defer until after the transaction commits. In reality, `afterCommit()` on event dispatch only defers listeners that implement `ShouldQueue`. Synchronous listeners execute immediately, inside the transaction.

### Why It Happens
- The Laravel documentation describes `afterCommit()` as deferring "listeners" without prominently distinguishing synchronous from queued
- The developer tests with queued listeners only and doesn't notice synchronous listeners still fire immediately
- The method name `afterCommit()` implies ALL behavior is deferred
- Mixing synchronous and queued listeners on the same event is common

### Warning Signs
- An event dispatched with `->afterCommit()` has both queued and synchronous listeners
- Synchronous listeners on the event perform external side effects (cache writes, log entries, API calls)
- Side effects from synchronous listeners are observed inside the transaction despite `afterCommit()`
- Tests pass in development (no transaction) but fail in production (with transactions) because synchronous listeners execute before commit

### Why Harmful
The developer believes all side effects are deferred, but synchronous listeners are executing inside the transaction. If a synchronous listener sends an email, writes to an external API, or invalidates a cache, those side effects happen before the transaction commits — exactly the scenario `afterCommit()` was supposed to prevent.

### Real-World Consequences
- A developer dispatches `event(new SubscriptionUpgraded($sub))->afterCommit()` with two listeners: a queued listener that sends an email and a synchronous listener that updates a CRM API. The email is correctly deferred (queued listener). The CRM update happens inside the transaction (synchronous listener). The transaction rolls back. The CRM now has an upgrade record that doesn't exist in the local database.

### Preferred Alternative
Understand the distinction: `event(...)->afterCommit()` only defers queued listeners. For synchronous listeners that also need to defer, use `DB::afterCommit()` inside the listener's `handle()` method, or convert the listener to a queued listener. Document which listeners are synchronous and which are queued on every event.

### Refactoring Strategy
1. For each event dispatched with `->afterCommit()`, list all listeners and identify which are synchronous vs. queued.
2. For synchronous listeners that perform external side effects, wrap the logic in `DB::afterCommit()` inside the listener.
3. Alternatively, convert synchronous listeners to queued listeners if the side effect can be asynchronous.
4. Add a comment on each event class listing its listeners and whether they are queued or synchronous.

### Detection Checklist
- [ ] Events dispatched with `->afterCommit()` have synchronous listeners that perform external side effects
- [ ] No `DB::afterCommit()` wrapping inside synchronous listeners on after-commit events
- [ ] Side effects from synchronous listeners observed inside transaction boundaries
- [ ] No documentation of which listeners are queued vs. synchronous on multi-listener events

### Related Rules
- Defer External Side Effects Until After the Transaction Commits

---

## AP-AC-005: Cache Invalidation Inside Transaction

### Category
Data Integrity | Caching

### Description
Calling `Cache::forget()` or `Cache::tags([...])->flush()` from inside a `DB::transaction()` block. If another process reads the cache between the invalidation and the transaction commit, it re-populates the cache with stale (uncommitted) data. When the transaction rolls back, the cache now holds data that doesn't match the rolled-back database state.

### Why It Happens
- Cache invalidation feels like a local operation — it doesn't touch external systems
- The developer wants the cache to be fresh as soon as the data changes
- No awareness that other processes can read and re-cache between invalidation and commit
- The `Cache` facade doesn't throw errors inside transactions, so it appears safe

### Warning Signs
- `Cache::forget()` or `Cache::tags()->flush()` inside `DB::transaction()` blocks
- Intermittent stale cache issues where the cache doesn't match the database
- Cache invalidation happens "too early" — before the transaction completes
- Other processes report reading stale data from the cache during concurrent updates

### Why Harmful
Cache invalidation inside a transaction creates a race condition:
1. Transaction starts, updates the database record
2. `Cache::forget('user:123')` is called inside the transaction
3. Another process reads `user:123` from the database (seeing uncommitted state if using the same connection, or committed old state if using a different connection)
4. That process writes the (stale or uncommitted) data back to the cache
5. The transaction rolls back
6. The cache now holds data that doesn't match the committed database state

### Real-World Consequences
- A team's plan is updated inside a transaction. `Cache::forget("team:{$id}:entitlements")` is called inside the transaction. Another request reads the team's entitlements, gets stale data, and re-caches it. The transaction rolls back. The cache now has the old entitlements, which happen to match the rolled-back state — but if the re-cache read uncommitted data, the cache has data that never committed. Users see incorrect feature access.

### Preferred Alternative
Defer cache invalidation to after the transaction commits: `DB::afterCommit(fn () => Cache::forget('user:123'))`. Or use cache tags that are flushed by an after-commit job. This ensures the cache is only invalidated after the data is durable.

### Refactoring Strategy
1. Search for `Cache::forget()` and `Cache::tags()->flush()` inside `DB::transaction()` blocks.
2. Wrap each call in `DB::afterCommit()`.
3. For tag-based flushing, dispatch a queued job with `->afterCommit()` that flushes the tags.
4. Test: start a transaction, invalidate cache, have another process read and re-cache, roll back, verify cache matches committed state.

### Detection Checklist
- [ ] `Cache::forget()` found inside `DB::transaction()` blocks
- [ ] `Cache::tags()->flush()` found inside transaction blocks
- [ ] No `DB::afterCommit()` wrapping around cache invalidation calls
- [ ] Intermittent stale cache issues reported by users or monitoring

### Related Rules
- Defer External Side Effects Until After the Transaction Commits
