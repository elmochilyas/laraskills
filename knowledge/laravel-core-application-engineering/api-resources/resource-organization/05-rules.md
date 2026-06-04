# Resource Organization — Engineering Rules

---

## Rule: Start Flat, Restructure When Needed

---

## Category

Code Organization

---

## Rule

Begin with a flat `app/Http/Resources/` directory structure. Introduce version subdirectories or resource-type grouping only when the number of resource files causes discoverability issues (typically >15 files) or when the first breaking API change is made.

---

## Reason

Premature version directories create empty folders and unnecessary namespace depth without providing any benefit. Flat structure is simpler to navigate, import, and generate. Complexity should be earned by demonstrated need, not anticipated.

---

## Bad Example

```php
// Before any release — three empty version directories
app/Http/Resources/
├── V1/ (empty)
├── V2/ (empty)
└── V3/ (empty)

// Only 2 resources exist, all in wrong place
```

---

## Good Example

```php
// Initial flat structure — simple and navigable
app/Http/Resources/
├── UserResource.php
├── UserCollection.php
├── PostResource.php
└── PostCollection.php

// Later, after first breaking change:
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── PostResource.php
└── V2/
    ├── UserResource.php
    └── PostResource.php
```

---

## Exceptions

When the project specification explicitly requires versioned resources from the start (e.g., building a public API for version 1.0 release).

---

## Consequences Of Violation

Unnecessary namespace complexity; longer import paths; empty directories that confuse developers; maintenance overhead from empty version shells.

---

## Rule: Never Mix Versioned and Non-Versioned Resources

---

## Category

Code Organization

---

## Rule

Choose either versioned or non-versioned resource organization and apply it consistently across the entire API. Never have both `app/Http/Resources/UserResource.php` and `app/Http/Resources/V1/UserResource.php`.

---

## Reason

Mixed organization creates ambiguity about which resource is active. Some controllers may import the versioned resource while others import the non-versioned one, producing inconsistent responses. The confusion is invisible at compile time since both classes exist and are valid imports.

---

## Bad Example

```php
app/Http/Resources/
├── UserResource.php             // Non-versioned (active?)
├── V1/
│   ├── UserResource.php         // Versioned (also active?)
│   └── PostResource.php
└── V2/
    ├── UserResource.php
    └── PostResource.php

// Some controllers import UserResource (non-versioned)
// Other controllers import V1\UserResource
// Response shapes differ unpredictably
```

---

## Good Example

```php
// All resources versioned
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── PostResource.php
└── V2/
    ├── UserResource.php
    └── PostResource.php

// Or all resources non-versioned (flat)
app/Http/Resources/
├── UserResource.php
└── PostResource.php
```

---

## Exceptions

No common exceptions. Mixing organizational strategies is always a mistake.

---

## Consequences Of Violation

Reliability risks from inconsistent response formats across controllers; debugging overhead from tracking which resource each controller uses; versioning confusion when adding new endpoints.

---

## Rule: Keep Maximum Directory Depth at 3-4 Levels from app/

---

## Category

Maintainability

---

## Rule

Limit resource directory nesting to a maximum of 3-4 levels from the `app/` directory. Avoid deep paths like `app/Http/Resources/Api/V2/Modules/Sales/Resources/`.

---

## Reason

Deep namespace nesting makes imports hard to read, increases typing errors in `use` statements, and reduces code discoverability. Developers should be able to determine a resource's purpose from its import path at a glance.

---

## Bad Example

```php
// 7 levels from app/ — unreadable import
use App\Http\Resources\Api\V2\Modules\Sales\SubModules\OrderResource;

class OrderController
{
    public function show(Order $order): OrderResource
    {
        // ...
    }
}
```

---

## Good Example

```php
// 3 levels from app/ — clear and readable
use App\Http\Resources\V2\OrderResource;

class OrderController
{
    public function show(Order $order): OrderResource
    {
        // ...
    }
}
```

---

## Exceptions

Modular monoliths where resources live within domain boundaries (`app/Domains/Sales/Http/Resources/V1/OrderResource.php` — 5 levels, acceptable for domain isolation).

---

## Consequences Of Violation

Maintainability risks from unreadable imports; developer friction from long namespace paths; increased typos in `use` statements; reduced code discoverability.

---

## Rule: Use a Base Resource Class Per Version

---

## Category

Code Organization

---

## Rule

Define a base resource class in each version namespace (e.g., `V1/BaseResource`) that all resources in that version extend. Use it for shared metadata, wrapping configuration, and common headers.

---

## Reason

Without a base class, every resource duplicates version metadata (API version, format version) and wrapping configuration. A base class provides a single point of control for version-wide response characteristics, ensuring consistency and reducing duplication.

---

## Bad Example

```php
// Every V1 resource duplicates metadata
class V1\UserResource extends JsonResource
{
    public function with($request): array
    {
        return ['api_version' => '1.0'];
    }
}

class V1\PostResource extends JsonResource
{
    public function with($request): array
    {
        return ['api_version' => '1.0'];
    }
}
```

---

## Good Example

```php
// Base class — single source of truth
namespace App\Http\Resources\V1;

abstract class BaseResource extends JsonResource
{
    public function with($request): array
    {
        return ['api_version' => '1.0'];
    }
}

// Resources extend base
class UserResource extends BaseResource { }
class PostResource extends BaseResource { }
```

---

## Exceptions

APIs with fewer than 5 resources where the duplication is minimal.

---

## Consequences Of Violation

