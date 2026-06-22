# Rules — Billing Alerts & Support Repair Flows

## Rule 1: Every Repair Action Must Be Both an Artisan Command and an Admin UI Action
| Field | Value |
|-------|-------|
| **Name** | Every Repair Action Must Be Both an Artisan Command and an Admin UI Action |
| **Category** | Operations — Tooling |
| **Rule** | Every billing repair action (webhook replay, subscription force-sync, entitlement recalculation, failed job retry) must be available as both a CLI artisan command and an admin UI controller action. The CLI is for on-call engineers who need scriptable access during incidents. The admin UI is for support staff who need a safe, guided interface without SSH access. Never implement only one interface. |
| **Reason** | During a billing incident at 3 AM, the on-call engineer needs to run repairs quickly via CLI — they should not need to navigate a web UI. During business hours, support staff handle customer billing issues — they should not need SSH access to run artisan commands. Implementing both interfaces ensures the right tool is available to the right person at the right time. The underlying repair logic should be a shared Action class called by both the command and the controller. |
| **Bad Example** | Only an artisan command exists for subscription sync. Support staff cannot help a customer with a stuck subscription without escalating to engineering. |
| **Good Example** | ```php
// Shared Action
class SyncSubscriptionAction { public function execute(Team $team): Subscription { ... } }
// Artisan command
class SyncSubscriptionCommand extends Command { public function handle() { app(SyncSubscriptionAction::class)->execute($team); } }
// Admin UI controller
class BillingRepairController { public function syncSubscription(Team $team) { app(SyncSubscriptionAction::class)->execute($team); } }
``` |
| **Exceptions** | Repair actions that are inherently unsafe for support staff (e.g., bulk entitlement recalculation for all teams). These should remain CLI-only with explicit confirmation flags. |
| **Consequences Of Violation** | Support staff bottlenecks on engineering for routine billing repairs. On-call engineers waste time performing repairs through a UI instead of scripting. Billing incidents take longer to resolve. Support escalations increase. |

## Rule 2: Always Provide a --dry-run Flag on Repair Commands
| Field | Value |
|-------|-------|
| **Name** | Always Provide a --dry-run Flag on Repair Commands |
| **Category** | Operations — Safety |
| **Rule** | Every billing repair artisan command must support a `--dry-run` flag that reports what would change without actually making changes. The difference between "report what would happen" and "make it happen" prevents irreversible mistakes on production data. |
| **Reason** | Repair commands modify billing state — subscription statuses, entitlements, payment records. Running a repair on the wrong team, or a bulk repair with unintended scope, can corrupt billing state for multiple customers. The `--dry-run` flag lets the operator see exactly which teams would be affected and what changes would be made before committing. In an incident, the operator can run `--dry-run` first, verify the output, then run without it — reducing the risk of compounding the incident with a repair error. |
| **Bad Example** | ```bash
php artisan billing:recalculate-entitlements --all-teams
# Output: "Entitlements recalculated."
# No way to preview. 500 teams' entitlements changed — some incorrectly.
``` |
| **Good Example** | ```bash
php artisan billing:recalculate-entitlements --all-teams --dry-run
# Output: "Team 1: would set entitlements: ['reports', 'api']
#          Team 2: would set entitlements: ['reports']
#          ..."
# Operator verifies, then runs without --dry-run
``` |
| **Exceptions** | Read-only commands like `billing:audit` or `billing:report` where no state is modified. The `--dry-run` flag is only needed for commands that mutate data. |
| **Consequences Of Violation** | Mistaken repair corrupts billing state. A bulk recalculation intended for one team affects all teams. Irreversible changes require manual Stripe reconciliation to undo. Incident compounded by repair error — significantly worse than the original issue. |

## Rule 3: Audit Log Every Manual Repair Action
| Field | Value |
|-------|-------|
| **Name** | Audit Log Every Manual Repair Action |
| **Category** | Security — Audit |
| **Rule** | Every manual billing repair action (webhook replay, subscription sync, entitlement recalculation, job retry) must write an audit log entry recording: who performed the action (`actor_id`), what action was taken (`action`), which team was affected (`team_id`), the reason for the repair, and the before/after state where applicable. Audit logs must be queryable by both `team_id` (for customer-facing investigations) and `actor_id` (for internal compliance reviews). |
| **Reason** | Manual billing repairs bypass the normal webhook-driven state transitions. Without audit logging, there is no record of who changed what and why. When a customer disputes a charge or questions their subscription history, the support team must be able to reconstruct every manual change. For SOC2, PCI-DSS, and internal compliance, all manual billing state modifications must be traceable to an authorized actor with a documented reason. |
| **Bad Example** | Repair command modifies subscription status directly with no audit log. Three months later, a customer disputes a charge — no record exists of why their subscription was force-synced. |
| **Good Example** | ```php
AuditLog::create([
    'action' => 'billing.subscription_synced',
    'actor_id' => auth()->id(),
    'team_id' => $team->id,
    'metadata' => [
        'reason' => $request->input('reason'),
        'previous_status' => $team->subscription->stripe_status,
        'new_status' => $newSubscription->stripe_status,
    ],
]);
``` |
| **Exceptions** | Automated repairs triggered by scheduled jobs (reconciliation, cleanup) — these should still log, but with `actor_id = 0` (system). The log entry is still valuable for investigation. |
| **Consequences Of Violation** | Untraceable billing state changes. Cannot answer "who changed this customer's subscription and why?" during a dispute. SOC2 audit finds missing audit trail for manual billing operations. Support staff cannot verify whether a repair was already attempted for a given customer. |

