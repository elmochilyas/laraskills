## Make The Structure Decision Early

Choose feature-based or layer-based organization before writing significant application code.

---

## Category

Architecture

---

## Rule

Decide on the organizational structure (feature-based vs layer-based) in the first week of the project. Document the decision in the project README. Do not start with one and expect to migrate painlessly.

---

## Reason

Retrofitting feature-based structure onto a layer-based project requires moving every file, updating every namespace, and fixing every import. For a project with 50+ files, this takes several days and introduces namespace errors, broken imports, and autoloading issues.

---

## Bad Example

A project starts with layer-based structure. At 30 models, the team decides to switch to feature-based. Every file must be moved. Namespaces break. The migration takes a week.

---

## Good Example

A project starts feature-based from day one, even with 2 features. The structure scales naturally as features grow.

---

## Exceptions

Prototypes and MVPs where speed is the priority should start layer-based. Migrate only if the prototype graduates to a maintained product.

---

## Consequences Of Violation

Expensive migration requiring namespace updates across every file. Risk of broken imports and autoloading errors. Developer productivity loss during migration.

---

## Commit Fully To One Structure

All code of the same type must follow the same organizational convention. Do not mix feature and layer placement.

---

## Category

Code Organization

---

## Rule

If using feature-based structure, every controller must be in a feature directory. Every model must be in a feature directory (unless it belongs in the shared kernel). Do not leave any controllers in `app/Http/Controllers/` or any models in `app/Models/` (except shared models).

---

## Reason

Partial adoption creates ambiguity. A developer tasked with creating a new controller must decide: does it go in `app/Http/Controllers/` or in `app/Features/X/Controllers/`? Different developers make different choices, creating an inconsistent, unpredictable codebase.

---

## Bad Example

```php
// Some controllers in features
app/Features/Billing/Controllers/InvoiceController.php

// Some controllers still in global directory
app/Http/Controllers/AuthController.php
```

---

## Good Example

```php
// ALL controllers in feature directories
app/Features/Billing/Controllers/InvoiceController.php
app/Features/Users/Controllers/AuthController.php
```

---

## Exceptions

Cross-cutting infrastructure (middleware, service providers, global exception handlers) remains in its default location, as it is not feature-specific.

---

## Consequences Of Violation

Ambiguity about where new code belongs. Inconsistent placement across the codebase. Architectural drift with no clear convention.

---

## One Feature Per Business Domain

A feature directory must represent a business domain boundary, not a technical grouping or a single model.

---

## Category

Code Organization

---

## Rule

Define features as business capabilities with 3-20 related files. Do not create a feature for a single model or a technical concern. A feature should answer "what business capability does this serve?"

---

## Reason

Technical grouping (e.g., `Controllers`, `Exporters`) within a feature defeats the purpose of feature-based organization. Single-model features create directory overhead without cohesion benefits. A feature should encapsulate all files needed to deliver a business capability.

---

## Bad Example

```php
// Technical grouping — not a business domain
app/Features/Exporters/

// Single model — not a full business capability
app/Features/Invoice/
```

---

## Good Example

```php
// Business domain — includes controllers, models, services, requests
app/Features/Billing/
```

---

## Exceptions

An exceptionally complex single model (e.g., a `Product` in an e-commerce system with 15+ related files) may warrant its own feature if it represents a clear business domain.

---

## Consequences Of Violation

Directory overhead without cohesion benefits. Difficulty determining feature boundaries. Inconsistent feature sizes.

---

## Maintain A Shared Kernel For Cross-Cutting Code

Common abstractions, shared models, and base classes must live in `app/Shared/` or `app/Kernel/`, not inside any feature.

---

## Category

Code Organization

---

## Rule

Place code that is consumed by multiple features into `app/Shared/` (or `app/Kernel/`). This includes the User model, base controllers, custom casts, global helpers, and shared interfaces. Never duplicate this code across features or place it arbitrarily in one feature.

---

## Reason

Duplicating cross-cutting code violates DRY. Placing it arbitrarily in one feature creates an implicit dependency on that feature from all others. A shared kernel centralizes common code without coupling features.