Code duplication across resources; maintenance overhead when version-wide metadata changes (must update every resource); inconsistent metadata when some resources are missed during updates.

---

## Rule: Standardize Suffix Naming Convention

---

## Category

Maintainability

---

## Rule

Establish a consistent suffix convention for resource variants and apply it across all entities. If you use `DetailResource` for one entity, use it for all entities that have a detail variant.

---

## Reason

Inconsistent naming forces developers to search for the correct class name every time. Predictable suffixes (`UserResource`, `UserCollection`, `UserSummaryResource`, `UserDetailResource`) make class discovery instantaneous and eliminate guesswork.

---

## Bad Example

```php
// Inconsistent suffixes
app/Http/Resources/
├── UserResource.php
├── UserList.php              // Should be UserCollection
├── FullUserResource.php       // Should be UserDetailResource
├── PostResource.php
├── PostCollection.php
├── PostDetail.php             // Should match UserBrevResource naming
```

---

## Good Example

```php
// Consistent suffixes
app/Http/Resources/
├── UserResource.php
├── UserCollection.php
├── UserSummaryResource.php
├── UserDetailResource.php
├── PostResource.php
├── PostCollection.php
├── PostSummaryResource.php
├── PostDetailResource.php
```

---

## Exceptions

No common exceptions. Suffix conventions must be project-wide and enforced in code review.

---

## Consequences Of Violation

Discoverability friction (developers cannot guess class names); inconsistent code style; onboarding overhead for new developers.

---

## Rule: Create Version Subdirectories Only After First Breaking Change

---

## Category

Architecture

---

## Rule

Do not create version subdirectories (`V1/`, `V2/`) until the API has been released and a breaking change is required. Before that, use a flat structure.

---

## Reason

Versioning before the first release adds complexity without benefit. The API has no consumers to protect, so there is nothing to version against. Resources moved to `V1/` before release must be moved again when the actual V1 contract is finalized.

---

## Bad Example

```php
// Created V1/ before any API release
app/Http/Resources/
└── V1/
    ├── UserResource.php
    └── PostResource.php

// API changes during development — now V1/ is wrong
// Must update V1/ resources (which have no consumers yet)
```

---

## Good Example

```php
// During development — flat structure
app/Http/Resources/
├── UserResource.php
└── PostResource.php

// After first release and first breaking change
app/Http/Resources/
├── V1/
│   ├── UserResource.php (frozen copy of original)
│   └── PostResource.php (frozen copy of original)
└── V2/
    ├── UserResource.php (new contract)
    └── PostResource.php (new contract)
```

---

## Exceptions

Public APIs that are documented and versioned from day one, where consumers are expected to pin to a specific version immediately.

---

## Consequences Of Violation

Unnecessary directory nesting; wasted effort moving resources into version folders before they stabilize; premature complexity without consumer protection.

---

## Rule: Organize Tests to Mirror Resource Structure

---

## Category

Testing

---

## Rule

Structure test files to mirror the resource directory hierarchy. A resource at `app/Http/Resources/V1/UserResource.php` must have tests at `tests/Feature/Http/Resources/V1/UserResourceTest.php`.

---

## Reason

Mirroring eliminates guessing where tests live. When a developer navigates to a resource and needs to find its tests, the path is predictable. This is especially critical for versioned resources where each version has independent tests.

---

## Bad Example

```php
// Tests scattered with no relation to source structure
tests/
├── Unit/
│   └── UserResourceTest.php          // Which version?
├── Feature/
│   └── Api/
│       └── V1UserResourceTest.php    // Naming mismatch

// Source is at app/Http/Resources/V1/UserResource.php
```

---

## Good Example

```php
// Tests mirror source structure
tests/
└── Feature/
    └── Http/
        └── Resources/
            └── V1/
                ├── UserResourceTest.php
                ├── UserCollectionTest.php
                └── PostResourceTest.php

// Source at app/Http/Resources/V1/UserResource.php
```

---

## Exceptions

Small APIs with fewer than 10 resources where test discoverability is not a problem.

---

## Consequences Of Violation

Discoverability friction when navigating between source and tests; risk of untested versions when tests are not clearly associated with version directories; confusion during version migration.

---

## Rule: Avoid Namespace-as-Version in File Names

---

## Category

Code Organization

---

## Rule

Use PHP namespace directories for resource versioning (`V1/UserResource.php` → `App\Http\Resources\V1\UserResource`). Never embed version identifiers in file names (`UserResourceV1.php`).

---

## Reason

PHP namespaces are the correct tool for organizing versioned classes. File-name suffixes (`UserResourceV1`, `UserResourceV2`) create unmanageable import aliasing, longer class names, and no namespace-level grouping. Version directories leverage PSR-4 autoloading and IDE directory navigation.

---

## Bad Example

```php
// File-name versioning
app/Http/Resources/
├── UserResourceV1.php
├── UserResourceV2.php
├── PostResourceV1.php
├── PostResourceV2.php

// Imports are messy
use App\Http\Resources\UserResourceV1;
use App\Http\Resources\UserResourceV2;
```

---

## Good Example

```php
// Namespace versioning
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── PostResource.php
└── V2/
    ├── UserResource.php
    └── PostResource.php

// Imports are clean
use App\Http\Resources\V1\UserResource;
use App\Http\Resources\V2\UserResource;
```

---

## Exceptions

No common exceptions. PHP namespaces are the correct mechanism for this.

---

## Consequences Of Violation

Unwieldy class names; messy import aliasing; inability to use IDE directory-based navigation; PSR-4 autoloading not leveraged.
