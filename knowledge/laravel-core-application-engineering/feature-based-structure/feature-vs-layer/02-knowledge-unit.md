# Feature-Based vs Layer-Based Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Feature vs Layer
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Layer-based (technical) organization groups code by its technical role: controllers in one directory, models in another, services in another. Feature-based (domain) organization groups code by business domain: everything for billing in one directory. This choice is the foundational structural decision for a Laravel project.

The engineering tradeoff: layer-based follows Laravel conventions and is simpler for small projects; feature-based provides better cohesion and scales to larger, multi-domain applications. Neither is universally superior — the right choice depends on project size, team structure, and domain complexity.

---

## Core Concepts

### Layer-Based Organization

```
app/
  Http/
    Controllers/    # All controllers
    Requests/       # All form requests
    Middleware/     # All middleware
  Models/           # All Eloquent models
  Services/         # All services
  Exceptions/       # All exceptions
  Events/           # All events
  Listeners/        # All listeners
```

Each directory contains ALL files of that type, regardless of domain. Finding everything related to "billing" requires opening 6+ directories.

### Feature-Based Organization

```
app/
  Features/
    Billing/
      Controllers/  # Billing controllers
      Models/       # Billing models
      Services/     # Billing services
      Exceptions/   # Billing exceptions
    Users/
      Controllers/  # Users controllers
      Models/       # Users models
```

Each directory contains ALL file types for a single domain. Finding everything related to "billing" requires opening one directory.

### Hybrid Organization

```
app/
  Http/
    Controllers/    # Simple controllers (few lines)
    Middleware/     # Cross-cutting middleware
  Features/
    Billing/        # Complex domain
      Controllers/
      Models/
      Services/
    Users/
      Controllers/
      Models/
```

Simple, cross-cutting code stays layered. Complex domains get feature directories.

---

## Mental Models

### The Filing Cabinet Analogy

- **Layer-based**: All manila folders (controllers) in one drawer, all blue folders (models) in another. To assemble a complete "billing" document, you open multiple drawers.
- **Feature-based**: Each client has their own filing cabinet drawer containing all document types. To find a billing document, you open one drawer.

### The Cohesion-Coupling Matrix

Layer-based minimizes coupling between layers (controllers don't know about each other) but minimizes cohesion within a domain (billing logic is scattered). Feature-based maximizes cohesion (billing is together) but risks coupling between features if boundaries aren't respected.

---

### Comparison Matrix

| Criterion | Layer-Based | Feature-Based |
|---|---|---|
| **Laravel defaults** | ✅ Yes | ❌ No |
| **Small project (<10 models)** | ✅ Simpler | ❌ Overhead |
| **Large project (>50 models)** | ❌ Scattered | ✅ Cohesive |
| **Multi-team development** | ❌ Merge conflicts | ✅ Team ownership per feature |
| **New dev onboarding** | ❌ Must learn all layers | ✅ Learn one feature at a time |
| **Refactoring a domain** | ❌ Touch 6+ directories | ✅ Touch one directory |
| **Cross-cutting concerns** | ✅ Natural (middleware, etc.) | ❌ Need shared directory |
| **Artisan generators** | ✅ Built-in | ❌ Need custom stubs |
| **IDE navigation** | ✅ Simple (class name → file) | ✅ Same (PSR-4 works) |
| **Reusability** | ❌ Layer coupling | ✅ Feature isolation |

---

## Internal Mechanics

### Autoloading Compatibility

Both layer-based and feature-based structures use the same PSR-4 autoloading mechanism. Composer's classmap generator (`dump-autoload -o`) works identically for both:

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/"
        }
    }
}
```

`App\Http\Controllers\BillingController` maps to `app/Http/Controllers/BillingController.php` (layer-based).
`App\Features\Billing\Controllers\BillingController` maps to `app/Features/Billing/Controllers/BillingController.php` (feature-based).

### Service Provider Loading

Layer-based structure uses a single `AppServiceProvider` for all registrations. Feature-based structure distributes registrations across per-feature providers. Both ultimately register with Laravel's provider array in `config/app.php` — the framework makes no distinction.

### Route Registration

Layer-based routes are defined in `routes/web.php` and `routes/api.php`. Feature-based routes are loaded from per-feature files via `loadRoutesFrom()` in each feature's service provider. Both resolve to the same `RouteRegistrar` internally — the caching mechanism (`php artisan route:cache`) works identically.

---

### When to Choose Each

### Choose Layer-Based When

- Application has <15-20 models
- Single developer or very small team
- Simple CRUD with minimal domain logic
- Rapid prototyping (MVPs, hackathons)
- Following Laravel defaults is a project requirement
- You expect the project to stay small

### Choose Feature-Based When

- Application has 20+ models across distinct domains
- Multiple developers or teams work on different domains
- Domains have complex business logic (not just CRUD)
- You anticipate significant growth
- Team ownership per domain is desired
- You need to extract domains into separate packages later

### Choose Hybrid When

- Core structure (auth, user management) is simple
- One or two domains are complex (billing, analytics)
- You're migrating from layer-based to feature-based incrementally
- Team is comfortable with ambiguity in where to place things

---

### Migration Path: Layer → Feature

```
Phase 1: Identify domain boundaries
  Map all models to business domains
  Identify shared models (User, Settings)

