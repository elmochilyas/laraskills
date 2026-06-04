# Application Organization Patterns

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Application Architecture & Structure
- **Knowledge Unit:** Application Organization Patterns
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02
- **ECC Phase:** 4

---

## Overview

Application organization patterns determine how code is grouped within a Laravel project. The four primary patterns are **technical-layer** (group by file type: all controllers together), **domain-driven** (group by business domain: all billing files together), **modular** (each domain is a self-contained sub-application with its own providers and routes), and **hybrid technical-domain** (technical layers with domain subdirectories). The default Laravel convention is technical-layer, which is optimal for small teams and simple CRUD applications. Domain-driven and modular patterns provide clear ownership boundaries and scale to 50+ models.

---

## Core Concepts

1. **Technical-Layer Organization (Default)** — Code grouped by technical role: all `Controllers/`, `Models/`, `Services/` in their own top-level directories. Artisan commands work natively, developers know the structure immediately, and namespace depth is minimal. The downside is that related files (e.g., all billing-related code) are scattered across directories, and team ownership boundaries are unclear.

2. **Domain-Driven Organization** — Code grouped by business domain under `app/Domain/{Domain}/`. Each domain has its own controllers, models, services, and actions co-located. This requires manual file moves after Artisan generation and deeper namespaces, but provides clear bounded contexts and ownership boundaries.

3. **Modular Organization** — Each module is a self-contained sub-application under `app/Modules/{Module}/` with its own service providers, routes, and database migrations. Modules communicate via contracts or events. This pattern has the highest overhead but enables strong isolation, team-per-module ownership, and natural package extraction potential.

4. **Hybrid Technical-Domain** — Technical layers with domain subdirectories (e.g., `app/Http/Controllers/Billing/`, `app/Models/Billing/`). Maintains Artisan compatibility while grouping within each layer. Domain files are still in different top-level directories, making boundaries less explicit than pure domain-driven organization.

5. **Migration Paths** — The recommended approach is to start with technical-layer and evolve. Transitions happen at ~20-model and ~100-model thresholds. The migration path involves identifying domain boundaries, creating domain directories, moving files one domain at a time, updating namespaces, and extracting shared models.

---

## When To Use

- **Technical-layer** — Small teams (<5 devs), fewer than 20 models, simple CRUD applications, single-team ownership, new projects (start here, evolve later)
- **Domain-driven** — 20-50 models across 3-5 distinct business domains, multiple developers owning different domains, bounded contexts are clear
- **Modular** — 50+ models, multiple teams (module per team), planned package extraction, strong isolation requirements
- **Hybrid** — Pragmatic middle ground when team is familiar with Laravel conventions but needs domain grouping within each layer

---

## When NOT To Use

- **Domain-driven for tiny apps** — Creating domain directories for apps with <20 models adds overhead without benefit; the navigation cost and manual file moves aren't justified
- **Modular for single-team** — The overhead of per-module service providers, inter-module contracts, and autoloading configuration is not justified when one team owns the entire codebase
- **Mixed patterns** — Having `app/Services/PaymentService.php` alongside `app/Domain/Payment/Services/PaymentService.php` creates ambiguity; choose one convention and apply it everywhere
- **Without bounded contexts** — Forcing domain or modular organization without clear domain boundaries leads to cross-domain model access and tangled dependencies that are worse than flat structure
- **Modular for extraction uncertainty** — If you are not sure you need to extract modules into packages, the overhead of modular organization is premature

---

## Best Practices (WHY)

1. **Start with default, evolve when it hurts** — Every Laravel application starts as technical-layer (the default). Organizational patterns should evolve with the application, not be chosen at project start. Premature domain organization pays overhead for no benefit. The trigger to reorganize is when navigating the technical-layer structure slows the team down.

2. **Define bounded contexts before restructuring** — Domain boundaries must be explicit before moving files. Without clear bounded contexts, domain directories become arbitrary groupings that don't reduce cognitive load. Map the domains first, then restructure.

