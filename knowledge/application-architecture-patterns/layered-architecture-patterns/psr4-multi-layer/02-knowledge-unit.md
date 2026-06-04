# PSR-4 Autoloading for Multi-Layer Projects

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-05-psr4-multi-layer
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary
PSR-4 autoloading maps namespace prefixes to directory roots, enabling Composer to load classes on demand. In multi-layer Laravel projects, configuring multiple PSR-4 roots per architecture layer makes dependency boundaries explicit, auditable through import statements, and enforceable through static analysis. This is not about autoloading mechanics — it is about using namespace isolation as an architectural enforcement mechanism.

---

## Core Concepts
- **PSR-4 Namespace Root**: A mapping from a namespace prefix to a directory path; all classes under that namespace must reside in the mapped directory.
- **Multi-Root Autoloading**: Defining multiple PSR-4 entries so each architecture layer (Domain, Application, Infrastructure, Presentation) has its own isolated namespace root.
- **Namespace Visibility**: The namespace of a class is visible in any file that imports it — a `use` statement revealing an Infrastructure namespace in a Domain file immediately signals a dependency rule violation.
- **Autoloader Optimization**: Composer can generate a classmap (optimized autoloader) that maps classes directly to file paths, eliminating filesystem lookups for production and Octane compatibility.
- **PSR-4 Trailing Backslash Requirement**: Every namespace prefix in the mapping must end with `\\` — without it, Composer cannot correctly resolve sub-namespaces.

---

## Mental Models
1. **Namespace-as-Boundary**: Think of each PSR-4 root as a security boundary for dependencies — if a Domain class imports from Infrastructure, the `use` statement is the visible violation. Reading a file's imports reveals the entire dependency graph without understanding business logic.
2. **Audit Trail in Imports**: The `use` statements at the top of every file serve as the audit trail for architecture enforcement. A CI script or architecture test can scan these imports to verify no layer violations exist, making the namespace structure a machine-enforceable contract.

---

## Internal Mechanics
When a class like `App\Domain\Entities\Invoice` is requested, Composer's autoloader iterates through PSR-4 roots in order. The first matching prefix (`App\Domain\`) maps to `src/Domain/`, so Composer resolves the file to `src/Domain/Entities/Invoice.php`. If no PSR-4 root matches, the classmap fallback is checked. The optimized autoloader (`composer dump-autoload -o`) bypasses this entire resolution process by loading a pre-generated classmap. In Octane, the classmap is loaded once at worker boot and shared across all requests, making PSR-4 root count irrelevant to runtime performance.

---

## Patterns
### Multi-Root Isolation Pattern
- **Purpose**: Give each architecture layer its own namespace to enforce dependency boundaries
- **Mechanism**: One PSR-4 entry per layer in `composer.json`, non-overlapping namespace roots
- **Benefits**: Visible dependency violations via imports, architecture-testable, clear layer ownership
- **Tradeoffs**: More configuration, requires team discipline, `composer dump-autoload` after layer moves

### Optimized Classmap Pattern
- **Purpose**: Eliminate autoloader resolution overhead in production
- **Mechanism**: Run `composer dump-autoload -o` during deployment to generate a classmap
- **Benefits**: Identical performance regardless of root count, Octane-compatible, no filesystem lookups
- **Tradeoffs**: Slower iteration during development (requires re-optimization after new classes)

---

## Architectural Decisions
- **Choose multi-root PSR-4 when**: Adopting Clean/Hexagonal Architecture, enforcing layer boundaries, using architecture tests, or working on a team of 3+ developers
- **Choose default `App\\` namespace when**: Building a simple MVC application, prototyping, working solo on a small project (< 10 classes), or the team is not committed to namespace discipline
- **Alternatives**: Single `App\\` root with subdirectories (no enforcement), per-component roots (over-fragmentation), or classmap-only autoloading (inflexible for development)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit layer boundaries via namespace isolation | More `composer.json` configuration and maintenance | Teams must remember to add roots for new layers |
| Auditable dependency violations via `use` statements | Requires team discipline to check imports | CI/architecture tests can automate enforcement |
| Optimized classmap eliminates performance concerns | Must run `composer dump-autoload -o` after namespace changes | Forgetting causes class-not-found errors in production |
| Non-overlapping roots prevent ambiguity | Overlapping roots confuse resolution | Use distinct, non-overlapping roots exclusively |

