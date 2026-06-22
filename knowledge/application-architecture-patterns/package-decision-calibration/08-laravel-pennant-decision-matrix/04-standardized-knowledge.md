# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Application Architecture Patterns |
| Subdomain | Package Decision Calibration |
| Knowledge Unit | Laravel Pennant Decision Matrix |
| Difficulty | Intermediate |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-22 |
| Dependencies | Feature flag concept, Laravel service container, SaaS plan architecture |
| Related KUs | Calibrated package recommendation, Package escape hatch strategy, SaaS billing architecture |
| Source | domain-analysis.md |

---

# Overview

Laravel Pennant is Laravel's first-party feature flag package. It manages feature flags stored in the application database using a fluent, class-based API. Pennant supports boolean flags, rich feature classes, gradual rollouts (percentage-based), and environment-specific flags. It is designed for single-application flag management — it is not a distributed feature flag service. This decision matrix covers when Pennant fits, when dedicated feature flag services (LaunchDarkly, Flagsmith) are warranted, and how to use Pennant for SaaS plan feature gating without making it the primary entitlement store.

---

# Core Concepts

- **Feature class**: A class extending `Laravel\Pennant\Feature` that defines flag resolution logic. Each feature is a named class with a `resolve()` method.
- **Boolean flags**: `Feature::define('new-dashboard', fn (User $user) => $user->isAdmin());` — simple true/false per user.
- **Rich features**: Feature classes can resolve to `string`, `int`, or enum values. `Feature::for($user)->value('theme-color')` returns `'dark'` or `'light'`.
- **Gradual rollout**: `Feature::define('new-checkout', fn (User $user) => $user->id % 100 < 10);` — 10% of users get the flag.
- **Scope resolution**: Flags resolve per scope (user, team, tenant, request). `Feature::for($user)->active('new-dashboard')`.
- **Caching**: Pennant caches flag resolutions in the database by default (the `features` table). Use `Feature::flushCache()` to clear.
- **Middleware**: `Feature::middleware('new-checkout')` — abort if feature is not active.

---

# When To Use

