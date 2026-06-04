# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: PSR-4 autoloading configuration for custom directories
Knowledge Unit ID: COS-03
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

PSR-4 autoloading is the mechanism enabling custom directory structures in Laravel. By modifying the `autoload.psr-4` section in `composer.json`, any directory maps to any namespace prefix. This enables reorganizing `app/`, adding domain-specific directories, or creating module structures without sacrificing autoloading. Understanding PSR-4's directory-to-namespace mapping rules is prerequisite to any custom architecture in Laravel.

---

# Core Concepts

- **Prefix Replacement**: PSR-4 maps namespace prefixes to directory roots. `App\` → `app/`, so `App\Models\User` → `app/Models/User.php`.
- **Multiple Roots**: Multiple namespace prefixes can map to different directories (e.g., `App\` → `app/`, `Modules\` → `modules/`).
- **No Registration Needed**: Once mapped, any correctly placed class is autoloaded. No manual `require` statements.
- **Autoload-dev**: Test-only classes have separate mapping (`Tests\` → `tests/`).

Default mapping:
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

---

# When To Use

- Adding custom directories outside default `app/` structure
- Implementing domain-based or module-based organization
- Separating test-only code into distinct namespaces
- Creating reusable packages with custom namespace prefixes

---

# When NOT To Use

- When the default single-root (`App\` → `app/`) setup suffices
- For very small projects with minimal custom structure
- When team members are unfamiliar with PSR-4 configuration
- When added complexity outweighs organizational benefit

---

# Best Practices

- **Run `composer dump-autoload` after every mapping change.** WHY: Without regeneration, new classes in custom directories trigger "class not found" errors.
- **Avoid overlapping roots.** WHY: Two PSR-4 entries resolving the same class cause undefined autoloading behavior.
- **Use `composer dump-autoload -o` in production.** WHY: Generates optimized class map, eliminating filesystem scans for O(1) autoloading.
- **Keep namespace case consistent with directory case.** WHY: PSR-4 is case-sensitive; case-insensitive dev environments (Windows/macOS) mask mismatches that fail on Linux production.
- **Document custom mappings in project README.** WHY: New developers need to know which namespace maps to which directory.

---

# Architecture Guidelines

- Multiple PSR-4 roots are useful when domains have distinct namespace prefixes (e.g., `Domains\Billing\`).
- A single root is sufficient for most projects — avoid unnecessary configuration complexity.
- Custom PSR-4 entries should be stable; changing namespace prefixes requires updating every file.
- Consider `autoload-dev` for test infrastructure that should not be in production class map.

---

# Performance Considerations

- Development-mode PSR-4 scans filesystem for classes — deep hierarchies slow this scan.
- Production `composer dump-autoload -o` generates a static class map, making directory depth irrelevant.
- With Octane, class files load once at worker boot and cache in memory — autoload differences eliminated.

---

# Security Considerations

- PSR-4 mappings do not affect security boundaries — only class resolution.
- Ensure custom directories are not accidentally web-accessible via misconfigured server roots.

---

# Common Mistakes

1. **Forgetting `composer dump-autoload`** after adding custom mapping. Cause: assuming new directories autoload automatically. Consequence: "Class not found" errors. Better: make `dump-autoload` part of the workflow after any mapping change.

2. **Mismatched namespace and directory:** `namespace App\Services\Payment` in a file at `app/Services/StripePayment.php`. Cause: filename doesn't match class name. Consequence: autoload failure. Better: ensure file name matches class name exactly.

3. **Case sensitivity issues on Linux.** Cause: developing on Windows/macOS (case-insensitive) and deploying to Linux (case-sensitive). Consequence: class not found only in production. Better: use consistent PascalCase in all directories and namespaces.

---

# Anti-Patterns

- **Overlapping prefixes**: Two roots that could resolve the same class — causes unpredictable behavior.
- **Unnecessary multiple roots**: Adding separate namespace prefixes when a single root with subdirectories would work.
- **Not using autoload-dev**: Test utilities polluting production autoload map.

---

# Examples

Domain namespace mapping:
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "Domains\\": "app/Domains/"
    }
  }
}
```

Module namespace mapping:
```json
{
  "autoload": {
    "psr-4": {
      "Modules\\": "modules/"
    }
  }
}
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| Composer autoload basics | COS-04 Namespace conventions | COS-06 Domain-based organization |
| PHP namespace syntax | COS-03 (this KU) | MMD-04 Module registration |

---

# AI Agent Notes

- When suggesting custom directory structures, always include the corresponding PSR-4 mapping.
- Verify `composer dump-autoload` is run after any PSR-4 configuration change.
- For simple subdirectories under `app/`, no additional PSR-4 mapping is needed — the default `App\` → `app/` covers them.

---

# Verification

- [ ] `composer dump-autoload` completes after all PSR-4 mapping changes
- [ ] All custom namespace prefixes resolve to correct files
- [ ] Production deployment script includes `composer dump-autoload -o`
- [ ] No overlapping PSR-4 roots exist
- [ ] New developer can identify namespace-to-directory mapping from project documentation
