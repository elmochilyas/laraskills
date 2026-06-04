# Resource Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Organization
- **Difficulty:** Intermediate
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
API Resources must be organized for discoverability, maintainability, and versioning. The standard convention places resources in `app/Http/Resources/` with version subdirectories (`V1/`, `V2/`) and resource-type subdirectories for complex APIs. The organization strategy affects import readability, namespace collision, and migration between API versions.

The core decision is flat vs hierarchical resource organization. Flat (`app/Http/Resources/UserResource.php`) is simple for small APIs. Hierarchical (`app/Http/Resources/V1/User/UserResource.php`) scales for large APIs with many resource types and versions.

## Core Concepts
- **Default directory:** `app/Http/Resources/` maps to `App\Http\Resources` namespace (Laravel convention since 5.5).
- **Version subdirectories:** `V1/`, `V2/` isolate breaking changes.
- **Resource-type grouping:** Subdirectories per entity (`User/`, `Post/`) for APIs with many resources.
- **Domain-organized resources:** Resources live within domain boundaries for modular applications.
- **PSR-4 autoloading:** Directory structure maps directly to namespace — no configuration changes needed.
- **Suffix conventions:** `Resource` (full detail), `Collection` (collection wrapper), `SummaryResource` (brief), `ListResource` (list-specific), `DetailResource` (full).

## When To Use
- **Flat structure:** APIs with fewer than 15 resource classes. Single version. Simple CRUD applications.
- **Version subdirectories:** When multiple API versions are maintained simultaneously. First breaking change introduced.
- **Resource-type grouping:** When each entity has multiple resource variants (summary, detail, list).
- **Domain-organized resources:** Modular monoliths or domain-driven design applications where resources belong to bounded contexts.

## When NOT To Use
- Do not create version subdirectories before the first version is released — premature versioning adds complexity with zero benefit.
- Do not use deep nesting (more than 3-4 levels from `app/`) — namespace readability suffers.
- Do not mix versioned and non-versioned resources in the same API (e.g., both `app/Http/Resources/UserResource.php` and `app/Http/Resources/V1/UserResource.php`).
- Do not over-organize before the need is clear — start flat, restructure when pain points emerge.

## Best Practices (WHY)
- **Start flat, restructure when needed.** Premature organization creates empty directories and unnecessary namespaces. Earn the complexity.
- **Use a base resource class per version.** `V1/BaseResource` provides consistent metadata, wrapping, and headers for all V1 resources.
- **Use aliases for ambiguous resource names.** `use App\Http\Resources\V1\UserResource as V1UserResource` prevents confusion when importing across versions.
- **Generate resources via Artisan.** `php artisan make:resource V1/User/UserResource` ensures consistent naming and namespace.
- **Standardize suffix usage.** If you use `DetailResource` for some entities, use it for all. Inconsistent naming confuses developers.

## Architecture Guidelines
- Maximum 3-4 directory levels from `app/` (`app/Http/Resources/V1/User/UserResource.php`). Deeper nesting reduces import readability.
- Version subdirectories should appear before resource-type subdirectories: `V1/User/UserResource.php` not `User/V1/UserResource.php`.
- For modular applications, resources within domain boundaries should still follow versioning conventions: `app/Domains/Users/Http/Resources/V1/UserResource.php`.
- The decision to version-organize should coincide with the first breaking API change. Before that, flat structure is optimal.
- When migrating from flat to versioned structure, use IDE refactoring tools or automated scripts to update all controller imports.

## Performance
- Organizational strategy has zero runtime impact — PSR-4 autoloading resolves classes in O(1) regardless of directory depth.
- IDE performance may degrade with 50+ files in a single directory. Grouping by type or version mitigates this.
- No database queries or memory overhead is introduced by any organizational pattern.

## Security
- Organizational patterns do not affect security directly. However, clear version boundaries prevent accidental exposure of new fields through old endpoints.
- Domain-organized resources in modular monoliths prevent cross-domain data exposure by keeping resources within their bounded context.
- Base resource classes should not accidentally share sensitive metadata across all versions.

## Common Mistakes

