# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | DevOps & Infrastructure |
| Subdomain | Queue Deployment Safety |
| Knowledge Unit | Backward-Compatible Deployments with Queued Jobs |
| Difficulty | Advanced |
| Maturity | Stable |
| Priority | P1 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Laravel Queues, Laravel Horizon, Database Migrations, Deployment Strategies |
| Related KUs | Queue Restart & Horizon Verification, Blue-Green Deployment, Database Migration Strategies |
| Source | domain-analysis.md |

# Overview

Backward-compatible deployments for queued jobs ensure that jobs serialized by old application code can be successfully deserialized and processed by newly deployed code. When a deployment changes job constructors, model schemas, or class names, jobs already in the queue become dangerous time bombs — they will fail when the new code attempts to unserialize them. The core rule is: deploy application code before destructive schema changes, and always handle both old and new formats during transition periods.

# Core Concepts

- **Serialized job payloads**: Jobs in the queue are serialized PHP objects. The new code must understand the old serialization format.
- **Safe changes**: Changes that don't break old serialized payloads — adding nullable columns, adding new methods, adding optional constructor parameters with defaults.
- **Unsafe changes**: Changes that break old serialized payloads — renaming classes, changing constructor parameter types/signatures, removing model attributes jobs reference.
- **Transition periods**: Phased deployments where intermediate code handles both formats while old jobs drain.
- **Pennant feature flags**: Deploy new billing behavior behind a feature flag that's off by default, test in production, then enable gradually.
- **DTOs over models**: Serialize lightweight DTOs or IDs in jobs instead of full Eloquent models that may change schema.

# When To Use

- Every deployment that modifies queued job classes or constructor signatures
- When renaming or restructuring job classes (e.g., refactoring `ProcessOrder` to `ProcessOrderJob`)
- When adding or removing columns from tables that serialized jobs reference
- When changing model attributes that existing jobs access on deserialization
- During any billing system migration where old queued jobs reference old schema

# When NOT To Use

- For deployments with zero queued jobs
- For simple config or view changes with no job impact
- When the queue is guaranteed empty before deployment (scheduled maintenance window with drained queues)
- During initial development before any jobs exist

# Safe vs Unsafe Changes

## Safe Changes (Deploy Immediately)

| Change | Why Safe |
|--------|----------|
| Adding nullable columns to tables referenced by jobs | Old serialized models can still hydrate; new null column gets its default |
| Adding new optional constructor parameters with defaults | `public function __construct(public string $id, public ?int $version = null)` — old payloads without `version` get the default |
| Adding new methods to job classes | Doesn't affect deserialization |
| Changing job `handle()` logic without touching constructor or properties | Serialization only cares about stored properties |
| Adding new event listeners that don't modify job properties | Events fire after deserialization |

## Unsafe Changes (Require Transition Period)

| Change | Why Unsafe | Mitigation |
|--------|------------|------------|
| Renaming a class that has jobs in the queue | Old serialized payload references old class name; new code can't find it | Keep old class as alias extending new class during transition |
| Changing constructor parameter type or removing a parameter | Old payloads have old parameter set; deserialization fails | Add new parameter as optional, deprecate old parameter |
| Removing a model attribute that jobs reference | Job accesses removed attribute → error | Add a migration transition period; keep the attribute during transition |
| Changing the job class namespace | Same as renaming — old FQCN is in serialized payload | Keep old namespace class as alias |
| Removing a database column jobs query | Job calls `->where('old_column', ...)` → column not found | Keep column during transition, use `->selectRaw()` fallback in new code |

# Deployment Phases for Risky Changes

## Phase 1: Dual-Format Code

Deploy code that handles BOTH old and new formats:

```php
class ProcessInvoiceJob implements ShouldQueue
{
    public function __construct(
        public readonly string $invoiceId,
        public readonly ?string $stripeChargeId = null, // NEW: optional with default
        public readonly ?int $version = 1,              // NEW: version tracking
    ) {}

    public function handle(): void
    {
        // Handle both old format (no stripe_charge_id) and new format
        if ($this->version === 1 || $this->version === null) {
            // Legacy: charge ID embedded in invoice record
            $invoice = Invoice::findOrFail($this->invoiceId);
            $chargeId = $invoice->charge_id; // Still available during transition
        } else {
            $invoice = Invoice::findOrFail($this->invoiceId);
            $chargeId = $this->stripeChargeId;
        }

        // Process with resolved charge ID...
    }
}
```

