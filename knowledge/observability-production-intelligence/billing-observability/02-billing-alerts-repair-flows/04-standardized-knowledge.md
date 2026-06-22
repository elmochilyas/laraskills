# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Observability & Production Intelligence |
| Subdomain | Billing Observability |
| Knowledge Unit | Billing Alerts & Support Repair Flows |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Billing Webhook Metrics, Laravel Artisan Commands, Laravel Horizon, Stripe SDK |
| Related KUs | Billing Webhook Metrics, Alerting & Incident Response, Error Tracking |
| Source | domain-analysis.md |

# Overview

Billing alerts translate monitoring metrics into actionable notifications, and repair flows provide operations teams and support staff with safe, auditable tools to resolve billing incidents. When subscription state drifts or webhook processing fails, the team needs both immediate awareness (alerts) and well-tested recovery procedures (repair flows). Without standardized repair flows, every billing incident becomes a manual, error-prone investigation that risks compounding the problem.

# Core Concepts

- **Alert types**: Webhook delivery failure, processing failure rate spike, subscription drift detection, billing queue backlog, failed billing jobs, payment failure spike.
- **Webhook delivery failure response**: Check webhook endpoint health, check TLS certificate status, verify endpoint URL in Stripe dashboard, check for recent DNS or infrastructure changes.
- **Webhook processing failure rate spike response**: Check recent deploys, check for Stripe API version changes, check error logs for new exception types, verify Stripe SDK compatibility.
- **Subscription drift response**: Run reconciliation job immediately, identify affected teams, initiate per-team subscription sync from Stripe API.
- **Repair flows**: Manual webhook replay, subscription force-sync, entitlement recalculation, failed job recovery — each available as both admin UI actions and artisan commands.
- **Audit logging**: Every manual repair action is logged with who performed it, what was changed, why it was needed, and the result.
- **Rate limit awareness**: Manual repair actions can trigger Stripe API calls — respect Stripe's rate limits (100/sec for reads, 25/sec for writes in live mode).

# When To Use

- In every production Laravel SaaS with Stripe webhook processing
- When operations and support teams need standardized incident response procedures
- When subscription state correctness is critical to revenue
- After setting up billing metrics and before going live with paid subscriptions

# When NOT To Use

- During initial development before webhook handling is implemented
- For applications without billing or subscription management
- For non-production environments (manual testing via Telescope/Sentry is sufficient)

# Alert Types and Response Procedures

## Alert 1: Webhook Delivery Failure

**Detection:** Stripe dashboard shows failed deliveries. Stripe retries for 3 days with exponential backoff, so this alert fires after the first failure to give the team maximum time to respond.

**Response:**
1. Check webhook endpoint health — is the server up and responding to health checks?
2. Verify TLS certificate validity and expiration.
3. Check for recent DNS or load balancer changes.
4. Verify the webhook endpoint URL in the Stripe dashboard matches the current deployment.
5. If infrastructure is healthy, check for HTTP 5xx errors in application logs matching webhook request paths.

## Alert 2: Webhook Processing Failure Rate Spike

**Detection:** `stripe_webhook_failed_count / stripe_webhook_received_count > 1%` over 5 minutes.

**Response:**
1. Check recent application deploys — was new code released?
2. Check Stripe API version — was there an upgrade? Stripe API version changes can break webhook payload parsing.
3. Check error tracking (Sentry/Bugsnag) for new exception types matching `StripeWebhookFailed`.
4. Verify Stripe SDK version compatibility with the current Stripe API version.
5. If a specific `event_type` is failing, check that event's handler for newly introduced payload fields.

## Alert 3: Subscription Drift Detected

**Detection:** `subscription_drift_count > 0`. This fires when the nightly (or periodic) reconciliation job finds mismatches between database state and Stripe API state.

**Response:**
1. Run reconciliation report to identify which teams are affected and what mismatches exist.
2. For each mismatched team, determine the source of truth:
   - If Stripe is correct and the database is stale → force-sync subscription from Stripe API.
   - If the database is correct and Stripe is wrong → this is rare but possible with manual Stripe dashboard changes. Update Stripe to match.
3. Investigate root cause: why did webhooks fail to update the database? Check failed webhook logs for the affected teams.
4. If the drift affects many teams, consider running a bulk reconciliation repair.

## Alert 4: Billing Queue Backlog

**Detection:** `billing_queue_depth > 100`.

**Response:**
1. Check Horizon dashboard for queue health — are workers running?
2. Check for slow jobs in the billing queue — is one job type dominating processing time?
3. Check worker CPU/memory — are workers resource-starved?
4. Consider scaling workers temporarily if the backlog is from a legitimate traffic spike.
5. If workers are down, check `supervisor` status or container orchestrator health.

## Alert 5: Failed Billing Jobs

**Detection:** `failed_billing_jobs > 0` for more than 3 consecutive monitoring cycles.

**Response:**
1. Check Horizon "Failed Jobs" dashboard for the `billing` queue.
2. Identify the job class that is failing and the exception type.
3. Check error tracking for the stack trace and context.
4. For transient failures (network, timeout), retry the job via Horizon UI or `php artisan queue:retry {job_id}`.
5. For permanent failures (invalid data, missing records), fix the root cause before retrying.

