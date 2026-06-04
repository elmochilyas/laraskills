# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Organizing by domain: app/Domains/{Domain} structure
Knowledge Unit ID: COS-06
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

Domain-based organization places code into directories named after business domains (DDD Bounded Contexts), each containing all layers needed for that domain. Instead of flat `app/Models/` and `app/Http/Controllers/`, domain structure has `app/Domains/Billing/`, `app/Domains/Catalog/`, `app/Domains/Identity/` each with its own `Models/`, `Http/Controllers/`, `Services/`. This is the most common enterprise deviation from defaults because it creates genuine domain isolation within a single codebase.

---

# Core Concepts

- **Mini-Application Model**: Each domain is self-contained with its own controllers, models, services, events, and database schema. They share a deployment but not internal code.
- **Bounded Context as Directory**: The directory structure reflects business domain boundaries. What "User" means in Identity differs from "User" in Billing.
- **Separate Namespace Identity**: Each domain has a unique namespace prefix: `App\Domains\Billing`, `App\Domains\Catalog`.
- **Domain Contracts**: Domains expose service interfaces for cross-domain communication; internal implementation is hidden.

```
app/Domains/
├── Billing/
│   ├── Models/
│   ├── Http/Controllers/
│   ├── Services/
│   ├── Events/
│   ├── Providers/
│   └── routes/
├── Catalog/
└── Identity/
```

---

# When To Use

- Multiple business domains are clearly identifiable (Billing, Catalog, Identity, Compliance)
- Application will grow significantly over 3+ years
- Team ownership maps to domains
- Domain boundaries are reasonably stable
- Application requires genuine isolation, not just organizational grouping

---

# When NOT To Use

- Application is a single domain or simple CRUD
- Team is small (under 5 engineers)
- Business concepts lack clear boundaries
- Domain boundaries will change frequently
- The organization is not ready to enforce domain isolation

---

# Best Practices

- **Give each domain its own service provider.** WHY: Enables per-domain registration, event mapping, and configuration without cross-domain coupling.
- **Use domain-scoped Eloquent models.** WHY: Each domain owns specific database tables; Domain A never references Domain B's models directly.
- **Expose domain service contracts (interfaces) for cross-domain calls.** WHY: Hides implementation details and enables testing/mocking at domain boundaries.
- **Use domain events for cross-domain notification.** WHY: Decouples domains; when Domain A needs to notify Domain B, dispatch an event rather than calling code directly.
- **Document domain boundaries explicitly** via ADRs or a `domain-map.md`. WHY: New developers need to understand which domain owns which concept.

---

# Architecture Guidelines

- Domain boundaries should be stable — moving code between domains is expensive (file moves, namespace updates, import updates).
- Domain isolation must be enforced via automated checks. Without enforcement, `use App\Domains\Billing\Models\Invoice` in Catalog code will appear.
- Consider a `domain-map.md` listing each domain, owner, key models, and dependencies.
- Cross-domain communication goes through contracts or events — never direct model access.
- Shared kernel (auth middleware, base classes) stays at application level, not in any domain.

---

# Performance Considerations

- Multiple service providers increase boot time slightly. 10+ domains can add 50-100ms.
- Mitigate with config caching, route caching, and event caching.
- Cross-domain database queries (if any) must be explicit — may impact query performance.

---

# Security Considerations

- Domain isolation is architectural, not security — all domains share the same process and authentication.
- Ensure cross-domain contracts do not inadvertently expose sensitive internal domain data.

---

# Common Mistakes

1. **Leaking shared models:** Placing a model in one domain that is actually used across all domains. Cause: convenience over discipline. Consequence: domain isolation is compromised. Better: `User` model might belong to Identity, or live in a shared kernel.

2. **Cross-domain Eloquent access:** Catalog domain calling `Billing\Invoice::where(...)` directly. Cause: convenience over contract discipline. Consequence: defeats domain isolation. Better: use domain service contract or event.

3. **Inconsistent boundaries:** Some code in Domains/, some still flat in app/. Cause: partial migration. Consequence: developers don't know where new code goes. Better: migrate fully or not at all.

4. **Domain too large:** A "Core" domain containing everything not fitting elsewhere. Cause: failure to identify proper boundaries. Consequence: Core becomes the new dumping ground. Better: split into meaningful domains.

---

# Anti-Patterns

- **Circular domain dependency**: Domain A depends on Domain B's service, Domain B depends on Domain A's service.
- **Domain boundary erosion**: New features added to the "closest" domain rather than creating a new one.
- **Anemic domain directories**: Domain directories with only models and no controllers, services, or events — effectively just namespacing.

---

# Examples

Domain-based structure:
```
app/
├── Domains/
│   ├── Identity/
│   │   ├── Models/User.php
│   │   ├── Http/Controllers/AuthController.php
│   │   ├── Services/AuthenticationService.php
│   │   ├── Events/UserRegistered.php
│   │   ├── Providers/IdentityServiceProvider.php
│   │   └── routes/web.php
│   └── Billing/
│       ├── Models/Invoice.php
│       ├── Http/Controllers/InvoiceController.php
│       ├── Services/BillingService.php
│       ├── Contracts/BillingServiceInterface.php
│       ├── Providers/BillingServiceProvider.php
│       └── routes/api.php
├── Http/ (shared middleware)
└── Providers/ (app-level providers)
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Default structure | COS-07 Hybrid approach | DBC-01 Bounded context identification |
| COS-02 Layer-based organization | COS-03 PSR-4 autoloading | DBC-04 Anti-corruption layer |

---

# AI Agent Notes

- When generating code for a domain-based project, place classes inside the appropriate domain directory.
- Never generate cross-domain model imports — use service contracts or events instead.
- Suggest domain extraction when a default-structured project shows clear bounded context boundaries.

---

# Verification

- [ ] Each domain has its own namespace prefix and directory
- [ ] No direct Eloquent model imports across domain boundaries
- [ ] Cross-domain communication uses service contracts or events
- [ ] Domain boundaries are documented with ownership
- [ ] Architecture tests enforce domain isolation
- [ ] Each domain has its own service provider registered
- [ ] No domain acts as a catch-all "Core" dumping ground
