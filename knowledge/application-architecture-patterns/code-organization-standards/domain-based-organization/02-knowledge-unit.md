# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Organizing by domain: app/Domains/{Domain} structure
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Domain-based organization places code into directories named after business domains (Bounded Contexts in DDD terminology), each containing all the layers needed for that domain. Instead of `app/Models/`, `app/Http/Controllers/`, `app/Services/`, a domain-based structure has `app/Domains/Billing/`, `app/Domains/Catalog/`, `app/Domains/Identity/`, each with its own `Models/`, `Http/Controllers/`, `Services/`, `Events/`, etc. This is the most common "deviation from defaults" in enterprise Laravel because it creates genuine domain isolation within a single codebase. Each domain is a mini-application with its own concerns, but they share a single deployment.

---

# Core Concepts

```
app/
├── Domains/
│   ├── Billing/
│   │   ├── Models/
│   │   ├── Http/Controllers/
│   │   ├── Services/
│   │   ├── Events/
│   │   ├── Providers/
│   │   └── routes/
│   ├── Catalog/
│   │   ├── Models/
│   │   ├── Http/Controllers/
│   │   ├── Services/
│   │   └── routes/
│   └── Identity/
│       ├── Models/
│       ├── Http/Controllers/
│       ├── Services/
│       ├── Events/
│       └── routes/
├── Http/ (application-wide middleware, shared concerns)
├── Models/ (shared kernel models, if any)
└── Providers/ (application-level service providers)
```

Key distinctions from feature-based organization:
- Domains are larger, aligned with DDD bounded contexts.
- Domains have explicit contracts for cross-domain communication.
- Each domain typically owns its database tables.
- Domain boundaries are enforced, not just organizational.

---

# Mental Models

**The "Mini-Application" model:** Each domain is a self-contained application with its own controllers, models, services, events, and database schema. They share a deployment but not internal code.

**The "Bounded Context as Directory" model:** The directory structure reflects the business domain boundaries. What "User" means in the Identity domain is different from what it means in the Billing domain.

**The "Separate Namespace Identity" model:** Each domain has a unique namespace prefix: `App\Domains\Billing`, `App\Domains\Catalog`. This prevents accidental cross-domain imports and makes domain ownership explicit.

---

# Internal Mechanics

Domain directories require PSR-4 mapping if a separate namespace prefix is desired. Common approach: keep `App\` → `app/` mapping, making domain classes have `App\Domains\Billing\Models\Invoice`. This works without extra configuration.

Route files per domain are loaded via service provider or glob:
```php
// AppServiceProvider or domain-specific provider
foreach (glob(app_path('Domains/*/routes/*.php')) as $routeFile) {
    Route::group([], function () use ($routeFile) {
        require $routeFile;
    });
}
```

Each domain typically has its own service provider registered in `config/app.php`:
```php
'providers' => [
    App\Providers\AppServiceProvider::class,
    App\Domains\Billing\Providers\BillingServiceProvider::class,
    App\Domains\Catalog\Providers\CatalogServiceProvider::class,
],
```

---

# Patterns

**Domain-scoped Eloquent models:** Each domain has its own Eloquent models that own specific database tables. Domain A never references Domain B's models directly.

**Domain service layer:** Each domain exposes a service contract (interface) that other domains can depend on. Internal implementation details are hidden.

**Domain events for cross-domain communication:** When Domain A needs to notify Domain B, it dispatches a domain event rather than calling code directly.

**Domain-specific middleware:** Middleware that applies only to a domain's routes can live within the domain directory.

---

# Architectural Decisions

**Use domain organization when:** Multiple business domains are clearly identifiable (Billing, Catalog, Identity, Compliance), the application will grow significantly, and team ownership maps to domains.

**Avoid domain organization when:** The application is a single domain or simple CRUD, the team is small, or the business concepts don't have clear boundaries.

**Domain boundaries should be stable:** Moving code between domains is expensive (file moves, namespace updates, import updates). Get domain boundaries reasonably right early.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Genuine domain isolation | Higher initial setup cost | Each domain needs provider, routes setup |
| Team ownership by domain | Cross-domain code must use contracts | Simple cross-domain calls require interface definitions |
| Business-aligned directory structure | Duplicate infrastructure per domain | Each domain has its own controllers, form requests, etc. |
| Enables future extraction | Domain boundary identification is hard | Wrong boundaries cause painful restructuring |

---

# Performance Considerations

Multiple service providers increase boot time slightly. Each provider's `register()` and `boot()` methods execute sequentially. With 10+ domains, boot time can add 50-100ms. Use config caching and route caching to mitigate.

Database cross-domain queries (if any) are explicit joins across domain-owned tables, which may impact query performance if domains share a database.

---

# Production Considerations

Document domain boundaries explicitly (see AEG-06 Architecture Decision Records). New developers need to understand which domain owns which concept.

Domain isolation must be enforced. Without automated checks, `use App\Domains\Billing\Models\Invoice` in Catalog domain code will appear and degrade isolation.

Consider a `domain-map.md` file in the project root that lists each domain and its owner, key models, and cross-domain dependencies.

---

# Common Mistakes

**Leaking shared models:** Placing a model in a domain that is actually used across multiple domains. The `User` model is the most common offender—it often belongs to Identity/Auth but is referenced everywhere.

**Cross-domain Eloquent access:** Code in the Catalog domain calling `Billing\Invoice::where('...')` directly. Communication should go through domain service contracts or events.

**Inconsistent domain boundaries:** Some code in Domains, some still flat in app/. This creates confusion about where new code goes.

**Domain too large:** A "Core" domain that contains everything not fitting elsewhere. This becomes the new dumping ground.

---

# Failure Modes

**Circular domain dependency:** Domain A depends on Domain B's service, which depends on Domain A's service. This is a design smell—extract the shared concern or use events.

**Domain boundary erosion over time:** New features are added to the "closest" domain rather than creating a new one. Eventually domains contain unrelated concepts.

**Autoloading conflicts:** Two domains define classes with the same name in the same namespace. Unlikely with separate domain directories but possible if using flat namespace.

---

# Ecosystem Usage

The `nwidart/laravel-modules` package provides a domain-based structure with auto-discovery. `shahmy/laravel-ddd-toolkit` scaffolds domain directories with Artisan commands. The `farid-labs/modular-architecture-laravel` project on GitHub demonstrates a production-grade domain-based structure.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 Default structure | COS-07 Hybrid approach | DBC-01 Bounded context identification |
| COS-02 Layer-based organization | COS-03 PSR-4 autoloading | DBC-04 Anti-corrosion layer |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
