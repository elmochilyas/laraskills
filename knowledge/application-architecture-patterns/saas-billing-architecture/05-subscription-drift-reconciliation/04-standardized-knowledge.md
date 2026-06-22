# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Subscription Drift Detection & Repair
Difficulty Level: Advanced
Last Updated: 2026-06-22
Status: Standardized

---

# Overview

Subscription drift occurs when the application's local cached subscription state diverges from Stripe's canonical state. Drift is inevitable in distributed systems — webhook delivery is at-least-once, network partitions happen, workers crash mid-processing, and Stripe dashboard changes bypass webhooks entirely. Detecting and repairing drift is a mandatory operational concern for production SaaS billing.

---

# Core Concepts

This knowledge unit addresses the detection, classification, and repair of subscription state drift between Stripe and local application state.

## Drift Sources

| Source | Example | Frequency |
|--------|---------|-----------|
| Missed webhook | Stripe retry exhausted, network partition during delivery | Rare but real |
| Webhook processing bug | Handler crashed before updating local state | Occasional (after deploys) |
| Direct Stripe Dashboard change | Admin swapped plan, canceled subscription, issued refund via Stripe UI | Common (ops workflows) |
| Network partition | Stripe API unreachable during webhook processing | Rare |
| Worker crash mid-processing | OOM, deployment during processing, SIGKILL | Occasional |
| Cashier version mismatch | Cashier update changes subscription model assumptions | Rare (after upgrades) |

## Drift Categories

- **Safe drift**: Period dates, trial end dates, status transitions (active → past_due). Can be auto-repaired safely.
- **Risky drift**: Plan/price changes, subscription cancellation, payment method changes. Requires manual verification before repair.
- **Critical drift**: Canceled subscription still marked active locally (user gets free access), active subscription marked canceled (user locked out). Requires immediate alerting.

---

# When To Use

- Every production SaaS with Stripe billing
- When operational staff make changes directly in Stripe dashboard
- When billing accuracy matters (any paid product)
- When compliance requires audit trail of billing state changes

---

# When NOT To Use

- Development environments (reconciliation is useful but lower priority than production)
- Single-team SaaS where Stripe dashboard changes are never made directly (unrealistic in practice)

---

# Best Practices

1. **Reconcile proactively, not reactively.** Don't wait for a customer to report "my plan is wrong." Run reconciliation on a schedule (hourly minimum).

2. **Classify drift by risk.** Auto-repair safe fields (dates, statuses). Alert on risky fields (plan changes). Never auto-repair critical fields (cancellation reversal) without human approval.

3. **Reconciliation is a safety net, not a primary sync.** Webhooks are the primary mechanism. Reconciliation catches what webhooks miss. If reconciliation fires frequently, fix your webhook processing.

4. **Rate-limit Stripe API calls.** Live mode Stripe allows ~25 read requests/sec per secret key. Use delays (50ms between calls) or a queue with controlled concurrency.

5. **Drift is expected. Zero-drift is unrealistic.** Don't alert on every reconciliation discrepancy if it's a known pattern. Track drift rate over time and alert on anomalies.

---

# Architecture Guidelines

## Drift Detection Service