### Mixing Versioned and Non-Versioned Resources (desc)
Having both `app/Http/Resources/UserResource.php` and `app/Http/Resources/V1/UserResource.php`.
- **Cause:** Incrementally adopting versioning without cleaning up old structure.
- **Consequence:** Confusion about which resource is active. Some controllers import the unversioned one, others the versioned one.
- **Better:** Choose one strategy and apply it consistently. If versioning, move all resources into version directories.

### Over-Organizing Before Necessary (desc)
Creating `V1/`, `V2/`, `V3/` directories when only one version exists.
- **Cause:** Anticipating future needs or following a template without evaluating actual requirements.
- **Consequence:** Empty directories, longer import paths, unnecessary namespace depth.
- **Better:** Start flat. Introduce version subdirectories only when the first breaking change is made.

### Inconsistent Naming Convention (desc)
Using `UserResource` in some places and `UserDetailResource` in others without a clear pattern.
- **Cause:** Multiple developers making independent naming decisions.
- **Consequence:** Unpredictable file names. Developers must search for the correct resource class.
- **Better:** Establish a suffix convention and apply it across all resource types.

## Anti-Patterns
- **Deep namespace nesting:** `App\Http\Resources\Api\V2\Modules\Sales\Resources\OrderResource.php` — 6 levels deep, hard to read and type.
- **Namespace-as-version in file name:** `UserResourceV1.php`, `UserResourceV2.php` instead of proper version directories. PHP namespaces are designed for this purpose.
- **Single-file resource explosion:** 50+ resource classes in a flat `app/Http/Resources/` directory. IDE performance degrades and discoverability suffers.

## Examples

### Simple Flat Structure (< 15 resources)
```
app/Http/Resources/
├── UserResource.php
├── UserCollection.php
├── PostResource.php
├── PostCollection.php
└── CommentResource.php
```

### Versioned Flat Structure
```
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   ├── UserCollection.php
│   ├── PostResource.php
│   └── PostCollection.php
└── V2/
    ├── UserResource.php
    ├── UserCollection.php
    ├── PostResource.php
    ├── PostCollection.php
    ├── CommentResource.php
    └── CommentCollection.php
```

### Versioned + Type-Grouped (Large API)
```
app/Http/Resources/
└── V1/
    ├── User/
    │   ├── UserResource.php
    │   ├── UserCollection.php
    │   └── UserSummaryResource.php
    └── Post/
        ├── PostResource.php
        ├── PostCollection.php
        └── PostSummaryResource.php
```

### Domain-Organized Resources (Modular)
```
app/
├── Domains/
│   ├── Users/
│   │   └── Http/
│   │       └── Resources/
│   │           └── V1/
│   │               ├── UserResource.php
│   │               └── UserCollection.php
│   └── Posts/
│       └── Http/
│           └── Resources/
│               └── V1/
│                   ├── PostResource.php
│                   └── PostCollection.php
└── Http/
    └── Resources/       # Shared/cross-domain resources
        └── SharedResource.php
```

## Related Topics
- Resource Fundamentals — baseline resource structure
- Versioned Resources — version-specific organization and strategy
- Directory Convention Strategies (Application Architecture) — overall directory organization
- Feature-based Application Structure — domain-organized resources

## AI Agent Notes
- **Generate:** `php artisan make:resource V1/User/UserResource` — Artisan supports nested namespaces since Laravel 7.x.
- **Key constraint:** Maximum 3-4 directory levels from `app/`. Keep imports readable.
- **Validation:** No mixing of versioned and non-versioned resources in the same API.
- **Common fix:** When imports fail after restructuring, check that `use` statements match the new namespace.
- **Testing pattern:** Organize tests to mirror resource structure: `tests/Feature/Http/Resources/V1/UserResourceTest.php`.

## Verification
- [ ] Resource organizational strategy is consistent across the entire API.
- [ ] No mixing of versioned and non-versioned resources.
- [ ] Maximum directory depth from `app/` is 3-4 levels.
- [ ] Artisan is used to generate resources for consistent naming.
- [ ] Base resource class exists per version for shared metadata.
- [ ] Suffix conventions are standardized and documented.
- [ ] Flat structure is used before the first breaking change (not prematurely versioned).
