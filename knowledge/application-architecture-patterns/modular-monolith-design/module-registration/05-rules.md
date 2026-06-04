# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module registration and discovery mechanisms
Knowledge Unit ID: MMD-04
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Keep exactly one service provider per module
---
## Category
Code Organization
---
## Rule
Register exactly one service provider per module. The provider handles all bootstrapping: routes, migrations, config, event listeners, and container bindings.
---
## Reason
Multiple providers per module signal that the module should be split. A single provider creates a clear bootstrap entry point that is easy to locate, debug, and reverse.
---
## Bad Example
```php
// config/app.php
Modules\Billing\Providers\BillingRoutesProvider::class,
Modules\Billing\Providers\BillingEventProvider::class,
Modules\Billing\Providers\BillingBindingProvider::class,
// Three providers for one module — registration scattered
```
---
## Good Example
```php
// config/app.php
Modules\Billing\Providers\BillingServiceProvider::class,
// Single provider: register() handles bindings, boot() handles routes/migrations
```
---
## Exceptions
If using Laravel's automatic event discovery, a secondary EventServiceProvider may be needed. Keep it within the module alongside the main provider. Never exceed 2 providers per module.
---
## Consequences Of Violation
Boot order complexity; registration scattered; unclear module boundaries; extraction requires provider consolidation.

---
## Rule Name
Use explicit registration for small to medium projects
---
## Category
Maintainability
---
## Rule
Default to explicit provider registration in `config/app.php` for teams under 10 engineers and module counts under 20. List each module's provider explicitly.
---
## Reason
Explicit registration is easier to debug, provides clear boot order, and has no hidden dependencies. When boot order matters, explicit ordering is unambiguous.
---
## Bad Example
```php
// Auto-discovery — boot order is implicit and fragile
// "Which module booted first? It depends on filesystem order"
```
---
## Good Example
```php
// config/app.php — explicit, ordered, debuggable
'providers' => [
    Modules\Shared\Providers\SharedServiceProvider::class,
    Modules\Catalog\Providers\CatalogServiceProvider::class,
    Modules\Billing\Providers\BillingServiceProvider::class,
    Modules\Inventory\Providers\InventoryServiceProvider::class,
],
```
---
## Exceptions
Module counts exceeding 20, or modules developed independently by separate teams in a monorepo, may benefit from auto-discovery.
---
## Consequences Of Violation
Debugging boot order issues is harder; new developers may not understand registration; dependency order is not obvious.

---
## Rule Name
Document the registration mechanism
---
## Category
Maintainability
---
## Rule
Document whether the project uses explicit registration or auto-discovery, and what steps are needed when adding a new module. Include this in the project's architecture documentation.
---
## Reason
New developers must know: "When I create a module, what do I need to register?" Without documentation, modules are created without registration, causing 404 routes and missing migrations.
---
## Bad Example
```php
// No documentation about registration
// New developer creates a module but doesn't register it
// "Why are my routes returning 404?"
```
---
## Good Example
```php
// README.md or ADR
// ## Module Registration
// This project uses explicit registration. When adding a new module:
// 1. Create the module service provider
// 2. Add it to config/app.php providers array
// 3. Set priority in module.json for boot order
```
---
## Exceptions
No common exceptions. Registration documentation is essential for onboarding.
---
## Consequences Of Violation
Modules are created but not registered; wasted debugging time; inconsistent module setup procedures across the team.

---
## Rule Name
Define module boot order explicitly
---
## Category
Architecture
---
## Rule
Establish and document the module boot order. Use `module.json` priority field or explicit provider ordering in `config/app.php` to ensure dependent modules boot after their dependencies.
---
## Reason
If Module A's boot() depends on Module B's bindings, but B boots after A, resolution failures occur. Boot order must be predictable and repeatable.
---
## Bad Example
```php
// No boot order defined
// InventoryModule needs CatalogModule's bindings
// Random order: sometimes works, sometimes fails
```
---
## Good Example
```php
// module.json in each module
{
    "name": "catalog",
    "priority": 10,
    "dependencies": ["shared"]
}
{
    "name": "inventory",
    "priority": 20,
    "dependencies": ["catalog"]
}
// Lower priority = boots first
```
---
## Exceptions
When modules have no inter-module boot-time dependencies (pure events-based communication), explicit boot order is less critical but still documented.
---
## Consequences Of Violation
Intermittent resolution failures; environment-dependent boot behavior; hard-to-diagnose bugs.

---
## Rule Name
Avoid duplicate registration
---
## Category
Code Organization
---
## Rule
Never combine explicit registration and auto-discovery for the same module. Every module must be registered through exactly one mechanism.
---
## Reason
Duplicate registration causes the service provider to boot twice, registering routes twice, running migrations twice, attaching event listeners twice. This produces unpredictable behavior.
---
## Bad Example
```php
// Module Billing registered both ways:
// 1. Explicitly in config/app.php
// 2. Auto-discovered by module scanner
// Provider boots twice — routes registered twice (500 error)
```
---
## Good Example
```php
// Choose one mechanism:
// config/app.php 'providers' array (explicit)
// OR module scanner convention (auto-discovery)
// Never both for the same module
```
---
## Exceptions
No common exceptions. Duplicate registration is always a bug.
---
## Consequences Of Violation
Route registration conflicts (500 errors); duplicate event listener execution; migration conflicts; unpredictable behavior.

---
## Rule Name
Use DeferredServiceProvider for binding-only providers
---
## Category
Performance
---
## Rule
Implement `DeferredServiceProvider` (or `Illuminate\Contracts\Support\DeferrableProvider`) when a module's service provider only registers container bindings and has no boot-time logic.
---
## Reason
Deferred providers only load when their bindings are resolved, not on every request. With 20+ modules, deferred providers can save 50-200ms of boot time.
---
## Bad Example
```php
class BillingServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->bind(InvoiceContract::class, InvoiceService::class);
    }
    public function boot(): void
    {
        // Nothing in boot
    }
    // Not deferred — loads on every request even if Billing is not used
}
```
---
## Good Example
```php
class BillingServiceProvider extends ServiceProvider
implements DeferrableProvider
{
    public function register(): void
    {
        $this->app->bind(InvoiceContract::class, InvoiceService::class);
    }
    public function provides(): array
    {
        return [InvoiceContract::class];
    }
    // Only loaded when InvoiceContract::class is resolved
}
```
---
## Exceptions
Do not use deferred providers when the module registers route files or event listeners in boot() — those require eager loading.
---
## Consequences Of Violation
Unnecessary boot time overhead for modules not used on the current request; cumulative 50-200ms+ delay in high-module-count applications.

---
## Rule Name
Deregister dead or orphaned modules
---
## Category
Maintainability
---
## Rule
When a module is no longer active, remove its service provider from registration immediately. Orphan modules waste boot resources and confuse developers.
---
## Reason
Dead modules that remain registered consume boot time, run migrations on every deploy, and confuse developers who assume registered modules are active.
---
## Bad Example
```php
// LegacyAnalytics module hasn't been touched in 2 years
// Still registered in config/app.php
// Still runs migrations on every deploy
// Still loads routes no one uses
```
---
## Good Example
```php
// Remove the provider from config/app.php
// Optionally keep the directory for reference
// Document the deactivation in ADR
```
---
## Exceptions
During active development, a module may be temporarily inactive but not yet ready for removal. Mark as disabled explicitly (e.g., `enabled: false` in module.json).
---
## Consequences Of Violation
Wasted boot time; unnecessary migration execution; developer confusion about module lifecycle.