---

## Bad Example

```php
// Base controller duplicated in every feature
// Or placed in Billing feature, making all features depend on Billing
```

---

## Good Example

```php
app/Shared/
  Controllers/BaseController.php
  Models/User.php
  Helpers/currency.php
  Exceptions/ApplicationException.php
```

---

## Exceptions

Small applications (3-5 features) may place shared code in the root `app/` namespace without a dedicated shared directory.

---

## Consequences Of Violation

Code duplication across features. Implicit dependencies on specific features. Confusion about where to place shared code.

---

## Customize Artisan Stubs For Feature Namespace Generation

Publish and modify Artisan stubs so that generators create files in the correct feature namespace.

---

## Category

Maintainability

---

## Rule

Run `php artisan stub:publish`. Modify the `make:model`, `make:controller`, and `make:request` stubs to accept a feature parameter and generate files under `app/Features/{Feature}/Controllers/`, `app/Features/{Feature}/Models/`, etc.

---

## Reason

Laravel's default generators create files in `app/Models/`, `app/Http/Controllers/` (layer-based). Without custom stubs, every generated file must be manually moved and its namespace updated. This friction discourages proper feature structure.

---

## Bad Example

```bash
# Default generates in wrong location
php artisan make:controller InvoiceController
# File created at app/Http/Controllers/InvoiceController.php instead of
# app/Features/Billing/Controllers/InvoiceController.php
```

---

## Good Example

```bash
# Custom stubs with feature parameter
php artisan make:model Billing/Invoice -m
php artisan make:controller Billing/InvoiceController
# Generated in correct feature directory and namespace
```

---

## Exceptions

Projects using `nwidart/laravel-modules` or similar package-based modular systems have their own generator commands and may skip stub customization.

---

## Consequences Of Violation

Manual file moves after every generation. Namespace errors from incomplete moves. Developer friction that encourages reverting to layer-based structure.

---

## Avoid Feature Explosion

Do not create a feature directory for every small concept. A feature must contain at least 3 files.

---

## Category

Maintainability

---

## Rule

Before creating a new feature directory, verify it will contain at least 3 files (e.g., a controller, a model, a route file). Single-file features add directory overhead without providing cohesion benefits.

---

## Reason

Each feature directory adds structural overhead: a service provider, a routes file, subdirectories. Creating features for 1-2 files multiplies this overhead across dozens of tiny directories, making the project harder to navigate than a layer-based structure.

---

## Bad Example

```php
// Single-file features
app/Features/PasswordReset/ResetController.php
app/Features/Export/ExportController.php
app/Features/Health/HealthController.php
// Each has 1-2 files, each needs a provider, routes, etc.
```

---

## Good Example

```php
// Consolidate small concepts into larger features
app/Features/System/
  Controllers/HealthController.php
  Controllers/ExportController.php
  Services/ExportService.php
```

---

## Exceptions

A feature that will clearly grow (planned upcoming work with 5+ files) may be created early with 1-2 initial files, as long as growth is expected within one sprint.

---

## Consequences Of Violation

Directory proliferation. Harder navigation due to many tiny feature directories. Overhead of maintaining per-feature providers for trivial features.

---

## Do Not Let A Feature Become A Monolith

Split any feature that exceeds 20 files into sub-features.

---

## Category

Maintainability

---

## Rule

Monitor feature file counts. When a feature exceeds 20 files, extract sub-features (e.g., `Billing/Invoicing/`, `Billing/Subscriptions/`). Do not let a single feature accumulate 50+ files.

---

## Reason

A feature with 50+ files collapses into the same cohesion problem as layer-based structure. The directory becomes hard to navigate, files are hard to find, and the feature loses its cognitive advantage.

---

## Bad Example

```php
// 50+ files in one feature — too large
app/Features/Billing/
  Controllers/ (12 files)
  Models/ (8 files)
  Services/ (15 files)
  Requests/ (8 files)
  Actions/ (6 files)
  // Too many responsibilities
```

---

## Good Example

