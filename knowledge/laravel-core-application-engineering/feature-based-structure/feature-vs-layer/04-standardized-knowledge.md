# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Feature-Based Structure |
| Knowledge Unit | Technical vs Domain Grouping |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Layer-based (technical) organization groups code by its technical role: controllers in one directory, models in another, services in another. Feature-based (domain) organization groups code by business domain: everything for billing in one directory. This choice is the foundational structural decision for a Laravel project. The engineering tradeoff: layer-based follows Laravel conventions and is simpler for small projects; feature-based provides better cohesion and scales to larger, multi-domain applications.

---

## Core Concepts

### Layer-Based Organization

```
app/
  Http/Controllers/    # All controllers
  Http/Requests/       # All form requests
  Http/Middleware/     # All middleware
  Models/              # All Eloquent models
  Services/            # All services
  Exceptions/          # All exceptions
```

Each directory contains ALL files of that type, regardless of domain. Finding everything related to "billing" requires opening 6+ directories.

### Feature-Based Organization

```
app/Features/Billing/
  Controllers/  # Billing controllers
  Models/       # Billing models
  Services/     # Billing services
  Exceptions/   # Billing exceptions
```

Each directory contains ALL file types for a single domain. Finding everything related to "billing" requires opening one directory.

### Hybrid Organization

Simple, cross-cutting code stays layered. Complex domains get feature directories. Core auth and user management in `app/Http/`, billing feature in `app/Features/Billing/`.

---

## When To Use

- **Layer-based**: Application has <15-20 models, single developer or very small team, simple CRUD with minimal domain logic, rapid prototyping, following Laravel defaults
- **Feature-based**: 20+ models across distinct domains, multiple developers/teams, complex business logic, anticipated significant growth, team ownership per domain
- **Hybrid**: Core structure is simple but one or two domains are complex, migrating incrementally

## When NOT To Use

- Feature-based for simple 5-model CRUD apps (overhead exceeds benefit)
- Layer-based for 100+ model enterprise apps (cohesion collapses)
- Hybrid without documented criteria for what goes where

---

## Best Practices

- **Make the structure decision early** — retrofitting from layer to feature is expensive and touches every file
- **Commit fully** — partial adoption (some controllers in features, some in layers) creates confusion; move ALL controllers
- **One feature per business domain** — don't create features for technical groupings; a feature should represent a business domain boundary
- **Use shared kernel** — maintain `app/Shared/` for cross-cutting code (User model, base controllers) to prevent duplication
- **Customize Artisan stubs** — publish and modify stubs to generate feature-namespaced files automatically
- **Avoid feature explosion** — a feature directory should have at least 3-5 files before it justifies the overhead

---

## Architecture Guidelines

- PSR-4 autoloading handles both structures equally: `App\Features\Billing\Controllers\BillingController` maps to file path automatically
- Service providers in feature-based structure distribute registrations per feature; layer-based uses a single `AppServiceProvider`
- Feature routes are loaded via `loadRoutesFrom()` in each feature's service provider
- Route caching (`php artisan route:cache`) works identically for both structures
- Artisan generators (`make:model`, `make:controller`) default to layer-based namespaces — customize stubs or use custom commands
- Shared models like `User` that span multiple features stay in `app/Models/`

---

## Performance

No runtime difference between layer-based and feature-based. Autoloading uses composer's classmap in production. The directory structure only affects developer experience, not application performance. Run `composer dump-autoload -o` in production for optimal autoloading.

---

## Security

Feature-based structure does not introduce security concerns. Namespace depth has no impact on authentication, authorization, or input validation. The same security middleware applies regardless of structure.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Half adoption | Partial migration | Ambiguity about where to put new code | Move ALL controllers or don't start |
| Feature explosion | Creating features for minor concepts | Dozens of single-file features | Feature should have 3-5+ files |
| Ignoring Laravel conventions | Using `make:model` defaults | Generated files in wrong directory | Customize stubs or move files |
| Circular feature dependencies | Feature A depends on Feature B which depends on A | Tight coupling harder to resolve than in layer-based | Use shared kernel for common abstractions |
| Feature becomes monolith | One feature grows to 50+ files | Same cohesion problems as layer-based | Split into sub-features at ~20 files |

---

## Anti-Patterns

- **Half adoption**: Some controllers in `app/Http/`, some in `app/Features/` — creates confusion with no clear convention
- **Feature explosion**: Creating a `PasswordReset` feature directory with a single file inside
- **God feature**: One `Core` or `Shared` feature that absorbs all cross-cutting code, becoming a dumping ground

---

## Examples

**Layer-based structure:**
```
app/Http/Controllers/BillingController.php
app/Models/Invoice.php
app/Services/BillingService.php
app/Http/Requests/BillingRequest.php
```

**Feature-based structure:**
```
app/Features/Billing/Controllers/InvoiceController.php
app/Features/Billing/Models/Invoice.php
app/Features/Billing/Services/InvoiceService.php
app/Features/Billing/Requests/StoreInvoiceRequest.php
```

**Migration from layer to feature:**
```
Phase 1: Identify domain boundaries
Phase 2: Create feature directories
Phase 3: Move files (one feature at a time)
Phase 4: Update namespaces and routes
Phase 5: Verify autoloading (composer dump-autoload)
Phase 6: Remove old directories
```

---

## Related Topics

- modular-monolith-basics — Core concepts of feature-based structure
- bounded-contexts — Standardizing feature internals
- inter-module-communication — Preventing tight coupling
- vertical-slice-architecture — Scaling beyond simple feature organization
- shared-kernel — Cross-cutting code management

---

## AI Agent Notes

- Layer-based is the Laravel default; feature-based is a deliberate deviation that requires custom stub configuration
- Both use the same PSR-4 autoloading — no framework configuration changes needed
- The choice affects developer navigation and team coordination, not runtime behavior
- When migrating, move one feature at a time with tests passing after each move
- `composer dump-autoload` is required after directory restructuring

---

## Verification

- [ ] Structure decision documented in project README
- [ ] All controllers follow the chosen convention (no mixed placement)
- [ ] Custom Artisan stubs configured if feature-based
- [ ] Shared models in `app/Models/` or `app/Shared/`
- [ ] Feature directories have 3+ files before creation
- [ ] `composer dump-autoload -o` runs in deployment
- [ ] Route caching works with chosen structure
- [ ] No circular dependencies between features
