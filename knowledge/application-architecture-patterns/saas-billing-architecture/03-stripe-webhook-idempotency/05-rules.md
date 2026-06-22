# Rules: Stripe Webhook Idempotency & Event Deduplication

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Stripe Webhook Idempotency & Event Deduplication

---

## Rule 1: Always Verify Webhook Signatures Before Processing

**Category:** Security

**Rule:** Every incoming Stripe webhook must be verified using `Webhook::constructEvent()` with the webhook signing secret before any processing occurs. Unverified webhooks must return 400 and must never touch billing state.

**Reason:** Without signature verification, an attacker can forge webhook payloads to cancel subscriptions, change plans, grant premium access, or trigger refunds. Stripe webhook signatures provide cryptographic proof that the payload originated from Stripe.

**Bad Example:**
```php
// DANGER: no signature verification — attacker can forge any billing event
class StripeWebhookController
{
    public function __invoke(Request $request): Response
    {
        $payload = json_decode($request->getContent(), true);
        $this->processEvent($payload); // Processes forged payload
        return response('OK', 200);
    }
}
```

**Good Example:**
```php
// Correct: signature verified before any processing
class StripeWebhookController
{
    public function __invoke(Request $request): Response
    {
        $payload = $request->getContent();
        $sigHeader = $request->header('Stripe-Signature');

        try {
            $event = Webhook::constructEvent($payload, $sigHeader, config('cashier.webhook.secret'));
        } catch (SignatureVerificationException $e) {
            \Log::warning('Stripe webhook signature verification failed', [
                'ip' => $request->ip(),
            ]);
            return response('Invalid signature', 400);
        }

        $this->processEvent($event);
        return response('OK', 200);
    }
}
```

**Exceptions:** None. Signature verification is a security invariant — skipping it creates a guaranteed vulnerability.

**Consequences Of Violation:** Attackers can forge any Stripe webhook event. They can cancel subscriptions, change plans, or mark invoices as paid. The entire billing system's integrity depends on this verification.

---

## Rule 2: Deduplicate at the Database Level Using a Unique Constraint

**Category:** Data Integrity

**Rule:** Use a unique index on `stripe_event_id` in the StripeEvent table as the primary deduplication mechanism. Use `firstOrCreate` within a `DB::transaction()` and catch `UniqueConstraintViolationException` for concurrent race conditions.

**Reason:** Application-level checks (checking if an event exists, then creating if not) have a race condition window where two concurrent processes both see "no event exists" and both insert. The unique constraint is the atomic guard that catches this.

**Bad Example:**
```php
// DANGER: race condition — two concurrent processes both pass the check
$existing = StripeEvent::where('stripe_event_id', $event->id)->first();
if (!$existing) {
    StripeEvent::create(['stripe_event_id' => $event->id, ...]);
    ProcessStripeEvent::dispatch($event);
}
```

**Good Example:**
```php
// Correct: unique constraint + transaction + race condition handling
try {
    DB::transaction(function () use ($event) {
        $stripeEvent = StripeEvent::firstOrCreate(
            ['stripe_event_id' => $event->id],
            ['type' => $event->type, 'payload' => $event->toArray(), 'status' => 'pending'],
        );

        if ($stripeEvent->wasRecentlyCreated) {
            ProcessStripeEvent::dispatch($stripeEvent);
        }
    });
} catch (UniqueConstraintViolationException $e) {
    \Log::info('Stripe webhook race condition — duplicate event', [
        'stripe_event_id' => $event->id,
    ]);
}
```

**Exceptions:** None for production billing systems. The unique constraint is the final guard against duplicates.

**Consequences Of Violation:** Concurrent webhooks for the same event are both processed. An `invoice.payment_succeeded` duplicate double-charges (or at minimum sends duplicate receipts). A `customer.subscription.deleted` duplicate may corrupt subscription state.

---

## Rule 3: Return 200 Quickly, Process Asynchronously via Queued Job

**Category:** Performance

**Rule:** The webhook controller must insert the event record, dispatch the processing job, and return 200 within 2 seconds. Heavy processing (subscription updates, email notifications, cache invalidation) must happen in the queued job, not in the controller.

**Reason:** Stripe expects a response within 20 seconds. If your webhook endpoint doesn't respond in time, Stripe retries the webhook — potentially causing duplicate processing. Asynchronous processing also decouples webhook delivery from processing throughput.

**Bad Example:**
```php
// DANGER: synchronous processing — Stripe may timeout and retry
class StripeWebhookController
{
    public function __invoke(Request $request): Response
    {
        $event = Webhook::constructEvent(...);
        // Processing inline — takes 5-10 seconds
        $this->updateSubscription($event);
        $this->updateEntitlements($event);
        $this->sendEmailNotifications($event);
        $this->invalidateCaches($event);
        return response('OK', 200);
    }
}
```

