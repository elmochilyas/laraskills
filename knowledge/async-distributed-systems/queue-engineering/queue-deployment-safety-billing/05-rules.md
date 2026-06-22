# Rules — Queue Deployment Safety and Worker Lifecycle

## Rule 1: Deploy Code Before Running Destructive Migrations
| Field | Value |
|-------|-------|
| **Name** | Deploy Code Before Running Destructive Migrations |
| **Category** | Deployment Ordering |
| **Rule** | Always deploy new application code to servers before running database migrations that modify or remove columns. Old queue workers must be able to process serialized jobs against the new schema. The reverse order (migrations first, then code deploy) causes old workers to crash when they encounter columns that no longer exist. |
| **Reason** | During a deployment, queue workers are still running old code until `queue:restart` signals them to pick up new code. If migrations ran first and dropped a column that serialized jobs reference, old workers will throw exceptions when they try to deserialize or query that column. The deployment order must be: (1) deploy code that handles both old and new schema, (2) run migrations that add columns, (3) restart workers, (4) in the next deployment cycle, remove old columns after all old jobs have drained. |
| **Bad Example** | CI/CD pipeline: `php artisan migrate --force` (drops old `status` column) → `git pull origin main` (deploys new code that uses `new_status`). Old workers crash for the minutes between migration and deploy. |
| **Good Example** | Deployment script: deploy code first (adds `new_status` nullable column, keeps old `status`), then `php artisan migrate`, then `php artisan queue:restart`, then `php artisan horizon:terminate`. Old column removal happens in the next deployment cycle after queues are drained. |
| **Exceptions** | When the queue is guaranteed empty before deploy (scheduled maintenance window where you drain all queues, then deploy, then restart queues). Also, for deployments that only add new tables or new nullable columns with no removal — these are safe in any order. |
| **Consequences Of Violation** | Old workers crash on deserialization failures. Billing jobs referencing dropped columns fail silently. Stripe webhooks queued before deploy are permanently lost. Failed jobs table fills with serialization exceptions that cannot be retried. |

## Rule 2: Keep Old Job Class as a Transition Alias When Renaming
| Field | Value |
|-------|-------|
| **Name** | Keep Old Job Class as a Transition Alias When Renaming |
| **Category** | Backward Compatibility |
| **Rule** | When renaming a job class that may have instances in the queue, keep the old class as an empty alias extending the new class for at least one full deployment cycle. Jobs serialized with the old fully-qualified class name cannot be deserialized by the new class name — the alias bridges this gap. |
| **Reason** | Laravel serializes jobs with their fully-qualified class name (FQCN). When a job named `App\Jobs\ProcessStripeWebhook` is queued and then the class is renamed to `App\Jobs\HandleStripeEvent`, the serialized payload references the old FQCN. PHP's autoloader cannot find `ProcessStripeWebhook` — the deserialization fails with a `ClassNotFoundException`. Keeping `class ProcessStripeWebhook extends HandleStripeEvent {}` as an empty class allows old jobs to deserialize correctly and execute the new logic. |
| **Bad Example** | Renaming `ProcessStripeWebhook` to `HandleStripeEvent` and deleting the old file. All queued instances of the old class fail permanently. |
| **Good Example** | Create `HandleStripeEvent` with new logic. Keep `class ProcessStripeWebhook extends HandleStripeEvent {}` in a separate file with a comment: "// Remove in next deploy cycle after all old jobs drain." |
| **Exceptions** | When the queue is guaranteed empty (verified zero depth) before the rename deploy. Also acceptable when renaming a class that never had jobs queued (new class, only ever used for immediate dispatch-and-process). |
| **Consequences Of Violation** | Permanent deserialization failures for all jobs queued before the rename. Failed jobs cannot be retried — the class no longer exists. Manual intervention required to replay lost work from source data (e.g., re-fetching Stripe events from the API). In billing systems, this means lost webhooks and revenue impact. |