3. **Document the decision rationale** — Every organizational pattern change should be documented in an ADR (Architecture Decision Record). The pattern is a team coordination mechanism — the rationale must be understood by everyone who adds files.

4. **Enforce boundaries with automation** — Use PHPStan/Psalm custom rules to prevent cross-domain access violations. Use CODEOWNERS for team ownership. Run dependency analysis in CI to detect circular module dependencies. Automation is more reliable than manual enforcement.

5. **Maintain a lean shared kernel** — In domain-driven and modular patterns, shared code (`app/Shared/` or `app/Kernel/`) should be minimal. Every file in shared code is a dependency that every domain or module relies on. Extract to shared only when three or more domains use it.

6. **Keep Artisan generators working** — The primary friction point for non-technical patterns is that `php artisan make:controller` places files in default directories. Handle this by either: (a) accepting manual file moves, (b) writing custom generator stubs, or (c) using packages that support custom paths. Do not let this friction cause you to skip the move.

7. **Consistency trumps the specific pattern** — A consistently-applied technical-layer pattern is better than a partially-implemented domain-driven pattern. Inconsistent organization creates ambiguity about where to place new files, leading to scattered code over time.

---

## Architecture Guidelines

### Pattern Selection Decision Framework

```
Project model count?
├── <20 → Technical-layer
├── 20-50 → Does the app have distinct bounded contexts?
│   ├── Yes → Domain-driven
│   └── No → Technical or Hybrid
└── 50+ → Multiple teams?
    ├── Yes → Modular (module per team)
    └── No → Domain-driven with sub-features
```

### Comparison Matrix

| Aspect | Technical | Domain | Modular | Hybrid |
|---|---|---|---|---|
| Artisan compatibility | Full | Partial | None | Full |
| Team ownership | Unclear | Clear | Very clear | Partial |
| Co-location by feature | No | Yes | Yes | Within-layer |
| Cross-domain sharing | Implicit | Contract-based | Event-based | Implicit |
| Overhead for small apps | None | Empty directories | Provider per module | Minimal |
| Extraction to package | Impossible | Feasible | Natural | Difficult |
| Navigation depth | 2 levels | 3 levels | 4 levels | 2 levels |
| Onboarding effort | Minimal | Moderate | Significant | Moderate |

### Pattern Selection Based on Team Size

| Team Size | Appropriate Pattern | Rationale |
|---|---|---|
| 1-3 developers | Technical-layer | No coordination overhead needed |
| 3-8 developers | Domain-driven or Hybrid | Team members own domains |
| 8+ developers | Modular | Clear team-per-module boundaries |

---

## Performance

Organizational patterns have zero runtime performance impact. Laravel uses PHP autoloading (composer generates a flat classmap in production), so directory depth does not affect filesystem access. All performance considerations are developer-side: navigation time, file search speed, and IDE responsiveness.

---

## Security

- Organizational patterns do not directly affect security — middleware, authentication, and authorization are configured independently of file organization
- Modular patterns can improve security isolation by enforcing clear boundaries between domains (e.g., billing code cannot directly access user authentication internals)
- Ensure CODEOWNERS and CI enforcement are configured to prevent unauthorized cross-module access
- Autoloading misconfiguration after restructuring can expose classes to unintended namespaces — verify with `composer dump-autoload`

---

## Common Mistakes

### Premature Domain Organization
- **Description:** Creating domain directories for a 5-model application
- **Cause:** Anticipating future scale without considering current overhead
- **Consequence:** Empty directories, manual file moves for no benefit, higher navigation depth without payoff
- **Better:** Start with technical-layer; reassess at ~20 models or when navigation friction becomes noticeable

### Mixed Organizational Signals
- **Description:** Having both `app/Services/PaymentService.php` and `app/Domain/Payment/Services/PaymentService.php`
- **Cause:** Team members choose different conventions for different files over time
- **Consequence:** Ambiguity about where to place new code; scattered, inconsistent structure
- **Better:** Choose one convention and document it; enforce via code review

