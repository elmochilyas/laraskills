# Rules: Subscription Drift Detection & Repair

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Subscription Drift Detection & Repair

---

## Rule 1: Stripe Is Always the Source of Truth — Never Push Local Corrections to Stripe

**Category:** Data Integrity

**Rule:** When reconciliation detects drift between local state and Stripe, always update local state to match Stripe. Never push local state to Stripe during reconciliation. Stripe is the financial system of record — the application's local cache is authoritative, Stripe is definitive.

**Reason:** Stripe is the system that charges customers, generates invoices, and manages the payment relationship. If the application pushes stale local state to Stripe, it can change billing amounts, cancel subscriptions, or alter payment methods against the customer's expectations.

**Bad Example:**
```php
// DANGER: pushing local state to Stripe during reconciliation
private function repairDrift(Team $team, $drifts, $stripeSub): void
{
    if ($team->subscription->stripe_status !== $stripeSub->stripeStatus) {
        // WRONG: updates Stripe to match local state
        $this->stripe->subscriptions->update($stripeSub->stripeId, [
            'status' => $team->subscription->stripe_status,
        ]);
    }
}
```

**Good Example:**
```php
// Correct: Stripe is source of truth — update local to match Stripe
private function repairDrift(Team $team, array $drifts, $stripeSub): void
{
    if ($team->subscription->stripe_status !== $stripeSub->stripeStatus) {
        // Correct: updates local cache to match Stripe's authoritative state
        $team->subscription()->update([
            'stripe_status' => $stripeSub->stripeStatus,
        ]);
    }
}
```

**Exceptions:** Creating a new Stripe subscription or canceling via the gateway as part of a user-initiated action. These are intentional billing operations, not reconciliation.

**Consequences Of Violation:** Reconciliation "corrects" Stripe based on stale local state, modifying the customer's actual billing arrangement in Stripe. This can cause incorrect charges, subscription cancellations, or plan changes.

---

## Rule 2: Classify Drift by Severity — Never Treat All Drift Equally

**Category:** Architecture

**Rule:** Categorize each detected drift item into LOW (period dates, trial dates), MEDIUM (status changes, cancel_at_period_end), or CRITICAL (plan changes, orphaned subscriptions). Auto-repair only LOW and MEDIUM severity. CRITICAL always requires human review.

**Reason:** Not all drift has the same business impact. Repairing a trial_end date that's off by a few seconds is harmless. Switching a customer from Enterprise to Starter because Stripe shows a different plan could devastate revenue. Severity classification prevents automated actions with high business risk.

**Bad Example:**
```php
// DANGER: treating all drift as equal — auto-repairs everything
private function repairDrift(Team $team, array $drifts, $stripeSub): void
{
    foreach ($drifts as $field => $values) {
        $team->subscription()->update([$field => $values['stripe']]);
    }
    // Plan change auto-repaired — customer's plan silently changed
}
```

**Good Example:**
```php
// Correct: severity-classified repair
class DriftSeverity {
    const LOW = 'low';       // safe to auto-repair
    const MEDIUM = 'medium'; // usually safe to auto-repair
    const CRITICAL = 'critical'; // never auto-repair
}

class DriftItem
{
    public function __construct(
        public string $field,
        public mixed $localValue,
        public mixed $stripeValue,
        public string $severity,
        public bool $safeForAutoRepair,
    ) {}
}

// Auto-repair only safe items, alert on critical
$repairableItems = $report->autoRepairableItems();
$criticalItems = $report->criticalItems(); // Triggers alert, creates DriftAlert
```

**Exceptions:** If the system can prove the plan change was triggered by your own application (correlating with an audit log entry or a Stripe webhook that was ultimately received), auto-repair is defensible. In practice, this correlation is hard to guarantee.

**Consequences Of Violation:** Automated repair of plan drifts changes customer billing without consent. Automated repair of orphaned subscriptions could cancel legitimate subscriptions. Revenue loss and customer trust erosion.

---

## Rule 3: Use Clock Skew Tolerance on Date Comparisons

**Category:** Reliability

**Rule:** Date comparisons between local cache and Stripe must allow a 5-second tolerance. This accounts for clock skew between servers, timestamp precision differences, and the time between Stripe creating a record and your webhook receiving it.

**Reason:** Without tolerance, subscriptions with dates differing by 1-2 seconds are flagged as drift on every reconciliation cycle. This creates noise, alert fatigue, and unnecessary repair operations. Clock skew in distributed systems is expected — not a bug.

