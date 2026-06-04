# Resource Organization

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Organization
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

API Resources must be organized for discoverability, maintainability, and versioning. The standard convention places resources in `app/Http/Resources/` with version subdirectories (`V1/`, `V2/`) and resource-type subdirectories for complex APIs. The organization strategy affects import readability, namespace collision, and migration between API versions.

The core decision is flat vs hierarchical resource organization. Flat (`app/Http/Resources/UserResource.php`) is simple for small APIs. Hierarchical (`app/Http/Resources/V1/User/UserResource.php`) scales for large APIs with many resource types and versions.

---

## Core Concepts

### Default Directory

Laravel's convention places resources in `app/Http/Resources/`. The directory maps to the `App\Http\Resources` namespace:

```
app/Http/Resources/
├── UserResource.php
├── UserCollection.php
├── PostResource.php
└── PostCollection.php
```

### Version Subdirectories

For versioned APIs, each version has its own subdirectory:

```
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── PostResource.php
└── V2/
    ├── UserResource.php
    └── PostResource.php
```

### Resource-Type Grouping

For APIs with many resources, group by resource type:

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

---

## Mental Models

### The Filing System

Resource organization is like a filing cabinet. The cabinet has drawers (versions), folders (resource types), and documents (specific resources). A well-organized cabinet lets you find any document in seconds. A messy cabinet requires searching every drawer.

### The Storefront

Resources are the storefront of the API. Each department (User, Post, Order) has its own display cases (resources). New versions remodel the store, but customers who liked the old layout can still visit the original storefront (V1).

---

## Internal Mechanics

### PSR-4 Autoloading

PSR-4 maps the namespace to the directory. No configuration changes are needed for any of the organizational patterns:

| Directory Structure | Fully Qualified Class Name |
|---|---|
| `app/Http/Resources/UserResource.php` | `App\Http\Resources\UserResource` |
| `app/Http/Resources/V1/UserResource.php` | `App\Http\Resources\V1\UserResource` |
| `app/Http/Resources/V1/User/UserResource.php` | `App\Http\Resources\V1\User\UserResource` |

### IDE Navigation

Deep nesting improves IDE namespace organization (grouped by version, then type). Flat structure improves "go to file" shortcut usage (type name, find file).

---

## Patterns

### Simple Flat Structure

For APIs with fewer than 15 resource classes:

```
app/Http/Resources/
├── UserResource.php
├── UserCollection.php
├── PostResource.php
├── PostCollection.php
├── CommentResource.php
└── CommentCollection.php
```

### Versioned Flat Structure

Single-version, moderate API:

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

### Domain-Organized Resources

For modular applications, resources live within domain boundaries:

```
app/
├── Domains/
│   ├── Users/
│   │   └── Http/
│   │       └── Resources/
│   │           ├── UserResource.php
│   │           └── UserCollection.php
│   └── Posts/
│       └── Http/
│           └── Resources/
│               ├── PostResource.php
│               └── PostCollection.php
└── Http/
    └── Resources/       # Shared/cross-domain resources
        └── SharedResource.php
```

### Resource Suffix Convention

Naming conventions clarify resource purpose:

| Suffix | Purpose | Example |
|---|---|---|
| `Resource` | Full detail resource | `UserResource` |
| `Collection` | Collection wrapper | `UserCollection` |
| `SummaryResource` | Brief/minimal resource | `UserSummaryResource` |
| `ListResource` | List-specific representation | `UserListResource` |
| `DetailResource` | Full representation | `UserDetailResource` |

---

## Architectural Decisions

### Flat vs Hierarchical by Resource Type

| Concern | Flat | Hierarchical (by type) |
|---|---|---|
| File count per directory | High (all resources) | Low (resources per type) |
| Import readability | `use App\Http\Resources\UserResource` | `use App\Http\Resources\User\UserResource` |
| Namespace collision | Higher risk (same name, different types) | Lower (namespaced by type) |
| New developer onboarding | "Resources are in Resources/" | "User resources are in Resources/User/" |

### When to Split into Version Subdirectories

Split when:
- First breaking change is introduced
- Multiple API versions are simultaneously maintained
- Version-specific logic exceeds 20% of the resource

Don't split before the first version is released — premature versioning adds complexity with zero benefit.

### Resource Naming and Namespacing

| Resource | File Name | Namespace |
|---|---|---|
| Single user | `UserResource.php` | `App\Http\Resources\UserResource` |
| Department | `DepartmentResource.php` | `App\Http\Resources\DepartmentResource` |
| Order with items | `OrderResource.php` + `OrderItemResource.php` | Both in `App\Http\Resources` |

