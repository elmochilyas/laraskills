## Maintain Consistent Feature Directory Structure

Every feature must follow the same subdirectory naming convention and organization pattern.

---

## Category

Code Organization

---

## Rule

All features must use identical subdirectory names: `Controllers/`, `Models/`, `Services/`, `Requests/`, `Providers/`, etc. Do not use `controllers/`, `CONTROLLERS/`, or `http/` in one feature while using `Controllers/` in another. Enforce this with CI.

---

## Reason

Consistent directory structure makes every feature predictable. A developer who knows the Billing feature knows the Users feature. Case-sensitivity issues on Linux cause autoloading failures. CI enforcement prevents drift.

---

## Bad Example

```php
// Feature A — PascalCase
app/Features/Billing/Controllers/
app/Features/Billing/Models/

// Feature B — lowercase
app/Features/CMS/controllers/
app/Features/CMS/models/
```

---

## Good Example

```php
// All features use the same conventions
app/Features/Billing/Controllers/
app/Features/Billing/Models/
app/Features/CMS/Controllers/
app/Features/CMS/Models/
```

---

## Exceptions

New features in the process of being initially scaffolded may temporarily deviate. Fix before merging the first PR.

---

## Consequences Of Violation

Autoloading failures on case-sensitive filesystems (Linux, CI). Navigation confusion. Inconsistent conventions across the codebase.

---

## Only Create Directories When Needed

Do not scaffold every possible subdirectory in every feature. Create directories only when they contain files.

---

## Category

Code Organization

---

## Rule

Add `Controllers/`, `Models/`, `Services/`, `Requests/` only when the feature has at least one file of that type. Empty directories like `Events/`, `Listeners/`, `Jobs/` create noise and imply expectations that the feature does not fulfill.

---

## Reason

Empty directories communicate "we expected to have events here" rather than the truth: "this feature has no events." They add visual clutter and make the feature appear more complex than it is. Create directories on demand.

---

## Bad Example

```php
app/Features/Billing/
  Controllers/
  Events/          # Empty — creates noise
  Listeners/       # Empty — creates noise
  Jobs/            # Empty — creates noise
  Models/
  Services/
```

---

## Good Example

```php
app/Features/Billing/
  Controllers/InvoiceController.php
  Models/Invoice.php
  Services/InvoiceService.php
  // No Events/ directory — no events exist
```

---

## Exceptions

If the team has agreed conventions that require certain directories (e.g., every feature must have a `Providers/` directory), scaffold only the required set plus actually populated directories.

---

## Consequences Of Violation

Cluttered feature directories. Misleading impression of feature complexity. Navigation overhead.

---

## Keep Nesting Shallow — Maximum 3 Levels

Do not nest subdirectories more than 3 levels deep within a feature.

---

## Category

Maintainability

---

## Rule

Limit directory nesting to 3 levels from the feature root. For example, `Features/Billing/Services/` (2 levels) is acceptable. `Features/Billing/Services/Payment/Processors/` (4 levels) is not. Flatten or extract sub-features when nesting exceeds 3 levels.

---

## Reason

Deep nesting makes files hard to find, creates long import paths, and increases cognitive load. It often indicates that a sub-feature should be extracted. Flatter structures are easier to navigate and understand.

---

## Bad Example

```php
// 4 levels deep — too deep
app/Features/Billing/Services/Payment/Processors/StripeProcessor.php
// Namespace: App\Features\Billing\Services\Payment\Processors\StripeProcessor
```

---

## Good Example

```php
// 2 levels — flat and navigable
app/Features/Billing/Services/StripeProcessor.php

// Or extract sub-feature for deep logic
app/Features/Billing/Payments/Processors/StripeProcessor.php
```

---

## Exceptions

Framework-required nesting (e.g., Blade view directories for namespacing) may exceed 3 levels. Document the exception.

---

## Consequences Of Violation

Long import paths. Hard-to-find files. Increased cognitive load. Unnecessarily complex namespaces.