## Rule 3: Use Feature Flags to Deploy Risky Billing Code Off-by-Default
| Field | Value |
|-------|-------|
| **Name** | Use Feature Flags to Deploy Risky Billing Code Off-by-Default |
| **Category** | Risk Management |
| **Rule** | Gate new billing behavior behind a feature flag (Laravel Pennant or equivalent) that is OFF by default on deploy. Enable the feature gradually — first for internal/staging teams, then 1% of production, then ramp up over hours or days while monitoring billing metrics. Never deploy new billing code enabled for all customers simultaneously. |
| **Reason** | New billing code is uniquely dangerous — a bug can simultaneously overcharge customers, undercharge customers, grant premium features to free users, or lock paying users out of features. A feature flag limits the blast radius to a controlled percentage of users. If metrics show a problem, the flag can be turned off immediately without a full rollback. This is safer than deploying new code enabled for 100% of users and relying on rollback speed. |
| **Bad Example** | Deploying a complete rewrite of the invoice calculation logic enabled for all teams. A rounding bug creates 1-cent errors on 10,000 invoices. Alternatively, a bug grants enterprise features to free plan users. |
| **Good Example** | ```php
if (Feature::for($team)->active('billing-v2')) {
    $this->calculateInvoiceV2($invoice);
} else {
    $this->calculateInvoiceV1($invoice); // proven safe fallback
}
``` |
| **Exceptions** | Bug fixes for existing behavior (not new behavior). Security patches that must be applied universally and immediately. Configuration changes that are fully tested in staging and affect infrastructure, not business logic. |
| **Consequences Of Violation** | A billing bug affects 100% of customers simultaneously. Revenue impact is immediate and widespread. Rollback requires deploying old code, restarting workers, and potentially reconciling corrupted billing state — much slower than flipping a feature flag. |

## Rule 4: Prefer Serializing IDs or DTOs Over Full Eloquent Models in Jobs
| Field | Value |
|-------|-------|
| **Name** | Prefer Serializing IDs or DTOs Over Full Eloquent Models in Jobs |
| **Category** | Backward Compatibility |
| **Rule** | Default to serializing identifiers (primary keys) or lightweight DTOs in job constructors rather than full Eloquent models with `SerializesModels`. Re-fetch the model from the database in `handle()`. This eliminates the risk of deserialization failures when the model schema changes between when the job was queued and when it processes. |
| **Reason** | Even with `SerializesModels` (which only stores the model identifier and re-fetches on deserialization), jobs can still break if the re-fetch fails because the model no longer exists or required columns were dropped. Serializing explicit IDs gives you control over the re-fetch logic — you can handle missing records gracefully, fetch with specific columns, or load relationships as needed. Serializing full models also makes job payloads larger, consuming more Redis memory. |
| **Bad Example** | ```php
use SerializesModels;
class ProcessInvoiceJob implements ShouldQueue {
    public function __construct(public Invoice $invoice) {}
}
// If the `invoices` table schema changes before this job processes, the model may fail to hydrate.
``` |
| **Good Example** | ```php
class ProcessInvoiceJob implements ShouldQueue {
    public function __construct(public readonly string $invoiceId) {}
    public function handle(): void {
        $invoice = Invoice::findOrFail($this->invoiceId);
        // Fresh data from database, no stale serialized state
    }
}
``` |
| **Exceptions** | When you specifically need the model's state as it was at the time of dispatch (snapshot semantics). For example, an audit job that needs to record the exact attribute values at the moment an action was taken. Also, for very simple models with stable schemas that never change. |
| **Consequences Of Violation** | Schema changes that would be safe for API requests become breaking changes for queued jobs. Column drops, renames, or type changes cause deserialization failures in jobs queued hours ago. Each schema change requires a multi-deploy transition plan. |

## Rule 5: Never Expose queue:restart via HTTP Endpoint
| Field | Value |
|-------|-------|
| **Name** | Never Expose queue:restart via HTTP Endpoint |
| **Category** | Security |
| **Rule** | The `queue:restart` command must only be executable via CLI during authorized deployments. Never create an HTTP endpoint (e.g., `/api/admin/queue/restart`) that triggers a queue restart. This would allow an attacker with admin credentials (or via SSRF) to disrupt the entire asynchronous processing pipeline. |
| **Reason** | A queue restart causes all workers to exit after their current job completes. While supervisor restarts them, there is a brief window where workers are unavailable. A malicious actor could repeatedly trigger restarts to create a denial-of-service condition on billing processing. Additionally, `queue:restart` is a deployment operation, not a runtime operation — it should be tied to the deployment pipeline, not exposed as an API. |
| **Bad Example** | ```php
Route::post('/api/admin/queue/restart', function () {
    Artisan::call('queue:restart');
    return response()->json(['status' => 'restarted']);
})->middleware('auth');
``` |
| **Good Example** | `queue:restart` runs only in the deployment script, executed by the CI/CD pipeline with appropriate credentials. No HTTP route exists for it. |
| **Exceptions** | An internal admin endpoint behind VPN with strong authentication, audit logging, and rate limiting, used only by the infrastructure team during incident response. Even then, audit every invocation and prefer SSH access to the server instead. |
| **Consequences Of Violation** | Denial of service on the queue processing pipeline. Workers cycling restarts delay billing webhook processing. Stripe webhook delivery failures cascade. Combined with other vulnerabilities, could be used to mask fraudulent activity by disrupting audit trail processing. |
