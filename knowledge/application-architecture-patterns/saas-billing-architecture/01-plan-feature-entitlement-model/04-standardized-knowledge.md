# Metadata

Domain: Application Architecture Patterns
Subdomain: SaaS Billing Architecture
Knowledge Unit: Plan, Feature & Entitlement Model
Difficulty Level: Advanced
Last Updated: 2026-06-22
Status: Standardized

---

# Overview

The Plan/Feature/Entitlement model separates the commercial packaging (what you sell) from application access decisions (what the user can do). This decoupling is the single most important architectural decision in SaaS billing: Stripe owns billing state; the application owns entitlement decisions. Entitlements are computed from subscription status, plan features, usage limits, and custom overrides — never from Stripe state alone.

---

# Core Concepts

This knowledge unit addresses the relationship between billing state (Stripe) and application authorization (entitlements) for Laravel SaaS applications.

## The Core Entities

- **Plan** — Commercial packaging (Pro, Enterprise, Starter). Contains metadata (trial days, billing interval), a Stripe price ID, and a feature set.
- **Subscription** — Current billing relationship with Stripe. BelongsTo a Team. Has status (active, past_due, canceled, incomplete, etc.) and period dates. This IS the Stripe record, cached locally.
- **Feature** — Named product capability. Defined in code or database (e.g., "api-access", "white-label", "priority-support", "team-size", "storage-gb"). Features are NOT Stripe-specific — Stripe doesn't know about features.
- **Entitlement** — Team-specific access decision. Computed at query time from: subscription status + plan features + usage limits + custom overrides. This is an APP decision, not a Stripe decision.
- **UsageLimit** — Quota/cap for a metered feature (e.g., "max 10 team members", "max 1000 API calls/day"). Stored on the plan or overridden per team.
- **UsageRecord** — Consumed usage during a billing period (e.g., "team X used 347 API calls today"). Written by the app, periodically synced to Stripe for metered billing.
- **FeatureGate** — Policy object that evaluates: "can team X use feature Y right now?" Combines entitlement + feature flag + plan. Used by the authorization layer.

## Critical Separation

```
Stripe State (source of truth for billing)
    ↓ synced via webhooks
Local Subscription Cache (cached Stripe state)
    ↓ combined with Plan definitions
Entitlement Computation (app business logic)
    ↓ checked by
FeatureGate (authorization gate)
```

Billing state says "Stripe thinks the team is on Pro plan, active." Entitlement says "Therefore the app allows API access, white-label, and max 10 team members." These are different concerns.

---

# When To Use

- Any SaaS with paid plans and feature gating
- Any product where different teams have different feature access
- When Stripe outages must NOT block application feature access
- When you need custom entitlement logic beyond Stripe's product model (e.g., usage-based limits, custom overrides, promotional access)
- When you offer trials, grace periods, or custom plan overrides per team

---

# When NOT To Use

- Single-plan SaaS with no feature gating (everyone gets everything)
- Billing managed entirely externally (e.g., reseller handles all billing)
- When all access decisions map 1:1 to Stripe subscription status with zero custom logic

---

# Best Practices

1. **Cache Stripe state locally, compute entitlements locally.** Never call Stripe API on every request to check if a user can access a feature. Stripe webhooks keep the local cache fresh; entitlements are computed from that cache.

2. **Entitlement is idempotent and fast.** An entitlement check should be a DB query + in-memory computation, never an HTTP call. It must never throw exceptions — if computation fails, default to denying access (fail closed).

3. **Features are defined in code, not in Stripe.** Stripe products/prices are billing instruments. Features are application concepts. Map them, but don't merge them.

4. **Usage tracking is eventual consistency.** Write usage records optimistically. Reconcile periodically. Don't block feature access on real-time usage counting unless billing accuracy demands it.

5. **Custom overrides are first-class.** Some teams get extra features for free (partnerships, beta testers, internal accounts). Model this as an `EntitlementOverride` table, not as hacks in the entitlement computation.

6. **Plans are immutable after release.** Changing a plan's features mid-cycle creates billing confusion. Deprecate old plans, create new ones. Use a `PlanVersion` pattern if needed.

---

# Architecture Guidelines

## Database Schema