### Ignoring Bounded Contexts
- **Description:** Forcing domain organization without defining domain boundaries first
- **Cause:** Assuming domain boundaries are obvious from business terminology
- **Consequence:** Cross-domain model access, tangled dependencies, modules that depend on each other's internals
- **Better:** Map bounded contexts before restructuring; define clear contracts between domains

### Pattern Over-Engineering
- **Description:** Using modular pattern for a single-team application
- **Cause:** Assuming modular is universally better, or following large-company patterns
- **Consequence:** Unnecessary overhead of module service providers, inter-module contracts, autoloading configuration
- **Better:** Use domain-driven or hybrid until multiple teams justify modular separation

---

## Anti-Patterns

- **Chaos Structure** — No consistent pattern emerges; files are placed based on individual developer preference. Results in a structure where finding any file requires searching multiple directories.
- **Module Sprawl** — Creating many small modules (10+ modules for a 30-model app) without clear bounded contexts. The overhead of inter-module communication exceeds the benefit of separation.
- **Shared Kernel Bloat** — Moving all shared code to a shared directory without discipline. Every common utility, helper, and base class ends up in shared code, creating a de facto monolith within the modular structure.
- **Directory as Ownership Proxy** — Assuming directory structure alone enforces team boundaries without CODEOWNERS, CI rules, or architectural tests. Directories do not prevent cross-boundary access.

---

## Examples

### Technical-Layer (Default)
```
app/
  Http/Controllers/    # All controllers
  Models/              # All models
  Services/            # All services
  Actions/             # All actions
  Providers/           # All providers
```

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
      Actions/
```

### Modular Organization
```
app/
  Modules/
    Billing/
      Http/Controllers/
      Models/
      ServiceProviders/
      routes/
      database/migrations/
    Users/ ...
  Shared/
    Middleware/
    Exceptions/
```

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

### Migration: Technical → Domain
```
Phase 1: Identify domain boundaries
Phase 2: Create app/Domain/{Domain}/ directories
Phase 3: Move files per domain (one domain at a time)
Phase 4: Update namespaces and imports
Phase 5: Extract shared models to app/Models/ or app/Shared/
```

### Migration: Technical → Modular
```
Phase 1: Create app/Modules/{Module}/ and app/Shared/
Phase 2: Add PSR-4 autoloading for modules in composer.json
Phase 3: Create service provider per module
Phase 4: Move files per module
Phase 5: Extract shared infrastructure to app/Shared/
```

---

## Related Topics

- **Directory Conventions** — literal filesystem mapping that patterns build on
- **Feature-based Structure** — domain-driven organization at the feature level
- **Service Provider Strategies** — per-module provider registration
- **Configuration Management** — autoloading configuration for custom directory structures

---

## AI Agent Notes

- When asked about project structure, always start by asking about model count and team size
- Default recommendation for new projects: technical-layer with Laravel's default structure
- Transition thresholds: ~20 models (consider domain-driven), ~100 models (consider modular)
- Artisan compatibility is the primary friction point for non-technical patterns
- Never suggest modular for single-team applications
- Document the decision: pattern choice is a team coordination concern, not a technical purity concern
- Verify autoloading configuration (`composer.json`) is updated when suggesting directory restructing

---

## Verification

- [ ] Can describe all four organizational patterns and their tradeoffs
- [ ] Can recommend a pattern based on model count and team size
- [ ] Understands why technical-layer is the correct default for new projects
- [ ] Can identify when a project has outgrown its current pattern
- [ ] Knows how to migrate between patterns
- [ ] Can explain why bounded contexts must be defined before restructuring
- [ ] Understands the autoloading requirements for non-technical patterns
- [ ] Can identify and fix mixed organizational signals in an existing codebase
