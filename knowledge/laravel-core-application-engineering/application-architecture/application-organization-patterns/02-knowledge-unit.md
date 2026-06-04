# Application Organization Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Application Organization Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Application organization patterns determine how code is grouped within a Laravel project. The three primary patterns are **technical-layer** (group by file type: all controllers together), **domain-driven** (group by business domain: all billing files together), and **modular** (each domain is a self-contained sub-application with its own providers and routes). Hybrid approaches combine aspects of multiple patterns.

The engineering value is matching the organizational structure to the team size, application complexity, and domain boundaries. The default technical-layer pattern is optimal for small teams and simple CRUD applications. Domain-driven and modular patterns become valuable at 20-50+ models or when multiple teams own different parts of the application.

---

## Core Concepts

### Technical-Layer Organization (Default)

```
app/
  Http/Controllers/    # All controllers
  Models/              # All models
  Services/            # All services
  Actions/             # All actions
  Providers/           # All providers
```

- **When to use:** Small teams (<5 devs), <20 models, simple CRUD
- **Advantages:** Artisan commands work natively, every developer knows the structure, minimal namespace depth
- **Disadvantages:** Related files are scattered, no domain boundaries, team ownership is unclear

### Domain-Driven Organization

```
app/
  Domain/
    Billing/
      Controllers/
      Models/
      Services/
      Actions/
      Providers/
    Users/
      Controllers/
      Models/
      Services/
```

- **When to use:** 20-50 models, multiple distinct business domains, team ownership per domain
- **Advantages:** Related code co-located, clear bounded contexts, team ownership boundaries
- **Disadvantages:** Artisan commands need manual moves, deeper namespaces, cross-domain sharing requires contracts

### Modular Organization

```
app/
  Modules/
    Billing/
      Http/Controllers/
      Models/
      Providers/
      routes.php
      database/migrations/
    Users/
      ...
  Shared/
    Middleware/
    Exceptions/
```

- **When to use:** 50+ models, multiple teams, potential package extraction
- **Advantages:** Strong isolation, extractable to packages, clear ownership
- **Disadvantages:** Highest overhead, inter-module communication via contracts/events, autoloading config needed

### Hybrid Technical-Domain

```
app/
  Http/Controllers/
    Billing/
    Users/
  Models/
    Billing/
    Users/
  Services/
    Billing/
    Users/
```

- **When to use:** Pragmatic middle ground, team familiar with Laravel conventions
- **Advantages:** Maintains Artisan compatibility, groups within each layer, easy navigation
- **Disadvantages:** Multi-layer domain files still in different top-level directories, less explicit domain boundaries

---

## Mental Models

### The Filing Cabinet Model

Technical-layer is one drawer per document type: all contracts in one drawer, all invoices in another. Domain-driven is one drawer per client: all documents for Client A in one drawer. Modular is one filing cabinet per department. The model helps teams visualize where to find and place files.

### The Growth Trajectory

Every Laravel application starts as technical-layer (the default). The organizational pattern should evolve with the application, not be chosen at the start. A 5-model app that starts modular pays overhead for no benefit. A 100-model app that stays technical-layer pays navigation debt on every change. The growth trajectory determines when to switch patterns.

### The Ownership Boundary

Organizational patterns are primarily about team coordination, not code organization. Technical-layer assumes one team owns everything. Domain-driven and modular patterns encode ownership boundaries into the directory structure. The pattern should match the team structure.

---

## Internal Mechanics

### Autoloading Compatibility

Technical-layer uses default PSR-4 autoloading for `App\` -> `app/`. Domain-driven and modular patterns require either PSR-4 sub-namespaces or explicit `composer.json` configuration:

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "App\\Domain\\": "app/Domain/",
            "App\\Modules\\": "app/Modules/"
        }
    }
}
```

Without proper autoloading configuration, namespaced classes in domain or module directories will not be found at runtime.

### Service Provider Registration

