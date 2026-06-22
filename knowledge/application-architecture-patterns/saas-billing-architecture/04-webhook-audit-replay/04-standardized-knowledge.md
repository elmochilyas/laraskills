# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Webhook Audit Log, Replay & Reconciliation
Difficulty Level: Advanced
Last Updated: 2026-06-22
Status: Standardized

---

# Overview

Three operational mechanisms form the safety net for SaaS billing: (1) an immutable webhook audit log recording every incoming Stripe event, (2) an event replay capability for support-driven and automated remediation, and (3) a scheduled reconciliation job that detects drift between Stripe and local state. Together, these ensure that no billing event is lost, every state change is traceable, and the system can self-heal from missed webhooks or processing bugs.

---

# Core Concepts

This knowledge unit addresses the audit, replay, and reconciliation triad for Stripe webhooks in Laravel applications.

## The Three Mechanisms

```
Audit → Replay → Reconciliation
  ↓        ↓          ↓
Record   Re-run    Compare &
every    failed    repair state
event    events    periodically
```

- **Audit Log**: Every incoming Stripe event is recorded in `stripe_events`. Duplicates are flagged but recorded. Full raw payload preserved. This is the immutable source of truth for all billing state changes.
- **Replay Flow**: A support user or automated system can reset a `StripeEvent` from `processed`/`failed` back to `pending`, which dispatches `ProcessStripeEvent` again. Because all handlers are idempotent, replay is always safe.
- **Reconciliation Job**: A scheduled command queries Stripe API for each active subscription, compares against local state, and flags drift. Drift is reported (alerts) and optionally auto-repaired.

---

# When To Use

- Every production SaaS with Stripe billing (all of them)
- When billing accuracy is critical (financial systems, compliance requirements)
- When customer support needs to diagnose and fix billing issues
- When you've had a webhook processing bug and need to replay affected events
- When you need an audit trail for billing state changes (SOC2, PCI compliance)

---

# When NOT To Use

- Trivially small operations where a single developer handles all billing issues manually — but even then, the audit log alone is worth implementing.

---

# Best Practices

1. **Record everything.** Even duplicate webhooks should be recorded with a `duplicate = true` flag or `skipped` status. You'll need this data when debugging "why was event X processed twice?"

2. **Replay is safe because handlers are idempotent.** If replay is not safe, fix the handlers first. Every handler must use `updateOrCreate`/`upsert`.

3. **Reconciliation is read-heavy on Stripe API.** Rate-limit reconciliation API calls (Stripe allows ~100/sec in test mode, 25/sec in live mode per secret key). Use delays between batches.

4. **Auto-repair cautiously.** Automatically fixing safe fields (period dates, trial end) is fine. Automatically canceling subscriptions or changing plans is not — alert first, repair manually or with explicit approval.

5. **The audit log is append-only.** Only update `status`, `processed_at`, and `error_message`. Never mutate the `payload` or `stripe_event_id` after creation.

---

# Architecture Guidelines

## 1. Webhook Audit Log

The `StripeEvent` model doubles as the audit log. Every incoming webhook is recorded with its full raw payload.

```php
// Enhanced StripeEvent with audit capabilities
class StripeEvent extends Model
{
    protected $fillable = [
        'stripe_event_id', 'type', 'payload', 'status',
        'processed_at', 'error_message', 'is_duplicate', 'retry_count',
    ];

    protected $casts = [
        'payload' => 'array',
        'processed_at' => 'datetime',
        'is_duplicate' => 'boolean',
    ];

    // Scopes for audit queries
    public function scopeFailed($query): Builder
    {
        return $query->where('status', self::STATUS_FAILED);
    }

    public function scopeDuplicates($query): Builder
    {
        return $query->where('is_duplicate', true);
    }

    public function scopeByType($query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeProcessedBetween($query, Carbon $from, Carbon $to): Builder
    {
        return $query->whereBetween('processed_at', [$from, $to]);
    }
}
```

## 2. Replay Flow

