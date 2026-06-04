# Controller Organization by Domain

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Organization by Domain
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

As applications grow beyond a handful of resources, flat controller directories become unwieldy. Domain-organized controllers group controllers by bounded context—`Controllers/Billing/`, `Controllers/Inventory/`, `Controllers/Users/`—mirroring the domain model structure. Each directory contains controllers that serve a specific domain, along with domain-specific form requests, resources, and sometimes dedicated middleware.

This pattern aligns controller organization with the business domain rather than technical layers. It excels in large applications (50+ controllers) where developers work on domain-specific teams. The Laravel conventions do not prescribe this structure, but PSR-4 autoloading supports it seamlessly.

---

## Core Concepts

- **Bounded Context Grouping**: Controllers are organized by domain boundary (Billing, Inventory, Notifications), not by technical role (Admin, API, Web).
- **PSR-4 Autoloading**: `App\Http\Controllers\Billing\*` maps to `app/Http/Controllers/Billing/` automatically.
- **Domain-Specific Route Files**: Each domain gets its own route file or route group: `routes/billing.php`, `routes/inventory.php`.
- **Team Ownership Boundaries**: Each domain directory can be owned by a different team with clear code ownership.
- **Scalable Namespacing**: Deep namespacing is acceptable: `App\Http\Controllers\Billing\Subscriptions\PlanController`.

---

## Mental Models

- **Bounded Context Map**: The controller directory structure is a directory-level representation of the DDD bounded context map.
- **Team Boundary**: Each domain directory lines up with a team's area of ownership. The file system enforces the team boundary.
- **Package Seed**: Each domain directory contains the seeds of a future extracted package; separating concerns early simplifies extraction later.

---

## Internal Mechanics

Domain-organized controllers use the same `Controller` base class but live in subdirectories under `app/Http/Controllers/`. The route registration uses the namespace option to point to the domain:

```php
Route::namespace('App\Http\Controllers\Billing')
    ->prefix('billing')
    ->group(base_path('routes/billing.php'));
```

Inside `routes/billing.php`:
```php
Route::apiResource('invoices', InvoiceController::class);
// Resolves to App\Http\Controllers\Billing\InvoiceController
```

The directory structure:
```
app/Http/Controllers/
├── Billing/
│   ├── InvoiceController.php
│   ├── PaymentController.php
│   └── Requests/
│       └── StoreInvoiceRequest.php
├── Inventory/
│   ├── ProductController.php
│   └── StockController.php
└── Users/
    ├── UserController.php
    └── ProfileController.php
```

---

## Patterns

- **Domain-Name Prefix + Namespace**:
  ```php
  Route::prefix('billing')->namespace('Billing')->group(fn () => [
      Route::apiResource('invoices', InvoiceController::class),
      Route::apiResource('payments', PaymentController::class),
  ]);
  ```
- **Domain-Specific Form Request Co-location**:
  ```php
  namespace App\Http\Controllers\Billing\Requests;

  class StoreInvoiceRequest extends FormRequest { ... }
  ```
- **Domain Middleware**:
  ```php
  class BillingController extends Controller
  {
      public function __construct()
      {
          $this->middleware('billing.verified');
      }
  }
  ```

---

## Architectural Decisions

- **Why domain organization over flat?** Flat directories with 100+ controllers make it hard to find the right controller. Domain grouping reduces search scope and enables team ownership.
- **Why not version-first, domain-second?** `Controllers/V1/Billing/...` and `Controllers/V2/Billing/...` is valid but creates redundancy. Version-at-top is better when versions change multiples across all domains simultaneously.
- **Why domain-specific route files?** A single `api.php` with all domain routes becomes a bottleneck. Domain route files can be loaded conditionally, tested independently, and owned by different teams.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear team ownership boundaries | Cross-domain actions require shared namespaces | Extract shared logic to a `Shared/` or `Common/` directory |
| Easy to find controllers by business concept | New developers must learn the domain map | Document the domain structure in a README |
| Simplified extraction to microservices | Over-engineering small apps | Do not introduce domain directories until 20+ controllers |