**Bad Example:**
```php
// DANGER: strict equality — flags drift on 1-second difference
if ($localSub->current_period_end != $stripeSub->currentPeriodEnd) {
    $drifts[] = "current_period_end drift detected";
}
```

**Good Example:**
```php
// Correct: 5-second tolerance accounts for clock skew
private function checkDateDrift(Collection $drifts, string $field, ?DateTimeInterface $local, ?DateTimeInterface $stripe): void
{
    $localTs = $local?->getTimestamp();
    $stripeTs = $stripe?->getTimestamp();

    if ($localTs !== null && $stripeTs !== null && abs($localTs - $stripeTs) > 5) {
        $drifts->push(new DriftItem(
            field: $field,
            localValue: $local?->toIso8601String(),
            stripeValue: $stripe?->format('Y-m-d\TH:i:s\Z'),
            severity: DriftSeverity::LOW,
            safeForAutoRepair: true,
        ));
    }
}
```

**Exceptions:** Financial calculations (proration, credit amounts) where exact precision matters. Even then, compare timestamps as integers with tolerance rather than using strict equality.

**Consequences Of Violation:** Reconciliation reports hundreds of false-positive drifts per cycle. Ops team ignores reconciliation alerts (alert fatigue). Legitimate drifts are missed because everything looks like noise.

---

## Rule 4: Detect and Handle Orphaned Subscriptions

**Category:** Data Integrity

**Rule:** During reconciliation, if a team's subscription exists locally (with active/trialing/past_due status) but the gateway's `getSubscription()` throws an exception (subscription not found in Stripe), mark the local subscription as canceled and log a critical alert.

**Reason:** An orphaned subscription means the user may have free access to paid features because the local state thinks they're subscribed. The subscription was likely deleted in the Stripe Dashboard or via an API call that didn't trigger a webhook.

**Bad Example:**
```php
// DANGER: orphaned subscription ignored — user keeps free access
try {
    $stripeSub = $this->gateway->getSubscription($team);
} catch (\RuntimeException $e) {
    // Silently skip — user retains "active" status locally
    return;
}
```

**Good Example:**
```php
// Correct: orphan detected and local state corrected
try {
    $stripeSub = $this->gateway->getSubscription($team);
} catch (\RuntimeException $e) {
    // Subscription doesn't exist in Stripe — mark as canceled locally
    $team->subscription()->update([
        'stripe_status' => 'canceled',
        'ended_at' => now(),
    ]);

    \Log::critical('Orphaned subscription detected and canceled', [
        'team_id' => $team->id,
        'stripe_subscription_id' => $team->subscription->stripe_id,
    ]);

    $entitlements->invalidateCache($team);
}
```

**Exceptions:** If the Stripe API returns a transient error (rate limit, network timeout) rather than "not found," do NOT cancel the subscription. Check the exception type before taking action.

**Consequences Of Violation:** Users get free access to paid features indefinitely. Revenue leakage. The subscription appears active in analytics but generates no revenue.

---

## Rule 5: Reconciliation Is a Safety Net — Fix Webhook Processing First

**Category:** Architecture

**Rule:** If reconciliation detects frequent drift (more than 1% of active subscriptions per cycle), investigate and fix the webhook processing pipeline. Reconciliation is a safety net, not a primary sync mechanism. Frequent drift indicates systemic webhook failures.

**Reason:** Treating symptoms (reconciling drift) without fixing the cause (broken webhook processing) means the system is operating in a degraded state. Webhook processing is real-time; reconciliation is periodic. Lag between webhook failure and reconciliation repair means users experience incorrect state.

**Good Example:**
```php
// Monitor: alert if drift rate exceeds threshold
$driftRate = $driftsDetected / $totalSubscriptions;
if ($driftRate > 0.01) {
    \Log::critical('High drift rate detected — webhook processing may be degraded', [
        'drift_rate' => $driftRate,
        'drifts_detected' => $driftsDetected,
        'total_subscriptions' => $totalSubscriptions,
    ]);
    // Escalate to on-call engineer
    // Do NOT just auto-repair and move on
}
```

**Exceptions:** During Stripe outages or maintenance windows, elevated drift is expected and temporary. These should still be monitored but may not require immediate webhook fixes.

**Consequences Of Violation:** The root cause of webhook failures goes unfixed. Drift accumulates and reconciliation becomes a high-volume repair operation instead of a safety net. Users experience hours-long delays in subscription state updates.