Phase 2: Create feature directories
  app/Features/Billing/
  app/Features/Users/

Phase 3: Move files (one feature at a time)
  Move BillingController → Features/Billing/Controllers/
  Move BillingService → Features/Billing/Services/
  Move Invoice model → Features/Billing/Models/

Phase 4: Update namespaces
  Update all use statements
  Update routes to reference new namespace

Phase 5: Verify autoloading
  composer dump-autoload
  Run tests

Phase 6: Remove old directories (after all features moved)
```

Each feature should be migrated independently, with tests passing after each move.

---

## Architectural Decisions

### Artisan Generators with Feature Structure

Customize Artisan stubs for feature-based structure:

```bash
php artisan stub:publish
```

Modify `stubs/controller.stub`:

```php
namespace App\Features\{{ feature }}\Controllers;

class {{ class }}Controller extends Controller
{
    // ...
}
```

Or use a custom command:

```php
// app/Console/Commands/MakeFeatureController.php
class MakeFeatureController extends Command
{
    protected $signature = 'make:feature-controller {feature} {name}';

    public function handle()
    {
        $feature = $this->argument('feature');
        $name = $this->argument('name');
        // Generate controller in Features/{feature}/Controllers/
    }
}
```

### Shared Models

Models like `User` that span multiple features stay in `app/Models/`:

```
app/
  Models/
    User.php          # Shared across features
    Setting.php       # Shared across features
  Features/
    Billing/
      Models/
        Invoice.php   # Feature-specific
        Plan.php      # Feature-specific
```

---

## Tradeoffs

| Concern | Layer-Based | Feature-Based |
|---|---|---|
| Directory depth | ~3 levels (app/Http/Controllers/) | ~4 levels (app/Features/Billing/Controllers/) |
| File count per directory | High (50+ files) | Low (5-15 files) |
| Change impact | High (many files across layers) | Low (files in one feature) |
| Framework alignment | Idiomatic Laravel | Custom structure |
| Tool/package compatibility | Full | Most work; some assume layer structure |

---

## Performance Considerations

No runtime difference. Autoloading uses composer's classmap in production. The directory structure only affects developer experience, not application performance.

---

## Production Considerations

- Make the structure decision early — retrofitting is expensive
- Be consistent: pick one approach and document it
- If hybrid, document clear criteria for what goes in `app/Http/` vs `app/Features/`
- Use `composer dump-autoload -o` in production regardless of structure choice
- Consider namespace aliases for deep feature paths if they become unwieldy

---

## Common Mistakes

### Half Adoption

Some controllers in `app/Http/Controllers/`, some in `app/Features/Billing/Controllers/`. New team members don't know where to put new code. If you go feature-based, move ALL controllers.

### Feature Explosion

Creating a new feature for every minor concept leads to dozens of single-file features. A feature directory should have at least 3-5 files before it justifies the structure overhead.

### Ignoring Laravel Conventions

Laravel's `php artisan make:model` puts models in `app/Models/`. If you're feature-based, you'll need to either move generated files or create custom commands. Document this workflow.

---

## Failure Modes

### Circular Feature Dependencies

Feature A depends on Feature B which depends on Feature A. This creates tight coupling that is harder to resolve than in layer-based structure (where circular dependencies between services are more visible). Mitigate with strict dependency rules and a `Shared/` layer for common abstractions.

### Feature Becomes a Monolith

One feature (usually `Billing` or `Core`) grows to 50+ files while others stay at 5. The monolith feature has the same problems as layer-based structure — poor cohesion within it. Split the monolith into sub-features.

---

## Patterns

### Gradual Adoption Pattern

Migrate one feature at a time from layer-based to feature-based structure. Start with the most self-contained domain (e.g., `Billing`) and validate the approach before converting others.

### Shared Kernel Pattern

Maintain a top-level `app/Shared/` or `app/Kernel/` directory for truly cross-cutting code: base controllers, helpers, and shared models like `User`. This prevents duplication while keeping features independent.

### Feature Flag Pattern

Use environment-based feature flags to toggle between layer-based and feature-based implementations during migration. This allows A/B testing the new structure incrementally without full commitment.

---

## Ecosystem Usage

Laravel's default structure is layer-based, but the framework fully supports feature-based organization through its service container, autoloading, and provider system. Artisan's `stub:publish` command allows customizing generated file templates for feature-based namespaces. Third-party packages like `nwidart/laravel-modules` provide structured module support. Static analysis tools (PHPStan, Psalm) can enforce cross-feature dependency rules regardless of the chosen structure.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — core concepts of feature-based structure
- **Module Organization** (this workspace) — standardizing feature internals
- **Cross-Feature Communication** (this workspace) — preventing tight coupling
- **Large Project Structure** (this workspace) — scaling beyond simple feature organization

---

## Research Notes

- This debate parallels "package-by-layer vs package-by-feature" in Java/Spring
- Layer-based is the default in most frameworks (Rails, Django, Laravel)
- Feature-based is more common in Go and domain-driven design communities
- Neither approach affects testability — both support unit and integration tests equally
- The choice is about human cognition and team coordination, not technical capability
- Many large Laravel projects (500k+ LOC) use feature-based or modular structure
