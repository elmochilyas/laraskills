# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Billing Failure States, Trials, Grace Periods & Downgrades
Difficulty Level: Advanced
Last Updated: 2026-06-22
Status: Standardized

---

# Overview

SaaS billing is a state machine — not a boolean. Subscriptions transition through trial, active, past_due, canceled, and expired states. Each state has distinct product behavior implications: what features are available during a trial? During a grace period after payment failure? After cancellation but before the period ends? These are entitlement decisions, not billing decisions. The billing state and the product behavior must be modeled and tested as separate concerns.

---

# Core Concepts

This knowledge unit addresses the subscription lifecycle state model, the behavioral implications of each state, trial and grace period handling, downgrade flows, and the separation of billing state from product entitlement.

## The Billing State Machine

```
                  ┌─────────┐
                  │  Trial  │ (trial_ends_at in future)
                  └────┬────┘
                       │ trial ends OR payment added
                       ▼
                  ┌─────────┐
          ┌───────│ Active  │───────┐
          │       └────┬────┘       │
          │            │            │
          │    payment │            │ user cancels
          │    fails   │            │
          │            ▼            ▼
          │       ┌──────────┐  ┌──────────┐
          │       │ Past Due │  │ Canceled │ (cancel_at_period_end)
          │       └────┬─────┘  └────┬─────┘
          │            │             │
          │    payment │   grace     │ period
          │    succeeds│   expires   │ ends
          │            │             │
          │            ▼             ▼
          │       ┌─────────┐  ┌─────────┐
          └───────│  Active │  │ Expired │
                  └─────────┘  └─────────┘
```

## State Definitions

| State | Stripe Status | Meaning | Access Behavior (Default) |
|-------|--------------|---------|---------------------------|
| Trial | `trialing` | Free evaluation period, payment method may or may not be collected | Full feature access |
| Active | `active` | Payment method valid, subscription in good standing | Full feature access |
| Past Due | `past_due` | Payment failed, within grace period | Features available (configurable) |
| Canceled (grace) | `canceled` with `cancel_at_period_end = true` | User canceled but period hasn't ended | Full access until period end |
| Expired | `canceled` with `cancel_at_period_end = false` or period ended | Subscription fully ended | No feature access |
| Incomplete | `incomplete` | First payment hasn't succeeded yet (SCA, 3DS required) | No feature access (or limited) |
| Unpaid | `unpaid` | Final invoice not paid after all retries | No feature access |

---

# When To Use

- Any SaaS with trials (free or paid)
- Any SaaS where payment failures should not immediately lock users out
- When you offer grace periods during which users can fix payment issues
- When cancellation doesn't immediately revoke access (cancel-at-period-end pattern)

---

# When NOT To Use

- Free product with no billing whatsoever
- Fully prepaid model where payment failure isn't possible mid-period (annual upfront)
- Simple case where all states map to a boolean "has access / no access" — but even then, the state model documents behavior explicitly

---

# Best Practices

1. **Billing state and entitlement are separate.** Stripe says the subscription is `past_due`. The app decides whether to allow feature access during `past_due`. The Product team owns that decision, not the Billing team.

2. **The default during past_due is to allow access.** Locking users out immediately on payment failure causes churn. Give them a grace period (3-14 days) to fix their payment method. Communicate clearly via email and in-app banners.

3. **Trials should have full access.** Don't cripple the trial experience. The user should see everything they'd get on a paid plan. This maximizes conversion.

4. **Canceled ≠ Expired.** A canceled subscription still provides access until the current period ends. Only when the period ends does the subscription become expired and access is revoked.

5. **The Customer Portal handles standard flows.** Stripe's hosted Customer Portal handles plan switching, cancellation, payment method updates, and invoice viewing. Only build custom billing management pages when you need flows the portal doesn't support (custom downgrade surveys, non-standard plan transitions).

---

# Architecture Guidelines

## Subscription State Model

