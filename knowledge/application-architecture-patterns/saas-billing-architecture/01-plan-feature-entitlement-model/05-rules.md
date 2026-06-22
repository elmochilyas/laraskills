# Rules: Plan, Feature & Entitlement Model

**Domain:** Application Architecture Patterns
**Subdomain:** SaaS Billing Architecture
**Knowledge Unit:** Plan, Feature & Entitlement Model

---

## Rule 1: Separate Billing State From Entitlement Decisions

**Category:** Architecture

**Rule:** Compute entitlements from locally cached subscription state combined with plan/feature definitions. Never make entitlement decisions by calling the Stripe API directly on every request.

**Reason:** Stripe is the billing system, not the authorization system. Stripe outages must not block feature access for paying customers. Entitlement checks should be a database query + in-memory computation — never an HTTP call.

**Bad Example:**
```php
// DANGER: Stripe API call on every feature check — adds latency and coupling
class FeatureGate
{
    public function can(Team $team, string $feature): bool
    {
        $stripe = new StripeClient(config('cashier.secret'));
        $sub = $stripe->subscriptions->retrieve($team->subscription->stripe_id);
        return $sub->status === 'active' && $this->planHasFeature($sub->plan->product, $feature);
    }
}
```

**Good Example:**
```php
// Correct: entitlement computed from locally cached Stripe state
class FeatureGate
{
    public function __construct(private EntitlementService $entitlements) {}

    public function can(Team $team, string $featureKey): bool
    {
        $entitlementSet = $this->entitlements->getEntitlements($team);
        return $entitlementSet->can($featureKey);
    }
}
```

**Exceptions:** Reconciliation jobs that periodically compare local state against Stripe. These are background operations, not user-facing feature checks.

**Consequences Of Violation:** Stripe API latency (~200-500ms) added to every page load. Stripe downtime blocks user access to features they've paid for. Feature access becomes dependent on a third-party API's availability.

---

## Rule 2: Entitlement Computation Must Be a Pure Function of Local State

**Category:** Architecture

**Rule:** The `computeEntitlements()` method must be a pure function: same inputs → same outputs. No HTTP calls, no random generation, no external API queries. Inputs are local database records (subscription, plan, features, overrides, usage records).

**Reason:** Pure functions are cacheable, testable, and predictable. If entitlement computation depends on external state, caching becomes unsafe and the system behaves non-deterministically under network conditions.

**Bad Example:**
```php
// DANGER: non-deterministic — depends on Stripe API
private function computeEntitlements(Team $team): EntitlementSet
{
    $stripe = new StripeClient(config('cashier.secret'));
    $stripeSub = $stripe->subscriptions->retrieve($team->subscription->stripe_id);
    $features = [];
    foreach ($stripeSub->items->data as $item) {
        $features[] = $item->price->metadata['feature_key'] ?? 'unknown';
    }
    return new EntitlementSet($features);
}
```

**Good Example:**
```php
// Correct: pure function — all inputs are from local database
private function computeEntitlements(Team $team): EntitlementSet
{
    $subscription = $team->subscription;
    if (!$subscription || !$subscription->isActive()) {
        return EntitlementSet::empty();
    }
    $planFeatures = $subscription->plan->features()->get()->keyBy('key');
    $entitlements = [];
    foreach ($planFeatures as $feature) {
        $entitlements[$feature->key] = new Entitlement(
            feature: $feature,
            granted: true,
            source: 'plan',
        );
    }
    $this->applyUsageLimits($team, $entitlements);
    $this->applyOverrides($team, $entitlements);
    return new EntitlementSet($entitlements, $subscription);
}
```

**Exceptions:** None. This is a data integrity invariant — mixing external API calls into entitlement computation produces unreproducible bugs.

**Consequences Of Violation:** Entitlement caching is unsafe (stale or incorrect data). Tests cannot reproduce entitlement bugs reliably. Stripe API errors crash feature access checks.

---

## Rule 3: Feature Keys Are Internal Identifiers — Never Accept From User Input

**Category:** Security

**Rule:** Feature keys (e.g., `api-access`, `white-label`) are internal identifiers. Never accept them directly from user input (query parameters, request body, headers) without whitelisting against the known set of features.

**Reason:** Accepting arbitrary feature keys from user input enables privilege escalation — an attacker can request a feature key they haven't paid for and bypass entitlement checks if the code doesn't re-verify against the actual entitlement set.

**Bad Example:**
```php
// DANGER: accepts arbitrary feature key from user input
class ApiController
{
    public function __invoke(Request $request, FeatureGate $gate): JsonResponse
    {
        $feature = $request->input('feature'); // Attacker sends "admin-panel"
        if ($gate->can($request->team(), $feature)) {
            // ...
        }
    }
}
```

**Good Example:**
```php
// Correct: feature keys are hardcoded or whitelisted
class ApiController
{
    private const REQUIRED_FEATURES = ['api-access', 'webhook-endpoints'];

    public function __invoke(Request $request, FeatureGate $gate): JsonResponse
    {
        $feature = $request->input('feature');
        if (!in_array($feature, self::REQUIRED_FEATURES, true)) {
            abort(400, 'Unknown feature.');
        }
        if ($gate->can($request->team(), $feature)) {
            // ...
        }
    }
}
```

**Exceptions:** Admin panels where authorized operators manage feature assignments. Even then, validate against the `features` table.

**Consequences Of Violation:** An attacker can probe feature keys by observing response differences. In poorly designed systems, passing a valid feature key may grant access if the entitlement check is inverted or skipped.

---

