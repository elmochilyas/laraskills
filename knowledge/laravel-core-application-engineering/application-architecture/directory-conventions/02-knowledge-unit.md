# Laravel Directory Conventions & Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Laravel Directory Conventions & Organization
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel's directory structure is a convention-based scaffold that organizes application code by technical layer. The default layout (`app/`, `config/`, `database/`, `resources/`, `routes/`, `storage/`, `tests/`) was designed for CRUD applications with a small number of concerns and has remained structurally stable across major Laravel versions, with the notable simplification in Laravel 11+ that removed several default directory stubs.

The directory convention serves two purposes: it establishes a predictable file layout that all Laravel developers understand without documentation, and it maps directly to PSR-4 autoloading so that the `App\` namespace resolves to `app/` without additional configuration. This tight coupling between filesystem structure and namespace resolution is the foundation upon which all organizational decisions are built.

The critical architectural decision is when to depart from conventions and how. The community consensus, supported by every major production framework analysis, is that default conventions should be maintained until the application demonstrates a clear need for deviation — typically at 20-30 files within a single directory or when team boundaries require separate module directories. Departure from convention is earned by complexity, not chosen by preference.

---

## Core Concepts

### Default Laravel Structure

The Laravel 11+ default structure (simplified from earlier versions):

```
project-root/
├── app/               -- Application code (PSR-4: App\)
│   ├── Http/
│   │   ├── Controllers/
│   │   └── Middleware/
│   ├── Models/        -- Eloquent models
│   ├── Providers/     -- Service providers
│   └── ...            -- Application-specific directories
├── bootstrap/         -- Application bootstrap files, cache
├── config/            -- Configuration files
├── database/          -- Migrations, factories, seeders
├── public/            -- Web server document root
├── resources/         -- Views, assets, language files
├── routes/            -- Route definitions (web.php, api.php, console.php)
├── storage/           -- Logs, cache, compiled views, user uploads
├── tests/             -- Test suite (PHPUnit/Pest)
└── vendor/            -- Composer dependencies
```

Key differences from Laravel 10-:
- `app/Console/Commands` and `app/Exceptions` are no longer created by default (generated when needed)
- `app/Http/Middleware` is created by default in Laravel 11+, reflecting middleware configuration in `bootstrap/app.php`
- `app/Providers/EventServiceProvider` and `app/Providers/AuthServiceProvider` are not created by default; their functionality is configured via the Event and Auth directories

### PSR-4 Namespace Mapping

The `composer.json` autoload configuration maps `App\` to `app/`:
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

This means `App\Services\PaymentService` resolves to `app/Services/PaymentService.php`. The namespace and directory must match case-sensitively on case-sensitive filesystems (Linux, Docker).

Adding new directories under `app/` (e.g., `app/Services/`, `app/Actions/`, `app/DTOs/`) works automatically because PSR-4 maps the `App\` prefix to `app/`. Adding directories outside `app/` requires a new PSR-4 entry or PSR-0/classmap autoloading.

### Structure Evolution Across Laravel Versions

- **Laravel 5-10:** Controllers, Middleware, Requests, and Resources were default subdirectories under `app/Http/`. `Commands/`, `Events/`, `Listeners/`, `Jobs/`, `Mail/`, `Notifications/`, `Policies/`, `Rules/`, `Exceptions/` were all created by default.
- **Laravel 11+:** Streamlined default structure. Only essential directories are created. Others are generated on demand via `artisan make:` commands.
- **Impact:** The streamlined structure reduces cognitive overhead for new projects but means teams must decide their own organizational conventions earlier in the project lifecycle.

### Artisan Generate Conventions

The `make:` commands follow the directory structure established by convention:
- `php artisan make:controller UserController` → `app/Http/Controllers/UserController.php`
- `php artisan make:model User` → `app/Models/User.php`
- `php artisan make:rule StrongPassword` → `app/Rules/StrongPassword.php`
- `php artisan make:event UserRegistered` → `app/Events/UserRegistered.php`

These conventions can be overridden by specifying subdirectories:
- `php artisan make:controller Api/V2/UserController` → `app/Http/Controllers/Api/V2/UserController.php`
- The namespace is automatically generated as `App\Http\Controllers\Api\V2`

---

## Mental Models

### Filing Cabinet vs Workshop
The conventional structure is a filing cabinet — every type of document has a designated drawer (controllers in `Controllers/`, models in `Models/`). This works well for small organizations (small applications) where each drawer has few documents. As the application grows, the filing cabinet becomes a workshop — you need benches organized by project (domain) rather than by tool type. The transition from filing cabinet to workshop is the decision point for adopting domain-based or modular organization.

### Convention as Cognitive Offload
The directory convention exists so developers don't have to decide where each file goes. Every `artisan make:` command has a predictable output location. This cognitive offload is the primary benefit of convention over configuration. The cost is paid when the convention location no longer serves the application's organization needs — files spread across many directories become hard to navigate because related files are not co-located.

### Filesystem as Namespace Mirror
The directory structure is not decorative — it is the physical manifestation of the PHP namespace hierarchy. `App\Services\Payment\StripeService` must live at `app/Services/Payment/StripeService.php`. This one-to-one mapping means directory decisions are namespace decisions, and namespace decisions are import/use decisions. Changing a directory structure changes every `use` statement, which is why structural changes are expensive.

### Maximum Directory Depth
PHP PSR-4 has no technical depth limit, but practical limits emerge:
- Depth 1-2 (`app/Models/`, `app/Http/Controllers/`) — conventional, every developer knows
- Depth 3-4 (`app/Http/Controllers/Api/V2/`) — organized but still navigable
- Depth 5+ (`app/Domain/Sales/ValueObjects/Types/Currency.php`) — signals over-engineering or missing abstraction

A useful rule: if a directory path exceeds 3 levels, the organization scheme should be reconsidered.

---

## Internal Mechanics

### Composer's Autoloader Resolution

When a class is referenced (e.g., `new App\Services\PaymentService()`), Composer's autoloader:
1. Checks the PSR-4 prefix map for `App\`
2. Strips the prefix (`App\`) from the fully qualified class name → `Services\PaymentService`
3. Converts namespace separators to directory separators → `Services/PaymentService`
4. Appends `.php` → `Services/PaymentService.php`
5. Prepends the mapped directory → `app/Services/PaymentService.php`
6. Attempts `include`/`require` on the resulting path

This means the autoloader resolution is entirely deterministic — given a namespace, the file path is computable without any configuration.

### Classmap vs PSR-4 Autoloading

PSR-4 is the standard for application code because:
- It does not regenerate the autoloader on every file addition
- It follows a predictable namespace-to-path mapping
- It supports PHP 8+ strict typing and namespace conventions

Classmap autoloading is used for:
- Legacy libraries that don't follow PSR-4
- Dynamically generated classes (compiled template classes, cached config)
- Performance optimization (classmap is faster for very large codebases)

The `artisan optimize` command generates a classmap for the `app/` directory, combining PSR-4's development convenience with classmap's production speed.

### Bootstrap Cache Interaction

Several `bootstrap/cache/` files interact with directory conventions:
- `bootstrap/cache/packages.php` — cached package service provider discovery
- `bootstrap/cache/services.php` — cached deferred provider manifest
- `bootstrap/cache/config.php` — cached merged configuration
- `bootstrap/cache/routes-v7.php` — cached route collection (Laravel 11+)

These files are named by version to prevent stale cache loading during deployments. The `bootstrap/` directory is not in `app/` because bootstrap code must be available before the `App\` namespace autoloader is fully configured.

### Directory Generation Conventions

When `artisan make:` creates a file in a non-existent subdirectory, it creates the directory structure automatically. For example, `php artisan make:controller Api/V2/OrderController` creates `app/Http/Controllers/Api/V2/` if it doesn't exist. This automatic generation means the filesystem structure evolves organically with development.

---

## Patterns

### Technical Layer Organization
Files are organized by what they are (controllers, models, services) rather than what they do (sales, billing, inventory). This is the default Laravel pattern and the best choice for applications under 50 files.

```
app/
├── Http/Controllers/    -- All HTTP controllers
├── Models/              -- All Eloquent models
├── Services/            -- All service classes
├── Actions/             -- All action classes
├── DTOs/                -- All data transfer objects
└── Providers/           -- All service providers
```

Advantages: predictable, every file type has one location, Artisan commands generate directly into correct directories.
Disadvantages: related files are scattered (a User controller, model, service, and DTO are in 4 different directories).

### Domain Organization
Files are organized by what they do, with technical subdirectories within each domain. This is the "Beyond Code" and "feature-based" pattern.

```
app/
├── Domain/
│   ├── Sales/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Actions/
│   │   └── DTOs/
│   ├── Billing/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Actions/
│   │   └── DTOs/
│   └── Inventory/
│       └── ...
└── Providers/
```

Advantages: related code is co-located, team ownership boundaries are clear, domain boundaries encourage bounded context discipline.
Disadvantages: Artisan commands generate to wrong locations (require manual moves), shared infrastructure (middleware, exceptions) needs explicit cross-domain location, namespace prefixes become verbose (`App\Domain\Sales\Controllers\OrderController`).

### Modular Organization
Each module is a top-level directory under `app/` or in a separate `modules/` directory, acting as an independent sub-application.

```
app/
├── Modules/
│   ├── Sales/
│   │   ├── Http/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Providers/
│   │   └── database/
│   └── Billing/
│       └── ...
├── Shared/               -- Cross-module infrastructure
│   ├── Middleware/
│   ├── Exceptions/
│   └── Providers/
└── ...
```

Advantages: strong isolation, modules can be extracted to independent packages, clear ownership for large teams.
Disadvantages: high overhead (each module needs its own providers, routes, migrations), inter-module communication requires contracts/events, not supported by Artisan commands natively.

### Hybrid Technical-Domain Organization
A pragmatic middle ground: technical layer at the top level, domain subdirectories within each layer.

```
app/
├── Http/Controllers/
│   ├── Sales/
│   ├── Billing/
│   └── Inventory/
├── Models/
│   ├── Sales/
│   ├── Billing/
│   └── Inventory/
└── Services/
    ├── Sales/
    ├── Billing/
    └── Inventory/