## Phase 2: Drain Old Jobs

Check queue size and wait for old-format jobs to be processed:

```bash
# Monitor queue size
php artisan queue:monitor billing --format=json

# Check Horizon dashboard for billing queue depth
# Wait until billing queue depth is 0 (or only new-format jobs remain)
```

**Duration**: Worst-case job delay + a safety buffer. If jobs have 30-minute timeouts, wait at least 1 hour after Phase 1 deploy.

## Phase 3: Clean Deploy

Deploy code that only handles new format + run migration:

```bash
# Deploy simplified code
# Run migration to remove old column
php artisan migrate

# Code now only handles new format
class ProcessInvoiceJob implements ShouldQueue
{
    public function __construct(
        public readonly string $invoiceId,
        public readonly string $stripeChargeId,
    ) {}

    public function handle(): void
    {
        // Only new format — old jobs have already been processed
    }
}
```

# Feature Flags for New Behavior

Use Laravel Pennant to deploy new billing behavior off, test safely in production:

```php
// Define feature flag
use Laravel\Pennant\Feature;

Feature::define('billing-v2', function (Team $team) {
    return $team->isInBetaProgram();
});

// In job
class ProcessInvoiceJob implements ShouldQueue
{
    public function handle(): void
    {
        $invoice = Invoice::findOrFail($this->invoiceId);

        if (Feature::for($invoice->team)->active('billing-v2')) {
            $this->processV2($invoice);
        } else {
            $this->processV1($invoice);
        }
    }
}
```

**Rollout strategy:**
1. Deploy with feature flag OFF for all teams.
2. Enable for internal/staging teams first.
3. Enable for 1% of production teams, monitor metrics.
4. Increase to 10%, 50%, 100% over hours/days.
5. Once 100% stable, remove flag and old code path.

# Prefer DTOs Over Full Eloquent Models in Jobs

Serializing full Eloquent models in jobs creates fragility — any model schema change breaks existing jobs:

```php
// AVOID — serializes full model, fragile to schema changes
class ProcessInvoiceJob implements ShouldQueue
{
    use SerializesModels;

    public function __construct(
        public Invoice $invoice, // Full Eloquent model serialized
    ) {}
}

// PREFER — serialize identifiers, re-fetch the model
class ProcessInvoiceJob implements ShouldQueue
{
    public function __construct(
        public readonly string $invoiceId,
    ) {}

    public function handle(): void
    {
        $invoice = Invoice::findOrFail($this->invoiceId);
        // Fresh data from database, no stale serialized attributes
    }
}

// Also ACCEPTABLE — lightweight DTO
class ProcessInvoiceJob implements ShouldQueue
{
    public function __construct(
        public readonly string $invoiceId,
        public readonly int $amountCents,
        public readonly string $currency,
    ) {}

    public function handle(): void
    {
        // Use DTO properties directly — no model dependency
    }
}
```

# Blue-Green Deployment with Queues

```
Blue environment          Green environment
(old code + workers)      (new code + workers)
        |                         |
   [old workers drain]    [new workers start]
        |                         |
   [decommission blue]     [all traffic on green]
```

**Key queue considerations:**
- Blue workers must finish current jobs before decommission.
- New jobs dispatched during the transition may be picked up by either blue or green workers — both must handle the format.
- Use queue names to route jobs: `billing-blue` vs `billing-green` if strict isolation is needed.
- Supervisor config on blue: set `stopwaitsecs` to accommodate longest-running job.

# Config Cache Safety

Don't change config keys that queued jobs read between deployment phases:

```php
// config/billing.php
// Phase 1: Keep old key, add new key
return [
    'processor' => 'default',           // OLD — leave in place
    'processor_v2' => 'new-processor',  // NEW — eventually migrate to this
];

// In job: check new key, fall back to old
$processor = config('billing.processor_v2') ?? config('billing.processor');
```