## Rule 4: Cache Entitlements With Invalidation on Every Billing State Change

**Category:** Performance

**Rule:** Cache computed entitlement sets per team with a TTL of 1-5 minutes. Invalidate the cache on every webhook that changes subscription state, every admin action that modifies overrides, and every plan definition change.

**Reason:** Entitlement computation queries multiple tables (subscriptions, plans, plan_feature pivot, usage_limits, usage_records, entitlement_overrides). Caching reduces this to a single cache read. Without invalidation, users experience stale feature access after upgrades, downgrades, or payment recovery.

**Bad Example:**
```php
// DANGER: no caching — N queries per feature check, per request
public function can(Team $team, string $featureKey): bool
{
    $subscription = $team->subscription;
    $plan = $subscription->plan;
    $planFeatures = $plan->features()->where('key', $featureKey)->exists();
    $override = EntitlementOverride::where('team_id', $team->id)
        ->whereHas('feature', fn ($q) => $q->where('key', $featureKey))->first();
    $usage = UsageRecord::where('team_id', $team->id)->where('feature_id', ...)->sum('quantity');
    // ... repeated for every feature check on every request
}
```

**Good Example:**
```php
// Correct: cached with invalidation hooks
class EntitlementService
{
    public function getEntitlements(Team $team): EntitlementSet
    {
        return Cache::remember(
            "entitlements:team:{$team->id}",
            now()->addMinutes(5),
            fn () => $this->computeEntitlements($team),
        );
    }

    public function invalidateCache(Team $team): void
    {
        Cache::forget("entitlements:team:{$team->id}");
    }
}

// In every webhook handler:
$this->entitlements->invalidateCache($team);
```

**Exceptions:** During reconciliation jobs where you need the freshest data. Skip cache or use a shorter TTL.

**Consequences Of Violation:** Every page load runs 5-10 database queries for entitlement checks. For a dashboard with 50 teams, that's 250-500 queries. At scale, this degrades response times and database load.

---

## Rule 5: Entitlement Overrides Require Audit Trail

**Category:** Security / Compliance

**Rule:** Every entitlement override (granting or revoking feature access outside the plan) must record: who authorized it, when, why, and an optional expiration. Never modify overrides without creating an audit record.

**Reason:** Overrides bypass the normal billing → entitlement pipeline. Without an audit trail, there is no way to answer "why does team X have feature Y?" during a billing audit. Expired overrides that aren't cleaned up become permanent free access.

**Bad Example:**
```php
// DANGER: direct DB mutation with no audit trail
DB::table('entitlement_overrides')->insert([
    'team_id' => $team->id,
    'feature_id' => $feature->id,
    'granted' => true,
]);
```

**Good Example:**
```php
// Correct: audit-logged override with reason and expiration
class GrantFeatureOverrideAction
{
    public function execute(Team $team, Feature $feature, string $reason, ?Carbon $expiresAt = null): EntitlementOverride
    {
        $override = EntitlementOverride::updateOrCreate(
            ['team_id' => $team->id, 'feature_id' => $feature->id],
            ['granted' => true, 'reason' => $reason, 'expires_at' => $expiresAt],
        );

        AuditLog::create([
            'actor_id' => auth()->id(),
            'action' => 'entitlement_override.granted',
            'target_type' => 'team',
            'target_id' => $team->id,
            'metadata' => [
                'feature' => $feature->key,
                'reason' => $reason,
                'expires_at' => $expiresAt?->toIso8601String(),
            ],
        ]);

        return $override;
    }
}
```

**Exceptions:** Automated system overrides (e.g., partner integrations) should still log with `actor_id = null` and `reason = 'automated:partner_sync'`.

**Consequences Of Violation:** Cannot explain to auditors or customers why a team has elevated access. Expired promotional access persists indefinitely. SOC2/ISO27001 compliance audit fails on access control review.

---

## Rule 6: Plans Are Immutable After Release

**Category:** Data Integrity

**Rule:** Once a plan is in use by active subscriptions, never mutate its features, pricing, or trial configuration. To change a plan, create a new plan row and migrate active subscriptions. Use soft-deletes on old plans.

**Reason:** Changing a plan mid-cycle creates billing confusion: customers on the same plan have different feature sets depending on when they subscribed. Historical invoices reference the old plan configuration. Plan mutations make revenue reporting unreliable.

**Bad Example:**
```php
// DANGER: mutating a live plan
$plan = Plan::where('slug', 'pro')->first();
$plan->features = ['api-access', 'white-label', 'new-feature']; // In-place mutation
$plan->save();
```

**Good Example:**
```php
// Correct: new plan version, migrate subscriptions
$newPlan = Plan::create([
    'name' => 'Pro v2',
    'slug' => 'pro-v2',
    'stripe_price_id' => 'price_new_pro_v2',
    'features' => ['api-access', 'white-label', 'new-feature'],
    'billing_interval' => 'month',
]);

// Deprecate old plan
$oldPlan = Plan::where('slug', 'pro')->first();
$oldPlan->update(['is_active' => false]);

// Migrate active subscriptions (via queue or scheduled job)
MigrateSubscriptionsToNewPlan::dispatch($oldPlan, $newPlan);
```

**Exceptions:** Fixing typos in display names or descriptions that don't affect billing logic. Adding a feature to a plan as an additive-only change (customers don't lose anything). Both cases should be documented in a changelog.

**Consequences Of Violation:** Two customers on the "same" Pro plan have different features. Customer support cannot explain what a customer should have. Revenue metrics by plan become meaningless because the plan definition changed.