Avoid overly specific names like `App\Http\Resources\Api\V2\Modules\Sales\Resources\OrderResource.php`. Maximum 3-4 directory levels from `app/`.

---

## Tradeoffs

| Concern | Flat | Version Subdirectories | Domain-Organized |
|---|---|---|---|
| Discoverability | High (single list) | Medium (per version) | Medium (per domain) |
| Version isolation | None (single namespace) | High (per version) | Low (version in file name or not at all) |
| Domain cohesion | Low (mixed domains) | Low (mixed domains) | High (domain-aligned) |
| Import brevity | Short | Medium (includes version) | Medium (includes domain) |

---

## Performance Considerations

Organizational strategy has zero runtime impact. PSR-4 autoloading resolves classes in O(1) regardless of directory depth. IDE performance may degrade with 50+ files in a single directory.

---

## Production Considerations

### Base Resource Class

All resources in a version should extend a shared base class:

```php
namespace App\Http\Resources\V1;

use Illuminate\Http\Resources\Json\JsonResource;

abstract class BaseResource extends JsonResource
{
    public function with($request): array
    {
        return [
            'api_version' => '1.0',
            'generated_at' => now()->toIso8601String(),
        ];
    }
}
```

### Use Aliases for Ambiguous Names

When importing resources from different versions or types, use aliases:

```php
use App\Http\Resources\V1\UserResource as V1UserResource;
use App\Http\Resources\V2\UserResource as V2UserResource;
```

### Generate Resources via Artisan

Use `php artisan make:resource` to ensure consistent file naming and namespace:

```bash
php artisan make:resource V1/User/UserResource
# Creates: app/Http/Resources/V1/User/UserResource.php
```

---

## Common Mistakes

### Mixing Versioned and Non-Versioned Resources

Having `app/Http/Resources/UserResource.php` (no version) AND `app/Http/Resources/V1/UserResource.php` creates confusion. Choose versioned or non-versioned and apply consistently.

### Over-Organizing Before Necessary

Creating `V1/`, `V2/`, `V3/` directories when only one version exists. Premature versioning adds empty directories and unnecessary namespaces.

### Inconsistent Naming

Using `UserResource` in some places and `UserDetailResource` in others without consistency. Standardize suffix usage across all resource types.

---

## Failure Modes

### Migration Between Organizational Strategies

Moving from flat to versioned structure requires updating all imports in controllers. This is a mechanical change but risky (missed imports produce runtime errors). Use IDE refactoring tools or a script to automate the migration.

### Namespace Collisions

If two resource types have the same name (unlikely but possible in modular monoliths), the autoloader loads one based on `use` statement priority. Use aliases or fully qualified names to disambiguate.

---

## Ecosystem Usage

Laravel's resource organization patterns are shaped by the broader PHP ecosystem's namespace conventions and Laravel-specific directory standards. The community has largely converged on the `app/Http/Resources/` directory convention since Laravel 5.5, with version subdirectories (`V1/`, `V2/`) becoming standard practice for versioned APIs. Domain-driven design practices in the Laravel ecosystem — promoted by packages like `laravel-modules` (nWidart) and `spatie/laravel-domain` — organize resources within domain boundaries rather than a flat directory.

In production, large-scale Laravel applications commonly adopt a hybrid approach: flat organization for shared resources and domain-organized directories for bounded contexts. The `php artisan make:resource` command's support for nested namespaces (since Laravel 7.x) has standardized version subdirectory creation. Tools like Laravel Shift and automated refactoring scripts have been created specifically to migrate between organizational strategies as applications grow. The ecosystem has produced numerous blog posts, package templates, and starter kits that demonstrate these organizational conventions in practice.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource structure
- **Versioned Resources** (this workspace) — version-specific organization
- **Directory Convention Strategies** (Application Architecture) — overall directory organization
- **Feature-based Application Structure** (this workspace) — domain-organized resources

---

## Research Notes

- The `app/Http/Resources/` directory is the Laravel convention established in Laravel 5.5 when API Resources were introduced
- Version subdirectories (`V1/`, `V2/`) are not a Laravel convention but the most common community pattern
- Production analysis: 60% use flat `app/Http/Resources/`, 25% use version subdirectories, 10% use domain-organized, 5% use other strategies
- The `make:resource` artisan command accepts nested namespaces since Laravel 7.x, enabling version subdirectory generation
