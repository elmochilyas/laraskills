# Skill: Organize API Resource Files

## Purpose

Structure resource class files in `app/Http/Resources/` for discoverability, maintainability, and versioning using a flat or hierarchical directory layout.

## When To Use

- Setting up the resource directory structure for a new API
- Introducing version subdirectories after the first breaking change
- Grouping resources by entity type when many variants exist per entity
- Migrating from flat to versioned structure

## When NOT To Use

- Before the first API version is released — premature versioning adds complexity with zero benefit
- Mixing versioned and non-versioned resources — choose one strategy consistently
- Creating deep nesting (>3-4 levels from `app/`) — namespace readability suffers
- Over-organizing before the need is clear — start flat, restructure when pain points emerge

## Prerequisites

- Understanding of PSR-4 autoloading and namespace mapping
- Artisan CLI for generating resources
- Decision on organizational strategy (flat, versioned, type-grouped, or domain-organized)

## Inputs

- List of existing or planned resource classes
- API versioning strategy
- Number of resource variants per entity

## Workflow

1. Start with a flat structure for new APIs with fewer than 15 resource classes:
   ```
   app/Http/Resources/
   ├── UserResource.php
   ├── UserCollection.php
   ├── PostResource.php
   └── PostCollection.php
   ```
2. Introduce version subdirectories only after the first breaking change is made to a released API.
3. When versioning, move ALL resources into version directories — never mix versioned and non-versioned resources.
4. Define a base resource class per version (`V1/BaseResource`) that all resources in that version extend for shared metadata and wrapping configuration.
5. When each entity has multiple variants (summary, detail, list), group by type within the version:
   ```
   app/Http/Resources/V1/
   ├── User/
   │   ├── UserResource.php
   │   ├── UserCollection.php
   │   └── UserSummaryResource.php
   └── Post/
       ├── PostResource.php
       └── PostCollection.php
   ```
6. Keep directory depth at maximum 3-4 levels from `app/`.
7. Use PHP namespace directories for versioning (`V1/UserResource.php` → `App\Http\Resources\V1\UserResource`). Never embed version identifiers in file names (`UserResourceV1.php`).
8. Standardize suffix naming conventions: `Resource`, `Collection`, `SummaryResource`, `DetailResource`, `ListResource` — apply consistently across all entities.
9. Use `php artisan make:resource V1/User/UserResource` for consistent naming and namespace generation.
10. Structure test files to mirror the resource directory hierarchy.

## Validation Checklist

- [ ] Resource organizational strategy is consistent across the entire API
- [ ] No mixing of versioned and non-versioned resources
- [ ] Maximum directory depth from `app/` is 3-4 levels
- [ ] Artisan is used to generate resources for consistent naming
- [ ] Base resource class exists per version for shared metadata
- [ ] Suffix conventions are standardized and documented
- [ ] Flat structure is used before the first breaking change (not prematurely versioned)

## Common Failures

- Mixing versioned and non-versioned resources — having both `app/Http/Resources/UserResource.php` and `app/Http/Resources/V1/UserResource.php` causes confusion about which is active
- Over-organizing before necessary — creating `V1/`, `V2/`, `V3/` directories when only one version exists adds empty directories and unnecessary namespace depth
- Inconsistent naming convention — using `UserResource` in some places and `UserDetailResource` in others without a clear pattern forces developers to search for the correct class
- Deep namespace nesting — paths like `App\Http\Resources\Api\V2\Modules\Sales\Resources\OrderResource.php` (6+ levels) make imports unreadable
- Namespace-as-version in file names — using `UserResourceV1.php` instead of `V1/UserResource.php` bypasses PSR-4 and creates unwieldy class names

## Decision Points

- **Flat vs versioned**: Use flat until the first breaking change to a released API. Then migrate all resources into version directories.
- **Version subdirectories vs file-name suffixes**: Always use version subdirectories (namespaces). Never use file-name suffixes like `UserResourceV1.php`.
- **Type grouping vs flat**: Use type grouping (`User/`, `Post/`) when each entity has 3+ resource variants. Use flat within a version when each entity has 1-2 resource classes.
- **Domain-organized vs centralized**: For modular monoliths, place resources within domain boundaries (`app/Domains/Users/Http/Resources/`). For simpler apps, centralize in `app/Http/Resources/`.

## Performance Considerations

- Organizational strategy has zero runtime impact — PSR-4 autoloading resolves classes in O(1) regardless of directory depth
- IDE performance may degrade with 50+ files in a single directory — grouping by type or version mitigates this
- No database queries or memory overhead introduced by any organizational pattern

## Security Considerations

- Organizational patterns do not affect security directly. However, clear version boundaries prevent accidental exposure of new fields through old endpoints
- Domain-organized resources in modular monoliths prevent cross-domain data exposure by keeping resources within their bounded context
- Base resource classes should not accidentally share sensitive metadata across all versions

## Related Rules

- Start Flat, Restructure When Needed (Code Organization)
- Never Mix Versioned and Non-Versioned Resources (Code Organization)
- Keep Maximum Directory Depth at 3-4 Levels from app/ (Maintainability)
- Use a Base Resource Class Per Version (Code Organization)
- Standardize Suffix Naming Convention (Maintainability)
- Create Version Subdirectories Only After First Breaking Change (Architecture)
- Organize Tests to Mirror Resource Structure (Testing)
- Avoid Namespace-as-Version in File Names (Code Organization)

## Related Skills

- [Resource Fundamentals](../resource-fundamentals/06-skills.md)
- [Versioned Resources](../versioned-resources/06-skills.md)

## Success Criteria

- Resource organization is consistent across the entire API
- No mixing of versioned and non-versioned resources exists
- Maximum directory depth is within the 3-4 level guideline
- Suffix conventions are consistent and documented
- Base resource class provides shared version metadata
- Test files mirror the resource directory structure