Each module in a modular pattern requires its own service provider registered in `config/app.php`. Domain-driven patterns can use a single provider per domain or a shared provider. Technical-layer uses the default `AppServiceProvider` or a handful of global providers.

### Artisan Generator Behavior

`php artisan make:controller UserController` places the file in `app/Http/Controllers/` regardless of the organizational pattern. Domain and modular patterns require manual file moves or custom generator commands after generation. This is the primary friction point for non-technical patterns — every generated file must be moved to its domain directory.

---

## Patterns

### Technical-Layer Pattern

The default Laravel convention. Code is grouped by technical role. This is the simplest pattern but does not scale beyond ~20 models. It is the recommended starting point for all projects.

### Domain-Driven Pattern

Code is grouped by business domain. Requires manual file moves after generation. Provides clear ownership boundaries. Best for applications with 20-50 models across 3-5 distinct business domains.

### Modular Pattern

Each module is a self-contained sub-application. Requires per-module service providers, autoloading configuration, and inter-module communication via contracts or events. Best for applications with 50+ models and multiple teams.

### Migration Path: Technical → Domain

```
Phase 1: Identify domain boundaries
Phase 2: Create app/Domain/{Domain}/ directories
Phase 3: Move files per domain (one domain at a time)
Phase 4: Update namespaces and imports
Phase 5: Extract shared models to app/Models/ or app/Shared/
```

### Migration Path: Technical → Modular

```
Phase 1: Create app/Modules/{Module}/ and app/Shared/
Phase 2: Add PSR-4 autoloading for modules
Phase 3: Create service provider per module
Phase 4: Move files per module
Phase 5: Extract shared infrastructure to app/Shared/
```

---

## Architectural Decisions

### Pattern Selection Decision Framework

```
Project size?
├── <20 models → Technical layer
├── 20-50 models → Has the app distinct bounded contexts?
│   ├── Yes → Domain-driven
│   └── No → Technical or Hybrid
└── 50+ models → Multiple teams?
    ├── Yes → Modular (module per team)
    └── No → Domain-driven with sub-features
```

### Comparison Matrix

| Aspect | Technical | Domain | Modular | Hybrid |
|---|---|---|---|---|
| Artisan compatibility | Full | Partial | None | Full |
| Team ownership | Unclear | Clear | Very clear | Partial |
| Refactoring impact | Low (move single files) | High (move subtrees) | High (move entire module) | Low |
| Co-location by feature | No | Yes | Yes | Within-layer |
| Cross-domain sharing | Implicit | Contract-based | Event-based | Implicit |
| Overhead for small apps | None | Empty directories | Provider per module | Minimal |
| Extraction to package | Impossible | Feasible | Natural | Difficult |

### Pattern Selection Based on Team Size

| Team Size | Appropriate Pattern | Rationale |
|---|---|---|
| 1-3 developers | Technical-layer | No coordination overhead needed |
| 3-8 developers | Domain-driven or Hybrid | Team members own domains |
| 8+ developers | Modular | Clear team-per-module boundaries |

---

## Tradeoffs

| Concern | Technical | Domain | Modular |
|---|---|---|---|
| Navigation speed | Fast (2-level depth) | Moderate (3-level depth) | Slower (4-level depth) |
| File generation | Native Artisan support | Manual moves required | Manual moves + provider setup |
| Cross-boundary refactoring | Simple (single file) | Complex (move subtree) | Complex (move module + update contracts) |
| Onboarding | Minimal learning curve | Must learn domain mapping | Must learn module boundaries |
| Package extraction | Impossible | Feasible | Natural |

---

## Performance Considerations

Organizational patterns have zero runtime performance impact. All patterns use PHP autoloading (composer classmap in production). The directory depth difference (2 levels vs 4 levels) does not affect filesystem access because composer generates a flat classmap in production. The performance consideration is purely developer-side: navigation time, file search speed, and IDE responsiveness.

---

## Production Considerations