## Alert 6: Payment Failure Spike

**Detection:** Anomaly in `invoice.payment_failed` event rate compared to baseline.

**Response:**
1. Check Stripe dashboard for payment failure reasons — is it a specific card network, bank, or region?
2. If widespread, this may be a Stripe platform issue — check Stripe status page.
3. If limited to specific customers, investigate their payment methods.
4. Communicate with affected customers if the issue is on their side (expired cards, insufficient funds).

# Repair Flows

## Repair 1: Manual Webhook Replay

When a specific StripeEvent was not processed or needs to be reprocessed:

```bash
# Artisan command
php artisan billing:replay-webhook {stripeEventId}

# Options
php artisan billing:replay-webhook {stripeEventId} --force    # Skip duplicate check
php artisan billing:replay-webhook {stripeEventId} --sync      # Process synchronously
```

```php
// Admin UI action (controller method)
class BillingRepairController extends Controller
{
    public function replayWebhook(ReplayWebhookRequest $request): JsonResponse
    {
        $stripeEvent = StripeEvent::findOrFail($request->input('stripe_event_id'));

        $this->authorize('repair', $stripeEvent);

        dispatch(new ProcessStripeWebhook($stripeEvent));

        AuditLog::create([
            'action' => 'billing.webhook_replayed',
            'actor_id' => auth()->id(),
            'metadata' => [
                'stripe_event_id' => $stripeEvent->external_id,
                'team_id' => $stripeEvent->team_id,
                'reason' => $request->input('reason'),
            ],
        ]);

        return response()->json(['message' => 'Webhook replay queued.']);
    }
}
```

## Repair 2: Subscription Force-Sync

When a team's local subscription state must be overwritten from the Stripe API:

```bash
# Artisan command
php artisan billing:sync-subscription {teamId}

# Options
php artisan billing:sync-subscription {teamId} --all    # Sync all subscriptions for team
```

```php
class SyncSubscriptionCommand extends Command
{
    protected $signature = 'billing:sync-subscription {teamId} {--all}';
    protected $description = 'Force-sync a team subscription from Stripe API';

    public function handle(): int
    {
        $team = Team::findOrFail($this->argument('teamId'));

        $this->info("Syncing subscription for team {$team->id} ({$team->name})...");

        $subscription = app(SyncSubscriptionAction::class)->execute($team);

        AuditLog::create([
            'action' => 'billing.subscription_synced',
            'actor_id' => auth()->id() ?? 0,
            'team_id' => $team->id,
            'metadata' => [
                'subscription_id' => $subscription->id,
                'stripe_status' => $subscription->stripe_status,
                'previous_status' => $team->subscription?->stripe_status,
                'trigger' => 'manual_command',
            ],
        ]);

        $this->info('Subscription synced successfully.');

        return self::SUCCESS;
    }
}
```

## Repair 3: Entitlement Recalculation

When a team's feature access does not match their plan + subscription + usage:

```bash
# Artisan command
php artisan billing:recalculate-entitlements {teamId}

# Options
php artisan billing:recalculate-entitlements {teamId} --dry-run   # Report without making changes
php artisan billing:recalculate-entitlements --all-teams           # Recalculate all teams
```

```php
class RecalculateEntitlementsCommand extends Command
{
    protected $signature = 'billing:recalculate-entitlements {teamId?} {--all-teams} {--dry-run}';
    protected $description = 'Recalculate feature entitlements for a team';

    public function handle(): int
    {
        $teams = $this->option('all-teams')
            ? Team::all()
            : collect([Team::findOrFail($this->argument('teamId'))]);

        foreach ($teams as $team) {
            $planEntitlements = $team->subscriptionPlan?->entitlements ?? [];
            $subscriptionEntitlements = $team->subscription?->entitlements ?? [];
            $usageOverrides = $team->usageOverrides;

            $resolved = app(EntitlementResolver::class)->resolve(
                plan: $planEntitlements,
                subscription: $subscriptionEntitlements,
                usage: $usageOverrides,
            );

            if ($this->option('dry-run')) {
                $this->info("Team {$team->id}: would set entitlements: " . json_encode($resolved));
                continue;
            }

            $team->update(['entitlements' => $resolved]);

            AuditLog::create([
                'action' => 'billing.entitlements_recalculated',
                'actor_id' => auth()->id() ?? 0,
                'team_id' => $team->id,
                'metadata' => [
                    'entitlements' => $resolved,
                    'plan_id' => $team->subscriptionPlan?->id,
                    'subscription_id' => $team->subscription?->id,
                ],
            ]);
        }

        $this->info('Entitlements recalculated.');
        return self::SUCCESS;
    }
}
```

## Repair 4: Failed Job Recovery

```bash
# Retry specific failed job
php artisan queue:retry {job_id}

# Retry all failed jobs on the billing queue
php artisan queue:retry all --queue=billing

# Via Horizon UI: navigate to "Failed Jobs" → click "Retry"
```

