# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Namespace conventions and directory-to-namespace mapping
Knowledge Unit ID: COS-04
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

PHP namespaces in Laravel follow the PSR-4 convention where namespace segments map directly to directory segments. The root namespace `App\` maps to `app/`. Every subdirectory becomes a namespace segment: `app/Http/Controllers/` becomes `App\Http\Controllers`. This one-to-one mapping is the foundation for autoloading, IDE navigation, and import resolution.

---

# Core Concepts

- **Path is the Name**: The namespace is the directory path with separators converted. `Controllers\Api\UserController` = `Controllers/Api/UserController.php`.
- **Root + Segments**: Everything starts from the root namespace (`App\`). Add directory segments separated by `\`.
- **FQCN Identity**: The fully qualified class name is the class's identity in the service container — `$this->app->bind(UserService::class, ...)` references by FQCN.
- **No Surprises**: Given a file at `app/Domains/Billing/Services/InvoiceService.php`, namespace must be `App\Domains\Billing\Services`.

Core rules:
- `namespace App\Models;` → file in `app/Models/`
- `namespace App\Http\Controllers\Api;` → file in `app/Http/Controllers/Api/`
- Class `User` in `App\Models` → FQCN `App\Models\User` → file `app/Models/User.php`

---

# When To Use

- Always — PSR-4 namespace-to-directory mapping is universal in Laravel and the PHP ecosystem
- Any time you create custom directories under `app/`
- When organizing code into sub-namespaces for clarity

---

# When NOT To Use

- Never deviate from PSR-4 mapping in application code
- Do not use classmap autoloading for new application classes (only for legacy or package files)

---

# Best Practices

- **Maintain directory-per-namespace alignment.** WHY: Every leaf directory with PHP files should be a namespace. Non-PHP directories cause confusion.
- **Use PascalCase for namespace segments.** WHY: Matches class naming convention; `app/http/controllers/api/` looks inconsistent and breaks tool expectations.
- **Avoid namespace aliasing:** `use App\Models\User as AppUser`. WHY: Indicates poor naming or namespace structure. Restructure rather than alias.
- **Use sub-namespaces for organizational clarity:** `App\Services\Payment\Stripe` vs `App\Services\PaymentStripeService`. WHY: Keeps directory structure organized and prevents long class names.
- **Keep root namespace as `App\` unless necessary.** WHY: All packages and tooling assume `App\`; changing it requires updating every file.

---

# Architecture Guidelines

- The namespace declaration in each file must exactly match the directory path relative to the PSR-4 root.
- Refactoring a class to a new directory requires both file move AND namespace change.
- Establish a namespace convention document for custom PSR-4 mappings.
- Sub-namespace depth should not exceed 5-6 levels for readability.

---

# Performance Considerations

- Namespace depth does not affect autoloading performance with optimized class maps.
- Class maps map FQCN directly to file path regardless of directory depth.
- Development autoloading scans filesystem; depth increases scan time but impact is negligible.

---

# Security Considerations

- Namespace collisions between application and package code can cause class resolution to unexpected files.
- Ensure custom namespace prefixes do not conflict with vendor namespace prefixes.

---

# Common Mistakes

1. **Namespace mismatch:** `namespace App\Services;` in a file at `app/Http/Services/SomeService.php`. Cause: forgetting to update namespace declaration after moving file. Consequence: class not found. Better: use IDE refactoring tools that update both path and namespace.

2. **Missing namespace declaration:** File without `namespace` keyword defines classes in global namespace. Cause: oversight when creating new files. Consequence: class cannot be autoloaded by PSR-4. Better: always add namespace declaration immediately.

3. **Wrong root namespace in custom structures:** Creating `app/Domains/Billing/UserService.php` with `namespace Domains\Billing;` when PSR-4 root is `App\`. Cause: assuming namespace starts at custom root. Consequence: autoload failure. Better: `namespace App\Domains\Billing;`.

---

# Anti-Patterns

- **Flat namespace**: No sub-namespaces, all classes in `App\`. Leads to class name collisions.
- **Deep namespace nesting**: 8+ levels of sub-namespaces making FQCNs unreadable.
- **Namespace aliasing**: Using `as` imports as a substitute for proper namespace organization.

---

# Examples

Correct namespace mapping:
```php
// File: app/Domains/Billing/Services/InvoiceService.php
namespace App\Domains\Billing\Services;

class InvoiceService { }
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| PHP namespace syntax | COS-03 PSR-4 autoloading | COS-06 Domain-based organization |
| PSR-4 specification | COS-02 Layer-based organization | COS-08 Naming conventions |

---

# AI Agent Notes

- When generating new classes, always include the correct namespace matching the file path.
- Use the project's existing PSR-4 mapping to determine the correct namespace prefix.
- For `app/` subdirectories, the namespace prefix is `App\` by default.

---

# Verification

- [ ] Every PHP file has a `namespace` declaration matching its directory path
- [ ] `composer dump-autoload` validates all namespace mappings
- [ ] IDE navigation (Go to Definition) resolves all class references
- [ ] No `use ... as` aliases for application classes (excluding vendor disambiguation)
- [ ] All namespace segments use PascalCase
