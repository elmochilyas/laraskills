# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Default Laravel directory structure and its design rationale
Knowledge Unit ID: COS-01
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

Laravel's default directory structure is the framework's most consequential architectural opinion. It is deliberately minimal—`app/`, `bootstrap/`, `config/`, `database/`, `public/`, `resources/`, `routes/`, `storage/`, `tests/`, `vendor/`—prioritizing immediate productivity over strict layering. The `app/` directory bundles all application code under a single root namespace `App\` with subdirectories organized by technical role. This structure is a starting point, not a rigid constraint.

---

# Core Concepts

- **Convention over Configuration**: The structure is designed so any Laravel developer can open any project and immediately find Controllers in `app/Http/Controllers/`, routes in `routes/web.php`, and Models in `app/Models/`.
- **Technical Slicing**: Code is grouped by what it does technically (HTTP, database, console) rather than what business problem it solves.
- **PSR-4 Foundation**: `App\` maps to `app/` via `composer.json`. Any class under `app/` with the correct namespace is autoloaded.
- **Shallow Directory Tree**: Unlike Symfony or Rails, Laravel keeps everything under one `app/` with shallow subdirectories.
- **Version-Sensitive**: Laravel 11 removed several default directories (`Http/Middleware/`, `Http/Kernel.php`). Laravel 12 continued this minimalism trend.

Directory breakdown:
- `app/` — Application code, auto-loaded via `App\` namespace.
- `bootstrap/` — Framework bootstrapping and cached files.
- `config/` — Configuration files returning arrays.
- `database/` — Migrations, factories, seeders.
- `public/` — Web server document root, entry point, assets.
- `resources/` — Views, compiled assets, language files.
- `routes/` — Route definitions split by concern.
- `storage/` — Compiled templates, logs, cache, sessions.
- `tests/` — Test files mirroring `app/` structure.
- `vendor/` — Composer dependencies.

---

# When To Use

- Projects under 3-5 engineers
- CRUD-heavy applications with straightforward business rules
- Rapid shipping priority over long-term maintainability
- Teams where all developers are Laravel-familiar
- Prototypes and MVPs where architecture decisions would slow iteration

---

# When NOT To Use

- Growing teams (10+ engineers) needing clear ownership boundaries
- Multiple business domains with distinct logic requiring isolation
- Complex business rules not well-served by Controller → Model pattern
- Applications expected to live 5+ years without reorganization
- When codebase has >50 files in any single default directory

---

# Best Practices

- **Use subdirectories within defaults** — Even within the default structure, subdirectories like `app/Http/Controllers/Api/` keep things organized. WHY: Prevents flat-file dumping ground that degrades navigability.
- **Document custom additions** — If you add `app/Services/`, document it in README. WHY: The default structure is self-documenting; custom extensions are not.
- **Run `composer dump-autoload -o` in deployment** — Ensures optimized class maps. WHY: Development-mode PSR-4 scans the filesystem; optimized maps are O(1).
- **Keep `app/` shallow** — Avoid exceeding 4-5 levels of nesting. WHY: Deep nesting slows IDE navigation and creates long FQCNs.
- **Align with `artisan make:` conventions** — Use standard directories for standard artifact types. WHY: Generated files land where expected; prevents "class not found" confusion.

---

# Architecture Guidelines

- The default structure is an intentional starting point, not a production end-state for complex applications.
- Deviate from defaults only when measurable pain emerges — never for architectural fashion.
- Any custom directory structure must remain compatible with PSR-4 autoloading.
- Consider organizing by business domain when the application has 3+ distinct business areas.
- Preserve the `routes/` → `Controllers/` entry point pattern even with custom structures.

---

# Performance Considerations

- Directory structure has negligible performance impact on runtime.
- `composer dump-autoload -o` generates optimized class maps making autoloading O(1) regardless of directory depth.
- Config caching (`php artisan config:cache`) and route caching are unaffected by directory structure.
- Event caching works regardless of where event classes reside.

---

# Security Considerations

- Never expose `vendor/` or `storage/` directories via web server configuration.
- Ensure `public/` is the document root — no other directory should be web-accessible.
- Custom directories containing sensitive logic must still respect Laravel's middleware and auth boundaries.

---

# Common Mistakes

1. **Flat dumping ground**: Adding files to `app/` without namespace organization. Cause: assuming default structure means no structure. Consequence: files become unfindable. Better: use subdirectories even within defaults.

2. **Fighting framework conventions**: Creating custom directories that break `artisan make:` commands without documentation. Cause: desire for clean architecture too early. Consequence: developers create files in wrong locations. Better: override stubs or document new locations.

3. **Over-organization before pain**: Deeply nested custom structures on day one for an application that doesn't exist yet. Cause: architectural purity over pragmatism. Consequence: wasted effort restructuring later. Better: start simple, evolve with demonstrated complexity.

---

# Anti-Patterns

- **App dumping ground**: All files in `app/` root namespace without subdirectories. Degrades to unmaintainable.
- **Preemptive architecture**: Building elaborate directory structures for "future needs" that never materialize.
- **Framework fighting**: Restructuring purely to avoid looking like "default Laravel."

---

# Examples

Default Laravel directory tree:
```
my-project/
├── app/
│   ├── Http/
│   │   └── Controllers/
│   ├── Models/
│   ├── Providers/
│   └── ...
├── bootstrap/
├── config/
├── database/
├── public/
├── resources/
├── routes/
├── storage/
├── tests/
└── vendor/
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| PHP PSR-4 autoloading basics | COS-02 Layer-based organization | COS-09 When to deviate |
| Composer autoload configuration | COS-04 Namespace conventions | COS-10 Team-scale strategies |

---

# AI Agent Notes

- When generating Laravel code, default to the standard directory conventions unless the project explicitly documents custom paths.
- Recognize that projects with deep custom directory structures have likely made specific architectural choices — respect those patterns.
- For simple CRUD features, suggest staying within Laravel defaults rather than proposing elaborate restructuring.

---

# Verification

- [ ] All `artisan make:` commands produce files in the expected locations
- [ ] `composer dump-autoload` completes without errors after custom directory additions
- [ ] IDE navigation (Ctrl+click on class names) resolves correctly
- [ ] Production deployment includes optimized autoload (`-o` flag)
- [ ] New developers can find expected artifacts (controllers, models, routes) within 30 seconds
