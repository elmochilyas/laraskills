# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: PSR-4 autoloading configuration for custom directories
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

PSR-4 autoloading is the mechanism that makes custom directory structures possible in Laravel. By modifying the `autoload.psr-4` section in `composer.json`, any directory can be mapped to any namespace prefix. This enables teams to reorganize the `app/` directory, add domain-specific directories, or create module structures without sacrificing autoloading. Understanding PSR-4's directory-to-namespace mapping rules is prerequisite to any custom architecture in Laravel.

---

# Core Concepts

PSR-4 maps namespace prefixes to directory roots. `App\` maps to `app/`, so `App\Models\User` maps to `app/Models/User.php`. The namespace prefix is replaced by the directory root, then the remaining namespace segments become directory segments.

The default Laravel `composer.json` mapping:
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Database\\Factories\\": "database/factories/",
      "Database\\Seeders\\": "database/seeders/"
    }
  }
}
```

Multiple namespace prefixes can map to the same or different directories. `Domain\Shared\` could map to `app/Domains/Shared/` while `Domain\Billing\` maps to `app/Domains/Billing/`.

---

# Mental Models

**The "prefix replacement" model:** PSR-4 takes the namespace prefix, replaces it with the directory path, then converts the remaining namespace to directory separators. `App\Services\Payment\StripeService` → replace `App\` with `app/` → `app/Services/Payment/StripeService.php`.

**The "multiple roots" model:** You are not limited to one `App\` root. You can have `Modules\`, `Domains\`, and `App\` all mapped to different directories. Each is a separate autoloading root.

**The "no registration needed" model:** Once mapped, any class file placed in the correct directory with the correct namespace is autoloaded. No `require`, no manual registration, no facade.

---

# Internal Mechanics

Composer generates a class map from the PSR-4 configuration. In development, it scans directories on each request. In production with `composer dump-autoload -o`, it generates an optimized class map that maps FQCNs directly to file paths, eliminating directory scanning.

Changing PSR-4 mappings requires `composer dump-autoload` to regenerate the mapping. Without this, new classes in custom directories will not be found.

The `autoload-dev` section handles test-only classes separately. Test files under `tests/` typically map to `Tests\` namespace:
```json
{
  "autoload-dev": {
    "psr-4": {
      "Tests\\": "tests/"
    }
  }
}
```

---

# Patterns

**Domain namespace mapping:** Map `Domains\` to `app/Domains/` to create domain-rooted namespaces:
```json
{
  "psr-4": {
    "App\\": "app/",
    "Domains\\": "app/Domains/"
  }
}
```
This allows `Domains\Billing\Models\Invoice` in `app/Domains/Billing/Models/Invoice.php`.

**Module namespace mapping:** Map `Modules\` to `modules/` at project root:
```json
{
  "psr-4": {
    "Modules\\": "modules/"
  }
}
```

**Source-root mapping:** Some teams create a `src/` directory for domain code alongside the default `app/`:
```json
{
  "psr-4": {
    "App\\": "app/",
    "Src\\": "src/"
  }
}
```

---

# Architectural Decisions

**Use multiple PSR-4 roots when:** You have clearly separated domain modules or bounded contexts that should have distinct namespace prefixes. This makes domain identity explicit.

**Use a single root when:** The default structure suffices and you want to minimize configuration complexity.

**Avoid overlapping roots:** Two PSR-4 entries that could both resolve the same class file will cause undefined behavior. Ensure each namespace prefix is unique and unambiguous.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Any directory structure is possible | Requires composer dump-autoload after changes | New developers may forget and get class-not-found errors |
| Clear namespace-to-directory mapping | Multiple roots add configuration complexity | New team members must learn the mapping |
| Production optimization via classmap | Development adds file-system overhead | Complicated structures slow development-time autoloading |
| Framework-agnostic mechanism | Package compatibility depends on standard | Packages assume `App\` namespace conventions |

---

# Performance Considerations

Development-mode PSR-4 autoloading scans the filesystem to find classes. Deep directory hierarchies or many root mappings slow this scan. Production `composer dump-autoload -o` eliminates this by generating a static class map—the number of roots or directory depth becomes irrelevant at runtime.

With Octane, class files are loaded once at worker boot and cached in memory thereafter. The autoload performance difference between development and optimized modes is eliminated.

---

# Production Considerations

Always run `composer dump-autoload -o` as part of deployment. Using `--optimize` (aliased as `-o`) generates the class map, eliminating filesystem scans.

After any change to `composer.json` autoload section, run `composer dump-autoload` locally. CI pipelines should fail if class resolution fails due to outdated autoload mapping.

---

# Common Mistakes

**Forgetting `composer dump-autoload`:** After creating a custom directory and adding PSR-4 mapping, the most common error is forgetting to regenerate the autoload files. Result: "Class not found" errors for classes that clearly exist.

**Mismatched namespace and directory:** `namespace App\Services\Payment` in a file at `app/Services/StripePayment.php` will not autoload because the filename doesn't match the class name (unless a custom autoloader is used).

**Case sensitivity on case-insensitive filesystems:** PSR-4 is case-sensitive in the standard, but Windows and macOS case-insensitive filesystems mask mismatches that surface in Linux production environments.

---

# Failure Modes

**Class not found:** The class file doesn't exist, the namespace doesn't match the directory, or `composer dump-autoload` hasn't been run.

**Two files resolving to same class:** Two directories both mapped to overlapping namespaces. Rare but causes unpredictable loading.

**Optimized class map stale:** After deployment without fresh `dump-autoload`, newly added classes trigger "class not found" errors because the optimized map doesn't include them.

---

# Ecosystem Usage

Laravel's `composer.json` defines the initial PSR-4 mapping. The `nwidart/laravel-modules` package adds a `Modules\` root mapping by convention. Custom scaffolding packages (like `shahmy/laravel-ddd-toolkit`) typically add PSR-4 entries during installation.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| Composer autoload basics | COS-04 Namespace conventions | COS-06 Domain-based organization |
| PHP namespace syntax | COS-03 (this KU) | MMD-04 Module registration |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