```php
// App\Billing\Models\Subscription.php (extending the base model)
class Subscription extends Model
{
    public function isActive(): bool
    {
        return in_array($this->stripe_status, ['active', 'trialing']);
    }

    public function isOnTrial(): bool
    {
        return $this->stripe_status === 'trialing'
            && $this->trial_ends_at
            && $this->trial_ends_at->isFuture();
    }

    public function isOnGracePeriod(): bool
    {
        return $this->stripe_status === 'past_due';
    }

    public function isCanceled(): bool
    {
        return $this->stripe_status === 'canceled';
    }

    public function hasGracePeriodExpired(): bool
    {
        if (!$this->isOnGracePeriod()) return false;

        $graceDays = config('billing.grace_period_days', 7);
        $graceStart = $this->current_period_end ?? $this->updated_at;

        return $graceStart->addDays($graceDays)->isPast();
    }

    public function isExpired(): bool
    {
        return $this->stripe_status === 'canceled'
            && (
                $this->ended_at?->isPast()
                || ($this->current_period_end && $this->current_period_end->isPast())
            );
    }

    public function hasAccess(): bool
    {
        // The billing-level access check (before entitlement computation)
        // This is intentionally permissive — the entitlement layer refines it
        if ($this->isActive()) return true;
        if ($this->isOnGracePeriod()) return true;
        if ($this->isCanceled() && !$this->isExpired()) return true;

        return false;
    }

    public function billingStateLabel(): string
    {
        return match (true) {
            $this->isOnTrial() => 'Trial',
            $this->isActive() && !$this->isOnTrial() => 'Active',
            $this->isOnGracePeriod() => 'Past Due',
            $this->isCanceled() && !$this->isExpired() => 'Canceled (access until period end)',
            $this->isExpired() => 'Expired',
            default => $this->stripe_status,
        };
    }
}
```

## Entitlement Decisions Per State

```php
// App\Billing\Services\EntitlementService.php (extension)
class EntitlementService
{
    public function getEffectiveFeatures(Team $team): array
    {
        $subscription = $team->subscription;

        if (!$subscription || !$subscription->hasAccess()) {
            return []; // No access at all
        }

        $planFeatures = $subscription->plan->features;

        // During trial: full plan features (maximize trial experience)
        if ($subscription->isOnTrial()) {
            return $planFeatures;
        }

        // During grace period: configurable — default to full access
        if ($subscription->isOnGracePeriod()) {
            if (config('billing.restrict_during_grace_period', false)) {
                // Optional: restrict to "core" features only
                return $this->filterToCoreFeatures($planFeatures);
            }
            return $planFeatures;
        }

        // Canceled but before period end: full access (they paid for this period)
        if ($subscription->isCanceled() && !$subscription->isExpired()) {
            return $planFeatures;
        }

        // Active: full plan features
        return $planFeatures;
    }

    private function filterToCoreFeatures(array $features): array
    {
        $coreFeatureKeys = config('billing.core_features', []);
        return array_filter($features, fn ($feature) => in_array($feature['key'], $coreFeatureKeys));
    }
}
```

## Trial Handling

```php
// App\Billing\Actions\StartTrialAction.php
class StartTrialAction
{
    public function __construct(
        private BillingGateway $gateway,
        private EntitlementService $entitlements,
    ) {}

    public function execute(Team $team, Plan $plan): SubscriptionResult
    {
        // Create subscription with trial period (no payment method required)
        $result = $gateway->createSubscription($team, $plan);

        if ($result->status === 'trialing') {
            event(new TrialStarted($team, $plan, $plan->trial_days));
        }

        return $result;
    }
}

// Trial ending notification (scheduled job)
// App\Jobs\NotifyTrialEnding.php
class NotifyTrialEnding implements ShouldQueue
{
    public function handle(): void
    {
        $endingTomorrow = Subscription::where('stripe_status', 'trialing')
            ->whereDate('trial_ends_at', now()->addDay()->toDateString())
            ->with('team')
            ->get();

        foreach ($endingTomorrow as $subscription) {
            $subscription->team->notify(new TrialEndingNotification(
                trialEndsAt: $subscription->trial_ends_at,
                plan: $subscription->plan,
            ));
        }

        $endedYesterday = Subscription::where('stripe_status', 'trialing')
            ->whereDate('trial_ends_at', '<', now()->toDateString())
            ->with('team')
            ->get();

        foreach ($endedYesterday as $subscription) {
            $subscription->team->notify(new TrialExpiredNotification(
                plan: $subscription->plan,
            ));
        }
    }
}
```

## Grace Period Handling

```php
// App\Billing\Services\GracePeriodService.php
class GracePeriodService
{
    public function getGracePeriodEnd(Subscription $subscription): ?Carbon
    {
        if (!$subscription->isOnGracePeriod()) return null;

        $graceDays = config('billing.grace_period_days', 7);
        $graceStart = $subscription->current_period_start ?? $subscription->updated_at;

        return $graceStart->addDays($graceDays);
    }

    public function isInFinalWarning(Subscription $subscription): bool
    {
        $end = $this->getGracePeriodEnd($subscription);
        if (!$end) return false;

        // Final 24 hours of grace period
        return $end->diffInHours(now()) <= 24;
    }

    public function sendWarning(Subscription $subscription): void
    {
        $team = $subscription->team;
        $end = $this->getGracePeriodEnd($subscription);

        if ($this->isInFinalWarning($subscription)) {
            $team->notify(new GracePeriodFinalWarning($end));
        } else {
            $team->notify(new PaymentFailedNotification($end));
        }
    }
}
```

