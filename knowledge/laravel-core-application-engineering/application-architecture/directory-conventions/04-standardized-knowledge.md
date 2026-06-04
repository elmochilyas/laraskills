# ECC Standardized Knowledge — Directory Conventions

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Application Architecture & Structure |
| **Knowledge Unit** | Directory Conventions |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — Project Structure |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel's directory structure is a convention-based scaffold that organizes application code by technical layer. The default layout (`app/`, `config/`, `database/`, `resources/`, `routes/`, `storage/`, `tests/`) establishes a predictable file layout that all Laravel developers understand without documentation. It maps directly to PSR-4 autoloading so that the `App\` namespace resolves to `app/` without additional configuration.

The critical architectural decision is when to depart from conventions and how. The community consensus: default conventions should be maintained until the application demonstrates a clear need for deviation — typically at 20-30 files within a single directory or when team boundaries require separate module directories.

---

## Core Concepts

### Default Structure (Laravel 11+)
- `app/` — application code (PSR-4: `App\`)
- `bootstrap/` — bootstrap files, cache
- `config/` — configuration files
- `database/` — migrations, factories, seeders
- `public/` — web server document root
- `resources/` — views, assets, language files
- `routes/` — route definitions
- `storage/` — logs, cache, compiled views
- `tests/` — test suite

### PSR-4 Namespace Mapping
`App\` maps to `app/`. `App\Services\PaymentService` resolves to `app/Services/PaymentService.php`. Adding directories under `app/` works automatically.

### Artisan Generate Conventions
`php artisan make:controller UserController` → `app/Http/Controllers/UserController.php`. Subdirectories are supported: `Api/V2/UserController` generates into `app/Http/Controllers/Api/V2/`.

### Structure Evolution
Laravel 11+ streamlined: only essential directories created by default. Others generated on demand via `make:` commands.

---

## When To Use

- **New Laravel projects** — start with the default structure
- **Small applications** (<50 files) — technical layer organization is sufficient
- **Single-team projects** — team ownership boundaries don't require domain separation
- **CRUD applications** — technical organization maps naturally to CRUD operations

---

## When NOT To Use

- **Large applications** (500+ files) — flat technical layers become unmanageable
- **Multi-team projects** — domain boundaries improve team ownership
- **Modular monoliths** — each module needs independent structure
- **DDD implementations** — domain organization aligns with bounded context discipline

---

## Best Practices

### Start with Default, Evolve When Needed
Use the default structure. Add `app/Services/`, `app/Actions/`, `app/DTOs/` when files warrant them, not on day one.

**Why:** Premature directory creation leads to empty folders and architectural decisions made without context. Conventions are earned by complexity.

### Maintain Case Consistency
Namespace and directory must match case-sensitively. `App\Models\User` → `app/Models/User.php`.

**Why:** Case-insensitive filesystems (macOS) won't catch mismatches. Deployment to Linux fails with "class not found" errors.

### Choose One Strategy
Use technical-layer top level with domain subdirectories within each layer. Avoid mixing `app/Services/` and `app/Domain/Payment/Services/`.

**Why:** Mixed strategies create ambiguity about where new files belong. Consistent conventions reduce cognitive load.

### Avoid Excessive Nesting
Keep directory depth ≤ 3 levels. Depth 4+ signals over-engineering.

**Why:** Deep nesting creates verbose namespace prefixes and makes imports harder to read. It also slows IDE navigation.

---

## Architecture Guidelines

### Organization Patterns

**Technical Layer** (Default): Files organized by type — all controllers together, all models together. Best for small applications.

**Domain Organization**: Files organized by business domain with technical subdirectories within each. Best for large applications with clear bounded contexts.

**Modular**: Each module is independent with its own technical structure. Best for multi-team applications and eventual extraction.

**Hybrid** (Recommended): Technical layer at top level, domain subdirectories within each layer. Balances Artisan compatibility with domain organization.

### PSR-4 Autoloader Resolution
Composer strips the registered prefix, converts namespace separators to directory separators, appends `.php`, and prepends the mapped directory. The resolution is entirely deterministic.

---

## Performance Considerations

### Autoloader Performance
PSR-4 is marginally slower than classmap but negligible. `composer dump-autoload --optimize` generates a classmap for production.

### Directory Depth Impact
No measurable performance impact — autoloader is O(1) per class reference regardless of depth.

### IDE Performance
500+ directories across 10+ levels shows measurable lag in file tree rendering. Keep depth manageable.

---

## Security Considerations

### Directory Permissions
- `storage/` — must be writable by web server user
- `bootstrap/cache/` — must be writable
- Everything else — read-only

### Vendor Directory Integrity
If `vendor/` is compromised, autoloading can be hijacked. Protect with filesystem permissions and integrity checking.

---

## Common Mistakes

### Creating Excessive Top-Level Directories
Desc: Adding Services/, Actions/, DTOs/, Repositories/, Enums/, Traits/, Helpers/ on day one.
Cause: Anticipating future needs without current justification.
Consequence: Empty directories, premature architecture decisions.
Better: Add directories when files need them.

### Mixing Organization Strategies
Desc: Having both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php`.
Cause: Inconsistent adoption of organizational patterns.
Consequence: Ambiguity about where new files belong.
Better: Choose one convention and apply it consistently.

### Case-Sensitivity Mismatches
Desc: `app/Models/User.php` in code but `app/models/user.php` on disk.
Cause: Case-insensitive local development.
Consequence: Production deployment fails with class not found.
Better: Enforce case-consistent naming with CI checks.

---

## Anti-Patterns

### Technical-Before-Domain Dogma
Insisting on pure technical organization for a 100k-line application with multiple teams. Technical organization scatters related files across 10+ directories, making feature development require opening files in unrelated locations.

### Domain-Before-Technical Dogma
Insisting on pure domain organization for a 20-file CRUD application. Creates empty domain directories and forces developers to navigate deep namespace prefixes for simple operations.

### Structure by Developer Role
Organizing directories by who writes the code (admin, frontend, backend) rather than by what the code does. This creates arbitrary boundaries that don't map to the business domain.

---

## Examples

### Default Laravel Structure
```
app/
├── Http/Controllers/
├── Http/Middleware/
├── Models/
├── Providers/
├── Services/     (added when needed)
└── Actions/      (added when needed)
```

### Hybrid Pattern (Recommended)
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

---

## Related Topics

### Prerequisites
- **Application Class** — The Application instance and its path resolution

### Closely Related
- **Feature-based Application Structure** — Domain and modular organization patterns
- **Service Layer Pattern** — Where service classes live in different schemes
- **Action Pattern** — Action class directory placement

### Advanced
- **Module Auto-Discovery** — How modules register within custom directory structures
- **PSR-4 vs Classmap** — Autoloading strategy for custom directory layouts

### Cross-Domain
- **Data & Storage Systems** — `database/` and `storage/` directory conventions

---

## AI Agent Notes

### Important Decisions
- Laravel 11+ removed several default directories (Commands, Events, Listeners, etc.)
- The `lang/` directory replaced `resources/lang/` in Laravel 9
- The `bootstrap/app.php` file in Laravel 11+ adds config previously in Kernel.php and Handler.php
- Artisan `make:` commands still generate to conventional locations even in Laravel 11+

### Important Constraints
- Every directory under `app/` must match the `App\` PSR-4 prefix
- Directories outside `app/` need new PSR-4 entries in `composer.json`
- `bootstrap/` is NOT under `app/` because bootstrap must be available before the `App\` namespace autoloader

### Rules Generation Hints
- Enforce maximum directory depth of 3 levels
- Enforce case-consistency between namespace and directory path
- Enforce single organizational strategy per project

---

## Verification

This document has been validated against:
- Composer PSR-4 autoloading specification
- Laravel's default `composer.json` autoload configuration
- Laravel 11 vs 10 default structure comparison
- Production codebases (Monica CRM, Akaunting) validating hybrid pattern