```

Advantages: maintains Artisan command predictability, groups related files within each layer, easy to navigate for developers familiar with Laravel.
Disadvantages: related multi-layer files (Sales controller, Sales service) are still in different top-level directories, domain boundaries are less explicit.

---

## Architectural Decisions

### Why app/ Is Flat by Default
Laravel's default flat `app/` structure (Models, Http, Providers as siblings rather than organized by domain) is a deliberate choice for developer onboarding. A new Laravel developer sees the same structure as every other Laravel project. The flat structure also reduces the namespace prefix length: `App\Models\User` is shorter than `App\Domain\Users\Models\User`.

### Why Technical Layer Before Domain
The default conventions organize by technical layer because the framework's target audience is developers building CRUD applications. For CRUD, technical organization is simpler: all controllers are in one place, all models are in one place, and the relationship between them is obvious. Domain organization becomes valuable only when the application has multiple bounded contexts with different team ownership.

### Why Convention Over Configuration
Laravel's philosophy of convention over configuration means the framework makes organizational decisions so developers don't have to. The decision is opinionated: "this is where controllers go, this is where models go." The benefit is zero-time decision-making for routine files. The cost is that non-conventional organization requires explicit configuration or deviation from Artisan conventions.

### Why Laravel 11+ Simplified the Structure
The Laravel 11+ structural simplification (removing default directories for commands, events, exceptions, etc.) reflects the observation that most new projects don't immediately need these directories. Creating them on demand via `artisan make:` keeps the initial structure minimal and defers organizational decisions until the application demonstrates need. This is the convention-over-configuration principle applied to the structure itself.

---

## Tradeoffs

### Conventional vs Domain Organization
| Aspect | Conventional | Domain |
|--------|-------------|--------|
| Navigation by type | Easy (all controllers together) | Hard (controllers split across domains) |
| Navigation by feature | Hard (feature code in 4+ directories) | Easy (feature code in one directory) |
| Artisan compatibility | Full (commands target correct dirs) | Partial (commands need manual moves) |
| Team ownership | Unclear (no domain boundaries) | Clear (domain = team boundary) |
| Refactoring impact | Low (moving a controller affects one file) | High (restructuring a domain affects its subtree) |
| Overhead for small apps | None (structure is free) | High (empty domain directories) |

### Depth vs Flatness
Deep nesting creates long namespace prefixes and verbose imports but organizes large file sets. Flat directories are simpler but become unmanageable past ~30 files per directory. The tradeoff is navigability per directory vs readability per import.

### Artisan Compliance vs Custom Structure
Following Laravel's conventions means Artisan `make:` commands work without manual file moves. Custom structures require either:
- Post-generation file moves (manual, error-prone)
- Custom Artisan commands (development overhead)
- Acceptance that generated files go to conventional locations and then get moved

Teams choosing custom structures should estimate the ongoing cost of this friction against the organizational benefit.

### Shared vs Duplicated Infrastructure
In domain-driven organizations, infrastructure code (middleware, exceptions, base classes) must either be shared in a common directory or duplicated across domains. Sharing introduces coupling between domains (defeating the purpose of separation). Duplication violates DRY. The resolution: shared infrastructure for truly cross-cutting concerns (authentication, error handling), domain-specific infrastructure for domain-boundary concerns.

---

## Performance Considerations

### Autoloader Performance
PSR-4 autoloading is marginally slower than classmap autoloading because Composer must compute the file path from the namespace on each first reference. For production, `composer dump-autoload --optimize` generates a classmap from PSR-4 directories, eliminating the path computation cost.

Directory structure affects autoloader performance only in terms of file count. An `app/` directory with 500 files across 10 subdirectories autoloads identically to one with 100 files across 2 subdirectories — the autoloader is O(1) per class reference regardless of directory depth.

### Artisan Generate Overhead
Each `make:` command parses stub files and determines target directories based on conventions. Custom structures that deviate from conventions do not increase Artisan's runtime directly, but the manual post-generation steps (moving files, adjusting namespaces) add development time.

### IDE Performance
Deeply nested directory structures can slow IDE file navigation and code completion. Modern IDEs handle 5-10 levels without issue, but directory trees with 500+ directories across 10+ levels show measurable lag in file tree rendering and "find file" operations.

---

## Production Considerations

### Deployment Directory Permissions
The `storage/` and `bootstrap/cache/` directories must be writable by the web server user. All other directories should be read-only. Deployment scripts should verify permissions:
- `storage/` — writable (logs, cache, compiled views, sessions)
- `bootstrap/cache/` — writable (config cache, routes cache, services manifest)
- Everything else — readable

### Directory Presence Verification
Production monitoring should verify that required directories exist. A missing `storage/logs/` directory causes silent log failures. A missing `bootstrap/cache/` directory causes config caching errors.

### Multi-Server Directory Consistency
In load-balanced environments with multiple web servers, all servers must have identical directory structures. Any discrepancy (e.g., a server missing a newly added directory from a deployment) causes autoloading failures on that server. Deployment automation should create any new directories before application code references them.

### Artifact-Based Deployments
Artifact-based deployments (building the application on a CI server and deploying the compiled artifact) must include all directories that the application references. Directories created by Artisan commands during local development may not exist in the artifact. The solution: ensure any custom directories are created during the build step or via a deployment script.

---

## Common Mistakes

### Creating Excessive Top-Level Directories
Adding `app/Services/`, `app/Actions/`, `app/DTOs/`, `app/Repositories/`, `app/Enums/`, `app/Traits/`, `app/Helpers/`, `app/ValueObjects/`, `app/Events/`, `app/Listeners/`, `app/Jobs/`, `app/Mail/`, `app/Notifications/`, `app/Policies/`, `app/Rules/` — all on day one of a new project. This creates an organization structure for files that don't exist yet, leading to empty directories and premature architectural decisions. Add directories when files need them.

### Mixing Organization Strategies
Having both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php` in the same project. This creates ambiguity about where new files should go. Choose one convention and apply it consistently across the entire application.

