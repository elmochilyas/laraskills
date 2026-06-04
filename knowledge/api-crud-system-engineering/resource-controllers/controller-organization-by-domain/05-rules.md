## Group Controllers By Bounded Context
---
## Category
Code Organization
---
## Rule
Always organize controllers into directories by bounded context (e.g., Controllers/Billing/, Controllers/Inventory/); never keep a flat Controllers/ directory for projects with 20+ controllers.
---
## Reason
Flat directories become unmanageable as controllers grow. Domain organization aligns with DDD principles, team ownership boundaries, and future extraction to microservices.
---
## Bad Example
`
app/Http/Controllers/
  BillingInvoiceController.php
  BillingPaymentController.php
  BillingSubscriptionController.php
  InventoryProductController.php
  InventoryCategoryController.php
`
---
## Good Example
`
app/Http/Controllers/
  Billing/
    InvoiceController.php
    PaymentController.php
    SubscriptionController.php
  Inventory/
    ProductController.php
    CategoryController.php
`
---
## Exceptions
Projects with fewer than 10 controllers benefit from flat simplicity. Introduce domain organization when maintainability warrants it.
---
## Consequences Of Violation
Hard-to-navigate controller directory; long class names with domain prefixes; no clear ownership boundaries; difficult to extract domains as microservices.

## Co-Locate Form Requests With Domain Controllers
---
## Category
Code Organization
---
## Rule
Always place form requests in a Requests/ subdirectory within the domain controller directory; never place all form requests in a single flat directory.
---
## Reason
Domain-scoped form requests stay close to their controllers, making validation rules visible within the domain boundary and preventing naming conflicts across domains.
---
## Bad Example
`
app/Http/Requests/
  StoreInvoiceRequest.php
  UpdateInvoiceRequest.php
  StorePhotoRequest.php
  UpdatePhotoRequest.php
`
---
## Good Example
`
app/Http/Controllers/Billing/Requests/
  StoreInvoiceRequest.php
  UpdateInvoiceRequest.php
app/Http/Controllers/Photos/Requests/
  StorePhotoRequest.php
  UpdatePhotoRequest.php
`
---
## Exceptions
Cross-domain shared form requests belong in pp/Http/Requests/Shared/.
---
## Consequences Of Violation
Naming collisions between domains; form requests disconnected from their controllers; no boundary enforcement; difficult to extract domain as a package.

## Enforce Cross-Domain Dependency Rules
---
## Category
Maintainability
---
## Rule
Always enforce cross-domain import restrictions using PHPStan or Deptrac; never allow controllers in one domain to import classes from another domain.
---
## Reason
Cross-domain imports create tight coupling between bounded contexts, defeating the purpose of domain organization and making domain extraction impossible.
---
## Bad Example
`php
// Controllers/Inventory/ProductController.php
use App\Http\Controllers\Billing\InvoiceController; // Cross-domain import
`
---
## Good Example
`php
// Deptrac rule enforcing no cross-domain imports
// layers:
//   - name: Billing
//     collectors: [{type: directory, regex: app/Http/Controllers/Billing/.*}]
//   - name: Inventory
//     collectors: [{type: directory, regex: app/Http/Controllers/Inventory/.*}]
`
---
## Exceptions
Shared base controller classes, traits, or utility classes in Controllers/Shared/ may be imported by multiple domains.
---
## Consequences Of Violation
Tight coupling between domains; domain extraction requires untangling imports; ownership boundaries blurred; unintended side effects across domains.

## Use Domain-Specific Route Files
---
## Category
Code Organization
---
## Rule
Always create per-domain route files (e.g., outes/billing.php, outes/inventory.php); never define all domain routes in a single pi.php.
---
## Reason
Per-domain route files keep route declarations close to their domain, enable independent testing, and prevent the route file from becoming a bottleneck that every team touches.
---
## Bad Example
`php
// routes/api.php — 500+ lines covering all domains
Route::apiResource('billing/invoices', Billing\InvoiceController::class);
Route::apiResource('inventory/products', Inventory\ProductController::class);
// ... 40 more resource routes
`
---
## Good Example
`php
// routes/api.php — delegates to domain files
Route::prefix('billing')->group(base_path('routes/billing.php'));
Route::prefix('inventory')->group(base_path('routes/inventory.php'));
`
---
## Exceptions
Small projects with fewer than 20 routes benefit from a single route file.
---
## Consequences Of Violation
Merge conflicts on the single route file; one team blocked waiting for another; routes hidden in a monolithic file.

## Use Singular Directory Names
---
## Category
Maintainability
---
## Rule
Always use singular nouns for domain directory names (Billing, User, Inventory); never use plural (Billings, Users).
---
## Reason
Singular naming matches Laravel's own conventions (e.g., pp/Http/Controllers) and eliminates ambiguity between singular and plural variants.
---
## Bad Example
`
app/Http/Controllers/Users/SettingsController.php
app/Http/Controllers/Payments/InvoiceController.php
`
---
## Good Example
`
app/Http/Controllers/User/SettingsController.php
app/Http/Controllers/Payment/InvoiceController.php
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Inconsistent naming within the codebase; confusion about which variant is correct; reduced discoverability.