```php
// Plans table — commercial packaging
Schema::create('plans', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('name');                    // 'Pro', 'Enterprise'
    $table->string('slug')->unique();          // 'pro', 'enterprise'
    $table->string('stripe_price_id');         // Maps to Stripe Price
    $table->json('features');                  // ['api-access', 'white-label', 'team-size:10']
    $table->integer('trial_days')->default(0); // 0 = no trial
    $table->string('billing_interval')->default('month'); // month | year
    $table->boolean('is_active')->default(true);
    $table->timestamps();
    $table->softDeletes();                     // Deprecate, don't delete
});

// Subscriptions table — cached Stripe state
Schema::create('subscriptions', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('team_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('plan_id')->constrained('plans');
    $table->string('stripe_id')->unique();          // Stripe subscription ID
    $table->string('stripe_status');                 // active, past_due, canceled, etc.
    $table->timestamp('trial_ends_at')->nullable();
    $table->timestamp('current_period_start')->nullable();
    $table->timestamp('current_period_end')->nullable();
    $table->timestamp('canceled_at')->nullable();
    $table->timestamp('ended_at')->nullable();
    $table->json('stripe_metadata')->nullable();     // Raw Stripe metadata
    $table->timestamps();

    $table->index('team_id');
    $table->index('stripe_status');
});

// Features table — application capabilities
Schema::create('features', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->string('key')->unique();           // 'api-access'
    $table->string('display_name');            // 'API Access'
    $table->string('group')->nullable();       // 'integration', 'branding', 'support'
    $table->text('description')->nullable();
    $table->string('type')->default('boolean'); // boolean | numeric | list
    $table->boolean('is_active')->default(true);
    $table->timestamps();
});

// Plan-Feature pivot — which features each plan includes
Schema::create('plan_feature', function (Blueprint $table) {
    $table->foreignUuid('plan_id')->constrained('plans')->cascadeOnDelete();
    $table->foreignUuid('feature_id')->constrained('features')->cascadeOnDelete();
    $table->json('config')->nullable();        // Feature-specific config (e.g., limit value)
    $table->primary(['plan_id', 'feature_id']);
});

// Usage limits — caps for metered features
Schema::create('usage_limits', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('team_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('feature_id')->constrained('features')->cascadeOnDelete();
    $table->string('period');                  // 'day', 'week', 'month', 'year', 'total'
    $table->bigInteger('limit');               // e.g., 1000 for "1000 API calls"
    $table->timestamps();

    $table->unique(['team_id', 'feature_id', 'period']);
});

// Usage records — consumed usage
Schema::create('usage_records', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('team_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('feature_id')->constrained('features')->cascadeOnDelete();
    $table->bigInteger('quantity');            // e.g., 347 API calls
    $table->timestamp('recorded_at');          // Used for period bucketing
    $table->timestamps();

    $table->index(['team_id', 'feature_id', 'recorded_at']);
});

// Entitlement overrides — custom access beyond plan
Schema::create('entitlement_overrides', function (Blueprint $table) {
    $table->uuid('id')->primary();
    $table->foreignUuid('team_id')->constrained()->cascadeOnDelete();
    $table->foreignUuid('feature_id')->constrained('features')->cascadeOnDelete();
    $table->boolean('granted');                // true = allow, false = deny
    $table->string('reason')->nullable();      // Audit trail
    $table->timestamp('expires_at')->nullable();
    $table->timestamps();

    $table->unique(['team_id', 'feature_id']);
});
```

## Model Definitions (Laravel 13 Attributes)

```php
use Illuminate\Database\Eloquent\Attributes\Table;
use Illuminate\Database\Eloquent\Attributes\Fillable;
use Illuminate\Database\Eloquent\Attributes\Casts;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;

#[Table('plans')]
#[Fillable(['name', 'slug', 'stripe_price_id', 'features', 'trial_days', 'billing_interval', 'is_active'])]
#[Casts(['features' => 'array', 'is_active' => 'boolean'])]
class Plan extends Model
{
    public function features(): BelongsToMany
    {
        return $this->belongsToMany(Feature::class)
            ->withPivot('config');
    }

    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    public function hasFeature(string $featureKey): bool
    {
        return in_array($featureKey, $this->features)
            || $this->features()->where('key', $featureKey)->exists();
    }
}

#[Table('subscriptions')]
#[Fillable(['team_id', 'plan_id', 'stripe_id', 'stripe_status', 'trial_ends_at', 'current_period_start', 'current_period_end', 'canceled_at', 'ended_at', 'stripe_metadata'])]
#[Casts(['trial_ends_at' => 'datetime', 'current_period_start' => 'datetime', 'current_period_end' => 'datetime', 'canceled_at' => 'datetime', 'ended_at' => 'datetime', 'stripe_metadata' => 'json'])]
class Subscription extends Model
{
    public function team(): BelongsTo
    {
        return $this->belongsTo(Team::class);
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function isActive(): bool
    {
        return in_array($this->stripe_status, ['active', 'trialing']);
    }

    public function isOnTrial(): bool
    {
        return $this->trial_ends_at && $this->trial_ends_at->isFuture();
    }

    public function isPastDue(): bool
    {
        return $this->stripe_status === 'past_due';
    }

    public function isCanceled(): bool
    {
        return $this->stripe_status === 'canceled';
    }
}

#[Table('features')]
#[Fillable(['key', 'display_name', 'group', 'description', 'type', 'is_active'])]
#[Casts(['is_active' => 'boolean'])]
class Feature extends Model
{
    public function plans(): BelongsToMany
    {
        return $this->belongsToMany(Plan::class)
            ->withPivot('config');
    }
}
```

