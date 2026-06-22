# Rules: Webhook Audit Log, Replay & Reconciliation

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Webhook Audit Log, Replay & Reconciliation

---

## Rule 1: The Audit Log Is Append-Only — Never Mutate Event Payloads

**Category:** Data Integrity

**Rule:** StripeEvent records are immutable after creation. Only `status`, `processed_at`, `error_message`, and `retry_count` may be updated. The `payload` and `stripe_event_id` columns must never be modified. The audit log is a legal and operational record — mutation destroys its value.

**Reason:** The audit log is the authoritative record of "what Stripe told us and when." If payloads can be changed, you cannot trust the audit log to debug billing discrepancies or satisfy compliance auditors. Append-only integrity is a core property of any audit system.

**Bad Example:**
```php
// DANGER: mutating the raw payload destroys audit integrity
$event = StripeEvent::where('stripe_event_id', $evtId)->first();
$payload = $event->payload;
$payload['data']['object']['status'] = 'active'; // "Fixing" bad data
$event->update(['payload' => $payload]);
```

**Good Example:**
```php
// Correct: status-only updates preserve the original payload
$event = StripeEvent::where('stripe_event_id', $evtId)->first();
$event->update([
    'status' => StripeEvent::STATUS_PROCESSED,
    'processed_at' => now(),
]);
// The payload is immutable — the original Stripe event is preserved forever
```

**Exceptions:** GDPR right-to-erasure requests may require PII removal from payloads. Use field-level redaction (set specific JSON paths to `null`) rather than deleting or modifying the rest of the payload.

**Consequences Of Violation:** Auditors cannot verify that processing was correct because the input record was modified. Debugging a billing discrepancy becomes impossible — "was the original payload different from what we see now?" is unanswerable.

---

## Rule 2: Replay Must Be Safe — All Handlers Must Be Idempotent Before Enabling Replay

**Category:** Reliability

**Rule:** Before allowing any support user or automated system to replay webhook events, verify that every handler for every replayable event type uses `updateOrCreate`/`upsert` operations. Replay of a non-idempotent handler can cause double-charging, duplicate subscriptions, or corrupted state.

**Reason:** Replay without idempotency is essentially duplicate webhook processing without the guardrails. The replay service itself doesn't enforce idempotency — it trusts that handlers are safe to re-run. This trust must be verified.

**Bad Example:**
```php
// DANGER: replaying a non-idempotent handler creates duplicates
class InvoicePaymentSucceededHandler
{
    public function handle(array $payload): void
    {
        // NOT idempotent — creates a new record on every replay
        PaymentRecord::create([
            'stripe_invoice_id' => $payload['data']['object']['id'],
            'amount' => $payload['data']['object']['amount_paid'],
        ]);
    }
}
```

**Good Example:**
```php
// Correct: idempotent handler — safe to replay
class InvoicePaymentSucceededHandler
{
    public function handle(array $payload): void
    {
        $invoice = $payload['data']['object'];

        PaymentRecord::updateOrCreate(
            ['stripe_invoice_id' => $invoice['id']],
            ['amount' => $invoice['amount_paid'], 'status' => $invoice['status']],
        );
    }
}
```

