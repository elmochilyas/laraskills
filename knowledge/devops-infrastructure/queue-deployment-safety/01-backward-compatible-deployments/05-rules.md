# Rules — Backward-Compatible Deployments with Queued Jobs

## Rule 1: Add Columns in Deploy N, Remove Columns in Deploy N+1
| Field | Value |
|-------|-------|
| **Name** | Add Columns in Deploy N, Remove Columns in Deploy N+1 |
| **Category** | Deployment Safety |
| **Rule** | Never remove or rename a database column in the same deployment that stops using it. Add new columns as nullable in Deploy N, populate them (via migration or background job), and remove old columns only in Deploy N+1 — after all queued jobs referencing the old column have been processed and the queue is drained. |
| **Reason** | Queued jobs serialized before Deploy N may reference the old column by name. If Deploy N removes that column, old workers (still running pre-deploy code) or new workers processing old serialized models will fail with column-not-found errors. The two-deploy cycle ensures overlapping safety: old jobs can run against the new schema (nullable columns are inert to old code), and new jobs never reference removed columns. |
| **Bad Example** | Single deployment: `Schema::table('subscriptions', fn ($t) => $t->dropColumn('status')); Schema::table('subscriptions', fn ($t) => $t->addColumn('string', 'new_status'));` — jobs queued before deploy with serialized models referencing `status` crash. |
| **Good Example** | Deploy N: `$table->string('new_status')->nullable();` — old jobs unaffected, new code writes to `new_status`. Background job migrates `status` → `new_status`. Deploy N+1: `$table->dropColumn('status'); $table->renameColumn('new_status', 'status');` — only after queues are drained. |
| **Exceptions** | Adding new tables (not modifying existing ones) — always safe because old jobs don't reference them. Adding nullable columns — safe because old serialized models ignore them. Changing column types that Laravel's casting handles transparently. |
| **Consequences Of Violation** | Queue deserialization failures on every job queued before the deploy. Billing webhook jobs referencing dropped columns fail silently or crash workers. Failed jobs accumulate and require manual intervention to replay. If the column contained critical billing state, the data is lost. |

## Rule 2: Serialize Identifiers, Not Full Eloquent Models, in Job Constructors
| Field | Value |
|-------|-------|
| **Name** | Serialize Identifiers, Not Full Eloquent Models, in Job Constructors |
| **Category** | Backward Compatibility |
| **Rule** | Default to serializing database identifiers (primary keys) or lightweight, immutable DTOs in job constructor parameters. Re-fetch fresh data from the database in `handle()`. Avoid serializing full Eloquent models — even with `SerializesModels` — because any schema change to the model's table introduces a deployment risk for existing queued jobs. |
| **Reason** | The `SerializesModels` trait stores only the model's identifier and re-fetches on deserialization. While this is better than serializing all attributes, the re-fetch can still fail: if a required column was dropped, the model fails to hydrate; if a relationship definition changed, eager loading breaks; if the model was soft-deleted while the job was queued, `findOrFail` throws. Serializing only IDs gives you full control over the fetch logic in `handle()` — you can use `find()`, handle null gracefully, load specific columns, or skip the fetch entirely if the data is already in the job payload. |
| **Bad Example** | ```php
use SerializesModels;
class ProcessOrderJob implements ShouldQueue {
    public function __construct(public Order $order) {}
}
// Order schema changes → all queued ProcessOrderJob instances may fail
``` |
| **Good Example** | ```php
class ProcessOrderJob implements ShouldQueue {
    public function __construct(
        public readonly string $orderId,
        public readonly int $amountCents,
    ) {}
    public function handle(): void {
        $order = Order::find($this->orderId); // Gracefully handles null
        if (!$order) { Log::warning('Order not found', ['order_id' => $this->orderId]); return; }
        // Fresh data from DB, no stale serialized state
    }
}
``` |
| **Exceptions** | When you explicitly need a snapshot of the model's state at dispatch time (audit trail, point-in-time record). In this case, serialize a DTO or array of the relevant attributes — not the model object itself. Use `$order->only(['id', 'status', 'total'])` to extract a stable subset. |
| **Consequences Of Violation** | Every schema change to a model referenced by queued jobs becomes a potential production incident. Column drops, relationship renames, or trait removals cause deserialization failures for jobs queued before the deploy. The blast radius is proportional to queue depth — deeper queues mean more failed jobs. |