### Case-Sensitivity Mismatches
On Linux servers, `App\Models\User` resolves to `app/Models/User.php` but not `app/models/User.php`. Local development on macOS (case-insensitive by default) won't catch this mismatch. Deployment fails with "class not found" errors. Solution: enforce case-consistent naming with a CI check (`composer dump-autoload` + verify autoloading works).

### Namespace-Directory Desynchronization
Moving a file without updating its namespace (or vice versa). PHP 8+ catches this at parse time (class not found), but dynamic class references (strings passed to `app()->make()`) fail at runtime. This is the most common production autoloading error.

---

## Failure Modes

### Class Not Found Due to Autoloader Cache
When a new directory is added under `app/` during development but the autoloader is not regenerated, classes in the new directory may not be found. The fix: `composer dump-autoload`. This is a development-only failure; production environments typically use classmap autoloading which regenerates during deployment.

### Missing Bootstrap Cache Directory
If `bootstrap/cache/` does not exist and the application tries to write a cache file (config:cache, route:cache), the write fails silently or throws a runtime exception depending on PHP error settings. Production deployments must ensure this directory exists and is writable.

### Vendor Directory in Production
If `vendor/` is missing or incomplete, the application fails immediately at the first `require vendor/autoload.php`. Always verify `vendor/` exists as part of deployment health checks.