- Feature flags in a single Laravel application (not cross-service)
- Gradual rollouts (10% → 50% → 100% of users)
- A/B testing with simple on/off or value-based flags
- SaaS plan feature gating (pro plan users get feature X)
- Environment-specific flags (staging has feature enabled, production doesn't)
- When you need flag resolution logic versioned in your codebase (class-based features)

## When NOT To Use

- Flags must work across multiple services (Laravel + Node.js + Go microservices)
- LaunchDarkly, Flagsmith, or another dedicated flag service is already in use
- Non-Laravel applications need to consume the same flags
- Site reliability team needs kill switches that work when the application database is down
- Flags need to be toggled instantly without cache delay or deployment
- Complex targeting rules (geolocation, device type, behavior history) beyond simple user attributes
- Flag analytics and experimentation tracking are primary requirements

---

# Best Practices

1. **Use Pennant for feature gating, not as the primary entitlement store** WHY: Pennant flags are code-level toggles. SaaS plan entitlements should live in a plan configuration (database or config). Pennant reads the entitlement to set a flag, but the plan config is the source of truth. Don't define `new-dashboard` as both a Pennant feature AND a plan entitlement — define the plan entitlement and have Pennant read it.

2. **Commit feature flag cleanup with every flag** WHY: Every feature flag is technical debt with an expiration date. When creating a flag, commit a reminder to remove it. Flags that outlive their feature become dead code that bloats the flag registry and confuses developers.

3. **Use feature classes for complex resolution, not closures in service providers** WHY: `Feature::define('name', $closure)` in `AppServiceProvider` puts flag logic in a bootstrapping file. Feature classes (`app/Features/NewDashboard.php`) are self-contained, testable, and discoverable.

4. **Cache Pennant flags, but keep TTL short (5-15 minutes)** WHY: Pennant's database-backed caching avoids recomputing flag resolution on every request. But long TTLs mean flags can't be toggled quickly. Short TTLs balance performance with responsiveness.

5. **Use `Feature::for()` with explicit scope, not implicit auth user** WHY: `Feature::active('new-dashboard')` implicitly uses the authenticated user. `Feature::for($user)->active('new-dashboard')` is explicit and works in queued jobs, commands, and tests.

---

# Architecture Guidelines

- **Feature class directory**: `app/Features/` — one class per feature. `NewDashboard.php`, `AdvancedSearch.php`, `DarkMode.php`.
- **Feature class structure**:
  ```php
  namespace App\Features;

  use App\Models\User;
  use Laravel\Pennant\Feature;

  class NewDashboard
  {
      public function resolve(User $user): bool
      {
          return match (true) {
              $user->isAdmin() => true,               // Admins always get it
              $user->onPlan('enterprise') => true,    // Enterprise plan gets it
              $user->id % 100 < 10 => true,           // 10% gradual rollout
              default => false,
          };
      }
  }
  ```

- **Integration with SaaS plans**: Pennant reads plan entitlements. The plan config is the source of truth:
  ```php
  // config/plans.php
  'enterprise' => ['new_dashboard', 'advanced_search', 'api_access'],
  'pro' => ['advanced_search'],
  'basic' => [],

  // app/Features/AdvancedSearch.php
  class AdvancedSearch
  {
      public function resolve(User $user): bool
      {
          return in_array('advanced_search', config("plans.{$user->plan}"));
      }
  }
  ```

---

# Performance Considerations

- **Database cache**: Pennant stores resolved flags in the `features` table. Each flag resolution that's not cached hits the database. For high-traffic apps, this can add 1-3 queries per page load.
- **Preload flags in middleware**: Instead of resolving flags in Blade templates (N queries), resolve all relevant flags in middleware and pass them to the view. `View::share('flags', ['new_dashboard' => Feature::for($user)->active('new-dashboard')])`.
- **Flag explosion**: 50+ features each resolved per request will degrade performance. Group related flags or resolve lazily.

---

# Security Considerations

- **Feature flags ARE NOT authorization**: A disabled feature flag does not mean the route/action is secure. Always add authorization checks (Gates/Policies) alongside feature flags. A feature flag controls visibility; authorization controls access.
- **Flag value exposure**: Do not put sensitive data in feature flag values. Flag values may be cached in the database and exposed in debug output.
- **Kill switch isolation**: If a feature flag serves as a kill switch for a broken feature, it must be togglable without deploying code. Ensure kill switch flags bypass caching or have a non-database fallback.

---

# Common Mistakes

**Mistake: Using Pennant across multiple services**
- Description: Expecting Pennant flags defined in the Laravel app to be readable by a Node.js service
- Cause: Treating Pennant as a distributed feature flag service
- Consequence: Duplicated flag logic across services, inconsistent flag state, "flag enabled in Laravel but not in Node"
- Better: Use LaunchDarkly, Flagsmith, or a custom flag API endpoint for cross-service flags. Pennant is single-application.

**Mistake: Treating Pennant as the primary entitlement store**
- Description: Defining plan features entirely in Pennant without a separate plan configuration
- Cause: "Pennant can check the user's plan, so why duplicate?"
- Consequence: Plan entitlements are now code-only. Changing a plan requires a code change. Sales and support can't see entitlements without code access.
- Better: Plans are defined in a database table or config file. Pennant reads plan data to set flags. The plan data is the source of truth.

**Mistake: Never cleaning up stale flags**
- Description: Feature flags for features shipped 18 months ago are still defined
- Cause: No flag cleanup process
- Consequence: 50+ defined flags, half are dead. Developers don't know which flags are active. Flag resolution overhead for unused flags.
- Better: Every flag definition gets a removal date comment. Quarterly flag cleanup sprint. CI check for flags older than 6 months.

**Mistake: Using Pennant for emergency kill switches that bypass caching**
- Description: Defining a flag as a kill switch but keeping the default 15-minute cache TTL
- Cause: Not understanding that Pennant caches flag resolutions
- Consequence: Toggle the kill switch, but it takes 15 minutes to take effect. Users keep hitting the broken feature.
- Better: Kill switches should bypass Pennant's cache or use an alternative mechanism (environment variable, Redis key) for immediate effect.

---

# Anti-Patterns

- **Pennant as authorization**: Using `Feature::active('can-edit-posts')` instead of Gates/Policies. Feature flags are for rollout control, not security.
- **Flag-driven architecture**: Every new feature behind a flag, every code path wrapped in `if (Feature::active(...))`. This creates a combinatorial explosion of untested code paths.
- **Database as kill switch**: Using a database-backed flag as an emergency kill switch. If the database is the problem, the kill switch doesn't work. Use env vars or Redis.
- **Feature flags for configuration**: `Feature::active('pagination-size-20')`. This is configuration, not a feature flag. Use `config()` or database settings.

---

# Escape Hatch

Pennant's escape hatch is to bypass Pennant entirely and use the underlying plan configuration or a dedicated flag service:

```php
class FeatureFlagResolver
{
    public function isActive(string $feature, User $user): bool
    {
        // Escape hatch: flags that need cross-service availability
        if ($this->isCrossServiceFlag($feature)) {
            return $this->resolveFromLaunchDarkly($feature, $user);
        }

        // Normal Pennant path
        return Feature::for($user)->active($feature);
    }
}
```

**When to escape**: Cross-service flags, kill switches needing instant toggle, complex targeting rules, flags needing analytics/experimentation.

**Migration path**: Introduce a `FeatureFlagGateway` interface. Start with a Pennant implementation. Add a LaunchDarkly/Flagsmith implementation for flags that outgrow Pennant. Migrate flags one at a time.

---

# Alternatives

| Alternative | Fits When | Tradeoff |
|-------------|-----------|----------|
| LaunchDarkly | Cross-service, instant toggle, experimentation, complex targeting | Paid service, adds external dependency, SDK complexity |
| Flagsmith | Open-source option, cross-service, self-hostable | Self-hosting operational burden, less mature than LaunchDarkly |
| Environment variables | Simple kill switches, infrastructure-level toggles | No per-user targeting, requires deployment to change |
| Database settings table | Feature gating tied to plan/config, no gradual rollout needed | No targeting rules, no caching layer, ad-hoc |
| Custom Redis-based flags | High performance, instant toggle, simple boolean flags | Build and maintain the resolution logic, no UI |

---

# Testing Impact

- **Feature flag isolation in tests**: Use `Feature::define()` in test setup to override flag behavior for specific tests. Reset flags in `tearDown()`.
- **Flag-dependent tests**: Every test that depends on a feature flag should test BOTH states (flag on AND flag off). Flag-off state is the most commonly missed test case.
- **Gradual rollout testing**: For percentage-based rollouts, test the boundary conditions (user ID that gets the flag vs. doesn't).
- **Cache clearing in tests**: Clear Pennant's cache between tests: `Feature::flushCache()` in `setUp()`.

---

# Operational Impact

- **Flag toggling**: Flags are toggled by deploying code (changing the resolve method) or by changing the data the resolve method reads. There is no built-in admin UI for toggling Pennant flags.
- **Monitoring**: Monitor the number of flags defined (flag bloat), the resolution time per flag (performance), and cache hit rate.
- **Flag cleanup process**: Establish a quarterly flag review. Remove flags for features that have been at 100% rollout for >2 months.
- **Database storage**: The `features` table grows with cached flag resolutions. Old cached values are automatically cleaned up by Pennant, but monitor table size in high-traffic apps.

---

# AI Agent Notes

- Default to recommending Pennant for Laravel-only feature flags. Only recommend LaunchDarkly/Flagsmith when cross-service flags, instant toggling, or experimentation tracking are explicit requirements.
- When generating SaaS applications, always define plan entitlements separately from Pennant. Pennant should read plan data, not be the plan data.
- Always generate a feature class (`app/Features/`) instead of defining flags in closures in service providers. Feature classes are testable and discoverable.
- When generating tests, always include tests for both flag-on and flag-off states. Flag-off is the most commonly untested path.
- Include a removal date comment in every generated flag definition. This prevents accumulation of stale flags.

---

# Verification

- [ ] Pennant is used for feature gating, not as primary entitlement store
- [ ] Plan entitlements are defined separately from Pennant flags
- [ ] Feature flags use feature classes, not closures in service providers
- [ ] Every flag has a removal plan or expiration comment
- [ ] Kill switches have a non-database fallback mechanism
- [ ] Pennant is not used for cross-service feature flags
- [ ] Pennant is not used as a substitute for authorization (Gates/Policies)
- [ ] Tests cover both flag-on and flag-off states
- [ ] Flag cleanup process is established (quarterly review)
- [ ] Cache TTL is configured (5-15 minutes) and flush mechanism exists