```php
// Admin UI action
class BillingRepairController extends Controller
{
    public function retryFailedJob(RetryJobRequest $request): JsonResponse
    {
        $this->authorize('repair', BillingJob::class);

        $jobId = $request->input('job_id');
        Artisan::call('queue:retry', ['id' => [$jobId]]);

        AuditLog::create([
            'action' => 'billing.job_retried',
            'actor_id' => auth()->id(),
            'metadata' => [
                'job_id' => $jobId,
                'reason' => $request->input('reason'),
            ],
        ]);

        return response()->json(['message' => "Job {$jobId} retried."]);
    }
}
```

# Audit Logging Standards

Every manual repair action must be logged with:

| Field | Description |
|-------|-------------|
| `action` | The repair action type (e.g., `billing.webhook_replayed`, `billing.subscription_synced`) |
| `actor_id` | The admin/support user who initiated the repair |
| `team_id` | The affected team (if applicable) |
| `metadata` | Action-specific context: reason, before/after state, correlation IDs |

```php
// Example audit log schema
Schema::create('billing_audit_logs', function (Blueprint $table) {
    $table->id();
    $table->string('action');           // billing.webhook_replayed, billing.subscription_synced
    $table->foreignId('actor_id')->nullable()->constrained('users');
    $table->foreignId('team_id')->nullable()->constrained('teams');
    $table->json('metadata');           // Flexible context
    $table->json('result')->nullable(); // Outcome (success/failure, affected records)
    $table->timestamps();
    $table->index(['action', 'created_at']);
    $table->index(['team_id', 'created_at']);
});
```

# Support Dashboard

A dedicated support admin panel provides visibility into billing health and access to repair actions:

- **Recent webhook events**: Filterable by team, event type, status, and date range.
- **Subscription statuses**: Per-team view showing Stripe plan, status, next billing date, and any drift flags.
- **Drift reports**: Recent reconciliation results with affected teams.
- **Repair action buttons**: Contextual buttons for replaying webhooks, syncing subscriptions, and recalculating entitlements — each gated behind authorization checks.
- **Audit log viewer**: Recent manual repair actions with actor, action, and result.

# Rate Limit Awareness

Manual repair actions trigger Stripe API calls. Respect Stripe's rate limits:

| Mode | Read Operations | Write Operations |
|------|-----------------|------------------|
| Live | 100/sec | 25/sec |
| Test | 25/sec | 25/sec |

- For bulk operations (e.g., `--all-teams`), use staggered processing with `sleep()` between batches.
- Queue bulk repairs as individual jobs to spread load over time.
- Cache Stripe API responses where possible to avoid redundant API calls.
- Use `stripe-php` library's built-in retry mechanism for rate limit responses.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No audit logging for manual repairs | Assuming repair actions don't need tracking | Cannot reconstruct what happened during an incident | Log every repair with actor, action, reason, and result |
| Repair commands without dry-run | Acting on production data with irreversible changes | A mistaken bulk repair corrupts subscription state | Always provide `--dry-run` flag on repair commands |
| Ignoring Stripe rate limits in repair flows | Bulk syncing without throttling | Stripe returns 429 errors, repair partially fails | Stagger API calls, queue individual syncs |
| Repair logic in controllers only | No artisan command alternative | Support staff can't run repairs without the admin UI | Every repair action should have both UI and CLI access |
| No authorization on repair endpoints | Assuming only trusted users access admin UI | Unauthorized support staff can modify billing state | Gate every repair action behind authorization checks |

# Related Topics

- **Prerequisites**: Billing Webhook Metrics, Laravel Artisan Commands, Stripe SDK
- **Closely Related**: Alerting & Incident Response, Observability Monitoring, Error Tracking
- **Advanced**: Automated drift remediation, Runbook automation, Incident management integration (PagerDuty, Opsgenie)

# AI Agent Notes

- Every repair artisan command should use `protected $signature` with the `{teamId}` argument pattern for consistency. Support staff learn one pattern and apply it everywhere.
- Always implement `--dry-run` on repair commands. The difference between "report what would change" and "actually change it" prevents irreversible mistakes.
- Audit logs should be queryable by both `team_id` (for customer-facing support investigations) and `actor_id` (for internal reviews and compliance).
- When building the support dashboard, authorization checks should be at the action level — a support agent might have permission to replay webhooks but not to force-sync subscriptions.

# Verification

- [ ] Alert runbooks documented for all six billing alert types
- [ ] Manual webhook replay command exists (`php artisan billing:replay-webhook`)
- [ ] Subscription force-sync command exists (`php artisan billing:sync-subscription`)
- [ ] Entitlement recalculation command exists with `--dry-run` flag
- [ ] Failed job recovery available via both Horizon UI and artisan command
- [ ] Audit log table exists and records every manual repair action
- [ ] Support dashboard shows recent events, subscription statuses, and drift reports
- [ ] All repair endpoints have authorization (Gate/Policy) checks
- [ ] Rate limit awareness built into bulk operations
- [ ] Incident response runbook is documented and accessible to the on-call team