## Past Due → Active Recovery

```php
// App\Billing\Handlers\InvoicePaymentSucceededHandler.php (webhook handler)
class InvoicePaymentSucceededHandler
{
    public function handle(array $payload): void
    {
        $invoice = $payload['data']['object'];
        $subscriptionId = $invoice['subscription'] ?? null;

        if (!$subscriptionId) return;

        $subscription = Subscription::where('stripe_id', $subscriptionId)->first();
        if (!$subscription) return;

        // Payment recovered — restore to active
        $subscription->update([
            'stripe_status' => 'active',
        ]);

        // Clear grace period warnings
        Cache::forget("grace_period_warning:{$subscription->team_id}");

        event(new PaymentRecovered($subscription));

        // Notify team their payment was successful
        $subscription->team->notify(new PaymentSucceededNotification());
    }
}
```

## Downgrade Flow

```php
// App\Billing\Actions\DowngradePlanAction.php
class DowngradePlanAction
{
    public function __construct(
        private BillingGateway $gateway,
        private EntitlementService $entitlements,
    ) {}

    public function execute(Team $team, Plan $newPlan, string $reason = null): void
    {
        $currentSubscription = $team->subscription;
        $currentPlan = $currentSubscription->plan;

        // Validate downgrade: new plan must be lower-tier
        if ($newPlan->tier >= $currentPlan->tier) {
            throw new \RuntimeException('Use swapPlan for upgrades, not downgrades.');
        }

        // Proration: Stripe handles proration by default for plan swaps.
        // For downgrades, you may want to schedule the change at period end
        // rather than applying immediately with negative proration.
        $scheduleAtPeriodEnd = config('billing.downgrade_at_period_end', true);

        if ($scheduleAtPeriodEnd) {
            // Schedule the swap to take effect at the end of the current period
            $this->gateway->schedulePlanSwap($team, $newPlan, $currentSubscription->current_period_end);
        } else {
            // Immediate swap (Stripe will apply proration credit)
            $this->gateway->swapPlan($team, $newPlan);
        }

        // Record downgrade reason for analytics
        \Log::info('Plan downgrade', [
            'team_id' => $team->id,
            'from_plan' => $currentPlan->slug,
            'to_plan' => $newPlan->slug,
            'reason' => $reason,
        ]);

        // Trigger downgrade survey or feedback collection
        event(new PlanDowngraded($team, $currentPlan, $newPlan, $reason));

        // Invalidate entitlements (new plan has fewer features)
        $this->entitlements->invalidateCache($team);
    }
}
```

## Cancellation Flow

```php
// App\Billing\Actions\CancelSubscriptionAction.php
class CancelSubscriptionAction
{
    public function __construct(
        private BillingGateway $gateway,
        private EntitlementService $entitlements,
    ) {}

    public function execute(Team $team, string $reason = null): void
    {
        $subscription = $team->subscription;

        if (!$subscription || !$subscription->isActive()) {
            throw new \RuntimeException('No active subscription to cancel.');
        }

        // Cancel with access until period end (standard behavior)
        $this->gateway->cancelSubscription($team);

        // Record cancellation for analytics and win-back campaigns
        \Log::info('Subscription canceled', [
            'team_id' => $team->id,
            'plan' => $subscription->plan->slug,
            'reason' => $reason,
            'period_ends_at' => $subscription->current_period_end,
        ]);

        event(new SubscriptionCanceled($team, $reason));

        // Schedule a follow-up check after period ends
        // to handle post-expiration actions (data export, cleanup)
        ProcessSubscriptionExpiry::dispatch($team)
            ->delay($subscription->current_period_end ?? now()->addMonth());
    }
}
```

## Stripe Customer Portal vs Custom Billing Page

```php
// App\Billing\Services\BillingPortalService.php
class BillingPortalService
{
    public function __construct(
        private BillingGateway $gateway,
    ) {}

    public function getPortalUrl(Team $team): string
    {
        // Stripe's hosted Customer Portal handles:
        // - View/pay invoices
        // - Update payment method
        // - Switch plans (within the same product family)
        // - Cancel subscription
        // - View billing history
        return $this->gateway->createBillingPortalSession(
            team: $team,
            returnUrl: route('billing.index'),
        );
    }

    public function shouldUseCustomPage(Team $team, Plan $targetPlan = null): bool
    {
        // Use custom billing management when:
        // - You need a downgrade survey before plan change
        // - You offer plans that can't be switched via Stripe (cross-product)
        // - You need custom trial extensions or promotions
        // - You need to validate team size or usage before upgrade
        // - You offer non-Stripe payment methods alongside Stripe

        if ($targetPlan && $targetPlan->requiresDowngradeSurvey) {
            return true;
        }

        if ($team->onLegacyPricing()) {
            return true;
        }

        // Default: use Stripe's Customer Portal
        return false;
    }
}
```