### Symlink Resolution Issues
If `public/storage` is not linked to `storage/app/public`, file uploads and public assets fail. This is a Laravel-specific directory convention that is easy to miss during initial server setup. Verify with `php artisan storage:link`.

---

## Ecosystem Usage

### Spatie Packages
Spatie packages typically follow the typical package directory structure (`src/`, `config/`, `resources/`, `tests/`). Their `src/` directory uses PSR-4 mapped to the package namespace. They do not modify the application's directory structure but may create directories during setup (e.g., `spatie/laravel-medialibrary` creates `storage/app/public/` for media files).

### Laravel Jetstream & Breeze
These first-party starter kits extend the conventional structure:
- Add `app/Actions/` for team-related operations (CreateTeam, DeleteUser, etc.)
- Add `app/Jetstream/` for Jetstream-specific classes
- Follow the conventional structure for everything else

### Monica CRM (Production Reference)
Monica CRM, an open-source Laravel application with 100,000+ lines of code, follows the conventional technical-layer organization with domain-based subdirectories within each layer:
- `app/Http/Controllers/` with domain subdirectories (`Account/`, `Contacts/`, `Settings/`)
- `app/Services/` with domain subdirectories
- No domain-level directory grouping — all domains share the same technical directories

This validates the hybrid pattern as a viable approach for large applications.