**Exceptions:** Some handlers are naturally safe to replay even without upsert — e.g., cache invalidation (idempotent by nature) or notification sending (may duplicate but doesn't corrupt data). These are acceptable but should be documented.

**Consequences Of Violation:** Replaying a subscription.created event creates a duplicate subscription. Replaying an invoice.payment_succeeded sends duplicate receipts and may double-count revenue in analytics.

---

## Rule 3: Auto-Repair Only Safe Fields — Never Auto-Repair Plan Changes

**Category:** Data Integrity / Business Risk

**Rule:** During reconciliation, auto-repair only safe fields: `stripe_status`, `trial_ends_at`, `current_period_start`, `current_period_end`, `canceled_at`, `cancel_at_period_end`. Never auto-repair plan/price changes — these must be reviewed by a human because they change what the customer is charged.

**Reason:** Plan drift usually means someone changed the subscription in the Stripe Dashboard. Auto-applying that change could switch a customer from Enterprise ($999/mo) to Starter ($29/mo) or vice versa without their knowledge or consent. This is a business decision, not a technical repair.

**Bad Example:**
```php
// DANGER: auto-repairing plan changes without human review
private function repairDrift(Team $team, array $drifts, $stripeSub): void
{
    // Auto-repairs plan — could change customer pricing without consent
    if ($planDrift) {
        $newPlan = Plan::where('stripe_price_id', $stripeSub->stripePriceId)->first();
        $team->subscription()->update(['plan_id' => $newPlan->id]);
    }
}
```

**Good Example:**
```php
// Correct: alert on plan drift, never auto-repair
private function repairDrift(Team $team, array $drifts, $stripeSub): void
{
    // Auto-repair only safe date/status fields
    $team->subscription()->update([
        'stripe_status' => $stripeSub->stripeStatus,
        'current_period_end' => $stripeSub->currentPeriodEnd,
    ]);

    if ($planDrift) {
        // Alert — requires manual intervention
        \Log::critical('Plan drift requires manual review', [
            'team_id' => $team->id,
            'local_price' => $team->subscription->plan->stripe_price_id,
            'stripe_price' => $stripeSub->stripePriceId,
        ]);
        DriftAlert::create([
            'team_id' => $team->id,
            'type' => 'plan_drift',
            'status' => 'pending_review',
        ]);
    }
}
```

**Exceptions:** If the Stripe price change was triggered by your own application (e.g., an upgrade webhook that was missed), auto-repair is safe. In practice, distinguishing "our change" vs "dashboard change" is difficult — default to manual review.

**Consequences Of Violation:** Customer is switched to a different plan without consent. Revenue is impacted. Customer trust is damaged. Regulatory implications if the customer disputes charges they didn't authorize.

---

## Rule 4: Log Every Reconciliation Repair With Before/After State

**Category:** Compliance

**Rule:** Every repair action (auto or manual) must be logged with: team ID, stripe subscription ID, field changed, old value, new value, and the actor (system for auto-repair, user ID for manual repair). This creates an audit trail of all state corrections.

**Reason:** Reconciliation repairs change billing state outside the normal webhook flow. Without logging, there is no record that a repair occurred — making it impossible to explain state changes during a billing investigation. SOC2/PCI-DSS require audit trails for all state changes.

**Bad Example:**
```php
// DANGER: silent repair with no audit trail
private function repairDrift(Team $team, $drifts, $stripeSub): void
{
    $team->subscription()->update(['stripe_status' => $stripeSub->stripeStatus]);
    // No log, no audit — state changed with no record
}
```

**Good Example:**
```php
// Correct: every repair logged with before/after values
private function repairDrift(Team $team, array $drifts, $stripeSub): void
{
    $localSub = $team->subscription;
    $oldStatus = $localSub->stripe_status;

    $localSub->update(['stripe_status' => $stripeSub->stripeStatus]);

    \Log::channel('billing_audit')->info('Subscription drift repaired', [
        'team_id' => $team->id,
        'stripe_subscription_id' => $localSub->stripe_id,
        'field' => 'stripe_status',
        'old_value' => $oldStatus,
        'new_value' => $stripeSub->stripeStatus,
        'actor' => 'system:reconciliation',
    ]);

    RepairAudit::create([
        'team_id' => $team->id,
        'stripe_subscription_id' => $localSub->stripe_id,
        'field_repaired' => 'stripe_status',
        'old_value' => $oldStatus,
        'new_value' => $stripeSub->stripeStatus,
        'repaired_by' => 'system:reconciliation',
    ]);
}
```

**Exceptions:** None. Silent state mutations in billing are a compliance risk regardless of context.

**Consequences Of Violation:** During a billing dispute, you cannot explain why the customer's state changed. Auditors flag missing audit trails. Debugging requires database diffing or log archaeology.

---

## Rule 5: Rate-Limit Reconciliation API Calls to Avoid Stripe 429 Errors

**Category:** Performance

**Rule:** Reconciliation jobs querying Stripe API for each active subscription must respect Stripe's rate limits. Insert at least 50ms delay between API calls (~20 req/sec) for live mode. Use a queue with controlled concurrency for large subscription counts.

**Reason:** Stripe's live mode rate limit is approximately 25 read requests per second per secret key. Exceeding this returns HTTP 429 errors that cause reconciliation to fail mid-batch, leaving some subscriptions unreconciled.

**Bad Example:**
```php
// DANGER: no rate limiting — Stripe returns 429 after ~25 calls
foreach ($teams as $team) {
    $stripeSub = $this->gateway->getSubscription($team); // Rate limit exceeded
    $this->detectDrift($team, $stripeSub);
}
```

**Good Example:**
```php
// Correct: rate-limited Stripe API calls
foreach ($teams as $team) {
    try {
        $stripeSub = $this->gateway->getSubscription($team);
        $this->detectDrift($team, $stripeSub);
    } catch (ApiErrorException $e) {
        if ($e->getHttpStatus() === 429) {
            \Log::warning('Stripe rate limit hit during reconciliation', [
                'team_id' => $team->id,
                'teams_remaining' => $teams->count() - $teams->search($team),
            ]);
            sleep(5); // Back off and continue
        }
    }
    usleep(50000); // 50ms = ~20 calls/sec
}
```

**Exceptions:** Test mode reconciliation can run faster (Stripe allows higher test mode rates). Development environments can reduce or skip rate limiting for speed.

**Consequences Of Violation:** Reconciliation fails mid-batch. Some subscriptions are reconciled, some are not — creating inconsistent state. Retry logic without rate limiting retries into more 429s.
