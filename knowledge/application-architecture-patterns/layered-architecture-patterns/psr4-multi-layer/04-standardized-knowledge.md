# Metadata

Domain: Application Architecture Patterns
Subdomain: Layered Architecture Patterns
Knowledge Unit: PSR-4 Autoloading for Multi-Layer Projects
Knowledge Unit ID: LAP-05-psr4-multi-layer
Difficulty Level: Intermediate
Category: Autoloading | Architecture Infrastructure
Last Updated: 2026-06-04

---

# Overview

PSR-4 autoloading maps namespace prefixes to directory roots, allowing Composer to load classes on demand. In multi-layer Laravel projects — Clean Architecture, Hexagonal, or any layered structure — configuring multiple PSR-4 roots per architecture layer gives each layer its own isolated namespace, making dependency boundaries explicit, auditable through import statements, and enforceable through static analysis.

This is not about autoloading mechanics. It is about using namespace isolation as an architectural enforcement mechanism. When each layer (Domain, Application, Infrastructure, Presentation) has a distinct PSR-4 namespace root, any cross-layer dependency becomes visible in a `use` statement at the top of every file. The namespace structure becomes a dependency graph that can be read without understanding the business logic.

---

# Core Concepts

**PSR-4 Namespace Root**: A mapping in `composer.json` from a namespace prefix to a directory path. Example: `"App\\Domain\\" => "src/Domain/"`. All classes under that namespace must reside in the mapped directory.

**Multi-Root Autoloading**: Defining multiple PSR-4 entries so each architecture layer has its own root. Instead of everything under `App\\`, you get `App\\Domain\\`, `App\\Application\\`, `App\\Infrastructure\\`, `App\\Presentation\\`.

**Namespace Visibility**: The namespace of a class is visible in any file that imports it. In multi-layer projects, a `use App\\Infrastructure\\PaymentGateway` in a Domain file immediately signals a dependency rule violation.

**Autoloader Optimization**: Composer can generate a classmap (optimized autoloader) that maps classes directly to file paths, eliminating filesystem lookups. Required for production and Octane compatibility.

**PSR-4 Trailing Backslash Requirement**: Every namespace prefix in the mapping must end with `\\`. This is a PSR-4 requirement — without it, Composer cannot correctly resolve sub-namespaces.

---

# When To Use

- Clean Architecture or Hexagonal Architecture projects where layer boundaries must be enforced
- Any project with a `src/` directory structure separating Domain, Application, and Infrastructure
- Teams using architecture tests (Pest, PHPStan) that check namespace-level dependency rules
- Projects where new developers must quickly understand layer boundaries from file structure alone
- Octane-deployed applications that benefit from optimized classmap autoloading

---

# When NOT To Use

- Single-layer MVC projects where `App\\` namespace is sufficient
- Small projects (<10 classes) where namespace infrastructure adds ceremony without benefit
- Monolithic applications where all code lives under one namespace and layers are directories only
- Projects where developers are not committed to respecting namespace boundaries

---

# Best Practices

**Define one PSR-4 root per architecture layer.** Domain, Application, Infrastructure, and Presentation each get their own entry. This makes layer ownership explicit and enables namespace-level architecture testing.

**Keep Presentation and Infrastructure under shared roots when appropriate.** Not every layer needs isolation. If Presentation and Infrastructure share `App\\`, that is acceptable — isolate only where boundary enforcement matters.

**Run `composer dump-autoload -o` after every namespace change.** The optimized autoloader prevents runtime class-not-found errors and improves performance. Use without `-o` during development for faster iteration.

**Never overlap namespace roots.** If `App\\` and `App\\Domain\\` are both defined, Composer uses the most specific match for sub-namespaces, but confusion and subtle bugs result. Use distinct, non-overlapping roots.

**Document the namespace-to-directory mapping.** A README or comment in `composer.json` showing which namespace maps to which directory serves as living documentation for the team.

---

# Architecture Guidelines

- Each layer must have its own top-level namespace directory. No two layers share a PSR-4 root.
- The namespace hierarchy must mirror the physical directory structure. `App\Domain\Entities\Invoice` must be in `src/Domain/Entities/Invoice.php`.
- Cross-layer imports are visible in `use` statements — this is the audit trail. Any violation of the dependency rule is detectable by scanning `use` statements.
- Architecture tests should check that Domain layer files do not import from Infrastructure or Presentation namespaces.
- PSR-4 roots should be defined in `composer.json` `autoload` section, not `autoload-dev`, unless the code is test-only.

