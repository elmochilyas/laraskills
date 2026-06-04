# ECC Standardized Knowledge — Controller Organization

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Organization |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Controller organization determines how controller files are structured within the `app/Http/Controllers/` directory. The default flat structure (all controllers in one directory) works for small applications but creates navigation problems beyond ~20 controllers. Organized structures use subdirectories by domain (`Admin/`, `Api/V1/`, `Sales/`) or by functionality (`Auth/`, `Dashboard/`).

Organization strategy affects: namespace length, Artisan command compatibility, team ownership boundaries, and navigation speed.

---

## Core Concepts

### Flat Organization
All controllers in `app/Http/Controllers/`. Simple but unmanageable beyond 20-30 controllers.

### Domain Subdirectories
`app/Http/Controllers/Sales/`, `app/Http/Controllers/Billing/`. Groups controllers by business domain.

### Version Subdirectories
`app/Http/Controllers/Api/V1/`, `app/Http/Controllers/Api/V2/`. Separates API versions.

### Feature Subdirectories
`app/Http/Controllers/Auth/`, `app/Http/Controllers/Dashboard/`. Groups by feature area.

---

## When To Use

### Flat: Small applications (<20 controllers)
### Domain: Large applications with clear business domains
### Version: API-heavy applications with versioned controllers
### Feature: Applications with distinct feature areas

---

## When NOT To Use

- Over-nesting (5+ levels deep) — creates overly verbose namespaces
- Mixing organization strategies — choose one and apply consistently
- Empty subdirectories — don't create directories before files exist

---

## Best Practices

### Group by Domain for Large Applications
Use domain subdirectories: `Controllers/Sales/`, `Controllers/Billing/`.

**Why:** Domain grouping provides clear team ownership boundaries. A developer working on Sales knows exactly which controllers to modify. Navigation scales to any number of controllers.

### Use Api/ Prefix for API Controllers
Place API controllers in `Controllers/Api/V1/`, etc.

**Why:** Separating API from web controllers prevents accidental mix of response types and clarifies the route-to-controller mapping.

### Keep Maximum Depth at 3 Levels
`app/Http/Controllers/Api/V1/UserController.php` is acceptable. Beyond 3 levels, reconsider.

**Why:** Deep nesting creates long namespace prefixes (`App\Http\Controllers\Api\V1\Admin\UsersController`) that are tedious to import and read.

---

## Architecture Guidelines

### Flat Structure (Small Apps)
```
app/Http/Controllers/
├── UserController.php
├── PostController.php
├── AuthController.php
└── DashboardController.php
```

### Domain Structure (Large Apps)
```
app/Http/Controllers/
├── Sales/
│   ├── OrderController.php
│   └── ProductController.php
├── Billing/
│   ├── InvoiceController.php
│   └── PaymentController.php
└── Auth/
    ├── LoginController.php
    └── RegisterController.php
```

### API Structure
```
app/Http/Controllers/
├── Web/
│   ├── UserController.php
│   └── PostController.php
└── Api/
    ├── V1/
    │   ├── UserController.php
    │   └── PostController.php
    └── V2/
        ├── UserController.php
        └── PostController.php
```

---

## Performance Considerations

Directory organization has NO impact on runtime performance. Controller resolution time is unaffected by namespace depth. The only impact is on developer navigation time.

---

## Common Mistakes

### Over-Nesting
Desc: 4+ levels of subdirectories (e.g., `Controllers/Api/V1/Admin/Reports/`).
Cause: Trying to organize by every possible dimension.
Consequence: Unwieldy namespace imports; navigation is harder than flat structure.
Better: Limit to 3 levels; use domain grouping.

### Mixing Flat and Domain
Desc: Some controllers in root `Controllers/`, others in `Controllers/Sales/`.
Cause: Incremental reorganization without a plan.
Consequence: Ambiguous placement for new controllers.
Better: Choose one strategy and migrate all controllers.

### Empty Directories
Desc: Creating `Admin/`, `Api/`, `Reports/` directories before any controllers exist.
Cause: Anticipating future needs.
Consequence: Empty directories clutter navigation; architectural decisions made without context.
Better: Create directories when first controller needs them.

---

## Anti-Patterns

### Structure by User Role
Directories named `Admin/`, `Customer/`, `Public/`. This couples controller organization to authentication roles, which are unrelated to code organization.

### Structure by HTTP Verb
Directories named `Get/`, `Post/`, `Put/`. This scatters related operations across directories and violates the resource grouping principle.

---

## Examples

### Artisan Generation with Subdirectory
```bash
# Generates to Controllers/Api/V1/ with correct namespace
php artisan make:controller Api/V1/UserController --api
```

### Domain-Based Controller Namespace
```php
namespace App\Http\Controllers\Sales;

use App\Http\Controllers\Controller;

class OrderController extends Controller
{
    // ...
}
```

---

## Related Topics

### Prerequisites
- **Controller Architecture** — Foundation for organization decisions
- **Directory Conventions** — PSR-4 namespace-to-directory mapping

### Closely Related
- **API Versioning** — Version-based controller organization
- **Feature-based Structure** — Domain grouping at the controller layer

---

## AI Agent Notes

### Important Decisions
- Flat structure is the default and works for <20 controllers
- Domain subdirectories are the recommended scale pattern
- API version subdirectories (`Api/V1/`) are standard for versioned APIs
- Maximum recommended depth: 3 levels

### Important Constraints
- Artisan `make:controller` supports subdirectory generation
- The namespace is derived from the subdirectory path
- All controller directories are under `app/Http/Controllers/`
- Controllers outside `Controllers/` require custom route configuration

### Rules Generation Hints
- Enforce maximum 3 levels of nesting
- Enforce domain grouping for applications with 20+ controllers
- Enforce `Api/V{version}/` for API controllers

---

## Verification

This document has been validated against:
- `php artisan make:controller` — subdirectory generation
- PSR-4 namespace-to-directory mapping for Controllers
- Production codebase organizational patterns
