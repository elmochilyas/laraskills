# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Organizing by feature/vertical slice within app/
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Feature-based organization (also called vertical slicing) groups code by business feature rather than technical layer. Instead of `app/Http/Controllers/PaymentController.php` and `app/Services/PaymentService.php` and `app/Models/Payment.php` spread across three directories, a feature-based approach places all Payment-related code in a `app/Features/Payment/` directory containing the controller, service, model, events, and jobs that belong to that feature. This keeps related code colocated and makes feature boundaries explicit, at the cost of duplicating structural conventions across features and losing the "one place for every type" predictability.

---

# Core Concepts

A "feature" is a cohesive business capability. Common feature examples: UserRegistration, Checkout, InvoiceGeneration, SubscriptionManagement. Each feature gets its own directory containing all the classes needed to implement that capability.

```
app/
├── Features/
│   ├── Checkout/
│   │   ├── Controllers/
│   │   ├── Models/
│   │   ├── Services/
│   │   ├── Events/
│   │   ├── Jobs/
│   │   └── routes.php
│   ├── UserRegistration/
│   └── InvoiceGeneration/
```

The key insight: within each feature directory, the same technical-layer subdirectories exist (Controllers, Models, Services), but they only contain classes relevant to that feature. This is sometimes called "vertical slicing" because each feature is a vertical slice through all technical layers.

---

# Mental Models

**The "Business Capability Directory" model:** Each folder represents a thing the application does. To add a new feature, create a new directory. To understand an existing feature, open one directory.

**The "Screaming Architecture" model:** The directory structure screams what the application does, not what framework it uses. The top-level directories are business concepts, not technical layers.

**The "Colocation over Convention" model:** Related code lives together even if it violates the "all controllers in one place" convention. The cost of reduced cross-feature visibility is justified by improved feature cohesion.

---

# Internal Mechanics

PSR-4 autoloading works unchanged. `App\Features\Checkout\Controllers\CheckoutController` maps to `app/Features/Checkout/Controllers/CheckoutController.php`. The default `App\` → `app/` mapping in `composer.json` covers this automatically.

Routes within feature directories can be included from `routes/web.php`:
```php
// routes/web.php
require base_path('app/Features/Checkout/routes.php');
```
Or each feature can have its own route file discovered via glob:
```php
foreach (glob(app_path('Features/*/routes.php')) as $routeFile) {
    require $routeFile;
}
```

---

# Patterns

**Feature-scoped route files:** Each feature owns its route definitions. This prevents routes/web.php from becoming unmanageable as features multiply.

**Feature-level service providers:** Features can have their own service providers for binding, event registration, and configuration.

**Feature-limited resources:** Views, language files, and config can be colocated with the feature. `app/Features/Checkout/views/` or `app/Features/Checkout/config.php`.

**Cross-feature shared code:** Code used by multiple features lives in `app/Shared/` or `app/Support/`. This is the shared kernel of the feature-based organization.

---

# Architectural Decisions

**Use feature organization when:** The application has multiple distinct business capabilities, team ownership maps to features (teams own features), and the application is medium-to-large (10+ features).

**Use layer organization when:** The application is primarily CRUD, business rules are simple, and team size is small. The overhead of feature boundaries isn't justified.

**Feature boundaries should match team boundaries:** Each feature should be ownable by a single team. Features that require changes from multiple teams are probably too large or poorly bounded.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Feature-related code is colocated | Technical cross-referencing becomes harder | Finding all uses of a Query Builder across features requires search |
| Feature boundaries are explicit | Structural boilerplate per feature | Each feature duplicates the Controller/Service/Model directory pattern |
| Adding/removing features is clean | Shared code identification requires discipline | Teams must recognize when code should be shared vs. duplicated |
| Team ownership maps naturally | Feature size variation creates inconsistency | Some features are 3 files, others 30 |

---

# Performance Considerations

No direct performance impact. Route file globbing at boot time is negligible. Service provider registration from many small providers is slightly slower than one large provider due to iteration overhead.

---

# Production Considerations

Feature registration must be documented. New developers need to know: "Where do I add a new route for the Checkout feature?" Answer: `app/Features/Checkout/routes.php`.

Ensure feature discovery is automated (glob loading) rather than manual listing. Manual listing creates merge conflicts and forgotten registration.

---

# Common Mistakes

**Leaky features:** Code in "Feature A" imports models from "Feature B." This creates hidden coupling that defeats feature isolation.

**Giant features:** A feature directory that contains 50+ files and multiple sub-features. The feature boundary is too coarse. Split.

**Shared code explosion:** Every feature duplicates the same CRUD boilerplate because sharing is discouraged. Find a balance: shared infrastructure is good, shared domain logic is coupling.

---

# Failure Modes

**Circular feature dependency:** Feature A depends on Feature B which depends on Feature A. This often manifests as shared model access. Solved by splitting the shared model or introducing an event-based communication.

**Orphaned features:** A feature that is no longer actively developed but remains in the codebase. Feature directories don't make it obvious which features are active vs. legacy.

---

# Ecosystem Usage

Vertical slice architecture is more common in .NET and Java communities. In the Laravel ecosystem, it appears in some DDD-focused projects and the Modulate package for modular monolith scaffolding. The `nwidart/modules` package provides a structured vertical slice approach with auto-discovery.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 Default structure | COS-06 Domain-based organization | COS-09 When to deviate |
| COS-02 Layer-based organization | COS-08 Naming conventions | COS-12 File placement decision trees |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
