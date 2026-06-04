# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Hybrid: domains inside default Laravel structure
Knowledge Unit ID: COS-07
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Overview

The hybrid approach keeps Laravel's default top-level directories (`app/Http/Controllers/`, `app/Models/`) but organizes within them by domain: `app/Http/Controllers/Billing/`, `app/Models/Billing/`. This is the recommended starting point for most teams according to community leaders. It preserves framework convention compatibility while introducing domain grouping without the overhead of full PSR-4 restructuring.

---

# Core Concepts

- **Default Plus Grouping**: Keep all framework conventions but add domain subdirectories within each technical layer.
- **Progressive Architecture**: Start with defaults. Add domain subdirectories as the application grows, before creating a full domain structure.
- **Framework Compatibility**: `artisan make:controller Billing/InvoiceController` works unchanged.
- **No PSR-4 Changes**: `App\Models\Billing\Invoice` resolves to `app/Models/Billing/Invoice.php` using the default mapping.

```
app/Http/Controllers/
├── Billing/InvoiceController.php
├── Catalog/ProductController.php
└── Auth/LoginController.php
app/Models/
├── Billing/Invoice.php
├── Catalog/Product.php
└── Auth/User.php
```

---

# When To Use

- Team is growing (5-15 engineers)
- Application has multiple business domains but not large enough for full domain isolation
- Framework compatibility is important
- Progressive migration from flat defaults

---

# When NOT To Use

- Team is small (<5) and application is a single domain
- Full domain isolation is already required (team ownership, formal contracts)
- Module extraction to microservices is anticipated
- Team has no intention of enforcing domain grouping conventions

---

# Best Practices

- **Apply domain subdirectories consistently across all technical layers.** WHY: If Controllers have domain subdirectories but Models don't, domain grouping is half-implemented and confusing.
- **Establish a threshold for new domain subdirectories.** WHY: Without a rule like "3+ files related to a business concept = create a subdirectory," structure becomes inconsistent.
- **Keep truly shared code at the technical layer root.** WHY: `app/Models/User.php` shared across domains stays in root; domain-specific models go in subdirectories.
- **Document the convention explicitly.** WHY: New developers need to know when to create domain subdirectories vs. keeping files flat.
- **Use code review to catch misplaced files.** WHY: Directory structure conventions are not enforced by tooling — human review is needed initially.

---

# Architecture Guidelines

- No PSR-4 changes are required — the default `App\` → `app/` mapping handles subdirectories.
- `artisan make:` commands work with subdirectories — use `php artisan make:model Billing/Invoice -m`.
- Route files can use domain grouping without restructuring: `Route::prefix('billing')->group(...)`.
- The hybrid approach is the recommended intermediate step before full domain-based organization.
- Domain boundaries are organizational, not enforced — nothing prevents cross-domain model access.

---

# Performance Considerations

- No additional performance cost — same as default structure.
- No extra service provider registration or autoloading configuration needed.

---

# Security Considerations

- Same as default structure. Domain grouping does not add security boundaries.
- Authentication and authorization must still be applied explicitly.

---

# Common Mistakes

1. **Inconsistent application:** Creating domain subdirectories for Controllers but keeping all Models flat. Cause: partial adoption. Consequence: confusion about where new files go. Better: apply consistently or not at all.

2. **Domain subdirectory for every resource:** Creating a subdirectory for every CRUD model rather than grouping related resources. Cause: over-grouping. Consequence: more directories than meaningful. Better: group related resources under shared domains.

3. **Domain proliferation:** Creating `app/Services/Payment/` and `app/Services/Payments/` (plural inconsistency). Cause: no naming convention. Consequence: inconsistent structure. Better: establish singular domain naming.

---

# Anti-Patterns

- **Orphaned domain subdirectories**: A subdirectory with 1-2 files started but never completed.
- **Mixed flat and domain without rules**: No documented criteria for when code goes flat vs. in a domain subdirectory.

---

# Examples

Hybrid structure:
```
app/
├── Http/Controllers/
│   ├── Billing/InvoiceController.php
│   ├── Catalog/ProductController.php
│   └── Auth/LoginController.php
├── Models/
│   ├── User.php (shared - stays flat)
│   ├── Billing/Invoice.php
│   ├── Catalog/Product.php
│   └── Catalog/Category.php
└── Services/
    ├── NotificationService.php (shared)
    ├── Billing/InvoiceService.php
    └── Catalog/ProductService.php
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-01 Default structure | COS-05 Feature-based organization | COS-09 When to deviate |
| COS-02 Layer-based organization | COS-06 Domain-based organization | COS-10 Team-scale strategies |

---

# AI Agent Notes

- For projects following the hybrid approach, generate files inside domain subdirectories within standard layers.
- When a directory grows beyond 20 files, suggest introducing domain subdirectories.
- Default to `app/Models/User.php` flat (shared) and domain-specific models in subdirectories.

---

# Verification

- [ ] All technical layers consistently use domain subdirectories (or none do)
- [ ] Domain subdirectory creation threshold is documented
- [ ] Shared cross-domain code remains flat at technical layer root
- [ ] `artisan make:` commands work with all subdirectory paths
- [ ] New developers can identify where to place new code