```php
// App\Billing\Services\DriftDetectionService.php
namespace App\Billing\Services;

use App\Models\Team;
use App\Models\Plan;
use App\Billing\Contracts\BillingGateway;
use App\Billing\Data\DriftReport;
use App\Billing\Data\DriftItem;
use Illuminate\Support\Collection;

class DriftDetectionService
{
    public function __construct(
        private BillingGateway $gateway,
    ) {}

    public function detectForTeam(Team $team): DriftReport
    {
        $localSub = $team->subscription;

        if (!$localSub) {
            return DriftReport::noSubscription($team->id);
        }

        try {
            $stripeSub = $this->gateway->getSubscription($team);
        } catch (\RuntimeException $e) {
            // Subscription exists locally but not in Stripe (might have been deleted)
            return DriftReport::orphanedSubscription(
                teamId: $team->id,
                localStripeId: $localSub->stripe_id,
            );
        }

        $drifts = collect();

        // Status drift
        if ($localSub->stripe_status !== $stripeSub->stripeStatus) {
            $drifts->push(new DriftItem(
                field: 'stripe_status',
                localValue: $localSub->stripe_status,
                stripeValue: $stripeSub->stripeStatus,
                severity: DriftSeverity::MEDIUM,
                safeForAutoRepair: in_array($stripeSub->stripeStatus, ['active', 'trialing', 'past_due', 'unpaid']),
            ));
        }

        // Date drifts (with 5-second clock skew tolerance)
        $this->checkDateDrift($drifts, 'trial_ends_at', $localSub->trial_ends_at, $stripeSub->trialEndsAt, DriftSeverity::LOW);
        $this->checkDateDrift($drifts, 'current_period_start', $localSub->current_period_start, $stripeSub->currentPeriodStart, DriftSeverity::LOW);
        $this->checkDateDrift($drifts, 'current_period_end', $localSub->current_period_end, $stripeSub->currentPeriodEnd, DriftSeverity::LOW);
        $this->checkDateDrift($drifts, 'canceled_at', $localSub->canceled_at, $stripeSub->canceledAt, DriftSeverity::MEDIUM);

        // Plan/price drift (risky — may indicate direct Stripe dashboard change)
        if ($localSub->plan->stripe_price_id !== $stripeSub->stripePriceId) {
            $drifts->push(new DriftItem(
                field: 'plan',
                localValue: $localSub->plan->stripe_price_id,
                stripeValue: $stripeSub->stripePriceId,
                severity: DriftSeverity::CRITICAL,
                safeForAutoRepair: false, // NEVER auto-repair plan changes
            ));
        }

        // Cancel at period end drift
        if ($localSub->cancel_at_period_end !== $stripeSub->cancelAtPeriodEnd) {
            $drifts->push(new DriftItem(
                field: 'cancel_at_period_end',
                localValue: $localSub->cancel_at_period_end,
                stripeValue: $stripeSub->cancelAtPeriodEnd,
                severity: DriftSeverity::MEDIUM,
                safeForAutoRepair: true,
            ));
        }

        return new DriftReport(
            teamId: $team->id,
            hasDrift: $drifts->isNotEmpty(),
            items: $drifts,
            localStatus: $localSub->stripe_status,
            stripeStatus: $stripeSub->stripeStatus,
        );
    }

    private function checkDateDrift(Collection $drifts, string $field, ?\DateTimeInterface $local, ?\DateTimeInterface $stripe, DriftSeverity $severity): void
    {
        $localTs = $local?->getTimestamp();
        $stripeTs = $stripe?->getTimestamp();

        // One is null, other is not
        if (($localTs === null) !== ($stripeTs === null)) {
            $drifts->push(new DriftItem(
                field: $field,
                localValue: $local?->toIso8601String(),
                stripeValue: $stripe?->format('Y-m-d\TH:i:s\Z'),
                severity: $severity,
                safeForAutoRepair: true,
            ));
            return;
        }

        // Both present, check difference
        if ($localTs !== null && abs($localTs - $stripeTs) > 5) {
            $drifts->push(new DriftItem(
                field: $field,
                localValue: $local?->toIso8601String(),
                stripeValue: $stripe?->format('Y-m-d\TH:i:s\Z'),
                severity: $severity,
                safeForAutoRepair: true,
            ));
        }
    }
}

// Drift severity enum
enum DriftSeverity: string
{
    case LOW = 'low';           // Period dates, trial dates
    case MEDIUM = 'medium';     // Status changes, canceled at
    case CRITICAL = 'critical'; // Plan changes, orphaned subscriptions
}

// Drift item value object
readonly class DriftItem
{
    public function __construct(
        public string $field,
        public mixed $localValue,
        public mixed $stripeValue,
        public DriftSeverity $severity,
        public bool $safeForAutoRepair,
    ) {}
}

// Drift report value object
readonly class DriftReport
{
    /** @param Collection<DriftItem> $items */
    public function __construct(
        public string $teamId,
        public bool $hasDrift,
        public Collection $items,
        public string $localStatus,
        public string $stripeStatus,
    ) {}

    public static function noSubscription(string $teamId): self
    {
        return new self($teamId, false, collect(), 'none', 'none');
    }

    public static function orphanedSubscription(string $teamId, string $localStripeId): self
    {
        return new self(
            teamId: $teamId,
            hasDrift: true,
            items: collect([new DriftItem(
                field: 'subscription',
                localValue: $localStripeId,
                stripeValue: 'NOT FOUND',
                severity: DriftSeverity::CRITICAL,
                safeForAutoRepair: false,
            )]),
            localStatus: 'active',
            stripeStatus: 'NOT FOUND',
        );
    }

    public function hasCriticalDrift(): bool
    {
        return $this->items->contains(fn (DriftItem $item) => $item->severity === DriftSeverity::CRITICAL);
    }

    public function autoRepairableItems(): Collection
    {
        return $this->items->filter(fn (DriftItem $item) => $item->safeForAutoRepair);
    }
}
```