```php
// App\Billing\Services\StripeEventReplayService.php
namespace App\Billing\Services;

use App\Models\StripeEvent;
use App\Jobs\ProcessStripeEvent;

class StripeEventReplayService
{
    public function replay(StripeEvent $event): void
    {
        // Reset to pending status
        $event->update([
            'status' => StripeEvent::STATUS_PENDING,
            'processed_at' => null,
            'error_message' => null,
            'retry_count' => $event->retry_count + 1,
        ]);

        // Re-dispatch
        ProcessStripeEvent::dispatch($event);

        \Log::info('Stripe event replay initiated', [
            'stripe_event_id' => $event->stripe_event_id,
            'type' => $event->type,
            'retry_count' => $event->retry_count,
        ]);
    }

    public function replayAllFailed(): int
    {
        $failedEvents = StripeEvent::failed()->get();
        $count = 0;

        foreach ($failedEvents as $event) {
            $this->replay($event);
            $count++;
        }

        return $count;
    }

    public function replayByType(string $type, ?Carbon $since = null): int
    {
        $query = StripeEvent::byType($type);

        if ($since) {
            $query->where('created_at', '>=', $since);
        }

        $events = $query->where('status', '!=', StripeEvent::STATUS_PROCESSED)->get();
        $count = 0;

        foreach ($events as $event) {
            $this->replay($event);
            $count++;
        }

        return $count;
    }
}
```

### Replay via Artisan Command

```php
// App\Console\Commands\ReplayStripeEvent.php
namespace App\Console\Commands;

use App\Models\StripeEvent;
use App\Billing\Services\StripeEventReplayService;
use Illuminate\Console\Command;

class ReplayStripeEvent extends Command
{
    protected $signature = 'billing:replay
                            {event? : Stripe event ID to replay}
                            {--all-failed : Replay all failed events}
                            {--type= : Replay events of a specific type}
                            {--since= : Replay events since this date}';

    protected $description = 'Replay Stripe webhook events';

    public function handle(StripeEventReplayService $replay): int
    {
        if ($this->argument('event')) {
            $event = StripeEvent::where('stripe_event_id', $this->argument('event'))->firstOrFail();
            $replay->replay($event);
            $this->info("Replayed event: {$event->stripe_event_id}");
            return self::SUCCESS;
        }

        if ($this->option('all-failed')) {
            $count = $replay->replayAllFailed();
            $this->info("Replayed {$count} failed events.");
            return self::SUCCESS;
        }

        if ($type = $this->option('type')) {
            $since = $this->option('since') ? Carbon::parse($this->option('since')) : null;
            $count = $replay->replayByType($type, $since);
            $this->info("Replayed {$count} events of type '{$type}'.");
            return self::SUCCESS;
        }

        $this->error('Specify an event ID, --all-failed, or --type.');
        return self::FAILURE;
    }
}
```

### Admin UI Replay Endpoint

```php
// App\Http\Controllers\Admin\StripeEventController.php
class StripeEventController
{
    public function replay(string $stripeEventId, StripeEventReplayService $replay): JsonResponse
    {
        $event = StripeEvent::where('stripe_event_id', $stripeEventId)->firstOrFail();

        $replay->replay($event);

        \Log::info('Admin replayed Stripe event', [
            'stripe_event_id' => $event->stripe_event_id,
            'admin_id' => auth()->id(),
        ]);

        return response()->json(['status' => 'replay_dispatched']);
    }
}
```

## 3. Reconciliation Job

