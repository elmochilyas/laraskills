# Rules: Billing Failure States, Trials, Grace Periods & Downgrades

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Billing Failure States, Trials, Grace Periods & Downgrades

---

## Rule 1: Billing State and Entitlement Are Separate — The Billing State Machine Informs Entitlement, It Doesn't Dictate It

**Category:** Architecture

**Rule:** The subscription model describes billing state (trial, active, past_due, canceled, expired). The entitlement layer decides what features are available in each state. The billing layer reports the state; the product layer decides the behavior. Never hardcode "past_due = no access" in the billing model.

**Reason:** Product decisions (grace periods during payment failure, full access during trial) are business decisions that change over time. The billing state machine should remain a pure description of the Stripe relationship. Entitlement policy should be configurable and testable independently.

**Bad Example:**
```php
// DANGER: billing model makes product decisions — hardcoded, rigid
class Subscription extends Model
{
    public function canAccessFeatures(): bool
    {
        return $this->stripe_status === 'active';
        // Past due = locked out immediately. Trial users? No access.
        // Product team can't change this without a code change.
    }
}
```

**Good Example:**
```php
// Correct: billing reports state, entitlement decides behavior
class Subscription extends Model
{
    public function hasAccess(): bool
    {
        // Permissive baseline — entitlement layer refines this
        return match (true) {
            $this->isOnTrial() => true,
            $this->isActive() => true,
            $this->isOnGracePeriod() => true,
            $this->isCanceled() && !$this->isExpired() => true,
            default => false,
        };
    }
}

class EntitlementService
{
    public function getEffectiveFeatures(Team $team): array
    {
        $subscription = $team->subscription;
        if (!$subscription || !$subscription->hasAccess()) return [];

        // Product decision: grace period gets core features only (if configured)
        if ($subscription->isOnGracePeriod() && config('billing.restrict_during_grace_period', false)) {
            return $this->filterToCoreFeatures($subscription->plan->features);
        }

        return $subscription->plan->features;
    }
}
```

**Exceptions:** None. Conflating billing state and product behavior creates a system that's hard to change and test.

**Consequences Of Violation:** The product team cannot adjust grace period behavior without a code change. A/B testing grace period length or feature availability during trials requires billing model changes. Separation of concerns is lost.

---

## Rule 2: Default to Allowing Access During Grace Periods

**Category:** Business Continuity

**Rule:** When a subscription enters `past_due` status (payment failure), default to full feature access for the duration of a configurable grace period (7-14 days). Lock users out only after the grace period expires. Communicate clearly at every stage: payment failure notification, 3-day warning, final 24-hour warning.

**Reason:** Most payment failures are transient — expired cards, insufficient funds on debit, bank maintenance. Immediately locking a user out drives churn. A grace period gives users time to fix payment issues without losing productivity. This is an industry standard practice.

**Bad Example:**
```php
// DANGER: immediate lockout on payment failure
public function handleInvoicePaymentFailed(array $payload): void
{
    $subscription = Subscription::where('stripe_id', $payload['data']['object']['subscription'])->first();
    $subscription->team->revokeAllAccess(); // Immediate lockout
    $subscription->team->notify(new AccessRevokedNotification());
}
```

**Good Example:**
```php
// Correct: grace period with progressive communication
public function handleInvoicePaymentFailed(array $payload): void
{
    $subscription = Subscription::where('stripe_id', $payload['data']['object']['subscription'])->first();
    $graceEndsAt = now()->addDays(config('billing.grace_period_days', 7));

    // Continue access during grace period
    $subscription->team->notify(new PaymentFailedNotification($graceEndsAt));

    // Schedule progressive warnings
    SendGracePeriodWarning::dispatch($subscription)->delay($graceEndsAt->subDays(3));
    SendFinalWarning::dispatch($subscription)->delay($graceEndsAt->subHours(24));
}
```

**Exceptions:** High-risk industries where payment is legally required before service delivery. Even then, consider a shorter grace period (24-48 hours) rather than immediate lockout.

**Consequences Of Violation:** Users locked out immediately on transient payment failures lose access to critical work. Churn rate increases. Support tickets flood in. Customer trust is damaged by punitive behavior for what is often a bank-side issue.

---

## Rule 3: Canceled Subscriptions Retain Access Until Period End — Never Revoke Immediately

**Category:** Business Integrity

**Rule:** When a user cancels their subscription, they have already paid for the current billing period. Access must continue until the period ends. The subscription status transitions to `canceled` with `cancel_at_period_end = true`, not `expired`. Only after the period ends does the subscription become `expired` and access is revoked.

**Reason:** Revoking access immediately on cancellation means you're taking away something the customer already paid for. This is in some jurisdictions a consumer protection violation. It also eliminates any opportunity for the customer to reconsider or be won back before the period ends.