```php
// Split into sub-features
app/Features/Billing/
  Invoicing/
    Controllers/
    Models/
    Services/
  Subscriptions/
    Controllers/
    Models/
    Services/
```

---

## Exceptions

Features with many small, tightly related files (e.g., a feature with 10 models, each with a corresponding policy, request, and resource) may be kept intact if splitting would break a cohesive domain.

---

## Consequences Of Violation

Navigation difficulty within oversized features. Same cohesion problems as layer-based structure. Feature boundaries become meaningless.

---

## Use A Shared Namespace For Cross-Feature Infrastructure

Place all cross-feature DTOs, contracts, and events in `App\Kernel\` namespace.

---

## Category

Code Organization

---

## Rule

Use `App\Kernel\` (not `App\Shared\` or `App\Common\`) as the namespace for cross-feature infrastructure: `App\Kernel\Contracts\`, `App\Kernel\DTOs\`, `App\Kernel\Events\`. Keep it distinct from feature namespaces.

---

## Reason

A dedicated namespace (`Kernel`) signals that these are foundational abstractions that features build upon. `Shared` or `Common` are ambiguous — they may be used for code-sharing shortcuts. `Kernel` has a well-understood meaning (core infrastructure).

---

## Bad Example

```php
// Ambiguous namespace
App\Shared\Contracts\UserProvider.php
App\Common\DTOs\InvoiceData.php
```

---

## Good Example

```php
// Clear, intentional namespace
App\Kernel\Contracts\UserProvider.php
App\Kernel\DTOs\InvoiceData.php
```

---

## Exceptions

Applications that adopted a different naming convention before this rule was established may keep their existing convention for consistency.

---

## Consequences Of Violation

Ambiguous namespace naming. Tendency to use the "shared" directory for code that should stay in features. Reduced clarity of architectural intent.

---

## Document The Structural Decision

The project README must state whether it uses feature-based or layer-based structure and explain the reasoning.

---

## Category

Maintainability

---

## Rule

Include a section in the project README titled "Project Structure" that states which organizational approach is used, why it was chosen, and where developers should place new files.

---

## Reason

As developers join and leave the project, the structural decision must be immediately discoverable. Without documentation, new developers may assume layer-based (Laravel defaults) and place files in the wrong location.

---

## Bad Example

Project README does not mention structure. New developer assumes Laravel defaults and creates controllers in `app/Http/Controllers/` while the team uses feature-based.

---

## Good Example

```
## Project Structure

This project uses feature-based organization. All application code lives under
app/Features/{FeatureName}/. See app/Features/Billing/ for an example.

Place new controllers, models, and services inside the relevant feature directory.
Cross-cutting code goes in app/Kernel/. Use php artisan make:model {Feature}/{Model}
(custom stubs).
```

---

## Exceptions

Single-developer projects where the only developer is present and consistent may skip formal documentation.

---

## Consequences Of Violation

Misplaced files by new developers. Structural drift over time. Onboarding friction.

---

## Do Not Split Controller Files By Action

Keep all controller actions for a single resource in one controller class. Do not create separate controllers for `Store`, `Update`, `Delete`.

---

## Category

Code Organization

---

## Rule

Use one controller per resource with standard CRUD actions (index, create, store, show, edit, update, destroy). Use invokable single-action controllers only for truly single-action resources.

---

## Reason

Laravel conventions (and Route::resource) assume standard controller structure. Splitting every action into a separate class creates file proliferation without proportional benefit. The "one action per class" rule is for complex actions, not CRUD.

---

## Bad Example

```php
app/Features/Billing/Controllers/
  StoreInvoiceController.php
  ShowInvoiceController.php
  UpdateInvoiceController.php
  DeleteInvoiceController.php
  ListInvoicesController.php
```

---

## Good Example

```php
app/Features/Billing/Controllers/InvoiceController.php
// Contains index, create, store, show, edit, update, destroy
```

---

## Exceptions

Single, complex actions that are inherently unique (e.g., `BillUserController` that does not fit a standard CRUD pattern) may use an invokable class.

---

## Consequences Of Violation

Excessive file count. Harder to find related actions. Inconsistent with Laravel's resource routing conventions.