---

## Performance Considerations
Multiple PSR-4 roots add negligible overhead compared to a single root — the autoloader checks each prefix in order. The optimized autoloader (`-o`) generates a classmap that bypasses PSR-4 resolution entirely, making performance identical regardless of root count. Octane compatibility is straightforward: multiple PSR-4 roots work correctly, but ensure `composer dump-autoload -o` is part of the deployment process. Moving a class between layers requires `composer dump-autoload` to update the autoloader cache.

---

## Production Considerations
Deployments must include `composer dump-autoload -o` as a mandatory step — without it, newly added classes in custom namespace roots cause class-not-found errors at runtime. Case sensitivity on Linux filesystems matters: `src/domain/` does not match `App\Domain\\`. CI environments should mirror production filesystem casing. Overlapping namespace roots (`App\\` and `App\Domain\\`) work technically but cause confusion and potential subtle bugs — audit composer.json during code review.

---

## Common Mistakes
1. **Missing trailing backslash in namespace prefix**: PSR-4 requires `"App\Domain\\"` not `"App\Domain"`. Without the trailing `\\`, Composer may resolve `App\DomainServices\\` to the wrong directory.
2. **Overlapping namespace roots**: Defining `"App\\": "app/"` alongside `"App\Domain\\": "src/Domain/"` creates ambiguity. The overlap is valid but confusing — use distinct, non-overlapping roots.
3. **Forgetting `composer dump-autoload` after adding roots**: New classes in the new namespace will not be found until the autoloader regenerates, manifesting as standard class-not-found errors.
4. **Case sensitivity mismatches on Linux**: PSR-4 namespace-to-directory resolution is case-sensitive. CI and production Linux environments fail if casing does not match.
5. **Placing classes in the wrong directory**: A class with namespace `App\Infrastructure\Services\PaymentService` must be in the directory mapped to `App\Infrastructure\\`.

---

## Failure Modes
- **Class not found errors**: Occurs when a namespace root is missing from `composer.json`, the optimized autoloader has not been regenerated, or the class file is in the wrong directory
- **Silent dependency violations**: Without architecture tests, a Domain file importing Infrastructure code passes code review because the import looks valid at a glance
- **Case sensitivity failures**: A CI pipeline that runs on Linux fails because the developer's Windows or macOS environment is case-insensitive
- **Ambiguous resolution**: Overlapping namespace roots cause subtle bugs where Composer resolves a namespace to an unexpected directory

---

## Ecosystem Usage
Laravel itself uses a single `App\\` namespace root for the default application structure. Packages define their own PSR-4 roots in their `composer.json`. The `laravel-common` package and enterprise scaffolds often pre-configure multi-root PSR-4 for layered architecture projects. Pest architecture tests can verify namespace-level dependency rules against PSR-4 root boundaries.

---

## Related Knowledge Units
### Prerequisites
- PHP Namespaces and PSR-4
- Composer autoloading basics
- Laravel directory structure

### Related Topics
- LAP-04 Dependency Rule
- LAP-01 Three-layer architecture
- LAP-03 Hexagonal Architecture

### Advanced Follow-up Topics
- LAP-13 Architecture Tests
- LAP-12 Incremental migration

---

## Research Notes
The most common production incident is a missing `composer dump-autoload -o` in the deployment script after adding a new PSR-4 root. The optimized autoloader provides identical performance regardless of the number of PSR-4 roots, making the multiple-root approach free in production. For simple MVC projects, the default `App\\` namespace is sufficient — do not add unnecessary PSR-4 roots.