- Choose the pattern at project start — retrofitting is expensive
- Document the decision rationale in the project's ADR
- Enforce boundaries with PHPStan/Psalm custom rules
- Use CODEOWNERS for team ownership in domain/modular patterns
- Keep shared kernel (`app/Shared/` or `app/Kernel/`) lean
- Never mix patterns — consistency is more important than the specific pattern
- Run `composer dump-autoload` after moving files between domains
- Test autoloading in CI to catch namespace mismatches

---

## Common Mistakes

### Premature Domain Organization

Creating domain directories for a 5-model application. The overhead of cross-domain communication patterns isn't justified.

### Mixed Organizational Signals

Having `app/Services/PaymentService.php` alongside `app/Domain/Payment/Services/PaymentService.php`. Choose one convention and apply it everywhere.

### Ignoring Bounded Contexts

Forcing domain organization without clear domain boundaries leads to cross-domain model access and tangled dependencies. Define bounded contexts before restructuring.

### Pattern Over-Engineering

Using modular pattern for a single-team application. The overhead of module service providers, inter-module contracts, and autoloading configuration is not justified when a single team owns the entire codebase.

---

## Failure Modes

### Hybrid Pattern Ambiguity

A hybrid pattern lacks clear rules for when to use `app/Controllers/` vs `app/Domain/Billing/Controllers/`. New team members guess where to place new code, creating a scattered, inconsistent structure over time. Document the hybrid decision rules explicitly.

### Autoloading Failures After Restructure

Moving files to domain directories without updating `composer.json` autoloading configuration. Classes fail to load with "Class not found" errors at runtime. Always update autoloading and run `composer dump-autoload` after structural changes.

### Circular Module Dependencies

Module A depends on Module B which depends on Module A. The modular pattern's contract-based communication makes these dependencies harder to detect than in technical-layer patterns. Enforce dependency direction rules and run dependency analysis in CI.

---

## Ecosystem Usage

Laravel's default application skeleton (created by `laravel new`) uses the technical-layer pattern. This is the framework's opinionated default and the most widely used pattern across all Laravel projects. Major ecosystem packages are designed around this default — Artisan generators, Laravel Nova, and Laravel Telescope all assume the technical-layer structure.

The `nwidart/laravel-modules` package is the most popular modular pattern implementation in the Laravel ecosystem, providing module discovery, configuration, and scaffolding. Spatie's open-source Laravel packages (laravel-permission, laravel-medialibrary, laravel-settings) typically use domain-aligned directory structures internally while remaining installable into any organizational pattern.

Production Laravel applications studied in this analysis show a clear correlation: apps under 20 models universally use the default technical-layer pattern. Apps with 20-100 models split between technical-layer and hybrid approaches. Apps over 100 models (Monica CRM, Flare, Buggregator) all use either domain-driven or modular patterns — no production application over 100 models was found using the default technical-layer pattern.

---

## Related Knowledge Units

- **Directory Conventions** (this workspace) — literal filesystem mapping that patterns build on
- **Feature-based Structure** (this workspace) — domain-driven organization at the feature level
- **Cross-Feature Communication** (this workspace) — contracts for domain boundary crossing
- **Large Project Structure** (this workspace) — scaling domain/modular patterns
- **Service Provider Strategies** (this workspace) — per-module provider registration

---

## Research Notes

- Monica CRM (100k+ LOC Laravel app) uses hybrid technical-domain pattern — validates pragmatic approach
- nwidart/laravel-modules popularizes modular pattern in Laravel
- No pure organizational pattern found in production codebases — all use hybrid approaches
- The "technical vs domain" framing is a false dichotomy in practice
- Artisan compatibility is the primary friction point for non-technical patterns
- Organizational pattern transitions happen at ~20-model and ~100-model thresholds
- Single-team applications rarely benefit from modular patterns
- CODEOWNERS enforcement is a practical proxy for architectural boundaries in monorepos