---

## Performance Considerations

- No performance impact from directory organization. PHP autoloads by class name, not directory.
- Opcode cache stores all classes regardless of directory depth.
- Route file splitting has no runtime cost; route caching compiles everything into a single file.
- The only practical performance consideration is ensuring domain route files are loaded only in the correct context (e.g., not loading `admin.php` for API requests).

---

## Production Considerations

- Use `php artisan make:controller Billing/InvoiceController` to generate controllers in domain subdirectories.
- Add a `composer.json` PSR-4 entry for shared domain code if extracting to a separate package later.
- Establish a naming convention: domain directories are singular (`Billing`, not `Billing` vs `Billings`).
- Configure PHPStan path constraints: `Billing/` controllers cannot depend on `Inventory/` repositories.
- Write a CI script that detects cross-domain violations.

---

## Common Mistakes

- **Flat directory with domain prefixes instead of subdirectories**: `BillingInvoiceController`, `InventoryProductController`.
  - *Why it happens:* Avoiding subdirectories out of habit.
  - *Why it's harmful:* Long class names, flat directory bloat.
  - *Better approach:* Use subdirectories and PSR-4 namespaces.

- **Domain directories too granular**: `Controllers/UserOnboarding/`, `Controllers/UserLogin/`, `Controllers/UserLogout/`.
  - *Why it happens:* Confusing single controllers with domains.
  - *Why it's harmful:* Too many directories, each with 1–2 controllers.
  - *Better approach:* Group by bounded context (e.g., `Users/` contains all user-related controllers).

- **Cross-domain dependency**: `Billing/InvoiceController` imports `Inventory/ProductRepository`.
  - *Why it happens:* Shared logic pulled across domain boundaries.
  - *Why it's harmful:* Tight coupling between domains.
  - *Better approach:* Extract a `Shared/` service or use domain events for cross-domain communication.

---

## Failure Modes

- **Orphaned domain directories after refactoring**: A `Legacy/` domain directory with controllers no longer referenced in any route file. *Detection:* No routes point to controllers in the directory. *Mitigation:* CI check comparing route controller references against existing directories.

- **Namespace collision with Laravel conventions**: `Controllers/Auth/` conflicting with `Auth` facade or base controller. *Detection:* Autoloading errors. *Mitigation:* Use domain-specific names like `Controllers/Authentication/` or `Controllers/Users/Auth/`.

- **Circular dependency between domains**: `Billing/InvoiceController` uses `Users/UserTransformer` which in turn references `Billing/Plan` model. *Detection:* Tight coupling, fragile tests. *Mitigation:* PHPStan rules forbidding cross-domain imports outside `Shared/`.

---

## Ecosystem Usage

- **Laravel Spark (Multi-Tenant)**: Uses domain-organized controllers: `Controllers/Teams/`, `Controllers/Billing/`, `Controllers/Auth/`.
- **Laravel Nova (Plugins)**: Nova's plugin architecture encourages domain-organized controllers within each plugin directory.
- **Monolithic Laravel Apps (e.g., Orchestra)**: Large Laravel applications commonly adopt domain-organized controller structures with 5–15 domain directories.

---

## Related Knowledge Units

### Prerequisites
- Resource Controller Pattern

### Related Topics
- Controller Organization by Version
- Controller Code Limits

### Advanced Follow-up Topics
- Controller Action Delegation
- Thin Controller Enforcement

---

## Research Notes

### Source Analysis
- PSR-4 Autoloading Specification — framework-agnostic namespace mapping
- Laravel route group namespace documentation

### Key Insight
Domain-organized controllers are a project-level convention, not a Laravel feature. The framework supports any directory structure via PSR-4; the team decides the grouping.

### Version-Specific Notes
- Laravel 8+ `php artisan make:controller Billing/InvoiceController` generates controllers in subdirectories.
- No specific Laravel version changes affect domain organization.
