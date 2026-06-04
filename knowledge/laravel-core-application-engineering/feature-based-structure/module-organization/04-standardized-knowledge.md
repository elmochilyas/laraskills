# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Bounded Contexts |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Module organization defines the internal directory structure of each feature. A well-organized module has consistent subdirectories (Controllers, Models, Services, Requests) and clear conventions for what goes where. It balances framework conventions with domain cohesion. The engineering value is predictable navigation: every feature has the same structure, so any developer can immediately find the relevant file.

---

## Core Concepts

### Standard Feature Directory Layout

```
Features/{FeatureName}/
  Controllers/     # HTTP controllers
  Models/          # Eloquent models
  Requests/        # Form requests
  Resources/       # API resources
  Services/        # Business logic
  Actions/         # Single-action classes
  DTOs/            # Data transfer objects
  Events/          # Domain events
  Listeners/       # Event listeners
  Jobs/            # Queued jobs
  Notifications/   # Mail/notifications
  Policies/        # Authorization policies
  Rules/           # Validation rules
  Exceptions/      # Feature-specific exceptions
  Providers/       # Service providers
  routes.php       # Feature routes
```

### Minimal Feature for Simple Cases

```
Features/Contacts/
  Controllers/ContactController.php
  Models/Contact.php
  Requests/StoreContactRequest.php
  routes.php
```

---

## When To Use

- Any feature-based project where consistency across features is important
- Teams with multiple developers who need predictable navigation
- Features with 5+ files that benefit from standardized internal structure
- Projects where features may later be extracted into packages

## When NOT To Use

- Single-file features (a feature with just one model and one controller)
- Prototypes where directory overhead slows iteration
- Teams that prefer flat structure within features

---

## Best Practices

- **Every feature has the same structure** — consistency reduces cognitive load; a developer who knows one feature knows them all
- **Only create directories that are needed** — empty `Events/`, `Listeners/`, `Jobs/` directories create noise
- **Enforce naming conventions** — case sensitivity matters on Linux; use CI to enforce a single convention
- **Keep nesting shallow** — three levels deep (Services/Payment/Processors/) is a smell; flatten or extract sub-features
- **Use a feature template** — `php artisan make:feature` to scaffold new features with consistent structure

---

## Architecture Guidelines

- Controllers in features resolve the same way as top-level controllers — use fully qualified class names in routes
- Models use standard Eloquent table naming conventions (snake_case plural of class name)
- View namespacing: `$this->loadViewsFrom(__DIR__.'/../views', 'billing')` enables `billing::invoices.index`
- Factories co-located at `Features/{Feature}/Database/Factories/`
- Migrations co-located at `Features/{Feature}/Database/Migrations/`
- Tests in `tests/Features/{Feature}/` mirroring the source structure
- Subdirectory names must be consistent across features (case-sensitive)

---

## Performance

No direct runtime performance impact — PHP resolves classes by fully qualified name regardless of directory depth. Composer's optimized autoloader eliminates filesystem overhead. View namespacing adds negligible overhead.

---

## Security

Module organization has no security implications. Controller middleware, authorization policies, and validation all function identically regardless of directory depth.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Nested subdirectories too deep | Organizing by technical sub-category | Hard to navigate, deep paths | Flatten or extract sub-feature |
| Empty subdirectories | Scaffolding all directories upfront | Noise, confusion about purpose | Create directories only when needed |
| Inconsistent naming | No enforced convention | Case-sensitive OS failures, confusion | Enforce with CI/linter |
| Feature as dumping ground | No clear guidelines | 40 files with no structure | Enforce subdirectory rules in PRs |
| Duplicate cross-feature files | Poor feature boundary extraction | Two features define same class | Consolidate into shared service |

---

## Anti-Patterns

- **Nesting beyond 3 levels**: `Features/Billing/Services/Payment/Processors/StripeProcessor.php`
- **Every feature having every subdirectory**: `Events/`, `Listeners/`, `Jobs/` present but empty
- **Inconsistent casing**: `Controllers/` in one feature, `controllers/` in another
- **Feature directory with all files at root**: 40 files in `Features/Billing/` with no subdirectories

---

## Examples

**Feature model with proper namespace:**
```php
namespace App\Features\Billing\Models;

use Illuminate\Database\Eloquent\Model;

class Invoice extends Model
{
    protected $table = 'invoices';
}
```

**Artisan command for feature model:**
```bash
php artisan make:model "Features/Billing/Models/Invoice" -m
```

**View namespace registration:**
```php
// BillingServiceProvider
public function boot(): void
{
    $this->loadViewsFrom(__DIR__.'/../views', 'billing');
}
```

**View usage:**
```php
return view('billing::invoices.index');
```

---

## Related Topics

- modular-monolith-basics — When and why to use feature-based structure
- technical-vs-domain-grouping — Comparing organizational approaches
- module-auto-discovery — How features register with the app
- dtos — Data transfer objects within features
- action-pattern — Action classes as feature internals

---

## AI Agent Notes

- Subdirectory names follow Laravel's own conventions (Controllers/, Models/, etc.)
- Feature-level `routes.php` loaded via service provider's `boot()` method
- Migrations can be loaded from feature directories since Laravel 8+
- Factories placed in `database/factories/` (global) or feature's `Database/Factories/`
- Tests can be co-located or in `tests/` — co-location requires additional autoloading config

---

## Verification

- [ ] All features use the same subdirectory naming convention
- [ ] No empty subdirectories in any feature
- [ ] Maximum nesting depth of 3 levels or less
- [ ] Feature models have correct namespace and autoloading
- [ ] View namespaces registered in service provider
- [ ] Migrations loaded from feature directory
- [ ] Case sensitivity consistent across all features
- [ ] CI enforces directory structure conventions
