# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Default Laravel directory structure and its design rationale
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

Laravel's default directory structure is the framework's most consequential architectural opinion. It is deliberately minimal—`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/`—prioritizing immediate productivity over strict layering. The `app/` directory bundles all application code (Controllers, Models, Providers, etc.) under a single root namespace `App\`, with subdirectories organized by technical role (Http, Console, Exceptions). This structure is designed as a starting point, not a rigid constraint: Laravel imposes almost no restrictions on class placement as long as Composer can autoload. Understanding the design tradeoffs embedded in this default structure is prerequisite to any architectural decision about deviation.

---

# Core Concepts

The default structure optimizes for rapid onboarding and framework convention over custom architecture. Every top-level directory maps to a framework concern:

- `app/` — Application code, auto-loaded via `App\` namespace under PSR-4.
- `bootstrap/` — Framework bootstrapping (`app.php`) and cached route/services.
- `config/` — Configuration files, each returning an array loaded by key.
- `database/` — Migrations, factories, seeders, SQLite storage.
- `public/` — Web server document root, `index.php` entry point, assets.
- `resources/` — Views (Blade), compiled assets (Vite), language files.
- `routes/` — Route definitions split by concern: `web.php`, `api.php`, `console.php`, `channels.php`.
- `storage/` — Compiled templates, logs, cache, session files, local uploads.
- `tests/` — Test files mirroring `app/` structure, with `Feature/` and `Unit/` split.
- `vendor/` — Composer dependencies, never committed.

Within `app/`, the subdirectories (`Http/`, `Console/`, `Models/`, `Providers/`, `Exceptions/`) are organized by technical concern, not business domain. This is the "layered within a namespace" approach: all Controllers in one folder, all Models in another, regardless of what business concept they represent.

---

# Mental Models

**The "Convention over Configuration" handler:** Taylor Otwell designed the structure so that a developer who understands the framework conventions can open any Laravel project and immediately find Controllers in `app/Http/Controllers/`, routes in `routes/web.php`, and Models in `app/Models/`. This predictability is the primary value.

**The "Starting Point" scaffold:** The official documentation describes the structure as "intended to provide a great starting point for both large and small applications." It is not presented as an end-state architecture but as a scaffold that teams are free to reorganize.

**The "Technical Slicing" axis:** The default structure groups code by what it does technically (HTTP handling, database interaction, console commands) rather than what business problem it solves. This is the layer-based organizational axis, contrasted with feature-based or domain-based axes.

---

# Internal Mechanics

PSR-4 autoloading in `composer.json` maps `App\` to the `app/` directory. Any class created anywhere under `app/` with the corresponding namespace is autoloaded without manual registration. This is the mechanism that makes custom directory extensions work:

```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Database\\Factories\\": "database/factories/",
      "Database\\Seeders\\": "database/seeders/"
    }
  }
}
```

Laravel's service container and `artisan make:` commands generate classes into these default directories. The `ShowModelCommand`, for instance, places models in `app/Models/`. Custom artisan commands go to `app/Console/Commands/`. This convention extends to package development, where service providers are typically placed under `app/Providers/`.

The structure is version-sensitive. Laravel 11 removed several default directories (`Http/Middleware/`, `Http/Kernel.php`, `Console/Kernel.php`, `Exceptions/Handler.php`) that were previously generated—these classes now live in the framework bootstrap, only generated when customized. This trend toward minimalism continued in Laravel 12.

---

# Patterns

**Convention-based command generation:** `php artisan make:controller`, `make:model`, `make:mail`, etc., all follow directory conventions. Knowing these defaults means knowing where generated files land without reading documentation.

**The "app/" as a single root:** Unlike Symfony's `src/` or Rails' `app/` with deeply nested conventions, Laravel keeps everything under one `app/` with shallow subdirectories. This makes cross-referencing (seeing all controllers at once) easy but creates namespace collisions at scale.

**Routes as entry points:** `routes/web.php` and `routes/api.php` are the documented entry points. Controllers in `app/Http/Controllers/` are the handlers. This three-hop pattern (Route → Controller → Model) is the default request lifecycle.

---

# Architectural Decisions

**When to stay with defaults:** Projects under 3-5 engineers, CRUD-heavy applications with straightforward business rules, and projects where rapid shipping is the priority over long-term maintainability benefit from staying close to defaults.

**When to deviate:** Growing teams, multiple business domains with distinct logic, complex business rules that aren't well-served by the Controller → Model pattern, and applications expected to live 5+ years.

**The default is not wrong:** Many teams internalize that "real" applications need custom architecture. Laravel's default structure powers production applications at scale. The decision to deviate should be driven by measurable pain, not architectural fashion.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Immediate developer familiarity | No business-domain grouping | Files for different business concepts mix in the same folder |
| Framework conventions work out-of-box | Technical-layer coupling | Business logic spreads across controllers, models, and helpers |
| Minimal decisions on day one | No explicit module boundaries | Refactoring to modular structure later requires migration |
| Shallow directory tree | Namespace collisions at scale | `UserController` and `User` model coexist but domain-specific classes conflict |

---

# Performance Considerations

The directory structure itself has negligible performance impact. However, deeper nested directories can affect IDE file navigation. Laravel's `composer dump-autoload` generates optimized class maps for production, making autoloading O(1) regardless of directory depth.

Config caching (`php artisan config:cache`) and route caching (`php artisan route:cache`) are unaffected by directory structure. Event caching (`php artisan event:cache`) similarly works regardless of where event classes reside.

---

# Production Considerations

When deploying, ensure custom directory additions are reflected in `composer.json` autoload section. Run `composer dump-autoload -o` after modifying autoload mappings. The `-o` flag generates an optimized class map, critical for production performance.

Custom directory structures must be documented in team onboarding. The default structure is self-documenting because every Laravel developer recognizes it. Custom structures require README files explaining where code lives.

Octane does not affect directory structure decisions. Files are read from disk at boot time and cached thereafter.

---

# Common Mistakes

**Assuming default structure = no structure:** New teams often treat `app/` as a flat dumping ground, adding files without namespace organization. Even within defaults, subdirectories should be used for grouping.

**Fighting the framework:** Creating custom directory structures that break `artisan make:` conventions without documenting the new locations. Developers then create files in wrong locations.

**Over-organization before pain:** Creating deeply nested custom structures on day one for an application that doesn't yet exist. Architecture should respond to demonstrated complexity.

---

# Failure Modes

**Namespace collision:** Two packages or app classes with the same name cause autoloading conflicts. Eg, `App\Services\PaymentService` and `Vendor\Package\PaymentService`.

**Class not found after adding custom directory:** Failure to update `composer.json` PSR-4 mapping results in runtime class loading errors.

**IDE confusion with deep nesting:** Extremely deep directory structures (>6 levels) cause IDE file tree rendering issues and navigation slowdowns.

---

# Ecosystem Usage

Laravel's own packages follow the default conventions. Spatie packages place config in `config/`, migrations with timestamps, and service providers in standard locations. First-party packages (Horizon, Telescope, Pulse, Reverb) use the default directory structure for their published assets.

The `artisan` CLI generates code assuming the default structure. Commands like `make:model -a` (all: model, migration, factory, seeder, controller, requests, policy) assume standard directories.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| PHP PSR-4 autoloading basics | COS-02 Layer-based organization | COS-09 When to deviate from defaults |
| Composer autoload configuration | COS-04 Namespace conventions | COS-10 Team-scale strategies |

---

# Research Notes

The official Laravel documentation explicitly states the structure is a starting point, not a constraint. This is critical context: the default structure is intentionally flexible. Taylor Otwell has repeatedly stated that the framework should not dictate architecture decisions, only provide sensible defaults. This philosophy underpins the entire code organization subdomain.
