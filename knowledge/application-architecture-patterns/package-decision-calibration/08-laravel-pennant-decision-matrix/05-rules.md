# Rules for Laravel Pennant Decision Matrix

## Use Pennant for Feature Gating — Not as the Primary Entitlement Store
---
## Category
Architecture | Separation of Concerns
---
## Rule
Pennant feature flags should read plan entitlements to determine flag state — not serve as the entitlement definition itself. SaaS plan entitlements must be defined separately (database or config). Pennant is a feature gating layer, not a plan management system.
---
## Reason
When plans are defined solely in Pennant flags, plan changes require code changes and deployments. Sales, support, and operations teams cannot view entitlements without code access. When plans are defined in a database table or config, they can be managed independently of feature flags. Pennant reads the plan data to decide flag state — the plan data is the source of truth, not Pennant.
---
## Bad Example
```php
// Plan entitlements defined entirely in Pennant
Feature::define('advanced-search', fn (User $user) => $user->plan === 'enterprise');
Feature::define('api-access', fn (User $user) => $user->plan === 'enterprise' || $user->plan === 'pro');
Feature::define('custom-reports', fn (User $user) => $user->plan === 'enterprise');
// 30 feature flags, each hardcoding plan logic. Changing a plan requires updating 10+ flags.
```
---
## Good Example
```php
// Plan entitlements defined in config — source of truth
// config/plans.php
return [
    'enterprise' => ['advanced_search', 'api_access', 'custom_reports', 'white_label'],
    'pro' => ['advanced_search', 'api_access'],
    'basic' => [],
];

// Pennant reads plan data to determine flag state
class AdvancedSearch
{
    public function resolve(User $user): bool
    {
        return in_array('advanced_search', config("plans.{$user->plan}"));
    }
}
// Adding a feature to the enterprise plan: add to config array. One-line change.
```
---
## Exceptions
Applications with a single plan or no plan structure at all may use Pennant flags directly without a separate entitlement store. The moment a second plan is introduced, separate the concerns.
---
## Consequences Of Violation
Plan changes require code deployments. Sales team cannot answer "does the pro plan include feature X?" without asking engineering. Changing a plan's feature set requires updating multiple Pennant flag definitions scattered across the codebase.

## Use Feature Classes, Not Closures in Service Providers
---
## Category
Architecture | Maintainability
---
## Rule
Define Pennant features in dedicated feature classes (`app/Features/NewDashboard.php`), not as closures in `AppServiceProvider::boot()`. Feature classes are self-contained, testable, discoverable via IDE, and version-controlled as individual files.
---
## Reason
Closures in service providers mix feature flag logic with application bootstrapping. A service provider with 20 `Feature::define()` closures becomes unreadable. Feature classes isolate each flag's resolution logic in its own file, making it easy to find, test, and modify individual flags without touching the provider.
---
## Bad Example
```php
// All flags in AppServiceProvider — unmaintainable at scale
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        Feature::define('new-dashboard', fn (User $user) => $user->isAdmin() || $user->id % 100 < 10);
        Feature::define('dark-mode', fn (User $user) => $user->settings->dark_mode ?? false);
        Feature::define('advanced-search', fn (User $user) => $user->onPlan('enterprise'));
        Feature::define('api-v2', fn (User $user) => $user->id % 100 < 25);
        // ... 15 more closures — where does new-dashboard logic live?
    }
}
```
---
## Good Example
```php
// Feature classes — self-contained, testable, discoverable
// app/Features/NewDashboard.php
class NewDashboard
{
    public function resolve(User $user): bool
    {
        return match (true) {
            $user->isAdmin() => true,
            $user->onPlan('enterprise') => true,
            $user->id % 100 < 10 => true, // 10% gradual rollout
            default => false,
        };
    }
}

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
## Exceptions
Trivial flags with a single line of logic that are temporary (<2 weeks) may use a closure. Any flag that lives longer than a single sprint should be extracted to a feature class.
---
## Consequences Of Violation
Feature flag logic scattered across a monolithic service provider. Testing individual flags requires booting the entire application. Flag resolution logic is hidden inside bootstrapping code, making it invisible to new team members.

## Commit Feature Flag Cleanup with Every Flag
---
## Category
Maintainability | Observability
---
## Rule
Every feature flag definition must include a removal plan: a comment with an expected removal date, a cleanup task, or a CI check that flags for stale flags. Flags that outlive their feature become dead code that bloats the flag registry.
---
## Reason
Feature flags are technical debt with an expiration date. When a flag's feature reaches 100% rollout and has been stable for 2+ months, the flag should be removed. Stale flags accumulate silently — a codebase with 50 defined flags may have only 10 active features. Developers waste time understanding which flags are live and which are dead. Flag resolution overhead continues for flags nobody uses.
---
## Bad Example
```php
class NewDashboard
{
    public function resolve(User $user): bool
    {
        return true; // Shipped 18 months ago, 100% rollout, never cleaned up
    }
}