## Rule 4: Gate Every Repair Endpoint Behind Explicit Authorization
| Field | Value |
|-------|-------|
| **Name** | Gate Every Repair Endpoint Behind Explicit Authorization |
| **Category** | Security — Authorization |
| **Rule** | Every admin UI repair action must have an explicit authorization check (Policy or Gate). Different repair actions should have different authorization requirements — a support agent may be authorized to replay webhooks but not to force-sync subscriptions or recalculate entitlements. Never assume that access to the admin panel implies access to all repair actions. |
| **Reason** | Repair actions have different blast radii. Replaying a single webhook affects one event. Force-syncing a subscription overwrites local state from Stripe's API — a broader impact. Recalculating entitlements for all teams is a mass-update operation that requires the highest authorization level. Without granular authorization, a support agent with access to one repair can trigger all repairs — including potentially destructive ones. This violates the principle of least privilege. |
| **Bad Example** | ```php
class BillingRepairController {
    public function __construct() {
        $this->middleware('can:access-admin'); // One permission for all repairs
    }
}
``` |
| **Good Example** | ```php
class BillingRepairController {
    public function replayWebhook() { Gate::authorize('repair-webhooks'); ... }
    public function syncSubscription() { Gate::authorize('repair-subscriptions'); ... }
    public function recalculateEntitlements() { Gate::authorize('repair-entitlements'); ... }
}
// Authorization: support-agent can replay webhooks, senior-support can sync subscriptions, engineering can recalculate entitlements
``` |
| **Exceptions** | Applications with a single support role where all support staff are trusted to perform all repair actions. Even in this case, implement the granular authorization scaffolding — it costs little and provides immediate value when the team grows. |
| **Consequences Of Violation** | Unauthorized support staff trigger destructive repairs. A new support agent accidentally recalculates entitlements for all teams. A compromised support account can mass-modify all billing state. Audit logs show the right actor but the authorization was too permissive — compliance finding. |

## Rule 5: Respect Stripe API Rate Limits in Bulk Repair Operations
| Field | Value |
|-------|-------|
| **Name** | Respect Stripe API Rate Limits in Bulk Repair Operations |
| **Category** | Operations — External API Safety |
| **Rule** | Bulk repair operations (e.g., `--all-teams` flag on recalculate-entitlements) must stagger Stripe API calls to stay within rate limits: 100/sec for read operations, 25/sec for write operations in live mode. Use `sleep()` between batches, queue individual syncs as separate jobs, or use Stripe's built-in automatic retry mechanism. Never issue 500 Stripe API calls in a tight loop. |
| **Reason** | Exceeding Stripe's rate limits causes `429 Too Many Requests` responses, which the Stripe SDK automatically retries with exponential backoff. This means a bulk operation that was intended to complete in 30 seconds instead takes 10+ minutes as retries pile up — and some API calls may still fail permanently after exhausting retries. Additionally, rate-limited requests count against your Stripe API quota and can cause rate-limiting for other legitimate API calls (e.g., the checkout flow for new customers). |
| **Bad Example** | ```php
Team::all()->each(function ($team) {
    $stripe->subscriptions->retrieve($team->stripe_subscription_id); // 500 API calls in a tight loop
});
// 429 errors, retry backoffs, operation takes 15 minutes, some calls fail
``` |
| **Good Example** | ```php
Team::all()->chunk(25)->each(function ($teams) {
    foreach ($teams as $team) {
        SyncSubscription::dispatch($team->id)->onQueue('billing');
    }
    sleep(1); // ~25 writes/sec, safely under Stripe's 25/sec write limit
});
``` |
| **Exceptions** | Test mode operations — Stripe test mode rate limits are lower (25/sec for reads) but the consequences of hitting them are lower. Still use queue staggering to build the right habits. |
| **Consequences Of Violation** | Stripe API rate limit errors during bulk repair. Intended 30-second repair takes 15+ minutes due to SDK retries. Legitimate customer API calls (checkout, payment method updates) get rate-limited because the repair consumed the API quota. Repair partially fails — some teams synced, some not. |
