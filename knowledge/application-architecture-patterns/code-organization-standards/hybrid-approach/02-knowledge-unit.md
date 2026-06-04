# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Hybrid: domains inside default Laravel structure
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

The hybrid approach keeps Laravel's default top-level directories (`app/Http/Controllers/`, `app/Models/`) but organizes within them by domain: `app/Http/Controllers/Billing/`, `app/Models/Billing/`. This is the recommended starting point for most teams according to community leaders (Benjamin Crozat, Laravel Daily, Spatie). It preserves framework convention compatibility (all controllers are still in `app/Http/Controllers/`) while introducing domain grouping. It avoids the complexity of full domain-based PSR-4 restructuring while providing meaningful organizational structure.

---

# Core Concepts

```
app/
├── Http/Controllers/
│   ├── Billing/
│   │   ├── InvoiceController.php
│   │   └── PaymentController.php
│   ├── Catalog/
│   │   ├── ProductController.php
│   │   └── CategoryController.php
│   └── Auth/
│       ├── LoginController.php
│       └── RegisterController.php
├── Models/
│   ├── Billing/
│   │   ├── Invoice.php
│   │   └── Payment.php
│   ├── Catalog/
│   │   ├── Product.php
│   │   └── Category.php
│   └── Auth/
│       ├── User.php
│       └── Role.php
└── Services/
    ├── Billing/
    │   ├── InvoiceService.php
    │   └── PaymentService.php
    └── Catalog/
        ├── ProductService.php
        └── InventoryService.php
```

The key tradeoff: framework conventions still work (`artisan make:controller Billing/InvoiceController` works), and all controllers are in one directory tree, but they're grouped by domain within that tree.

---

# Mental Models

**The "Default Plus Grouping" model:** Keep all the framework conventions you know, but add domain subdirectories within each technical layer.

**The "Progressive Architecture" model:** Start with defaults. As the application grows, add domain subdirectories within existing layers before creating a full domain structure.

**The "Best of Both" model:** You get the framework compatibility of layer-based organization and the business cohesion of domain-based grouping—without the overhead of PSR-4 restructuring or per-domain service providers.

---

# Internal Mechanics

No PSR-4 changes needed. The default `App\` → `app/` mapping handles `App\Models\Billing\Invoice` resolving to `app/Models/Billing/Invoice.php`.

Artisan commands work with subdirectories: `php artisan make:model Billing/Invoice -m` creates `app/Models/Billing/Invoice.php`. `php artisan make:controller Billing/InvoiceController --resource` creates `app/Http/Controllers/Billing/InvoiceController.php`.

Route files can use domain grouping without restructuring:
```php
Route::prefix('billing')->group(base_path('routes/billing.php'));
```

---

# Patterns

**Domain groups within each layer:** Controllers, Models, Services, Events, Jobs all get domain subdirectories. This is the most common pattern.

**Shared cross-domain code stays flat:** Code used by multiple domains stays in the root of the technical layer (e.g., `app/Models/User.php` for Identity, `app/Services/NotificationService.php`).

**Progressive domain extraction:** Start flat, add domain subdirectories as patterns emerge. `app/Models/` contains `User.php` at root and `Billing/Invoice.php`, `Catalog/Product.php` within subdirectories.

---

# Architectural Decisions

**Use when:** Team is growing (5-15 engineers), the application has multiple business domains but isn't large enough to warrant full domain isolation, and you want framework compatibility.

**Stay with full defaults when:** Team is small (<5), application is a single domain, or rapid development is primary concern.

**Move to full domain structure when:** Teams need independent module ownership, cross-domain contracts are formalized, or module extraction is anticipated.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Framework conventions work unchanged | Technical layers still the top-level grouping | "Where is the Billing code?" requires knowing the technical layer |
| Lower migration cost from defaults | Partial isolation may feel incomplete | Teams may be tempted to cross-domain import because it's easy |
| Artisan commands work with subdirs | Inconsistent if some domains have subdirs and others don't | Team must agree on when to create domain subdirs |
| Easy developer onboarding | Domain boundaries are organizational, not enforced | Nothing prevents cross-domain model access |

---

# Performance Considerations

Same as default structure. No additional service provider registration, no extra autoloading configuration.

---

# Production Considerations

Document the convention: "When does a domain get its own subdirectory?" Common threshold: when there are 3+ files related to a business concept in a single technical layer.

Enforcement is cultural rather than automated initially. Code review should catch files placed in wrong domain subdirectories.

---

# Common Mistakes

**Inconsistent application:** Some teams create subdirectories for Controllers but keep all Models flat. Apply the convention consistently across all technical layers.

**Domain subdirectory for every CRUD resource:** Not every model needs a domain subdirectory. Group related resources together under shared domains.

**Mixed flat and domain code without rules:** Rules like "User belongs in root, everything else in domain subdirectories" must be explicit.

---

# Failure Modes

**Domain proliferation:** Creating `app/Services/Payment/`, `app/Services/Payments/` (plural inconsistency) or `app/Services/PaymentGateway/` (one-off). Without naming conventions, the structure becomes inconsistent.

**Abandoned domains:** A domain subdirectory with 1-2 files that was started but never completed. Regular cleanup prevents orphaned directories.

---

# Ecosystem Usage

This is the most common recommendation from community leaders. Benjamin Crozat's 2026 Laravel architecture guide recommends: "Organize by business domain inside Laravel's defaults." Spatie's open source structure often follows this pattern. Tighten's team conventions use domain subdirectories within standard directories.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-01 Default structure | COS-05 Feature-based organization | COS-09 When to deviate |
| COS-02 Layer-based organization | COS-06 Domain-based organization | COS-10 Team-scale strategies |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
