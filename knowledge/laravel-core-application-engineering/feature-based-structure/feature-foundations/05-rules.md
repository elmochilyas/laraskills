## Start With Default Structure, Then Organize By Domain

Feature-based structure must be earned by complexity, never chosen by preference.

---

## Category

Architecture

---

## Rule

Begin every new Laravel project with the default layer-based structure. Migrate to feature-based structure only when the application reaches 10+ models across distinct business domains. Do not adopt feature-based structure for prototypes, MVPs, or projects under 10 models.

---

## Reason

Feature-based structure adds directory overhead and requires customized Artisan stubs. For small projects, layer-based is simpler, faster to navigate, and better supported by Laravel's generators. The overhead is justified only when domain cohesion benefits outweigh the navigation cost of layer-based organization.

---

## Bad Example

Creating `app/Features/Billing/`, `app/Features/Users/`, `app/Features/CMS/` for a 5-model blog application.

---

## Good Example

Using `app/Http/Controllers/`, `app/Models/` for a project with <10 models. Migrating to `app/Features/` only when distinct business domains (e.g., Billing, Users, Inventory) emerge with 10+ models.

---

## Exceptions

Projects that will clearly require multiple bounded contexts from day one (enterprise applications, multi-tenant platforms, SaaS products with distinct modules) may adopt feature-based structure early.

---

## Consequences Of Violation

Premature abstraction overhead. Developers spend time navigating deep directory trees for simple operations. Artisan generators produce files in wrong locations.

---

## Each Feature Is A Bounded Context

A feature must own its models, controllers, services, and routes. No feature directly accesses another feature's internals.

---

## Category

Architecture

---

## Rule

Treat each feature directory as a bounded context with its own persistence, logic, and public API. Internal classes (models, repositories, helpers) must not be imported from outside the feature. Only service classes and events defined in the shared kernel are accessible externally.

---

## Reason

Bounded contexts prevent tight coupling and enable independent refactoring. If Feature B directly accesses Feature A's model, Feature A cannot change its model structure without breaking Feature B. The service layer is the public API; models are private.

---

## Bad Example

```php
use App\Features\Billing\Models\Invoice;

class ReportGenerator
{
    public function generate(): array
    {
        return Invoice::where('status', 'paid')->pluck('amount')->toArray();
    }
}
```

---

## Good Example

```php
use App\Kernel\Contracts\InvoiceProvider;

class ReportGenerator
{
    public function __construct(private InvoiceProvider $invoices) {}

    public function generate(): array
    {
        return $this->invoices->getPaidAmounts();
    }
}
```

---

## Exceptions

Models in `app/Models/` (`User`, `Setting`) are intentionally shared and may be imported from any feature.

---

## Consequences Of Violation

Tight coupling destroys the primary benefit of feature-based structure. Features cannot be extracted into packages. Refactoring one feature requires changing code across the entire application.

---

## Use A Shared Directory For Cross-Cutting Code

Place helpers, base classes, and truly shared models in an `app/Shared/` directory, not inside any feature.

---

## Category

Code Organization

---

## Rule

Maintain an `app/Shared/` directory (or `app/Kernel/`) for code that is consumed by multiple features. This includes base controllers, base models, custom casts, helpers, global middleware, and truly shared Eloquent models.

---

## Reason

Without a shared directory, cross-cutting code either duplicates across features (violating DRY) or gets placed arbitrarily in one feature, creating an implicit dependency on that feature from all others.

---

## Bad Example

```php
// Base controller duplicated in every feature
// Or placed arbitrarily in Billing feature, forcing all features to depend on Billing
```

---

## Good Example

```
app/
  Shared/
    Controllers/BaseController.php
    Models/User.php
    Helpers/money.php
    Exceptions/ApplicationException.php
  Features/
    Billing/
    Users/
    CMS/
```

---

## Exceptions

Very small applications (3-5 features) may place shared code in `app/` directly. The shared directory becomes more important as the number of features grows.

---

## Consequences Of Violation

Code duplication across features. Implicit dependencies where one feature is treated as a shared library. Confusion about where new cross-cutting code belongs.

---

## Maintain Feature Granularity At 3-20 Files

Create features for business domains, not for every concept. Split features that exceed 20 files.

---

## Category

Maintainability

---

## Rule

A feature directory should contain at least 3 files (to justify the overhead) and at most ~20 files (before it should be split into sub-features). A feature represents a business domain, not a technical concept or a single model.

---

## Reason

Features with 1-2 files create directory overhead without benefit. Features with 50+ files collapse into the same cohesion problem as layer-based structure. A feature should be large enough to have internal structure but small enough to be understood at a glance.

---

## Bad Example

```php
// Too small — single file feature
app/Features/PasswordReset/ResetController.php

// Too large — 50+ files in one feature
app/Features/Billing/ (with 50 files mixed together)
```

---

## Good Example

```php
app/Features/Billing/
  Controllers/
  Models/
  Services/
  Requests/
  routes.php
  // ~15 files total — appropriate size
```

---

## Exceptions

Features that are inherently simple (e.g., a "Health Check" feature with 2 files) are acceptable if they represent a genuine business domain boundary.

---

## Consequences Of Violation

Directory overhead without benefit for too-small features. Navigation difficulty and cohesion collapse for too-large features.

---

## Avoid Circular Dependencies Between Features

Features must never depend on each other in a cycle.

---

## Category

Architecture

---

## Rule

Ensure the feature dependency graph is a DAG (directed acyclic graph). Feature A may depend on Feature B, but Feature B must not depend on Feature A. Detect and fix cycles immediately.

---

## Reason