---

# Performance Considerations

- State checks (`isOnTrial()`, `hasAccess()`) are computed from cached local subscription data — no Stripe API calls.
- Grace period expiration checks reference the local `current_period_end` date, not Stripe.
- Trial ending notifications should be batched into a single scheduled job, not dispatched per-team.
- The entitlement computation (features per state) is the same function regardless of state — just with different inputs. Cache it uniformly.

---

# Security Considerations

- During grace period, users should not be able to consume usage that they won't pay for. If usage limits are enforced, they should continue to be enforced during grace period.
- Canceled-but-not-expired users still have legitimate access. Don't treat them as unauthorized in your middleware.
- Expired subscriptions must revoke ALL access, including API tokens and shared resources.
- Grace period communications (emails, in-app banners) must not leak billing details to other team members who shouldn't see payment information.

---

# Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Locking users out immediately on payment failure | Drives churn; most failures are transient (card expiry, bank issue) | Grace period of 7-14 days with clear communication |
| Treating "canceled" as "no access" | Revokes access that the user already paid for (current period) | Canceled = access until period end; Expired = no access |
| Crippling trial experience | Users can't evaluate the real product; low conversion | Full feature access during trial |
| Not notifying before trial ends | Users surprised by charge; chargebacks and churn | Notify 7 days, 3 days, 1 day before trial end |
| Grace period without communication | Users don't know payment failed; churn when access is revoked | Email + in-app banner when payment fails and at 3 days remaining |
| Downgrade with immediate proration refunds | Negative customer experience; accounting complexity | Default to downgrade-at-period-end; offer immediate as opt-in |
| Expired subscriptions not cleaning up resources | Orphaned data, API tokens still active, shared resources accessible | ProcessSubscriptionExpiry job handles cleanup |
| Not tracking cancellation reasons | Cannot improve retention without understanding why users leave | Log reason, trigger feedback survey, feed into analytics |

---

# Related Topics

Prerequisites: Plan-Feature-Entitlement model, BillingGateway wrapper, Stripe webhook idempotency
Related: Subscription drift reconciliation, Webhook audit & replay, Entitlement service

---

# AI Agent Notes

1. The billing state machine is the heart of the SaaS business model. Every state must be explicitly modeled, tested, and documented. Boolean "is_subscribed" checks are a code smell.
2. The separation of billing state (Stripe) from product behavior (entitlements) is the most important architectural principle in SaaS billing. Never conflate them.
3. Grace periods save customers. The default policy should be generous (7-14 days) with proactive communication. The product manager, not the developer, should decide grace period length — and it should be configurable.
4. Trial behavior has an outsized impact on conversion. Full access during trial is the standard industry practice. If the business wants to limit trial access, that's a product decision — implement it in the entitlement layer, not the billing layer.
5. Cancellation flow is a key retention opportunity. Always collect a reason (even optional). Schedule a follow-up (win-back email) a week after expiration.
6. Stripe's Customer Portal is excellent for standard flows. Only invest in custom billing pages when you have specific requirements the portal doesn't handle.
7. Test every state transition: trial → active, active → past_due, past_due → active (recovery), past_due → canceled (grace expired), canceled → expired. Every transition should have an automated test.
8. The `hasAccess()` method on Subscription is intentionally broad. The final access decision comes from the entitlement layer, which can be more restrictive based on business rules.

---

# Verification

- [ ] Subscription model correctly identifies: trial, active, past_due, canceled, expired states
- [ ] Trial provides full feature access (entitlement layer)
- [ ] Past due allows access with configurable grace period
- [ ] Canceled provides access until period end (not immediate revocation)
- [ ] Expired revokes all access
- [ ] Trial ending notifications: 7 days, 3 days, 1 day before end
- [ ] Payment failure triggers: email notification, in-app banner, grace period start
- [ ] Payment recovery (past_due → active) restores access and clears warnings
- [ ] Downgrade by default schedules at period end (not immediate)
- [ ] Cancellation flow: reason collection, period-end access, expiry job scheduled
- [ ] Post-expiration cleanup: revoke API tokens, archive data per retention policy
- [ ] Test: trial → active transition (payment method added)
- [ ] Test: active → past_due → active (payment failure and recovery)
- [ ] Test: active → past_due → expired (grace period exhaustion)
- [ ] Test: active → canceled → expired (user cancellation lifecycle)
- [ ] Test: canceled subscription retains access until period end
- [ ] Test: expired subscription has zero feature access