## Entitlement Engine

```php
// App\Billing\Services\EntitlementService.php
class EntitlementService
{
    public function __construct(
        private UsageService $usage,
    ) {}

    public function getEntitlements(Team $team): EntitlementSet
    {
        return Cache::remember(
            "entitlements:team:{$team->id}",
            now()->addMinutes(5),
            fn () => $this->computeEntitlements($team),
        );
    }

    private function computeEntitlements(Team $team): EntitlementSet
    {
        $subscription = $team->subscription;

        // No subscription = no access
        if (!$subscription || !$subscription->isActive()) {
            return EntitlementSet::empty();
        }

        $plan = $subscription->plan;
        $planFeatures = $plan->features()->get()->keyBy('key');

        // Build entitlements from plan features
        $entitlements = [];
        foreach ($planFeatures as $feature) {
            $entitlements[$feature->key] = new Entitlement(
                feature: $feature,
                granted: true,
                config: $feature->pivot->config ?? [],
            );
        }

        // Apply usage limits: if feature is metered and limit exceeded, deny
        foreach ($entitlements as $key => $entitlement) {
            $limit = $this->usage->getLimit($team, $entitlement->feature);
            if ($limit) {
                $consumed = $this->usage->getUsage($team, $entitlement->feature, $limit->period);
                $entitlements[$key] = $entitlement->withUsageLimit($limit, $consumed);
            }
        }

        // Apply custom overrides (promotions, beta access, manual adjustments)
        $overrides = EntitlementOverride::where('team_id', $team->id)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->get()
            ->keyBy('feature_id');

        foreach ($overrides as $override) {
            $feature = Feature::find($override->feature_id);
            if ($override->granted) {
                $entitlements[$feature->key] = new Entitlement(
                    feature: $feature,
                    granted: true,
                    source: 'override',
                );
            } else {
                unset($entitlements[$feature->key]);
            }
        }

        return new EntitlementSet($entitlements, $subscription);
    }

    public function invalidateCache(Team $team): void
    {
        Cache::forget("entitlements:team:{$team->id}");
    }
}

// Value object for a single entitlement
readonly class Entitlement
{
    public function __construct(
        public Feature $feature,
        public bool $granted,
        public string $source = 'plan',       // 'plan', 'override', 'legacy'
        public ?array $config = null,
        public ?int $usageLimit = null,
        public ?int $usageConsumed = null,
    ) {}

    public function isExhausted(): bool
    {
        return $this->usageLimit !== null && $this->usageConsumed >= $this->usageLimit;
    }

    public function remainingUsage(): ?int
    {
        if ($this->usageLimit === null) return null;
        return max(0, $this->usageLimit - ($this->usageConsumed ?? 0));
    }

    public function withUsageLimit(UsageLimit $limit, int $consumed): self
    {
        return new self(
            feature: $this->feature,
            granted: $this->granted && $consumed < $limit->limit,
            source: $this->source,
            config: $this->config,
            usageLimit: $limit->limit,
            usageConsumed: $consumed,
        );
    }
}

// Collection of entitlements for a team
readonly class EntitlementSet
{
    /** @var array<string, Entitlement> */
    public array $entitlements;

    public function __construct(
        array $entitlements,
        public ?Subscription $subscription = null,
    ) {
        $this->entitlements = $entitlements;
    }

    public static function empty(): self
    {
        return new self([]);
    }

    public function can(string $featureKey): bool
    {
        return isset($this->entitlements[$featureKey])
            && $this->entitlements[$featureKey]->granted
            && !$this->entitlements[$featureKey]->isExhausted();
    }

    public function get(string $featureKey): ?Entitlement
    {
        return $this->entitlements[$featureKey] ?? null;
    }
}
```

## FeatureGate — Authorization Integration