**Good Example:**
```php
// Correct: record + dispatch, return 200 immediately
class StripeWebhookController
{
    public function __invoke(Request $request): Response
    {
        $event = Webhook::constructEvent(...);

        DB::transaction(function () use ($event) {
            $stripeEvent = StripeEvent::firstOrCreate(
                ['stripe_event_id' => $event->id],
                ['type' => $event->type, 'payload' => $event->toArray(), 'status' => 'pending'],
            );

            if ($stripeEvent->wasRecentlyCreated) {
                ProcessStripeEvent::dispatch($stripeEvent);
            }
        });

        return response('OK', 200);
    }
}
```

**Exceptions:** Events that require synchronous idempotent processing for correctness (e.g., validating a checkout.session.completed before redirecting the user). Even then, keep the synchronous work minimal.

**Consequences Of Violation:** Stripe timeouts cause webhook retries. Combined with missing deduplication, you get duplicate processing. Even with deduplication, the webhook backlog grows because retries consume more processing time.

---

## Rule 4: All Webhook Handlers Must Use Idempotent Operations (updateOrCreate/upsert)

**Category:** Data Integrity

**Rule:** Every handler invoked by ProcessStripeEvent must use `updateOrCreate`, `upsert`, or equivalent idempotent operations. Never use plain `create()` for entities that should exist at most once per event. The handler must be safe to run multiple times for the same event.

**Reason:** Webhook delivery is at-least-once, not exactly-once. A handler using `create()` produces duplicate records on retry. `updateOrCreate` ensures the handler produces the same result whether run once or ten times.

**Bad Example:**
```php
// DANGER: not idempotent — creates duplicate entities on retry
class SubscriptionCreatedHandler
{
    public function handle(array $payload): void
    {
        $data = $payload['data']['object'];
        $team = Team::findOrFail($data['metadata']['team_id']);

        Subscription::create([  // Creates duplicate on retry
            'team_id' => $team->id,
            'stripe_id' => $data['id'],
            'stripe_status' => $data['status'],
        ]);
    }
}
```

**Good Example:**
```php
// Correct: upsert — safe to replay
class SubscriptionCreatedHandler
{
    public function handle(array $payload): void
    {
        $data = $payload['data']['object'];
        $team = Team::findOrFail($data['metadata']['team_id']);

        Subscription::updateOrCreate(  // Idempotent on retry
            ['stripe_id' => $data['id']],
            [
                'team_id' => $team->id,
                'plan_id' => Plan::where('stripe_price_id', $data['items']['data'][0]['price']['id'])->first()?->id,
                'stripe_status' => $data['status'],
                'trial_ends_at' => $data['trial_end'] ?? null,
                'current_period_end' => $data['current_period_end'] ?? null,
            ],
        );
    }
}
```

**Exceptions:** Append-only operations (like audit logs) where each replay intentionally creates a new record. Even then, the replay count should be tracked.

**Consequences Of Violation:** Replaying a webhook handler produces duplicate subscriptions, duplicate invoice records, or duplicate customer records. The webhook audit/replay system becomes unusable because replay is not safe.

---

## Rule 5: Use ShouldBeUnique on the Processing Job as Secondary Guard

**Category:** Reliability

**Rule:** The `ProcessStripeEvent` job must implement `ShouldBeUnique` with `uniqueId()` returning the Stripe event ID. Set `$uniqueFor` to a duration longer than the expected processing time (default 300 seconds).

**Reason:** Even with database-level deduplication, a bug or configuration issue could dispatch two jobs for the same event. `ShouldBeUnique` prevents both from processing simultaneously, providing a second layer of protection.

**Good Example:**
```php
class ProcessStripeEvent implements ShouldQueue, ShouldBeUnique
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 3;
    public int $backoff = 10;
    public int $uniqueFor = 300;

    public function __construct(public StripeEvent $stripeEvent) {}

    public function uniqueId(): string
    {
        return 'stripe-event:' . $this->stripeEvent->stripe_event_id;
    }

    public function handle(): void
    {
        if ($this->stripeEvent->fresh()->status === StripeEvent::STATUS_PROCESSED) {
            return; // Already processed by another worker
        }

        $this->processEvent();
    }
}
```

**Exceptions:** None for production webhook processing. The cost of `ShouldBeUnique` (a Redis lock) is negligible compared to the cost of duplicate processing.

**Consequences Of Violation:** Two workers pick up jobs for the same event simultaneously. Without unique job locking, both process the event — doubling side effects. The database-level deduplication prevents duplicate entity creation but side effects (emails, cache invalidations) fire twice.
