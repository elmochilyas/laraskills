# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module autonomy: routes, migrations, config, tests per module
Knowledge Unit ID: MMD-05
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---
## Rule Name
Always load routes from the module, never from a central route file
---
## Category
Code Organization
---
## Rule
Define all module routes in the module's own route directory and load them via the module's service provider using `loadRoutesFrom()`. The application-level `routes/` directory should contain only application-wide routes (health check, webhook handlers) or remain empty.
---
## Reason
Routes are part of the module's responsibility and must move with the module during extraction. Central route files break module extraction readiness and create ownership ambiguity.
---
## Bad Example
```php
// Central routes/api.php
Route::prefix('billing')->group(function () {
    Route::get('/invoices', [BillingController::class, 'index']);
});
// Route belongs in the module but lives at application level
```
---
## Good Example
```php
// Modules/Billing/Providers/BillingServiceProvider.php
public function boot(): void
{
    $this->loadRoutesFrom(__DIR__ . '/../routes/api.php');
}

// Modules/Billing/routes/api.php
Route::prefix('billing')->group(function () {
    Route::get('/invoices', [BillingController::class, 'index']);
});
```
---
## Exceptions
Globally scoped routes (health checks, monitoring endpoints) that have no module owner may stay in central routes files.
---
## Consequences Of Violation
Extraction requires route file splitting; unclear ownership of route definitions; module extraction breaks route paths.

---
## Rule Name
Always load migrations from the module directory
---
## Category
Code Organization
---
## Rule
Place all module migrations in the module's `database/migrations/` directory and load them via the service provider using `loadMigrationsFrom()`. The application-level `database/migrations/` directory belongs to the application bootstrap, not module schema.
---
## Reason
Migrations define the module's database schema — they must move with the module during extraction. Central migrations create schema ownership ambiguity.
---
## Bad Example
```php
// database/migrations/2024_01_01_000001_create_billing_invoices_table.php
// Migration is at application level, not in the module
// Extraction requires finding and moving all module migrations
```
---
## Good Example
```php
// Modules/Billing/Providers/BillingServiceProvider.php
public function boot(): void
{
    $this->loadMigrationsFrom(__DIR__ . '/../database/migrations');
}

// Modules/Billing/database/migrations/2024_01_01_000001_create_billing_invoices_table.php
```
---
## Exceptions
Application-level migrations (shared pivot tables, application settings) that have no module owner may stay in central directory. Every domain-owned table must use module migrations.
---
## Consequences Of Violation
Extraction requires finding and manually moving migration files; schema ownership is unclear; migration naming collisions across modules.

---
## Rule Name
Namespace module config keys to prevent collisions
---
## Category
Code Organization
---
## Rule
Use namespaced config keys prefixed with the module name (`config('billing.invoice_prefix')`), never bare keys (`config('invoice_prefix')`).
---
## Reason
Two modules using `config('prefix')` would conflict. Namespacing prevents collision, makes config ownership clear, and follows Laravel package conventions.
---
## Bad Example
```php
// Modules/Billing/config/config.php
return ['prefix' => 'INV-'];
// Modules/Catalog/config/config.php
return ['prefix' => 'CAT-'];

// Modules/Billing/Service.php
config('prefix'); // Ambiguous — returns either value depending on merge order
```
---
## Good Example
```php
// Modules/Billing/config/config.php
return ['billing' => ['prefix' => 'INV-']];
// Modules/Catalog/config/config.php
return ['catalog' => ['prefix' => 'CAT-']];

// Modules/Billing/Service.php
config('billing.prefix'); // Unambiguous
```
---
## Exceptions
No common exceptions. Config namespacing is always required.
---
## Consequences Of Violation
Config key collisions produce silent bugs; wrong configuration values used; merge order dependency issues.