**Bad Example:**
```php
// DANGER: immediate access revocation on cancellation
class CancelSubscriptionAction
{
    public function execute(Team $team): void
    {
        $this->gateway->cancelSubscription($team);
        $team->subscription()->update(['stripe_status' => 'canceled']);
        $team->revokeAllAccess(); // Revokes access they paid for
    }
}
```

**Good Example:**
```php
// Correct: access retained until period end
class CancelSubscriptionAction
{
    public function execute(Team $team, string $reason = null): void
    {
        $subscription = $team->subscription;
        $this->gateway->cancelSubscription($team);

        // Schedule post-expiration cleanup
        ProcessSubscriptionExpiry::dispatch($team)
            ->delay($subscription->current_period_end ?? now()->addMonth());

        event(new SubscriptionCanceled($team, $reason));
    }
}

class ProcessSubscriptionExpiry implements ShouldQueue
{
    public function handle(Team $team): void
    {
        // Only now, after the period has ended, revoke access
        if ($team->subscription->isExpired()) {
            $team->revokeAllAccess();
            $team->notify(new AccessRevokedNotification());
        }
    }
}
```

**Exceptions:** Fraudulent accounts or terms-of-service violations where immediate termination is legally justified. These should be handled as a separate "ban" flow, not through the normal cancellation process.

**Consequences Of Violation:** Customers pay for a month of service and receive less than a month. Chargebacks increase. Consumer protection complaints. Negative reviews and reputation damage.

---

## Rule 4: Trials Should Provide Full Feature Access

**Category:** Business

**Rule:** During the trial period, users should have access to the full feature set of their chosen plan. Do not cripple trial experiences. The purpose of a trial is to demonstrate the full value of the product.

**Reason:** A limited trial prevents users from experiencing the features that would convince them to pay. Enterprise features often close deals — hiding them during trial undermines the sales process. Full access during trial is the industry standard for SaaS products.

**Bad Example:**
```php
// DANGER: crippled trial — limits features users need to evaluate
public function getEffectiveFeatures(Team $team): array
{
    if ($team->subscription->isOnTrial()) {
        return $this->filterToBasicFeatures($team->subscription->plan->features);
        // User can't evaluate premium features — won't convert
    }
    return $team->subscription->plan->features;
}
```

**Good Example:**
```php
// Correct: full access during trial
public function getEffectiveFeatures(Team $team): array
{
    $subscription = $team->subscription;
    if (!$subscription || !$subscription->hasAccess()) return [];

    // Trial: full plan features — user sees everything they'd get
    if ($subscription->isOnTrial()) {
        return $subscription->plan->features;
    }

    return $subscription->plan->features;
}
```

**Exceptions:** Features with hard costs per use (API credits, SMS sending, compute time) may need limits even during trial. These should be generous enough to demonstrate value but capped to prevent abuse.

**Consequences Of Violation:** Users don't experience the full product value. Trial-to-paid conversion rate drops. Sales team cannot demo full capabilities during trial. Competitors with full-featured trials win the evaluation.

---

## Rule 5: Notify Users Before Trial Expiration — Multiple Touchpoints

**Category:** Business / User Experience

**Rule:** Send trial expiration notifications at multiple intervals: 7 days before, 3 days before, and 1 day before trial end. Include a clear call to action to add a payment method. Send a final notification on the day the trial expires. Never let a trial expire silently.

**Reason:** Users forget when their trial ends. Without reminders, they're surprised by a charge or by losing access — leading to chargebacks, churn, and support tickets. Progressive reminders give users time to decide and act.

**Bad Example:**
```php
// DANGER: no trial ending notifications — user surprised by expiration
// (simply no notification code exists)
class NotifyTrialEnding extends Command
{
    public function handle(): void
    {
        // Nothing — trials expire silently
    }
}
```

**Good Example:**
```php
// Correct: multi-touchpoint trial notification
class NotifyTrialEnding implements ShouldQueue
{
    public function handle(): void
    {
        // 7 days before
        Subscription::where('stripe_status', 'trialing')
            ->whereDate('trial_ends_at', now()->addDays(7)->toDateString())
            ->each(fn ($sub) => $sub->team->notify(new TrialEndingIn7Days($sub)));

        // 3 days before
        Subscription::where('stripe_status', 'trialing')
            ->whereDate('trial_ends_at', now()->addDays(3)->toDateString())
            ->each(fn ($sub) => $sub->team->notify(new TrialEndingIn3Days($sub)));

        // 1 day before
        Subscription::where('stripe_status', 'trialing')
            ->whereDate('trial_ends_at', now()->addDay()->toDateString())
            ->each(fn ($sub) => $sub->team->notify(new TrialEndingTomorrow($sub)));
    }
}
```

**Exceptions:** Trials that convert automatically (require payment method upfront). Even then, send a notification that the trial is ending and a charge will occur.

**Consequences Of Violation:** Users surprised by charges file chargebacks. Users surprised by access loss churn and leave negative reviews. Trial conversion rate is significantly lower than with proper notification.