### nwidart/laravel-modules Package
This popular package adds a `modules/` directory at the project root with its own PSR-4 mapping. Each module has its own `Providers/`, `Http/`, `Models/`, `database/`, `Resources/` directories. This is the modular organization pattern implemented as a package.

---

## Related Knowledge Units

- **Feature-based Application Structure** — Domain and modular organization patterns built on top of directory conventions
- **Service Layer Pattern** — Where service classes live in different organization schemes
- **Action Pattern** — Action class directory placement in technical vs domain organization
- **Configuration Management** — The `config/` directory structure and its conventions
- **Bootstrapping Lifecycle** — How `bootstrap/` interacts with directory conventions for cache files

---

## Research Notes

### Source Analysis
- Composer's PSR-4 autoloading specification — the technical foundation
- Laravel's `composer.json` — the default autoload configuration
- Laravel 11 vs 10 default structure comparison — the evolution of conventions
- Monica CRM and Akaunting directory structures — production validation of hybrid pattern

### Key Insight
The most robust finding across all production Laravel applications studied is that none of them follow a "pure" domain or technical organization. Every production codebase uses a hybrid approach, with the majority adopting technical-layer organization at the top level and domain-based subdirectories within each layer. The "either/or" framing of technical vs domain organization is a false dichotomy — production codebases use a contextual combination.

### Version-Specific Notes
- Laravel 11+ default structure is simplified but fully backward-compatible — the old directories still work if created
- `artisan make:` commands in Laravel 11+ generate to the same locations as in Laravel 10-
- The `bootstrap/app.php` file in Laravel 11+ adds configuration that was previously in `app/Http/Kernel.php` and `app/Exceptions/Handler.php`
- No version-specific breaking changes to directory conventions across Laravel 10-13