---

## Enforce Naming Conventions With CI

Use CI linting to enforce consistent subdirectory naming, casing, and file naming conventions across all features.

---

## Category

Scalability

---

## Rule

Add a CI step that scans feature directories and reports naming convention violations: case mismatches, incorrect subdirectory names, or files in the feature root instead of subdirectories.

---

## Reason

Manual code review cannot catch every naming inconsistency. As the number of features grows, conventions naturally drift. Automated enforcement is the only reliable way to maintain consistency at scale.

---

## Bad Example

No CI check exists. Over 6 months, three different casing conventions appear across 10 features: `Controllers/`, `controllers/`, and `Http/`.

---

## Good Example

```yaml
name: Check Feature Structure
run: |
  errors=()
  for dir in app/Features/*/; do
    feature=$(basename "$dir")
    # Check for invalid subdirectories
    for subdir in "$dir"*/; do
      name=$(basename "$subdir")
      if [[ ! "$name" =~ ^(Controllers|Models|Services|Requests|Providers|Actions|DTOs|Events|Listeners|Jobs|Notifications|Policies|Rules|Exceptions)$ ]]; then
        errors+=("Invalid directory $name in $feature")
      fi
    done
  done
  [ ${#errors[@]} -eq 0 ] || (printf '%s\n' "${errors[@]}" && exit 1)
```

---

## Exceptions

Projects with <3 features may rely on manual review. Automated checking adds value when 5+ features exist.

---

## Consequences Of Violation

Convention drift across features. Case-sensitivity bugs in CI (Linux). Navigation inconsistency.

---

## Use A Feature Scaffold Command

Standardize feature creation with `php artisan make:feature` or equivalent custom command.

---

## Category

Maintainability

---

## Rule

Create an Artisan command (`php artisan make:feature {name}`) that scaffolds a feature with the approved directory structure, a service provider template, and a stub route file. Use it for every new feature.

---

## Reason

Manual feature creation is error-prone. Developers may forget the service provider, use wrong directory casing, or omit required files. A scaffold command guarantees every feature starts with the correct structure.

---

## Bad Example

```bash
# Manual creation — error-prone, inconsistent
mkdir -p app/Features/Billing/Controllers
mkdir -p app/Features/Billing/Models
touch app/Features/Billing/routes.php
# Forgot to create Providers/ directory and service provider
```

---

## Good Example

```bash
# Scaffold command — consistent every time
php artisan make:feature Billing
# Creates:
# app/Features/Billing/
#   Controllers/
#   Models/
#   Providers/BillingServiceProvider.php
#   routes.php
```

---

## Exceptions

Projects using `nwidart/laravel-modules` already have `php artisan module:make` and do not need a custom command.

---

## Consequences Of Violation

Inconsistent feature scaffolding. Missing service providers. Incorrect directory casing. Developer friction.

---

## Align View Namespace With Feature Name

Register view namespaces using the feature name to match the `feature::view.name` convention.

---

## Category

Code Organization

---

## Rule

Use `$this->loadViewsFrom(__DIR__.'/../views', 'billing')` in the feature's service provider. Access views as `billing::invoices.index`. The view namespace must match the feature's route prefix convention.

---

## Reason

Consistent view namespacing makes view ownership immediately clear. `billing::invoices.index` is unambiguously a Billing feature view. Inconsistent namespaces cause confusion and make view inheritance unpredictable.

---

## Bad Example

```php
// Provider uses different namespace than expected
$this->loadViewsFrom(__DIR__.'/../views', 'billing_module');

// Usage — developer expects 'billing::'
return view('billing::invoices.index'); // Fails — namespace mismatch
```

---

## Good Example

```php
$this->loadViewsFrom(__DIR__.'/../views', 'billing');

return view('billing::invoices.index');
```

---

## Exceptions

When the feature name conflicts with an existing vendor view namespace, use a clear alternative (e.g., `feature_billing`). Document the exception.