## Drift Repair Service

```php
// App\Billing\Services\DriftRepairService.php
namespace App\Billing\Services;

use App\Models\Team;
use App\Billing\Data\DriftReport;
use App\Billing\Data\DriftItem;
use App\Billing\Contracts\BillingGateway;
use App\Services\EntitlementService;

class DriftRepairService
{
    public function __construct(
        private BillingGateway $gateway,
        private EntitlementService $entitlements,
    ) {}

    public function repair(Team $team, DriftReport $report): array
    {
        $repaired = [];

        // Only repair safe items
        $repairableItems = $report->autoRepairableItems();

        // Re-fetch subscription data from Stripe for accurate repair
        $stripeSub = $this->gateway->getSubscription($team);
        $localSub = $team->subscription;

        $updates = [];

        foreach ($repairableItems as $item) {
            $value = match ($item->field) {
                'stripe_status' => $stripeSub->stripeStatus,
                'trial_ends_at' => $stripeSub->trialEndsAt,
                'current_period_start' => $stripeSub->currentPeriodStart,
                'current_period_end' => $stripeSub->currentPeriodEnd,
                'canceled_at' => $stripeSub->canceledAt,
                'cancel_at_period_end' => $stripeSub->cancelAtPeriodEnd,
                default => null,
            };

            if ($value !== null) {
                $updates[$item->field] = $value;
                $repaired[] = $item->field;
            }
        }

        if (!empty($updates)) {
            $localSub->update($updates);
            $this->entitlements->invalidateCache($team);

            \Log::info('Subscription drift repaired', [
                'team_id' => $team->id,
                'stripe_subscription_id' => $localSub->stripe_id,
                'repaired_fields' => $repaired,
            ]);
        }

        // For critical drifts (plan changes), alert but DO NOT auto-repair
        if ($report->hasCriticalDrift()) {
            $this->alertCriticalDrift($team, $report);

            // Create a record for support to review
            DriftAlert::create([
                'team_id' => $team->id,
                'stripe_subscription_id' => $localSub->stripe_id,
                'drift_details' => $report->items->toArray(),
                'status' => 'pending_review',
            ]);
        }

        return $repaired;
    }

    private function alertCriticalDrift(Team $team, DriftReport $report): void
    {
        $planDrift = $report->items->first(fn (DriftItem $i) => $i->field === 'plan');

        \Log::critical('CRITICAL: Plan drift detected — manual intervention required', [
            'team_id' => $team->id,
            'team_name' => $team->name,
            'local_plan' => $planDrift?->localValue,
            'stripe_plan' => $planDrift?->stripeValue,
        ]);

        // Send to Slack or PagerDuty
        // event(new CriticalBillingDriftDetected($team, $report));
    }
}

// Drift alert model
class DriftAlert extends Model
{
    protected $fillable = ['team_id', 'stripe_subscription_id', 'drift_details', 'status', 'resolved_at', 'resolution_notes'];
    protected $casts = ['drift_details' => 'array', 'resolved_at' => 'datetime'];
}
```

## Orphaned Subscription Cleanup

```php
// App\Jobs\CleanupOrphanedSubscriptions.php
namespace App\Jobs;

use App\Models\Team;
use App\Billing\Contracts\BillingGateway;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CleanupOrphanedSubscriptions implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function handle(BillingGateway $gateway): void
    {
        $teams = Team::whereHas('subscription', function ($q) {
            $q->whereIn('stripe_status', ['active', 'trialing', 'past_due']);
        })->get();

        $orphaned = [];

        foreach ($teams as $team) {
            try {
                $gateway->getSubscription($team);
            } catch (\RuntimeException $e) {
                // Subscription exists locally but not in Stripe
                // This could mean it was deleted in Stripe dashboard
                $orphaned[] = $team->id;

                \Log::warning('Orphaned subscription detected', [
                    'team_id' => $team->id,
                    'stripe_subscription_id' => $team->subscription->stripe_id,
                ]);

                // Mark as canceled locally — prevents free access
                $team->subscription()->update([
                    'stripe_status' => 'canceled',
                    'ended_at' => now(),
                ]);
            }

            usleep(50000); // Rate limit
        }

        if (!empty($orphaned)) {
            \Log::critical('Orphaned subscriptions cleaned up', [
                'team_ids' => $orphaned,
                'count' => count($orphaned),
            ]);
        }
    }
}
```