---

# Performance Considerations

- Multiple PSR-4 roots add negligible overhead compared to a single root. The autoloader resolves by checking each prefix in order.
- The optimized autoloader (`-o`) generates a classmap that bypasses PSR-4 resolution entirely, making performance identical regardless of number of roots.
- Octane compatibility: multiple PSR-4 roots work correctly with Octane. Ensure `composer dump-autoload -o` is part of the deployment process.
- File location changes (moving a class between layers) require `composer dump-autoload` to update the autoloader cache.

---

# Security Considerations

- Namespace structure does not affect runtime security — authentication, authorization, and validation must be implemented independently of namespace organization.
- However, namespace isolation can prevent accidental exposure of internal classes: if Infrastructure classes are in `App\\Infrastructure\\`, they cannot be accidentally exposed through routes that auto-discover controllers under `App\\Http\\Controllers\\`.
- Multi-tenant applications may use namespace-based service provider registration — ensure tenant isolation is not reliant on namespace structure alone.

---

# Common Mistakes

1. **Missing trailing backslash in namespace prefix.** PSR-4 requires `"App\\Domain\\"` not `"App\\Domain"`. Without the trailing `\\`, Composer may resolve `App\\DomainServices\\` to the wrong directory. Always double-check the trailing `\\` in every mapping.

2. **Overlapping namespace roots.** Defining `"App\\": "app/"` alongside `"App\\Domain\\": "src/Domain/"` creates ambiguity. Classes under `App\\Domain\\` will use the more specific root, but classes under `App\\Http\\` still use `app/`. The overlap is valid but confusing — use distinct roots.

3. **Forgetting `composer dump-autoload` after adding roots.** New classes in the new namespace will not be found until the autoloader regenerates. The error message looks like a standard class-not-found, causing debugging confusion.

4. **Case sensitivity mismatches on Linux.** PSR-4 namespace-to-directory resolution is case-sensitive on case-sensitive filesystems. `src/domain/` does not match `App\\Domain\\`. CI and production Linux environments will fail if case does not match.

5. **Placing classes in wrong directory matching a different root.** A class with namespace `App\\Infrastructure\\Services\\PaymentService` must be in the directory mapped to `App\\Infrastructure\\`. If it is accidentally placed under `src/Domain/`, autoloading fails with an obscure error.

---

# Anti-Patterns

- **Single Monster Root**: Everything under `App\\` in `app/`, with layers as subdirectories only. No namespace isolation, no visibility into layer dependencies, no enforcement possible.
- **Root per File**: Creating a separate PSR-4 root for every subdirectory. This is over-fragmentation — one root per architecture layer, not per component.
- **Production and Dev Roots Mixed**: Putting production code roots in `autoload-dev`. Production deployments silently miss classes and fail at runtime.

---

# Examples

**Multi-Layer PSR-4 Configuration:**
```json
{
  "autoload": {
    "psr-4": {
      "App\\": "app/",
      "App\\Domain\\": "src/Domain/",
      "App\\Application\\": "src/Application/",
      "App\\Infrastructure\\": "src/Infrastructure/"
    }
  }
}
```

**Resulting Directory Structure:**
```
src/
├── Domain/
│   ├── Entities/
│   ├── ValueObjects/
│   └── Services/
├── Application/
│   ├── UseCases/
│   └── DTOs/
└── Infrastructure/
    ├── Persistence/
    ├── Queue/
    └── External/
```

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| PHP Namespaces and PSR-4 | LAP-04 Dependency Rule | LAP-13 Architecture Tests |
| Composer autoloading basics | LAP-01 Three-layer architecture | LAP-12 Incremental migration |
| Laravel directory structure | LAP-03 Hexagonal Architecture | |

---

# AI Agent Notes

- When generating code for layered projects, always use fully qualified imports that make the layer of origin visible.
- Default recommendation: one PSR-4 root per architecture layer.
- For simple MVC projects, the default `App\\` namespace is sufficient — do not add unnecessary PSR-4 roots.
- Always generate `composer dump-autoload -o` in deployment scripts for Octane-deployed applications.