```php
// App\Console\Commands\ReconcileBilling.php
namespace App\Console\Commands;

use App\Models\Team;
use App\Models\Plan;
use App\Billing\Contracts\BillingGateway;
use App\Services\EntitlementService;
use Illuminate\Console\Command;

class ReconcileBilling extends Command
{
    protected $signature = 'billing:reconcile
                            {--auto-repair : Automatically repair safe drift}
                            {--team= : Reconcile a specific team}
                            {--dry-run : Report drift without making changes}';

    protected $description = 'Reconcile local subscription state with Stripe';

    public function handle(BillingGateway $gateway, EntitlementService $entitlements): int
    {
        $query = Team::whereHas('subscription', function ($q) {
            $q->whereIn('stripe_status', ['active', 'trialing', 'past_due']);
        });

        if ($teamId = $this->option('team')) {
            $query->where('id', $teamId);
        }

        $teams = $query->get();
        $driftsDetected = 0;
        $driftsRepaired = 0;

        $this->withProgressBar($teams, function (Team $team) use ($gateway, $entitlements, &$driftsDetected, &$driftsRepaired) {
            try {
                $stripeSub = $gateway->getSubscription($team);
                $localSub = $team->subscription;

                if (!$localSub) return;

                $drifts = $this->detectDrift($localSub, $stripeSub);

                if (empty($drifts)) return;

                $driftsDetected++;

                $this->warn("\nDrift detected for team {$team->id}:");
                foreach ($drifts as $drift) {
                    $this->line("  - {$drift}");
                }

                if ($this->option('auto-repair') && !$this->option('dry-run')) {
                    $this->repairDrift($team, $drifts, $stripeSub);
                    $entitlements->invalidateCache($team);
                    $driftsRepaired++;
                }

                // Always log drift for monitoring
                \Log::warning('Subscription drift detected', [
                    'team_id' => $team->id,
                    'stripe_subscription_id' => $localSub->stripe_id,
                    'drifts' => $drifts,
                ]);

            } catch (\Exception $e) {
                $this->error("Error reconciling team {$team->id}: {$e->getMessage()}");
            }

            // Rate limit Stripe API calls (25/sec in live mode)
            usleep(50000); // 50ms = ~20 calls/sec
        });

        $this->newLine();
        $this->info("Reconciliation complete. Drifts detected: {$driftsDetected}, Repaired: {$driftsRepaired}");

        return self::SUCCESS;
    }

    private function detectDrift($localSub, $stripeSub): array
    {
        $drifts = [];

        if ($localSub->stripe_status !== $stripeSub->stripeStatus) {
            $drifts[] = "status: local={$localSub->stripe_status}, stripe={$stripeSub->stripeStatus}";
        }

        // Compare dates within a 5-second tolerance (clock skew)
        if ($localSub->trial_ends_at?->diffInSeconds($stripeSub->trialEndsAt) > 5) {
            $drifts[] = "trial_ends_at: local={$localSub->trial_ends_at}, stripe={$stripeSub->trialEndsAt}";
        }

        if ($localSub->current_period_end?->diffInSeconds($stripeSub->currentPeriodEnd) > 5) {
            $drifts[] = "current_period_end: local={$localSub->current_period_end}, stripe={$stripeSub->currentPeriodEnd}";
        }

        // Plan drift: plan changed in Stripe but not locally
        if ($localSub->plan->stripe_price_id !== $stripeSub->stripePriceId) {
            $drifts[] = "plan: local={$localSub->plan->stripe_price_id}, stripe={$stripeSub->stripePriceId}";
        }

        return $drifts;
    }

    private function repairDrift(Team $team, array $drifts, $stripeSub): void
    {
        $safeFields = ['stripe_status', 'trial_ends_at', 'current_period_start', 'current_period_end'];

        $updateData = [];
        $needsPlanUpdate = false;

        if (in_array('stripe_status: local=...', $drifts) /* simplified */ ) {
            $updateData['stripe_status'] = $stripeSub->stripeStatus;
        }

        foreach ($safeFields as $field) {
            if ($drifts contain this field...) {
                // Map DTO fields to model fields
            }
        }

        // Auto-repair only safe period/status drift
        $team->subscription()->update([
            'stripe_status' => $stripeSub->stripeStatus,
            'trial_ends_at' => $stripeSub->trialEndsAt,
            'current_period_start' => $stripeSub->currentPeriodStart,
            'current_period_end' => $stripeSub->currentPeriodEnd,
        ]);

        // Plan drift: alert but DO NOT auto-update (could change pricing)
        if ($needsPlanUpdate) {
            \Log::critical('Plan drift requires manual intervention', [
                'team_id' => $team->id,
                'stripe_price_id' => $stripeSub->stripePriceId,
            ]);

            // Dispatch alert to Slack/email
            // AlertService::critical('billing', 'Plan drift detected', [...] );
        }
    }
}
```

### Horizon Schedule Configuration

```php
// App\Providers\HorizonServiceProvider.php or routes/console.php
\Illuminate\Support\Facades\Schedule::command('billing:reconcile --auto-repair')
    ->hourly()
    ->withoutOverlapping(600) // 10-minute lock
    ->onOneServer()
    ->runInBackground()
    ->emailOutputOnFailure(config('billing.alert_email'));

// Additional: daily full reconciliation with detailed report
\Illuminate\Support\Facades\Schedule::command('billing:reconcile --dry-run')
    ->dailyAt('03:00')
    ->withoutOverlapping(1200)
    ->onOneServer()
    ->emailOutputTo(config('billing.ops_email'));
```