---

# Performance Considerations

- Reconciliation is an O(n) operation where n = active subscriptions. For 10,000 subscriptions at ~20 calls/sec: ~8 minutes per reconciliation cycle.
- Use a queue with controlled concurrency (Horizon `maxProcesses` or `rateLimiter`) to avoid Stripe API 429 errors.
- Run reconciliation on a dedicated queue worker with low priority to avoid competing with user-facing jobs.
- Cache reconciliation results in a `drift_alerts` table rather than reporting live each cycle. Deduplicate alerts by team ID + field.
- Consider sharding reconciliation by team ID ranges if you have >50k active subscriptions.

---

# Security Considerations

- Reconciliation API calls use the same Stripe secret key as billing operations. Protect the queue worker environment.
- Drift alert data may contain PII (team names). Logs and alert channels should be access-controlled.
- Auto-repair must never modify Stripe state — it only syncs local state to match Stripe. The stripe_api is the source of truth.

---

# Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Auto-repairing plan changes | Switches customer to wrong plan without consent | Plan drift is always manual-repair; alert and queue for review |
| Zero clock skew tolerance | Dates flagged as drift due to 1-second differences | 5-second tolerance on date comparisons |
| Alerting on every reconciliation | Alert fatigue — ops team ignores billing alerts | Track drift rate; alert only on new drifts or anomaly thresholds |
| Not handling orphaned subscriptions | Local subscription thinks it's active, Stripe says it doesn't exist | Detect orphans in reconciliation; mark as canceled locally |
| Running reconciliation without rate limiting | 429 errors from Stripe API; reconciliation fails mid-way | usleep between calls; use a queue with RateLimiter |
| Reconciliation as the only sync mechanism | Webhook failures accumulate until hourly reconciliation | Fix webhook processing first; reconciliation is the safety net |
| Not logging repair actions | Cannot audit what was auto-repaired and why | Log every repair with team ID, fields changed, old/new values |

---

# Related Topics

Prerequisites: Stripe webhook idempotency, BillingGateway wrapper pattern, Webhook audit & replay
Related: Billing failure states, Plan-Feature-Entitlement model, Horizon queue management

---

# AI Agent Notes

1. Drift is normal. The goal is to detect it quickly and repair it safely, not to eliminate it (which is impossible in distributed systems).
2. The cardinal rule: Stripe is always the source of truth. When local state disagrees with Stripe, local state is wrong. Never push local state corrections to Stripe during reconciliation.
3. Plan drift is the most dangerous. It usually means someone changed the subscription in the Stripe dashboard. Auto-repairing this could switch a customer from Enterprise to Starter without their knowledge. Always require manual review.
4. Test reconciliation with the FakeBillingGateway. Set up scenarios where local state diverges from fake state and verify detection and repair.
5. The reconciliation job should be idempotent. Running it twice in a row should produce the same results (no new drifts after repair).
6. Orphaned subscriptions (local active, Stripe not found) are a special case. The subscription was probably deleted in the Stripe dashboard. Mark it canceled locally and alert — don't silently fix.
7. Consider adding a drift dashboard in your admin panel showing current drift count, recent repairs, and pending critical drifts.

---

# Verification

- [ ] DriftDetectionService correctly identifies: status drift, date drift, plan drift, cancel_at_period_end drift
- [ ] 5-second clock skew tolerance on date comparisons
- [ ] DriftReport correctly classifies items by severity (LOW, MEDIUM, CRITICAL)
- [ ] Auto-repair only touches safe fields (status, dates) — never plan
- [ ] Critical drift (plan change, orphaned subscription) triggers alert, not auto-repair
- [ ] Orphaned subscriptions detected and marked as canceled locally
- [ ] Reconciliation rate-limited (50ms delay between API calls)
- [ ] All repairs logged with team ID, fields changed, old/new values
- [ ] DriftAlert model records critical drifts for manual review
- [ ] `billing:reconcile` command runs on schedule (hourly minimum)
- [ ] Test: local status 'active', Stripe status 'past_due' → detected and auto-repaired
- [ ] Test: local plan 'Pro', Stripe plan 'Enterprise' → detected, alerted, NOT auto-repaired
- [ ] Test: subscription exists locally but not in Stripe → orphan detected, canceled locally