Never rename a config key in a deployment where queued jobs reference the config. Config cache (`php artisan config:cache`) bakes values into workers. A renamed key means old jobs that haven't been restarted still reference the old key but it no longer exists.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Renaming job class without alias | Refactoring class name for cleanliness | All queued jobs with old class name fail permanently | Keep old class as `class OldName extends NewName {}` during transition |
| Removing model column same deploy as code change | Code doesn't reference column anymore, so migration drops it | Queued jobs with serialized old models fail on deserialization | Migrate columns in a separate deployment after old jobs drain |
| Not monitoring queue depth before cleanup deploy | Assuming all old jobs are processed | Cleanup deploy breaks remaining old-format jobs | Explicitly check queue depth; wait for zero before Phase 3 |
| Serializing full Eloquent models in jobs (without SerializesModels) | Convenience | Every schema change becomes a deployment risk because the full model snapshot is stale | Use `SerializesModels` trait (stores only ID, re-fetches on deserialization) or pass explicit DTOs |
| Using `queue:restart` after config change without config cache rebuild | Workers restart but still have stale config | Workers use old config keys that no longer exist | Always `config:cache` before `queue:restart` |

# Anti-Patterns

- **Dropping columns in the same deployment as code change**: "The code doesn't use this column anymore, so I can drop it." But queued jobs with serialized models still reference it. Split into two deployments.
- **Renaming a class that `ShouldQueue` jobs reference without a transition alias**: "I'll just update all references." Old serialized payloads use the old FQCN. They can't be patched.
- **Assuming queue:restart makes everything safe**: Restart only picks up new code for future jobs, not already-serialized jobs in the queue. Those jobs are frozen with old class names and constructor signatures.
- **Serializing Eloquent models with `SerializesModels` as a safety net**: This trait only stores the model identifier and re-fetches on deserialization — which helps, but if the re-fetch fails because the column doesn't exist, the job still fails.

# Related Topics

- **Prerequisites**: Laravel Queues, Laravel Horizon, Database Migrations
- **Closely Related**: Queue Restart & Horizon Verification, Database Deployment Strategies, Blue-Green Deployment
- **Advanced**: Feature flag-driven migrations, Zero-downtime schema changes, Queue sharding strategies

# AI Agent Notes

- When asked to "rename this job class," first check if there are existing instances of this job in any queue. If queues aren't empty, create a transition plan — don't just rename.
- When creating a queued job that references Eloquent models, prefer the `SerializesModels` trait. This stores only the model identifier (class + primary key) and re-fetches the model on deserialization — not the full serialized model. For high-risk billing, webhook, reconciliation, and tenant-mutation jobs, passing explicit IDs or immutable external provider IDs can make freshness, idempotency, and replay behavior more explicit. For lower-risk notification jobs, `SerializesModels` with graceful handling of missing/deleted models is acceptable.
- Before running a migration that drops columns or renames columns, check if any queued jobs reference those columns. If uncertain, defer the destructive migration to a separate deployment.
- Feature flags (Pennant) are the safest way to introduce new behavior in queued jobs. Deploy the code off, enable selectively, and only remove the old code path once the new path is proven at 100%.

# Verification

- [ ] Before renaming a job class, existing queue is empty or a transition alias is created
- [ ] Adding nullable columns: safe to deploy immediately (no transition needed)
- [ ] Changing constructor parameters: new parameters are optional with defaults; old parameters aren't removed
- [ ] Removing model attributes: kept during transition period; only dropped after old jobs drain
- [ ] Feature flags (Pennant) used for new billing behavior — deployed off, tested, enabled gradually
- [ ] Jobs use `SerializesModels` trait (stores IDs, re-fetches on deserialization) or pass explicit DTOs; high-risk billing/webhook jobs pass explicit provider IDs for replay safety
- [ ] Config keys that jobs reference are not renamed within a single deployment
- [ ] Blue-green deployments drain old workers before decommission
- [ ] Queue depth verified at zero before Phase 3 cleanup deploy
- [ ] Column-drop migrations are separated from code changes that stop using those columns
