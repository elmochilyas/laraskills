# Rules

## Rule 1: Create One Provider per Domain Bounded Context
---
## Category
Architecture
---
## Rule
Align provider boundaries with domain bounded contexts — one provider per distinct domain capability (Payments, Notifications, Inventory, etc.).
---
## Reason
Domain-aligned providers make the bootstrap sequence readable as an architecture map. Providers become discoverable by business capability rather than technical layer, and each provider can be independently maintained, tested, or extracted into a microservice.
---
## Bad Example
```php
// Technical-layer providers — no domain visibility
return [
    App\Providers\RepositoriesServiceProvider::class,
    App\Providers\ControllersServiceProvider::class,
    App\Providers\ModelsServiceProvider::class,
];
```
---
## Good Example
```php
// Domain-aligned providers — clear business capabilities
return [
    App\Providers\AppServiceProvider::class,
    App\Providers\Payments\PaymentsServiceProvider::class,
    App\Providers\Notifications\NotificationServiceProvider::class,
    App\Providers\Inventory\InventoryServiceProvider::class,
    App\Providers\Analytics\AnalyticsServiceProvider::class,
];
```
---
## Exceptions
Small applications (<5 providers) do not benefit from domain organization — flat provider structure is adequate.
---
## Consequences Of Violation
Provider list becomes opaque; new developers cannot understand application capabilities from providers; domain concerns are spread across technical-layer providers; extraction of domains into services is more difficult.

## Rule 2: Keep Provider Count Between 10 and 30 for Medium-to-Large Applications
---
## Category
Maintainability
---
## Rule
Maintain 10-30 service providers in a medium-to-large Laravel application. Above 50, consolidate related providers; below 10, evaluate if providers are too granular.
---
## Reason
Provider count is a health metric. Below 10 suggests a god provider registering everything; above 50 indicates fragmentation that adds unnecessary iteration overhead and makes the bootstrap sequence hard to reason about.
---
## Bad Example
```php
// 70+ providers — extreme fragmentation
return [
    // ... 70 tiny providers, one per service
];
```
---
## Good Example
```php
// ~20 providers — balanced, domain-aligned
return [
    App\Providers\AppServiceProvider::class,
    // 5 domain providers
    // 5 infrastructure providers
    // 3 third-party package providers (non-discovered)
    // etc.
];
```
---
## Exceptions
Octane deployments can tolerate higher provider counts since overhead is paid once per worker boot. However, organization for maintainability still applies.
---
## Consequences Of Violation
Below 10: god provider that is untestable and hard to reason about. Above 50: excessive iteration overhead (50+ × register + boot); provider list too long to scan; difficulty locating specific registrations.

## Rule 3: Never Register Providers Dynamically from Database or Cache at Runtime
---
## Category
Reliability
---
## Rule
Keep provider registration static in `bootstrap/providers.php` — do not load providers from database rows, remote config, or runtime-generated sources.
---
## Reason
Static provider registration ensures deterministic, predictable bootstrap behavior. Dynamic registration introduces non-determinism — different requests may see different providers depending on database state, cache freshness, or timing.
---
## Bad Example
```php
public function register(): void
{
    $providers = DB::table('enabled_providers')->get(); // Dynamic!
    foreach ($providers as $p) {
        $this->app->register($p->class_name);
    }
}
```
---
## Good Example
```php
// bootstrap/providers.php — fully static
return [
    App\Providers\Payments\PaymentsServiceProvider::class,
    App\Providers\Analytics\AnalyticsServiceProvider::class,
];
```
---
## Exceptions
Tenant-specific provider loading in multi-tenant applications may use dynamic registration with explicit caching — but this should be minimal and well-documented.
---
## Consequences Of Violation
Non-deterministic bootstrap; impossible to reproduce production issues locally; cache invalidation causing provider to appear/disappear mid-request; broken security audits (unclear what runs during boot).

## Rule 4: Use `bootstrap/providers.php` as an Architecture Map
---
## Category
Code Organization
---
## Rule
Structure `bootstrap/providers.php` so that reading it from top to bottom reveals the application's architectural capabilities and their ordering constraints.
---
## Reason
The provider list is the first thing a developer (or AI agent) reads to understand application architecture. A well-organized list tells a story about the system's capabilities, dependencies, and boundaries.
---
## Bad Example
```php
return [
    App\Providers\HelperServiceProvider::class,      // Generic — what helpers?
    App\Providers\SomePackageProvider::class,        // Random package
    App\Providers\AppServiceProvider::class,         // God provider
    App\Providers\ZebraServiceProvider::class,       // No ordering logic
];
```
---
## Good Example
```php
return [
    // Infrastructure layer — registered first
    App\Providers\AppServiceProvider::class,
    App\Providers\EventServiceProvider::class,

    // Domain layer — registered in dependency order
    App\Providers\Payments\PaymentsServiceProvider::class,
    App\Providers\Notifications\NotificationServiceProvider::class,
    App\Providers\Inventory\InventoryServiceProvider::class,
    App\Providers\Analytics\AnalyticsServiceProvider::class,

    // Third-party (excluded from discovery, ordered explicitly)
    App\Providers\ThirdParty\AuditServiceProvider::class,
];
```
---
## Exceptions
Small applications (<5 providers) do not need this level of structure — but the principle of readability still applies.
---
## Consequences Of Violation
New developers cannot understand the system's architecture from the provider list; onboarding time increases; domain boundaries are unclear; ordering issues go unnoticed.

## Rule 5: Name Providers by Domain, Never Generic Names Like `ServiceProvider`
---
## Category
Code Organization
---
## Rule
Name provider classes to reflect their domain responsibility (e.g., `PaymentsServiceProvider`, `InvoiceServiceProvider`), never generic names.
---
## Reason
Generic names require reading the code to understand what the provider does. Domain-reflective names make the purpose immediately clear from the class name and from `bootstrap/providers.php`.
---
## Bad Example
```php
class AdminServiceProvider {} // Too generic — admin payments? admin users? admin settings?
class CoreServiceProvider {}   // What is "core"?
class ServiceProvider {}       // Ambiguous and conflicts with base class
```
---
## Good Example
```php
class AdminPaymentProvider {}     // Clear: payment-related admin concerns
class AdminUserProvider {}        // Clear: user-related admin concerns
class UserNotificationProvider {} // Clear: user notification services
```
---
## Exceptions
No common exceptions. Provider class names should always communicate domain scope.
---
## Consequences Of Violation
Confusion about provider responsibility; providers with similar names causing ambiguity; difficulty locating the right provider for a given concern; code review friction.