---

## Consequences Of Violation

View namespace confusion. `View not found` errors. Inconsistent view reference patterns.

---

## Co-locate Migrations Within The Feature

Store feature-specific migrations in the feature's `Database/Migrations/` directory, not in the global `database/migrations/`.

---

## Category

Code Organization

---

## Rule

Place all migrations that create or modify feature-specific tables in `Features/{Feature}/Database/Migrations/`. Load them via `$this->loadMigrationsFrom()` in the feature's service provider.

---

## Reason

Co-located migrations keep the feature self-contained. Disabling a feature (removing its provider) stops its migrations from loading. Feature extraction includes all migration files automatically.

---

## Bad Example

```php
// Migration in global directory — disconnected from feature
database/migrations/2024_01_01_create_invoices_table.php
```

---

## Good Example

```php
// Migration in feature directory — connected
app/Features/Billing/Database/Migrations/2024_01_01_create_invoices_table.php

// Loaded in provider
$this->loadMigrationsFrom(__DIR__.'/../Database/Migrations');
```

---

## Exceptions

Shared models in `App\Models\` should use the global `database/migrations/` directory. Migrations that alter shared tables (e.g., adding columns to `users`) stay in the feature but must be carefully named.

---

## Consequences Of Violation

Feature extraction requires hunting for migration files. Disabling a feature does not stop its migrations. Migration ownership is unclear.

---

## Keep Feature Files In Correct Subdirectories

Every file in a feature must be placed in its appropriate subdirectory. Do not put all files at the feature root.

---

## Category

Code Organization

---

## Rule

Controllers go in `Controllers/`. Models go in `Models/`. Services go in `Services/`. Do not place arbitrary files directly in the feature root directory. The only file allowed at the feature root is `routes.php`.

---

## Reason

Files at the feature root have no categorization. A feature with 40 files at the root is as disorganized as a layer-based structure. Subdirectories provide predictable file placement and make the feature navigable.

---

## Bad Example

```php
app/Features/Billing/
  InvoiceController.php       # Should be in Controllers/
  Invoice.php                 # Should be in Models/
  InvoiceService.php          # Should be in Services/
  StoreInvoiceRequest.php     # Should be in Requests/
  routes.php
```

---

## Good Example

```php
app/Features/Billing/
  Controllers/InvoiceController.php
  Models/Invoice.php
  Services/InvoiceService.php
  Requests/StoreInvoiceRequest.php
  routes.php
```

---

## Exceptions

Configuration files, README, or feature-specific helpers that do not fit established subdirectories may be placed at the feature root if the team agrees on the convention.

---

## Consequences Of Violation

Disorganized features that are hard to navigate. Inconsistent file placement. Feature loses its organizational advantage.

---

## Use Fully Qualified Class Names In Routes

Reference feature controllers in route files using their fully qualified class names.

---

## Category

Framework Usage

---

## Rule

Use `[App\Features\Billing\Controllers\InvoiceController::class, 'index']` in feature route files. Do not rely on `use` imports or relative namespaces for route controller references.

---

## Reason

Route files are loaded by the service provider, which may have different namespace resolution behavior than class files inside the feature. Fully qualified names make the reference unambiguous and prevent autoloading issues during route caching.

---

## Bad Example

```php
use App\Features\Billing\Controllers\InvoiceController;

// Route uses short name — may break with route caching
Route::get('/invoices', [InvoiceController::class, 'index']);
```

---

## Good Example

```php
// Fully qualified — unambiguous, survives route caching
Route::get('/invoices', [\App\Features\Billing\Controllers\InvoiceController::class, 'index']);
```

---

## Exceptions

When the controller namespace is configured as the default in `RouteServiceProvider`, short names may work. However, explicit FQCN is safer for feature-based projects.

---

## Consequences Of Violation

Route caching failures. Autoloading issues when feature is extracted. Ambiguous controller resolution.
