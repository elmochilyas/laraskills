# Directory Structure

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Model Design
- **Knowledge Unit:** Directory Structure
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary
The physical organisation of model files — their directory placement, naming conventions, and namespace hierarchy — directly impacts team productivity, code discoverability, and domain cohesion. Laravel defaults to a flat `app/Models/` directory, but as applications grow, grouping models into subdirectories by domain, feature, or architectural layer becomes essential. This KU covers the organisational patterns, namespace alignment, and tradeoffs of different model directory structures.

---

## Core Concepts

1. **`app/Models` Convention** — Since Laravel 8, `php artisan make:model` creates models in `app/Models/` with the `App\Models` namespace. The directory must be created before the command runs (Laravel creates it automatically if it doesn't exist).

2. **Namespace-to-Directory Alignment** — PSR-4 autoloading requires that the namespace matches the directory. A model at `app/Models/Auth/User.php` must declare `namespace App\Models\Auth;`. Mismatches cause class-not-found errors.

3. **Domain/Feature Subdirectories** — For larger applications, models can be organised into subdirectories reflecting bounded contexts or features: `app/Models/Billing/`, `app/Models/Analytics/`, `app/Models/Core/`.

4. **Model-Adjacent Files** — Factories, policies, resources, and form requests can follow the same subdirectory structure. Laravel's `make:model` with `--all` flag creates all adjacent files in matching subdirectories.

5. **Single-File Models vs. Directory Per Model** — Some teams prefer a directory per model for related classes: `app/Models/User/User.php`, `app/Models/User/UserPolicy.php`, `app/Models/User/UserCollection.php`. This keeps model-specific files colocated.

---

## Mental Models

### Directory as Domain Boundary
Think of each subdirectory under `app/Models/` as a bounded context boundary. Models in the same subdirectory should be cohesively related (they often share relationships, observer dependencies, and migration groups). Models in different subdirectories should interact only through well-defined cross-boundary relationships.

### The Three Tiers of Organisation
1. **Flat** — All models in `app/Models/`. Works for <20 models.
2. **Domain-grouped** — Models in `app/Models/{Domain}/`. Works for 20-100 models.
3. **Directory-per-model** — Each model in its own subdirectory. Works for complex models with many supporting classes (collections, builders, observers, policies, factories, DTOs).

---

## Internal Mechanics

### PSR-4 Autoloading Impact
PSR-4 autoloading maps the `App\Models` namespace to `app/Models/`. Moving a model file requires updating the namespace declaration. `composer dump-autoload` re-indexes the class map. Laravel's `make:model Auth/User` handles both file placement and namespace automatically.

### Artisan Command Support
- `php artisan make:model Auth/User` — creates `app/Models/Auth/User.php` with `namespace App\Models\Auth;`
- `php artisan make:model Auth/User --all` — also creates factory, policy, resource, form request, seeder, migration, and controller in corresponding subdirectories
- `php artisan make:model Auth/User -m` — creates migration in `database/migrations/` (not namespaced by Auth)

### IDE and Tooling
Most IDEs (PHPStorm, VS Code with PHP IntelliSense) respect PSR-4 mappings and auto-resolve namespaces for models in subdirectories. Renaming a model via IDE refactoring updates both the file path and the namespace declaration.

---

## Patterns

### Domain-Grouped Structure
```
app/Models/
├── User.php
├── Billing/
│   ├── Invoice.php
│   ├── Subscription.php
│   └── Payment.php
├── Content/
│   ├── Post.php
│   ├── Page.php
│   └── Category.php
└── Analytics/
    ├── PageView.php
    └── Event.php
```

### Directory-Per-Model Structure (for complex models)
```
app/Models/
├── User/
│   ├── User.php
│   ├── UserCollection.php
│   ├── UserPolicy.php
│   ├── UserObserver.php
│   └── Builders/
│       └── UserBuilder.php
├── Post/
│   ├── Post.php
│   ├── PostCollection.php
│   ├── PostPolicy.php
│   └── Scopes/
│       └── PublishedScope.php
└── Invoice/
    ├── Invoice.php
    ├── InvoiceFactory.php
    ├── States/
    │   ├── InvoiceState.php
    │   ├── DraftState.php
    │   └── PaidState.php
    └── Actions/
        ├── GenerateInvoice.php
        └── SendInvoice.php
```

### Namespace Aliasing for Convenience
When domain-grouped models are used frequently, aliasing the import reduces verbosity:
```php
use App\Models\Billing\Invoice;
use App\Models\Content\Post;
```

Or rely on service-level namespace aliasing via `config/app.php`:

```php
'aliases' => [
    'Invoice' => App\Models\Billing\Invoice::class,
    'Post' => App\Models\Content\Post::class,
],
```
(Laravel aliases are typically reserved for facades; prefer direct imports for models.)

---

## Architectural Decisions

### Decision: Flat vs. Domain-Grouped vs. Directory-Per-Model
- **Flat** — Simplest, no cognitive overhead. Best for small projects (<20 models). Becomes unwieldy as the model count grows.
- **Domain-grouped** — Matches domain-driven design boundaries. Improves discoverability. Preferred for medium-to-large projects (20-100 models).
- **Directory-per-model** — Maximum colocation of model-adjacent classes. Suitable for complex models with many supporting files. Can introduce over-organisation for simple models.

### Decision: Namespace Depth
- `App\Models\Billing\Invoice` (3 levels) vs. `App\Billing\Models\Invoice` (4 levels).
- Laravel convention: `App\Models\{Subdir}\{Model}`.
- The `App\Models` prefix provides a clear model namespace. Moving a model to a different subdomain only changes the subdirectory, not the `Models` parent.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Domain-grouped: improves discoverability | Import paths are longer (`use App\Models\Billing\Invoice`) | Use IDE auto-import; the cost is minimal |
| Directory-per-model: maximum colocation | Over-organisation for simple models | Let the model's complexity dictate the structure |
| Flat: simplest, zero ceremony | Chaos beyond 20 models | Transition to grouped structure proactively |
| Consistent with `make:model` output | Artisan assumes flat `app/Models` by default | Pass subdirectory path: `make:model Billing/Invoice` |

---

## Performance Considerations

- **Directory structure has zero runtime performance impact** — PSR-4 autoloading uses the class name to locate files, not the directory hierarchy. Deeply nested directories do not affect autoloading speed.
- **OpCache** reads files once regardless of directory depth. No measurable difference between flat and nested structures.
- **IDE performance** — Deeply nested directories (~8+ levels) can slow IDE file indexing marginally. 3-4 levels is well within acceptable range.

---

## Production Considerations

- **Consistency across environments** — Directory structure is part of version control. All environments automatically have the same structure after `git pull` and `composer dump-autoload`.
- **CI autoload validation** — Add `composer dump-autoload` to CI pipelines to verify PSR-4 mappings after file moves or additions. Catches mismatched namespace declarations before deployment.
- **Monorepo consistency** — In a monorepo with multiple applications, each application has its own `app/Models/` directory tree under its root. The structure patterns apply per-application.
- **Deployment tool compatibility** — Deployers (Envoyer, Forge, Deployer) that run `composer install --optimize-autoloader` generate an optimised class map. The directory structure is irrelevant once the class map is generated.

---

## Common Mistakes

**Mistake: Moving a model file without updating the namespace.**
Why it happens: `git mv` or IDE drag-and-drop moves the file without updating the `namespace` declaration at the top of the file.
Why it's harmful: PSR-4 autoloading fails; the class is not found. Results in a 500 error.
Better approach: Use `php artisan make:model NewDir/Model --force` to create the new file, then delete the old one. Or use IDE refactoring tools that update both path and namespace.

**Mistake: Inconsistent subdirectory naming (plural vs. singular).**
Why it happens: Some team members create `app/Models/Billing/` while others create `app/Models/Billings/`.
Why it's harmful: Imports are inconsistent; some files use `use App\Models\Billing\Invoice;` while others use `use App\Models\Billings\Invoice;`. Autoloader + namespace mismatch causes failures.
Better approach: Standardise on singular subdirectory names (e.g., `Billing`, `Content`, `Analytics`) — they match the domain concept, not the database table.

**Mistake: Nesting deeper than 3-4 levels.**
Why it happens: Over-engineering the directory structure with `app/Models/Billing/Subscription/Plans/EnterprisePlan.php`.
Why it's harmful: Deep nesting makes imports verbose and the hierarchy is rarely meaningful at depth >4.
Better approach: Limit to 3 levels: `app/Models/{Domain}/{Model}.php`. Use namespaces for deeper taxonomies only when the domain genuinely requires it.

**Mistake: Mixing domain-grouped models with flat models inconsistently.**
Why it happens: Refactoring some models into subdirectories while leaving others flat.
Why it's harmful: Imports become unpredictable — some are `use App\Models\User;`, others are `use App\Models\Billing\Invoice;`. New team members cannot intuit where a model lives.
Better approach: Either all models are flat, or all models are grouped. Avoid partial migrations. If transitioning, use a transition period with deprecated aliases in a single commit.

---

## Failure Modes

1. **PSR-4 Autoload Failure** — Moving a model without updating the namespace causes `Class "App\Models\Billing\Invoice" not found`. Mitigation: `composer dump-autoload` after all file moves; verify with `php artisan tinker --execute="new Invoice()"`.
2. **Inconsistent Convention Across Team** — Half the team uses flat structure, half uses domain-grouped. Merge conflicts and import inconsistencies follow. Mitigation: enforce structure via `php-cs-fixer` rules or CI linting that checks import path patterns.
3. **IDE Cache Staleness** — After restructuring, IDE class resolution may reference old paths. Mitigation: restart IDE indexer or invalidate cache after large file moves.
4. **Deployment Script Breakage** — Deploy scripts that `include` or `require` model files by relative path break when directories change. Mitigation: never use `require` for model files — always rely on autoloading.

---

## Ecosystem Usage

- **Laravel Jetstream** — Uses flat `app/Models/` structure with `User.php` and `Team.php`. Adjacent classes (policies, factories) follow the same flat structure.
- **Laravel Nova** — Nova resource classes live in `app/Nova/`, not `app/Models/`. Nova separates the resource (presentation) from the model (data), demonstrating a different organisational axis.
- **Spatie packages** — Package models are typically flat within the package's `src/Models/` directory. Spatie's `Media` model is at `src/Models/Media.php` without subdirectories, even though it has many supporting classes.
- **Statamic (Laravel-based CMS)** — Uses domain-grouped models under `app/Models/` with subdirectories for `Entries`, `Taxonomies`, `Globals`, reflecting its content-focused domain.

---

## Related Knowledge Units
### Prerequisites
- **Base Model Class** — Understanding that models are PHP classes requiring autoloading
- **Laravel Directory Structure** — General understanding of `app/` and PSR-4 autoloading

### Related Topics
- **Model Conventions** — How directory structure relates to table naming conventions (not directly, but both are naming/organisation concerns)
- **Service Providers / Namespace Registration** — How additional model namespaces are registered

### Advanced Follow-up Topics
- **Module-Based Application Structure** — Organising models within Laravel modules (nwidart/laravel-modules style)
- **Hexagonal Architecture with Eloquent** — Keeping models inside the infrastructure layer, separate from domain entities

---

## Research Notes
### Source Analysis
Laravel's `make:model` command is defined in `Illuminate\Foundation\Console\ModelMakeCommand`. It processes subdirectory paths by splitting on `/`, creating the directory if needed, and generating the namespace from the path segments. The `--all` flag maps model-adjacent classes to matching subdirectories using the same path logic.

### Key Insight
Laravel's directory structure is a developer-ergonomics concern, not a framework requirement. The framework works identically regardless of directory layout — autoloading maps namespace to path, and all model resolution is by class name. The structure decisions documented in this KU affect *team productivity*, not *application behaviour*.

### Version-Specific Notes
- Laravel 7 and earlier: Models defaulted to `app/` (flat). The `app/Models/` convention became default in Laravel 8.
- Laravel 8.x: `make:model` creates models under `app/Models/` by default. The `--namespace` flag allows custom namespace prefixes.
- Laravel 9.x: `make:model` improved subdirectory support; `--all` creates all adjacent files in matching subdirectories.
- Laravel 10.x + 11.x: No significant changes to model directory conventions. The `make:model` command remains stable.