---
## Rule Name
Colocate module tests in the module directory
---
## Category
Testing
---
## Rule
Place all module tests inside `Modules/{ModuleName}/tests/`. Ensure they can run independently of other module tests.
---
## Reason
Colocated, independently runnable tests enable parallel CI execution per module and simplify extraction — the entire `tests/` directory moves with the module.
---
## Bad Example
```php
// All tests at application level
tests/Feature/Billing/InvoiceTest.php
tests/Unit/Catalog/ProductTest.php
// Cannot run Billing tests independently — mixed with other tests
```
---
## Good Example
```php
// Tests colocated in module
Modules/Billing/tests/Feature/InvoiceTest.php
Modules/Catalog/tests/Unit/ProductTest.php

// Run independently:
// vendor/bin/phpunit Modules/Billing/tests
```
---
## Exceptions
Cross-module integration tests (testing contracts between A and B) may live at application level but should be minimal.
---
## Consequences Of Violation
Cannot run module tests independently; parallel CI requires complex test splitting; extraction requires test file separation.

---
## Rule Name
Use date-prefixed migration names with module prefix
---
## Category
Code Organization
---
## Rule
Prefix migration filenames with a date and the module abbreviation (`2024_01_01_000001_billing_create_invoices_table.php`) to prevent cross-module migration name collisions.
---
## Reason
Two modules could accidentally create migrations with identical timestamps, causing Laravel to skip the second one or create an ambiguous migration state.
---
## Bad Example
```php
// Both modules have the same migration name
Modules/Billing/database/migrations/2024_01_01_000001_create_invoices_table.php
Modules/Inventory/database/migrations/2024_01_01_000001_create_invoices_table.php
// Conflicting names — migration system skips one
```
---
## Good Example
```php
// Unique names via module prefix
Modules/Billing/database/migrations/2024_01_01_000001_billing_create_invoices_table.php
Modules/Inventory/database/migrations/2024_01_01_000001_inventory_create_invoices_table.php
// No collision — each migration is unique
```
---
## Exceptions
No common exceptions. Migration naming collisions are a silent deployment blocker.
---
## Consequences Of Violation
Migrations silently skipped; deployment failures; inconsistent database states across environments.

---
## Rule Name
Load module translations and views from the module directory
---
## Category
Code Organization
---
## Rule
Load module views and translations via the service provider using `loadViewsFrom()` and `loadTranslationsFrom()`, referencing the module's own directories.
---
## Reason
Views and translations belong to the module and must move with it during extraction. Centralized view/translation directories break module autonomy.
---
## Bad Example
```php
// resources/views/billing/invoice.blade.php
// resources/lang/en/billing.php
// Views/translations at application level, not in module
```
---
## Good Example
```php
// Modules/Billing/Providers/BillingServiceProvider.php
public function boot(): void
{
    $this->loadViewsFrom(__DIR__ . '/../resources/views', 'billing');
    $this->loadTranslationsFrom(__DIR__ . '/../resources/lang', 'billing');
}

// Modules/Billing/resources/views/invoice.blade.php
// Modules/Billing/resources/lang/en/messages.php
```
---
## Exceptions
Application-level layout views (shared shell, master layout) owned by no single module may stay in central resources.
---
## Consequences Of Violation
Extraction requires separating view files; module views can't be versioned with module code; namespace collisions.

---
## Rule Name
Document migration ordering strategy
---
## Category
Maintainability
---
## Rule
Establish and document how migration order is determined when loading from multiple module directories: alphabetical, dependency-based, or priority-based.
---
## Reason
When Module B's migration references Module A's table, Module A's migration must run first. Without an explicit ordering strategy, migrations fail on deploy.
---
## Bad Example
```php
// No documented ordering strategy
// Module B's migration: references billing_invoices table
// Module B loads before Module A — migration fails with table not found
```
---
## Good Example
```php
// Documented strategy: priority-based via module.json
// Billing: priority 10 (runs first)
// Inventory: priority 20 (runs after Billing)
// Migration: 2024_01_01_000001_billing_create_invoices_table.php runs first
// Migration: 2024_01_01_000001_inventory_create_invoice_items.php runs second
// Documented in ADR-009: Migration Ordering
```
---
## Exceptions
No common exceptions. Migration ordering strategy is required when loading from multiple directories.
---
## Consequences Of Violation
Deploy failures due to missing tables; emergency fixes required; deployment confidence erodes.
