# Rules

## Rule 1: Set and Enforce a Provider Budget via CI
---
## Category
Scalability
---
## Rule
Define a hard limit on total provider count (manual + discovered) and enforce it in your CI pipeline using a script that counts providers from `bootstrap/providers.php` and `bootstrap/cache/packages.php`.
---
## Reason
Provider sprawl degrades bootstrap time linearly. Without a budget, providers accumulate unchecked. CI enforcement makes the budget visible and requires explicit discussion before exceeding it.
---
## Bad Example
```php
// No budget — provider count doubles every year
// No one notices until TTFB has degraded 200ms
```
---
## Good Example
```bash
# CI step
$max = 30;
$manual = count(require 'bootstrap/providers.php');
$packagesPath = 'bootstrap/cache/packages.php';
$discovered = file_exists($packagesPath) ? count(require $packagesPath['providers'] ?? []) : 0;
$total = $manual + $discovered;
if ($total -gt $max) { exit 1; }
```
---
## Exceptions
Octane deployments can tolerate higher budgets since provider overhead is paid once per worker boot — adjust the budget accordingly.
---
## Consequences Of Violation
Unchecked provider growth; cumulative bootstrap time degradation; TTFB increase over time; performance issues that emerge gradually and are hard to attribute.

## Rule 2: Perform Quarterly Provider Audits
---
## Category
Maintainability
---
## Rule
Review all registered providers (both manual and auto-discovered) at least once per quarter. Remove unused providers, consolidate fragmented ones, and reassess deferral candidates.
---
## Reason
Providers accumulate from abandoned experiments, replaced packages, and past architectural decisions. Regular audits identify dead weight, reduce bootstrap time, and keep the provider list aligned with current architecture.
---
## Bad Example
```php
// Provider from an abandoned experiment 2 years ago
// Still registered — runs on every request, does nothing useful
class AbandonedExperimentProvider extends ServiceProvider { /* ... */ }
```
---
## Good Example
```bash
# Quarterly audit script
php artisan about --json | php -r "
    \$data = json_decode(file_get_contents('php://stdin'), true);
    echo 'Total providers: ' . count(\$data['providers']) . PHP_EOL;
    // Flag providers older than 6 months without commits
"
```
---
## Exceptions
Very small applications (<10 providers) with stable packages may extend to semi-annual audits.
---
## Consequences Of Violation
Dead code executing on every request; wasted bootstrap time; deprecated or unused packages still registered; security risk from unmaintained providers.

## Rule 3: Default to Deferred for New Providers (Deferred-First Policy)
---
## Category
Performance
---
## Rule
When adding a new provider, start with `DeferrableProvider` implementation. Only remove it if you can demonstrate a specific need for eager registration.
---
## Reason
Deferred providers incur zero bootstrap cost until their services are used. A deferred-first default prevents accidental performance regressions and forces explicit justification for eager registration.
---
## Bad Example
```php
// New provider — no thought about deferral
class GeocodingServiceProvider extends ServiceProvider
{
    // Eager by default — runs on every request
    // Geocoding used on <1% of routes
}
```
---
## Good Example
```php
// New provider — deferred by default
class GeocodingServiceProvider extends ServiceProvider implements DeferrableProvider
{
    public function provides(): array
    {
        return [Geocoder::class];
    }
}
```
---
## Exceptions
Providers that register boot-time artifacts (routes, views, event listeners, middleware) must be eager. Document the reason for each eager exception.
---
## Consequences Of Violation
Unnecessary bootstrap overhead from new providers; gradual performance degradation as provider count grows; cumulative cost of 10-50+ eager providers on every request.

## Rule 4: Monitor Provider Count as a Deployment Health Metric
---
## Category
Scalability
---
## Rule
Track total provider count (eager + discovered) alongside response times in your monitoring system. Alert on sudden increases.
---
## Reason
Provider count correlates with bootstrap time and TTFB. Monitoring it as a deployment health metric makes provider additions visible and creates accountability — a sudden jump signals an unvetted package or unintended registration.
---
## Bad Example
```php
// No monitoring — provider spike goes unnoticed
// 10 new package providers added in one deploy
// Bootstrap time increases 20ms — nobody notices
```
---
## Good Example
```php
// Artisan command for monitoring integration
class ProviderCountCommand extends Command
{
    public function handle(): void
    {
        $count = count(app()->getProviders(ServiceProvider::class));
        // Send to monitoring (Laravel Pulse, StatsD, etc.)
        Metric::gauge('laravel.providers.total', $count);
    }
}
```
---
## Exceptions
Small applications with stable provider lists may not need active monitoring — quarterly audit is sufficient.
---
## Consequences Of Violation
Performance degrades silently over time; provider additions go unnoticed; correlation between provider growth and performance issues is missed; capacity planning does not account for bootstrap time.

## Rule 5: Audit Both Manual and Auto-Discovered Providers
---
## Category
Maintainability
---
## Rule
Include auto-discovered providers from `bootstrap/cache/packages.php` in every provider audit, not just the manual list in `bootstrap/providers.php`.
---
## Reason
Counting only manual providers underestimates the true provider count. Auto-discovered packages are still registered and booted — their providers contribute equally to overhead and attack surface.
---
## Bad Example
```bash
php -r "echo count(require 'bootstrap/providers.php');"
# Output: 15
# Real count including auto-discovered: 42
```
---
## Good Example
```php
$manual = require base_path('bootstrap/providers.php');
$packages = require base_path('bootstrap/cache/packages.php');
$total = count($manual) + count($packages['providers'] ?? []);
```
---
## Exceptions
Applications with `dont-discover` configured for all external packages may have zero auto-discovered providers — still verify rather than assume.
---
## Consequences Of Violation
Provider count underestimated by 2-5x; audits miss significant provider growth from packages; performance issues attributed to "unknown causes"; security audits miss auto-discovered providers.

## Rule 6: Consolidate Providers Within Domain Boundaries, Never Across Them
---
## Category
Code Organization
---
## Rule
When consolidating providers, merge only those within the same domain boundary. Never merge providers from different bounded contexts into a single provider.
---
## Reason
Consolidating across domain boundaries creates a god provider that violates SRP — it couples unrelated concerns, makes the provider untestable, and blocks future extraction of individual domains into services.
---
## Bad Example
```php
// God provider — consolidating across domains
class MegaProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(Payments\StripeProvider::class);
        $this->app->register(Notifications\SmsProvider::class);
        $this->app->register(Inventory\StockProvider::class);
        $this->app->register(Analytics\TrackerProvider::class);
    }
}
```
---
## Good Example
```php
// Consolidated within domain — legitimate
class PaymentsServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->register(StripeProvider::class);
        $this->app->register(InvoiceProvider::class);
        $this->app->register(SubscriptionProvider::class);
    }
    // All three are payments-related — same bounded context
}
```
---
## Exceptions
Infrastructure-level providers (error handling, logging, cache) that serve all domains may span boundaries — but each should have a clear technical scope, not a "catch-all" purpose.
---
## Consequences Of Violation
God provider that is impossible to test; domain coupling that prevents service extraction; difficult debugging (one provider does too much); registration order issues between unrelated domains.
