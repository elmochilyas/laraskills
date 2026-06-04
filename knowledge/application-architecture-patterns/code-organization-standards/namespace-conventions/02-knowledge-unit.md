# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Namespace conventions and directory-to-namespace mapping
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

PHP namespaces in Laravel follow the PSR-4 convention where namespace segments map directly to directory segments. The root namespace `App\` maps to the `app/` directory. Every subdirectory of `app/` becomes a namespace segment: `app/Http/Controllers/` becomes `App\Http\Controllers`. This one-to-one mapping between filesystem and namespace is the foundation for autoloading, IDE navigation, and import resolution. Violating this mapping breaks tooling and confuses developers.

---

# Core Concepts

- `namespace App\Models;` → file must be in `app/Models/`
- `namespace App\Http\Controllers\Api;` → file must be in `app/Http/Controllers/Api/`
- Class `User` in namespace `App\Models` → FQCN `App\Models\User` → file `app/Models/User.php`

Laravel does not enforce strict PSR-4 compliance at runtime—you could place any class anywhere and `require` it manually—but doing so breaks autoloading, IDE navigation, and all tooling that relies on the namespace-to-path convention.

The FQCN is the class's identity in the service container. `$this->app->bind(UserService::class, ...)` references the class by its FQCN, which must match both the namespace declaration in the file and the PSR-4 mapping.

---

# Mental Models

**The "Path is the Name" model:** The namespace is the path with separators converted. `Controllers\Api\UserController` in namespace form is the directory path `Controllers/Api/UserController.php`.

**The "Root + Segments" model:** Everything starts from the root namespace (`App\`). Add directory segments separated by `\`. The fully qualified name is the class's complete address.

**The "No Surprises" model:** Given a file at `app/Domains/Billing/Services/InvoiceService.php`, the namespace must be `App\Domains\Billing\Services` and the class `InvoiceService`. Any deviation breaks autoloading.

---

# Internal Mechanics

`composer dump-autoload` generates a `vendor/composer/autoload_psr4.php` file that maps namespace prefixes to directories. The autoloader strips the prefix from the FQCN, converts the remainder to a path, appends `.php`, and checks for the file.

Laravel's `artisan` commands use namespace-aware templates. `make:model` generates `namespace App\Models;`. `make:controller` generates `namespace App\Http\Controllers;`. Custom stubs can override these defaults.

---

# Patterns

**Directory-per-namespace alignment:** Every leaf directory containing PHP files should be a namespace. Non-PHP directories (e.g., `app/Http/Controllers/Api/docs/`) should be avoided to prevent confusion.

**Single-class-per-file convention:** One class per file, filename matches class name. This is not a namespace rule but a PSR-4 autoloading requirement.

**Namespace case consistency:** Directory and namespace names use PascalCase (same as class names). `app/Http/Controllers/Api/UserController.php` — not `app/http/controllers/api/user_controller.php`.

---

# Architectural Decisions

**Use sub-namespaces for organizational clarity:** `App\Services\Payment\Stripe` vs. `App\Services\PaymentStripeService`. Sub-namespaces keep the directory structure organized and prevent long class names.

**Avoid namespace aliasing:** `use App\Models\User as AppUser` is a code smell. If name conflicts occur between namespaces, restructure rather than alias.

**Root namespace choice matters:** Keeping `App\` is conventional but not required. Some teams change it to the project name. Consider that all packages and tooling assume `App\`.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Intuitive mapping between FS and namespace | Refactoring requires moving files AND updating namespace | Moving a class to a new directory means changing its namespace declaration |
| IDE tools work automatically | Deep nesting produces long FQCNs | `App\Domains\Billing\Application\UseCases\GenerateInvoice` |
| Composer handles autoloading | Root namespace cannot change without rewrites | Changing `App\` to `Company\Project\` requires updating every file |

---

# Performance Considerations

Namespace depth does not affect autoloading performance with optimized class maps. The class map maps FQCN directly to file path regardless of directory depth.

---

# Production Considerations

Establish a namespace convention document. Every developer should know: "What namespace does a class in `app/X/Y/Z.php` get?" This is trivial for default structures but non-trivial for custom PSR-4 mappings.

Use `composer dump-autoload` in deployment to ensure the namespace-to-path mapping is fresh.

---

# Common Mistakes

**Namespace mismatch:** `namespace App\Services;` in a file located at `app/Http/Services/SomeService.php`. The namespace says `Services` but the path says `Http/Services`.

**Missing namespace declaration:** A file without `namespace` keyword defines classes in the global namespace, which cannot be autoloaded by PSR-4.

**Wrong root namespace in custom structures:** Creating `app/Domains/Billing/UserService.php` with `namespace Domains\Billing;` but the PSR-4 root is `App\`, not `Domains\`. Should be `namespace App\Domains\Billing;`.

---

# Failure Modes

**Class not found:** The namespace declaration in the file doesn't match the directory path relative to the PSR-4 root.

**Import confusion:** `use App\Models\User;` imports a class, but the file is actually at `app/Domains/Billing/Models/User.php` with namespace `App\Domains\Billing\Models\User`. The import resolves to a non-existent file.

---

# Ecosystem Usage

All Laravel packages follow the PSR-4 namespace-to-directory convention. Packages with custom autoloading (e.g., `nwidart/modules` adding `Modules\`) document this as an installation step. The convention is universal in the PHP ecosystem.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| PHP namespace syntax | COS-03 PSR-4 autoloading | COS-06 Domain-based organization |
| PSR-4 specification | COS-02 Layer-based organization | COS-08 Naming conventions |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