Circular dependencies make features untestable in isolation, prevent feature extraction, and create tight coupling that resists refactoring. A cycle between two features means neither can be understood without the other.

---

## Bad Example

```php
// BillingService calls CmsService
// CmsService calls BillingService
// Circular dependency — cannot refactor either independently
```

---

## Good Example

```php
// BillingService depends on UserProvider (from shared kernel)
// UserProvider is an interface in Kernel/Contracts/
// No circular dependency
```

---

## Exceptions

No exceptions. Circular dependencies must be resolved by extracting the shared concern into the shared kernel or restructuring the features.

---

## Consequences Of Violation

Cannot run tests in isolation. Feature extraction becomes impossible. Application boot may fail if providers are in a cycle.

---

## Document Feature Boundary Criteria

The team must have a documented, agreed-upon definition of what constitutes a feature and where boundaries lie.

---

## Category

Maintainability

---

## Rule

Create and maintain a project document (in the project README or an ADR) defining the criteria for feature boundaries, naming conventions, directory structure, and communication rules. Update it when the team identifies boundary ambiguities.

---

## Reason

Without documented criteria, different developers make inconsistent decisions about where to draw feature boundaries. One developer splits by technical domain, another by business process. Inconsistency accumulates into structural debt.

---

## Bad Example

No documentation exists. Developer A creates `app/Features/Payments/`. Developer B creates `app/Features/PaymentGateway/` for the same domain. Two features overlap.

---

## Good Example

```
# Feature Boundary Criteria (FEATURES.md)

A feature represents a business domain that:
1. Has its own models (at least 1, typically 2-5)
2. Has its own controllers or commands
3. Can be described in one sentence of business value
4. Changes independently of other features (ideally)

Naming: Singular noun (Billing, User, Invoice, Subscription)
```

---

## Exceptions

Very small teams (1-2 developers) may not need formal documentation if they share a consistent mental model.

---

## Consequences Of Violation

Inconsistent feature boundaries. Overlapping and ambiguous feature responsibilities. Difficulty determining where new code belongs.

---

## Use Service Provider Per Feature For Component Registration

Each feature must have its own service provider that registers routes, migrations, and views.

---

## Category

Code Organization

---

## Rule

Create a `Providers/{Feature}ServiceProvider.php` inside each feature. Use `loadRoutesFrom()`, `loadViewsFrom()`, and `loadMigrationsFrom()` in the provider's `boot()` method. Register the provider in `config/app.php`.

---

## Reason

The service provider is the feature's manifest — it declares what the feature contributes to the application. This makes features self-contained: enabling/disabling a feature means adding/removing its provider. The provider also documents the feature's components.

---

## Bad Example

```php
// All routes in routes/web.php
// All views in resources/views/
// All migrations in database/migrations/
// No per-feature registration
```

---

## Good Example

```php
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
        $this->loadViewsFrom(__DIR__.'/../views', 'billing');
        $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
    }
}
```

---

## Exceptions

Features that consist only of service classes (no routes, views, or migrations) do not need a service provider. They can be registered as simple namespace-based classes discovered by autoloading.

---

## Consequences Of Violation

Routes scattered across global route files. Views and migrations disconnected from their feature. Feature extraction requires hunting down all registration points.

---

## Do Not Mix Feature And Layer Structure

Choose one organizational approach and use it consistently across the entire application.

---

## Category

Maintainability

---

## Rule

If using feature-based structure, all controllers, models, requests, and services must live inside feature directories. Do not leave some controllers in `app/Http/Controllers/` while others are in `app/Features/`. Commit fully or not at all.

---

## Reason

Mixed structure creates ambiguity about where to put new code. Developers waste time deciding and checking. New team members cannot predict the convention. The inconsistency erodes trust in the architecture.

---

## Bad Example

```php
// Half the controllers are in Features/
app/Features/Billing/Controllers/InvoiceController.php

// Half are still in Http/
app/Http/Controllers/AuthController.php
```

---

## Good Example

```php
// All controllers in feature directories
app/Features/Billing/Controllers/InvoiceController.php
app/Features/Users/Controllers/AuthController.php
```

---

## Exceptions

Middleware, service providers, and truly global models (e.g., `User`) may remain in their default locations, as they are cross-cutting by nature.

---

## Consequences Of Violation

Confusion about conventions. New code placed inconsistently. Architectural drift as the project grows.

---

## Customize Artisan Stubs For Feature Namespaces

Publish and modify Artisan stubs so generators create files in the correct feature namespace.

---

## Category

Maintainability

---

## Rule

Run `php artisan stub:publish` and modify the stubs to support feature-based namespaces. Update `make:model` and `make:controller` to generate files under `app/Features/{Feature}/` instead of `app/Models/` and `app/Http/Controllers/`.

---

## Reason

Laravel's default generators create files in layer-based namespaces. Without custom stubs, developers must manually move files and update namespaces after every generator command. This friction causes incomplete moves and namespace errors.

---

## Bad Example

```bash
# Default generates model in wrong location
php artisan make:model "Features/Billing/Models/Invoice" -m
# File lands in app/Features/Billing/Models/Invoice.php but
# namespace paths must be typed manually each time
```

---

## Good Example

```bash
# Custom stubs configured for feature structure
php artisan make:feature Billing
php artisan make:model Billing/Invoice
# Generated in correct namespace automatically
```

---

## Exceptions

Projects that use the `nwidart/laravel-modules` package or similar tooling that provides its own generators may skip stub customization.

---

## Consequences Of Violation

Developer friction every time a new model or controller is created. Manual namespace fixes are error-prone and frequently missed.