---

# Performance Considerations

- Reconciliation queries Stripe API once per active subscription. For 10,000 active subscriptions, that's 10,000 API calls. At 20 calls/sec, it takes ~8 minutes. Schedule reconciliation hourly and ensure the job can overlap (or run on one server).
- The StripeEvent table grows unbounded. Schedule a prune command:
```php
// App\Console\Commands\PruneStripeEvents.php
StripeEvent::where('created_at', '<', now()->subDays(90))
    ->where('status', StripeEvent::STATUS_PROCESSED)
    ->delete();
```
- The audit log query for admin UI should be paginated and filterable by type/date.

---

# Security Considerations

- Admin replay endpoints must require authentication AND authorization (admin/support role).
- Reconciliation output may contain internal pricing data — don't email raw output to unprivileged addresses.
- StripeEvent payloads contain PII (customer email, billing address). Treat the table as sensitive data. Consider encryption at rest or field-level encryption for PII columns.

---

# Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| No audit log — events processed and forgotten | Cannot troubleshoot billing bugs; no trace of what happened | StripeEvent table records every incoming webhook |
| Replay that isn't actually idempotent | Replaying a subscription.created event creates a duplicate subscription | All handlers must use updateOrCreate/upsert |
| Auto-repair on plan changes | Automatically changing a customer's plan without their consent | Alert on plan drift, never auto-repair plan changes |
| Reconciliation without rate limiting | Stripe API rate-limit errors (429) cause reconciliation to fail | usleep between API calls; use a queue with concurrency limit |
| Not pruning the audit log | StripeEvent table grows to millions of rows, queries slow down | Scheduled prune for processed events older than 90 days |
| Reconciliation with no clock skew tolerance | Date mismatches due to clock skew flagged as drift | 5-second tolerance on date comparisons |
| Only reconciling on demand (manually) | Drift silently accumulates until a customer reports it | Scheduled reconciliation job runs at least hourly |

---

# Related Topics

Prerequisites: Stripe webhook idempotency, BillingGateway wrapper pattern, Laravel Queues & Horizon
Related: Subscription drift reconciliation, Plan-Feature-Entitlement model, Billing failure states

---

# AI Agent Notes

1. The audit log is append-only. Never modify the `payload` or `stripe_event_id` columns after creation. The `status` and `processed_at` columns track processing state.
2. Replay must always be safe. If you're unsure whether a handler is idempotent, verify by reading its code before enabling replay for that event type.
3. Reconciliation is a safety net, not a primary sync mechanism. Webhooks are the primary sync. Reconciliation catches what webhooks miss.
4. The reconciliation command should be tested in staging with a realistic number of subscriptions before deploying to production.
5. Rate-limit Stripe API calls carefully. In test mode, Stripe allows higher rates, so production behavior may differ.
6. The admin replay UI should show a confirmation dialog with the event details before replaying. Accidental replays should be difficult.
7. Consider adding a `replayed_from_id` column to StripeEvent to track replay chains for audit purposes.
8. Reconciliation drift alerts should go to a dedicated Slack channel or monitoring system, not just email.

---

# Verification

- [ ] StripeEvent table records every incoming webhook (including duplicates)
- [ ] StripeEventReplayService resets event to pending and re-dispatches job
- [ ] All webhook handlers are idempotent (updateOrCreate/upsert)
- [ ] `billing:replay` artisan command works for single events, all-failed, and by-type
- [ ] Admin replay endpoint secured with authorization
- [ ] `billing:reconcile` command compares local state against Stripe API
- [ ] Reconciliation detects: status drift, period date drift, plan drift
- [ ] Auto-repair only fixes safe fields (status, period dates) — never plan
- [ ] Reconciliation rate-limited to avoid Stripe API errors
- [ ] Scheduled reconciliation registered in console kernel
- [ ] StripeEvents pruned on a schedule (90-day retention)
- [ ] Replay audit trail (replayed_from_id or retry_count) recorded
- [ ] Reconciliation output/errors alerted to ops team (Slack/email/monitoring)
