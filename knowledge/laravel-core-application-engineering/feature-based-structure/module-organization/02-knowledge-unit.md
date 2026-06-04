# Module Organization Within Features

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Module Organization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Module organization defines the internal directory structure of each feature. A well-organized module has consistent subdirectories (Controllers, Models, Services, Requests) and clear conventions for what goes where. It balances framework conventions (Laravel's expected structure) with domain cohesion (keeping related code together).

The engineering value is predictable navigation: every feature has the same structure, so any developer can immediately find the relevant file. This reduces cognitive load as the number of features grows.

---

## Core Concepts

### Standard Feature Directory Layout

```
Features/{FeatureName}/
  ├── Controllers/        # HTTP controllers
  ├── Models/             # Eloquent models
  ├── Requests/           # Form requests
  ├── Resources/          # API resources
  ├── Services/           # Business logic
  ├── Actions/            # Single-action classes
  ├── DTOs/               # Data transfer objects
  ├── Events/             # Domain events
  ├── Listeners/          # Event listeners
  ├── Jobs/               # Queued jobs
  ├── Notifications/      # Mail/notifications
  ├── Policies/           # Authorization policies
  ├── Rules/              # Validation rules
  ├── Exceptions/         # Feature-specific exceptions
  ├── Providers/          # Service providers
  ├── routes.php          # Feature routes
  ├── helpers.php         # Feature-specific helpers (optional)
  └── config.php          # Feature-specific config (optional)
```

### Minimal Feature for Simple Cases

```
Features/Contacts/
  ├── Controllers/
  │   └── ContactController.php
  ├── Models/
  │   └── Contact.php
  ├── Requests/
  │   └── StoreContactRequest.php
  └── routes.php
```

---

## Mental Models

### The Nested Application

Each feature is a miniature Laravel application with its own controllers, models, and routes. The top-level `app/` directory is the application shell; each feature is a self-contained module within it.

### The Inbox Principle

New code goes in ONE place. When adding a feature, you create ONE directory and put everything in it. There is no ambiguity about where `BillingController` lives — it's in `Features/Billing/Controllers/`. The structure is the documentation.

---

## Internal Mechanics

### Controller Resolution

Controllers inside features resolve the same way as top-level controllers — Laravel's routing uses the fully qualified class name:

```php
// routes.php within the feature
Route::get('/invoices', App\Features\Billing\Controllers\InvoiceController::class);
```

Or import the namespace:

```php
use App\Features\Billing\Controllers\InvoiceController;

Route::get('/invoices', [InvoiceController::class, 'index']);
```

### Model Discovery

Models inside features work identically to top-level models:

```php
namespace App\Features\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';
}
```

Artisan commands need the full namespace:

```bash
php artisan make:model "Features/Billing/Models/Invoice" -m
```

### View Namespacing

Feature views can use double-colon namespace syntax:

```php
class InvoiceController extends Controller
{
    public function index()
    {
        return view('billing::invoices.index');
    }
}
```

```php
// BillingServiceProvider
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../views', 'billing');
}
```

---

## Patterns

### Co-located Factories

Place model factories within the feature:

```
Features/Billing/
  ├── Models/
  │   └── Invoice.php
  └── Database/
      └── Factories/
          └── InvoiceFactory.php
```

### Co-located Migrations

```
Features/Billing/
  └── Database/
      └── Migrations/
          └── 2024_01_01_000001_create_invoices_table.php
```

```php
// BillingServiceProvider
public function boot(): void
{
    $this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
}
```

### Co-located Tests

```
tests/
  Features/
    Billing/
      InvoiceTest.php
      SubscriptionTest.php
```

Or inline within the feature:

```
Features/Billing/
  └── Tests/
      └── InvoiceTest.php
```

The latter requires PSR-4 autoloading for tests in `composer.json`:

```json
{
    "autoload-dev": {
        "psr-4": {
            "Tests\\": "tests/"
        }
    }
}
```

---

## Architectural Decisions

### Required vs Optional Subdirectories

| Subdirectory | Always needed? | Default when omitted |
|---|---|---|
| Controllers | Yes (most features have HTTP endpoints) | Routes can point to invokable classes |
| Models | Yes (most features persist data) | Data may come from external API |
| Requests | For features with POST/PUT endpoints | Form request validation in controller |
| Services | For features with complex business logic | Logic in controllers or actions |
| Events | For features with side effects | Side effects in services |
| Providers | Yes (at least one per feature) | Routes/migrations loaded manually |

---

## Tradeoffs

| Concern | Standard Subdirectories | Custom Structure |
|---|---|---|
| Predictability | High (every feature looks the same) | Low (each feature invents its own layout) |
| Developer onboarding | Fast (one convention to learn) | Slow (learn per-feature layout) |
| Flexibility | Lower (some subdirectories may be empty) | High (structure matches the domain) |
| Tooling | Easy (consistent patterns for generators) | Hard (custom generators needed) |

---

## Production Considerations

- Enforce the directory structure with a linter or CI check
- Use a `README.md` per feature for domain-specific conventions
- Keep subdirectory names consistent across features (case-sensitive: `Controllers/`, not `controllers/`)
- Consider a `Shared/` directory for cross-cutting concerns (base controllers, traits, helpers)
- Document the decision for each optional subdirectory that you add (why `Policies/` is needed)
- Use a feature template or `php artisan make:feature` custom command to scaffold new features

---

## Common Mistakes

### Nested Subdirectories Too Deep

```
Features/Billing/Services/Payment/Processors/StripeProcessor.php
```

Three levels of nesting is a smell. Flatten to `Features/Billing/Services/` or extract into a sub-feature.

### Empty Subdirectories

Every feature having `Events/`, `Listeners/`, `Jobs/`, `Notifications/` even when empty creates noise. Only create directories when the feature actually needs them.

### Inconsistent Naming

```
Billing: Controllers/
Users: controllers/  # lowercase
Teams: Controllers/  # but what about USERS?
```

Case sensitivity matters on Linux. Enforce a single convention with CI.

---

## Failure Modes

### Feature Directory Becomes a Dumping Ground

Without clear guidelines, every new file goes in the root of the feature directory. After 6 months, `Features/Billing/` has 40 files with no structure. Solution: enforce subdirectory rules and review during PRs.

### Duplicate Cross-Feature Files

Two features define the same type of class (e.g., `PaymentService` in both `Billing` and `Subscriptions`). This is a sign of poor feature boundary extraction. Consolidate into a shared service.

---

## Performance Considerations

Module organization has no direct runtime performance impact — PHP resolves classes by fully qualified name regardless of directory depth. Composer's optimized autoloader (`composer dump-autoload -o`) generates a classmap that eliminates filesystem overhead. View namespacing adds negligible overhead for route resolution. The primary performance consideration is developer navigation time, not application execution speed.

---

## Ecosystem Usage

Laravel's PSR-4 autoloading automatically resolves feature-namespaced classes under `App\`. The `ServiceProvider` class provides `loadRoutesFrom()`, `loadViewsFrom()`, and `loadMigrationsFrom()` for per-feature registration. View namespacing (`billing::invoices.index`) requires loading views from the feature directory. Artisan's `make:model` command supports nested directory paths for feature models.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — when and why to use feature-based structure
- **Feature vs Layer** (this workspace) — comparing organizational approaches
- **Feature Service Providers** (this workspace) — how features register with the app
- **DTOs** (this workspace) — data transfer objects within features
- **Actions Pattern** (this workspace) — action classes as feature internals

---

## Research Notes

- Laravel's default directory structure is layer-based — feature structure is a deliberate deviation
- The subdirectory names follow Laravel's own conventions (Controllers/, Models/, etc.)
- Feature-level `routes.php` is loaded via the service provider's `boot()` method
- View namespacing (`billing::invoices.index`) requires loading views from the feature directory
- Migrations can be loaded from feature directories since Laravel 8+
- Factories placed in `database/factories/` (global) or feature's `Database/Factories/`
- Tests can be co-located or in `tests/` — co-location is more cohesive but requires additional autoloading config