class OldSearchEngine
{
    public function resolve(User $user): bool
    {
        return false; // Disabled 12 months ago, never cleaned up
    }
}
// 20+ stale flags remain. Nobody knows which flags are active.
```
---
## Good Example
```php
/**
 * Feature: New Dashboard
 * Rollout: 10% → 50% → 100%
 * Added: 2026-01-15
 * REMOVE AFTER: 2026-04-15 (3 months after 100% rollout)
 */
class NewDashboard
{
    public function resolve(User $user): bool
    {
        return $user->id % 100 < 10;
    }
}

// Quarterly cleanup: remove flags with REMOVE AFTER date passed
// CI check: flag files with REMOVE AFTER more than 30 days in the past
```
---
## Exceptions
Permanent kill switches that serve as emergency toggles do not need removal dates. However, kill switches should be few (1-3) and clearly documented as permanent.
---
## Consequences Of Violation
Flag registry bloat. 50+ defined flags, half dead. Developers don't know which flags are active. Flag resolution overhead for unused flags. Feature flag configuration becomes a historical archive, not an operational tool.

## Feature Flags Are Not Authorization
---
## Category
Security
---
## Rule
A disabled Pennant feature flag controls visibility; it does not control access. Always add proper authorization checks (Gates/Policies) alongside feature flags. A feature flag can be toggled on accidentally; authorization gates must still enforce the correct access rules.
---
## Reason
Feature flags are for gradual rollouts and A/B testing — they are not security boundaries. When a feature flag is misconfigured or accidentally enabled, the Gates/Policies still prevent unauthorized access. Feature flags without authorization create a path where a flag toggle grants access to unauthenticated or unauthorized users.
---
## Bad Example
```php
// Feature flag as sole access control
Route::get('/admin/reports', [ReportController::class, 'index'])
    ->middleware('feature:advanced-reports');
// If flag is accidentally enabled for all users, anyone can access admin reports
```
---
## Good Example
```php
// Feature flag controls visibility; Gate controls access
Route::get('/admin/reports', [ReportController::class, 'index'])
    ->middleware(['auth', 'can:view-reports', 'feature:advanced-reports']);

// In controller — double check
class ReportController
{
    public function index(Request $request): View
    {
        Gate::authorize('view-reports'); // Authorization — required regardless of flag state
        // Feature flag is a UI toggle, not a security control
    }
}
```
---
## Exceptions
When a feature flag is used exclusively to disable a broken feature (kill switch), and there are no security implications to the feature being re-enabled, authorization may not be needed. However, the vast majority of feature flags should have accompanying authorization checks.
---
## Consequences Of Violation
A misconfigured flag grants access to features that should be restricted. Internal admin tools become accessible. Feature flags become an attack vector: if an attacker can influence flag state (e.g., through a query parameter or header), they can bypass authorization.