```php
// App\Billing\Services\FeatureGate.php
class FeatureGate
{
    public function __construct(
        private EntitlementService $entitlements,
        private FeatureFlagService $featureFlags,
    ) {}

    public function can(Team $team, string $featureKey): bool
    {
        // Global feature flag check (Laravel Pennant or custom)
        if (!$this->featureFlags->isActive($featureKey)) {
            return false;
        }

        // Entitlement check
        $entitlementSet = $this->entitlements->getEntitlements($team);
        return $entitlementSet->can($featureKey);
    }

    public function authorize(Team $team, string $featureKey): void
    {
        if (!$this->can($team, $featureKey)) {
            throw new FeatureAccessDeniedException(
                "Feature '{$featureKey}' is not available for team '{$team->id}'."
            );
        }
    }
}

// Usage in controller/action
class ApiController
{
    public function __invoke(Request $request, FeatureGate $gate): JsonResponse
    {
        $gate->authorize($request->team(), 'api-access');

        // Feature is available — proceed
    }
}

// Usage in Blade
@if(app(FeatureGate::class)->can($team, 'white-label'))
    <x-white-label-header />
@endif
```

---

# Performance Considerations

- Entitlement computation runs on every feature check if not cached. Cache at 1-5 minute TTL.
- Cache invalidation on: subscription status change (webhook), plan change, override change.
- Usage record writes should be async (queued) to avoid slowing down the hot path.
- The EntitlementSet is intentionally immutable — returns a new object on mutation to prevent stale cache poisoning.

---

# Security Considerations

- Entitlement computation must never expose Stripe raw data to the presentation layer.
- Feature keys are internal identifiers — never accept them from user input without whitelisting.
- Entitlement overrides require audit logging (who granted, when, why).
- Cache keys must be prefixed with team ID — prevents cross-team entitlement leakage.
- Fail closed: if entitlement computation throws, deny access.

---

# Common Mistakes

| Mistake | Problem | Fix |
|---------|---------|-----|
| Checking subscription status directly for feature access | Bypasses usage limits, overrides, trials | Always go through FeatureGate |
| Calling Stripe API on every request | Latency, Stripe outage blocks the app | Cache Stripe state locally, compute entitlements from cache |
| Merging features into Stripe products | Stripe doesn't support granular feature gating | Separate Plan/Feature/Entitlement model in the app |
| Not caching entitlements | N+1 queries on every feature gate check | Cache per team, invalidate on billing change |
| Using anemic entitlement model (boolean only) | Cannot express usage limits or config values | Entitlement object carries config, limits, and consumption |
| Hardcoding plan-feature mapping in code | Requires deploy to add new plans | Store in plan_feature pivot table |
| Ignoring entitlement overrides for internal teams | Hacks like "if team_id === 5 then allow" scattered everywhere | EntitlementOverride table with audit trail |
| Computing entitlements on read without caching | Slows down every page load | 5-minute cache, invalidation on webhook |

---

# Related Topics

Prerequisites: Laravel Cashier setup, Stripe webhook handling, Team/tenant architecture
Related: Cashier BillingGateway wrapper, Subscription drift reconciliation, Billing failure states, Feature flags (Laravel Pennant)

---

# AI Agent Notes

1. The cardinal rule: billing state (Stripe) and entitlement decisions (app) are separate. Never mix them.
2. When implementing feature gating, always route through the FeatureGate — never directly check `$team->subscription->stripe_status`.
3. The entitlement computation must be a pure function of local state. No HTTP calls, no external API queries.
4. Usage limits should be enforced in the entitlement layer (deny access when exceeded), not just reported.
5. Custom overrides need an admin UI or at minimum a CLI command — operators need to grant promotional access without touching code.
6. Entitlement cache invalidation is the hardest part. Hook into every webhook that changes subscription state, and every admin action that modifies overrides or plan definitions.
7. Plan versioning: if you need to change a plan's features mid-cycle, create a new Plan row and migrate active subscriptions. Don't mutate the existing Plan row.
8. FeatureGate should integrate with Laravel's Gate system for `@can` Blade directives.

---

# Verification

- [ ] Entitlement computation is a pure function of local database state (no Stripe HTTP calls)
- [ ] FeatureGate is the only entry point for feature access checks
- [ ] Entitlement caching is implemented with invalidation on all billing state changes
- [ ] Usage records are written asynchronously (queued) and reconciled periodically
- [ ] Entitlement overrides have an audit trail (who, when, why)
- [ ] Plan features are stored in a pivot table, not hardcoded
- [ ] Fail-closed: exceptions in entitlement computation deny access
- [ ] Cross-team cache isolation verified (no entitlement leak between teams)
- [ ] Feature test: team on Pro can access Pro features, team on Starter cannot
- [ ] Feature test: team with exhausted usage limit is denied access
- [ ] Feature test: team with custom override is granted access despite plan
