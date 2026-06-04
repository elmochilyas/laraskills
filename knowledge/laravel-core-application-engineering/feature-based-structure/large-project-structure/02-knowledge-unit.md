# Large Project Structure

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Feature-Based Structure
- **Knowledge Unit:** Large Project Structure
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Large Laravel projects (100k+ LOC, 50+ features, multiple teams) require additional structural patterns beyond basic feature-based organization. Sub-features, shared kernels, multi-namespace packages, and monorepo management come into play. The structure must support independent deployability, team ownership, and long-term maintainability.

The engineering value is preventing the architecture from collapsing under its own weight. Without these patterns, a 200-feature project becomes as hard to navigate as a layer-based project with 500 models in one directory.

---

## Core Concepts

### The Skeleton at Scale

```
app/
  Kernel/                  # Shared contracts, base classes
    Contracts/
    DTOs/
    Exceptions/
    Events/
  Features/
    Billing/
      sub-features/
        Invoicing/         # Sub-feature within Billing
        Subscriptions/
        Payments/
    Users/
      sub-features/
        Registration/
        Profiles/
        Roles/
    Analytics/
  Support/                 # Cross-cutting infrastructure
    Helpers/
    Mixins/
    Macros/
  Providers/               # Global providers (AppServiceProvider, etc.)
```

### Sub-Features

When a feature exceeds ~20 files, split it into sub-features:

```
Features/Billing/
  ├── Controllers/               # High-level billing controllers
  ├── BillingServiceProvider.php
  ├── config.php
  ├── routes.php
  └── sub-features/
      ├── Invoicing/
      │   ├── Controllers/
      │   ├── Models/
      │   ├── Services/
      │   ├── Database/Migrations/
      │   └── Providers/
      │       └── InvoicingServiceProvider.php
      ├── Subscriptions/
      │   └── ...
      └── Payments/
          └── ...
```

### Feature Grouping by Domain

```
Features/
  Financial/                   # Domain group
    Billing/
    Invoicing/
    Payments/
    Accounting/
  UserManagement/              # Domain group
    Users/
    Roles/
    Permissions/
    Teams/
  Content/                     # Domain group
    Posts/
    Categories/
    Media/
```

Each domain group can have its own shared kernel.

---

## Mental Models

### The Concentric Architecture

The application has layers of cohesion:
- **Outer ring**: Domain groups (Financial, UserManagement)
- **Middle ring**: Features (Billing, Users)
- **Inner ring**: Sub-features (Invoicing, Profiles)
- **Core**: Shared kernel (Contracts, DTOs)

Dependencies flow inward. Outer rings depend on inner rings, never the reverse.

### The Package-Style Feature

Each feature at scale resembles a Laravel package: it has its own service provider, config, routes, views, migrations, and tests. The only difference is it lives in `app/` instead of `vendor/`. This means any feature can be extracted to a Composer package with minimal effort.

---

## Internal Mechanics

### Multi-Provider Features

Large features with sub-features have a hierarchy of service providers:

```php
// Billing Service Provider — top-level
class BillingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->loadRoutesFrom(__DIR__.'/../routes.php');
        $this->loadViewsFrom(__DIR__.'/../views', 'billing');

        // Register sub-feature providers
        $this->app->register(InvoicingServiceProvider::class);
        $this->app->register(SubscriptionsServiceProvider::class);
        $this->app->register(PaymentsServiceProvider::class);
    }
}
```

### Shared Kernel

```
app/Kernel/
  Contracts/
    BillingInterface.php
    UserRepositoryInterface.php
  DTOs/
    InvoiceData.php
    UserProfileData.php
  Exceptions/
    KernelException.php
  Events/
    ApplicationEvent.php
```

The shared kernel must not depend on any feature. It's the foundation everything else builds on.

### Autoloading at Scale

```json
{
    "autoload": {
        "psr-4": {
            "App\\": "app/",
            "App\\Features\\Financial\\": "app/Features/Financial/"
        }
    }
}
```

---

## Patterns

### Team Ownership

Each domain group is owned by a specific team:

```
Features/Financial/    → Team Alpha
Features/UserManagement/ → Team Beta
Features/Content/      → Team Gamma
```

Ownership is enforced via:
- CODEOWNERS file in GitHub/GitLab
- CI pipeline that requires team lead approval for changes outside owned directories
- Monorepo tooling (e.g., `nx` affected commands)

### Independent Testing

Each domain group has its own test pipeline:

```yaml
# .github/workflows/financial-tests.yml
name: Financial Tests
on:
  pull_request:
    paths:
      - 'app/Features/Financial/**'
      - 'tests/Features/Financial/**'
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - run: phpunit tests/Features/Financial
```

### Domain-Level Service Providers

```php
// Providers/FinancialServiceProvider.php
class FinancialServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        $this->app->register(BillingServiceProvider::class);
        $this->app->register(InvoicingServiceProvider::class);
        $this->app->register(PaymentsServiceProvider::class);

        // Domain-level shared bindings
        $this->app->bind(
            FinancialReportInterface::class,
            FinancialReportService::class,
        );
    }
}
```

### Feature Extraction Checklist

When a feature becomes stable and reusable, extract it to a package:

1. Move `Features/FeatureName/` to `packages/vendor/feature-name/src/`
2. Create `composer.json` with autoloading
3. Update namespaces from `App\Features\FeatureName\` to `Vendor\FeatureName\`
4. Publish migrations, config, and assets
5. Register the package's service provider in `config/app.php`
6. Update tests to reference the new namespace
7. Run full test suite

---

## Architectural Decisions

### Monorepo vs Multi-Repo

| Concern | Monorepo | Multi-Repo |
|---|---|---|
| Cross-feature refactoring | Single commit | Coordinated releases |
| CI complexity | Affected-only testing | Per-repo pipelines |
| Dependency management | Single composer.json | Multiple packages |
| Team isolation | CODEOWNERS | Separate repos |
| Release cadence | Single deploy | Independent deploys |

Monorepo is recommended for most large Laravel projects. Extract to multi-repo only when teams need independent deployment schedules or when the organization enforces repo-per-service.

### Sub-Feature Granularity Threshold

| Feature Size | Structure |
|---|---|
| < 10 files | Single directory |
| 10-20 files | Directory with subdirectories |
| 20-50 files | Sub-features |
| 50+ files | Domain group extraction |

---

## Tradeoffs

| Concern | Simple Feature Structure | Large-Scale Structure |
|---|---|---|
| Navigation | Easy (flat) | Harder (layered) |
| Overhead | Minimal | 3x more directories |
| Team isolation | Low | High |
| Refactoring impact | Feature-wide | Sub-feature scoped |
| Onboarding | Simple | Steep (learn the hierarchy) |

---

## Performance Considerations

Same as feature-based structure at any scale — zero runtime cost. The only overhead is developer navigation. Use IDE features (Go to Symbol, Find in Path) to mitigate deep directory structures.

---

## Production Considerations

- Use CODEOWNERS to enforce team ownership of domain groups
- Implement monorepo tooling (nx, turborepo, or custom scripts) for affected testing
- Establish a feature lifecycle: new → stable → (optionally) extracted to package
- Keep the shared kernel lean — every interface in `Kernel/` is a promise to maintain
- Document the domain group hierarchy in the project README
- Run static analysis with directory-specific rules (e.g., "Financial features can't import Content models")
- Establish a feature deprecation process: soft deprecate → hard deprecate → remove
- Version the shared kernel separately if multiple domain groups need independent release schedules

---

## Common Mistakes

### Premature Sub-Feature Splitting

Creating sub-features for a feature that has 5 files. The overhead of navigating sub-directories exceeds any benefit. Wait until the feature reaches ~20 files before splitting.

### Shared Kernel Bloat

The `app/Kernel/` directory grows to 200+ contracts and DTOs. Every feature adds interfaces "just in case." The kernel loses its meaning as a stable foundation. Prune aggressively — only add contracts that are actually consumed by multiple features.

### Circular Domain Group Dependencies

`Financial/` depends on `UserManagement/` for user data. `UserManagement/` depends on `Financial/` for billing status. This creates a circular dependency at the domain group level. Break it by moving the shared concern to `Kernel/` or by defining a unidirectional interface.

---

## Failure Modes

### Feature Extraction Stops

Features are never extracted to packages because "it works fine where it is." After 5 years, the monorepo has 150 features and 500k lines of code. Deployments take 45 minutes because every test runs on every commit. Mitigate: set a feature size threshold that triggers extraction review.

### Orphaned Sub-Features

A sub-feature (`Invoicing`) has no owner after team reorganization. It accumulates bugs and technical debt because no one feels responsible. Mitigate: assign ownership at the sub-feature level, not just the domain group level.

### Inconsistent Sub-Feature Conventions

`Billing/Invoicing/` uses PSR-4 and has a service provider. `Billing/Payments/` puts everything in the root directory and loads routes from `AppServiceProvider`. Enforce the same conventions at all levels.

---

## Ecosystem Usage

Monorepo tooling (nx, turborepo) can optimize CI for large Laravel projects by running affected tests only. Laravel's service provider hierarchy supports multi-level feature registration. CODEOWNERS files enforce team ownership in monorepos. Composer's autoloading with optimized classmaps handles deep directory structures efficiently at scale.

---

## Related Knowledge Units

- **Feature Foundations** (this workspace) — base concepts scaled here
- **Module Organization** (this workspace) — sub-feature internal structure
- **Feature Service Providers** (this workspace) — hierarchical provider registration
- **Cross-Feature Communication** (this workspace) — inter-feature interaction at scale
- **Feature vs Layer** (this workspace) — structural tradeoffs at different scales
- **Feature Tests** (this workspace) — testing at the domain group level

---

## Research Notes

- Monorepo tooling (nx, turborepo, Bazel) can optimize CI for large Laravel projects
- The 20-file threshold for sub-feature extraction is a heuristic — adjust based on team preference
- Domain group extraction mirrors module architecture in enterprise Java (Spring Modulith)
- Feature extraction to packages is simplified by the feature's existing package-like structure (provider, config, routes, migrations)
- CODEOWNERS is the primary mechanism for team ownership in monorepos
- Domain-level service providers enable lazy feature registration (only load features when their domain is needed)
- Some large Laravel projects (500k+ LOC) maintain this structure without extraction by using optimized monorepo tooling
- The structure supports gradual migration to microservices: extract a domain group → convert to package → deploy independently