## Rule 3: Never Rename a Job Class Without a Transition Alias
| Field | Value |
|-------|-------|
| **Name** | Never Rename a Job Class Without a Transition Alias |
| **Category** | Backward Compatibility |
| **Rule** | When a job class that may have instances in the queue is renamed, the old class file must be preserved as an empty alias extending the new class for at least one full deployment cycle. Remove the alias only after all queues containing instances of the old class are confirmed empty. |
| **Reason** | PHP serialization stores the fully-qualified class name. Jobs queued as `App\Jobs\ProcessOrder` cannot be revived as `App\Jobs\ProcessOrderJob`. Laravel's queue worker calls `unserialize()` on the job payload; if the class doesn't exist, a `ClassNotFoundException` is thrown and the job fails permanently. An empty alias `class ProcessOrder extends ProcessOrderJob {}` bridges the transition — old payloads deserialize into the alias, which inherits all behavior from the new class. |
| **Bad Example** | `git mv app/Jobs/ProcessOrder.php app/Jobs/ProcessOrderJob.php` with no alias. All queued instances fail with class-not-found errors. |
| **Good Example** | Create `ProcessOrderJob.php` with new logic. Keep `ProcessOrder.php` as `class ProcessOrder extends ProcessOrderJob { /* Transition alias — remove after next deploy */ }`. Document in code and deploy checklist. |
| **Exceptions** | When renaming a job class that was never dispatched (newly created, never queued). When you can guarantee the queue is empty before deploy. When using a job dispatch pattern that always encodes class names via a configurable mapping (rare). |
| **Consequences Of Violation** | Permanent deserialization failures for all jobs queued with the old class name. Failed jobs table fills with unrecoverable entries. Billing webhooks, order processing, and notification dispatch jobs lost. Manual replay required — for billing events, this means re-fetching from Stripe's API and cross-referencing with local state. |

## Rule 4: Deploy New Billing Behavior Behind a Feature Flag That Defaults to OFF
| Field | Value |
|-------|-------|
| **Name** | Deploy New Billing Behavior Behind a Feature Flag That Defaults to OFF |
| **Category** | Risk Management |
| **Rule** | Any new or modified billing logic in queued jobs must be deployed behind a feature flag (Laravel Pennant or similar) that defaults to disabled. Enable the flag for internal/staging teams first, then a small percentage of production, then ramp up over hours or days while monitoring billing metrics. Never deploy new billing behavior enabled for all customers. |
| **Reason** | Billing code bugs have immediate financial impact. A rounding error in invoice calculation, an incorrect tax rate, or a mishandled currency conversion can overcharge or undercharge customers at scale. A feature flag limits the blast radius to a controlled cohort. If the new code has a bug, the flag can be disabled instantly — no rollback, no re-deploy, no waiting for CI/CD. This is the fastest possible recovery from a billing bug. |
| **Bad Example** | Deploying a new Stripe tax calculation integration enabled for 100% of teams. A configuration error in the tax rate mapping causes incorrect tax on 5,000 invoices before detection. |
| **Good Example** | ```php
if (Feature::for($team)->active('new-tax-calculation')) {
    $tax = $this->calculateTaxV2($invoice);
} else {
    $tax = $this->calculateTaxV1($invoice); // Safe, proven fallback
}
``` |
| **Exceptions** | Bug fixes for existing behavior (not new behavior). Security patches where the risk of the vulnerability outweighs the risk of the fix. Configuration changes that are purely infrastructure (Redis connection, queue names) and don't affect business logic. |
| **Consequences Of Violation** | A billing bug affects 100% of customers simultaneously. Revenue impact is immediate: undercharging (revenue leakage) or overcharging (chargebacks, support load, reputational damage). Recovery requires full deployment rollback, which takes minutes to hours depending on CI/CD pipeline speed. During that time, the bug continues affecting new transactions. |

## Rule 5: Verify Queue Depth Is Zero Before Cleanup Deploy (Phase 3)
| Field | Value |
|-------|-------|
| **Name** | Verify Queue Depth Is Zero Before Cleanup Deploy (Phase 3) |
| **Category** | Deployment Safety |
| **Rule** | Before running a "cleanup" deployment that removes transition aliases, old columns, or old code paths (Phase 3 of a multi-phase deploy), verify that the relevant queues are empty. Use `php artisan queue:monitor` or Horizon's dashboard to confirm zero pending jobs. Do not rely on time-based assumptions ("it's been 2 hours, they must be done"). |
| **Reason** | The Phase 3 deploy removes the backward-compatibility scaffolding (old class aliases, old columns, old code paths). If any old-format jobs remain in the queue, they will fail because the scaffolding that supported them is gone. Time-based assumptions are unreliable: a job with a 30-minute timeout that was queued at the last moment of Phase 1 could still be pending 45 minutes later if the queue was backlogged. Explicit verification is the only reliable approach. |
| **Bad Example** | Phase 3 deploy runs at 2 PM "because Phase 1 was at noon and jobs time out in 30 minutes." A backlog of 200 jobs from a morning traffic spike is still pending — all 200 fail. |
| **Good Example** | ```bash
QUEUE_DEPTH=$(php artisan queue:monitor billing --json | jq '.queue_size')
if [ "$QUEUE_DEPTH" -gt 0 ]; then
    echo "ERROR: $QUEUE_DEPTH jobs still pending on billing queue. Aborting Phase 3."
    exit 1
fi
php artisan migrate # Safe: no old-format jobs remain
``` |
| **Exceptions** | If the cleanup deploy only removes code that is unreferenced (e.g., removing a class alias for a job that was never dispatched). Even then, verifying queue depth is a safety check worth running — it costs seconds and prevents hours of recovery. |
| **Consequences Of Violation** | Old-format jobs fail because the transition scaffolding was removed prematurely. Failed jobs require manual replay. Billing state divergence for affected customers. The multi-phase deployment strategy designed to prevent failures is undermined by skipping the final verification step. |
