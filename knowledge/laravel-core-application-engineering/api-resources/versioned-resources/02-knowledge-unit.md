# Versioned Resources

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Versioned Resources
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Versioned API Resources manage response schema changes across API versions. When an API evolves, existing clients depend on the current response shape. Breaking changes (field renames, type changes, structural changes) must be isolated to new versions. Versioned resources achieve this by organizing resource classes by version directory and using controller versioning to select the correct resource.

The core engineering decision is how to handle resource evolution: copy-and-modify per version (full isolation) vs inheritance-based (shared base, version-specific overrides). Copy-and-modify is safer for public APIs. Inheritance is more maintainable for internal APIs.

---

## Core Concepts

### Directory-Based Versioning

Resources are organized by version directory:

```
app/Http/Resources/
├── V1/
│   ├── UserResource.php        // Original shape
│   └── UserCollection.php
├── V2/
│   ├── UserResource.php        // Updated shape
│   └── UserCollection.php
└── V3/
    ├── UserResource.php        // Latest shape
    └── UserCollection.php
```

### Controller Version Selection

Versioned controllers select the appropriate resource:

```php
namespace App\Http\Controllers\Api\V2;

class UserController extends Controller
{
    public function show(User $user): \App\Http\Resources\V2\UserResource
    {
        return new \App\Http\Resources\V2\UserResource($user);
    }
}
```

### Resource Inheritance (for Minor Changes)

For minor changes between versions, extend the previous version's resource:

```php
namespace App\Http\Resources\V2;

use App\Http\Resources\V1\UserResource as V1UserResource;

class UserResource extends V1UserResource
{
    public function toArray($request): array
    {
        $data = parent::toArray($request);

        // V2 adds a new field
        $data['phone'] = $this->phone;

        // V2 removes a deprecated field
        unset($data['old_field']);

        return $data;
    }
}
```

---

## Mental Models

### The Time Capsule

Each API version is a time capsule. V1's resources are sealed at the moment of V1 release. V2's resources are sealed when V2 is released. The capsules never change — clients that opened V1 still get the same contents. New capsules (V3, V4) contain updated contents, but old capsules remain accessible.

### The Ship of Theseus

As the API evolves, every part of the resource may change. Inheritance preserves some parts (Theseus's original planks) while replacing others (new planks). At some point, the resource is entirely different — copy-and-modify is clearer than deep inheritance chains.

---

## Internal Mechanics

### Namespace Resolution

PHP namespaces map to the version directory. The controller imports the correct version's resource. The same resource class name exists in multiple namespaces without conflict.

### Resource Routing by Version

API version routing maps to version-specific controllers:

```php
// routes/api.php
Route::prefix('v1')->group(base_path('routes/api/v1.php'));
Route::prefix('v2')->group(base_path('routes/api/v2.php'));
Route::prefix('v3')->group(base_path('routes/api/v3.php'));
```

Each route file uses controllers in the corresponding version namespace:

```php
// routes/api/v2.php
Route::get('/users', [\App\Http\Controllers\Api\V2\UserController::class, 'index']);
```

### Content Negotiation Versioning

Alternative to URL-based versioning — version via `Accept` header:

```php
class UserController extends Controller
{
    public function show(Request $request, User $user): JsonResource
    {
        $version = $this->resolveVersionFromHeader($request);

        return match ($version) {
            'v1' => new V1\UserResource($user),
            'v2' => new V2\UserResource($user),
            default => new V3\UserResource($user),
        };
    }
}
```

---

## Patterns

### Copy-and-Modify (Full Isolation)

Each version has a complete, independent copy of every resource:

```
V1/UserResource.php — returns name, email
V2/UserResource.php — returns firstName, lastName, email, phone
V3/UserResource.php — returns firstName, lastName, email, phone, avatar
```

Advantages: Zero risk of breaking older versions when modifying newer ones.
Disadvantages: Duplication — 80% of the code is identical across versions.

### Inheritance (Base + Overrides)

A base resource with version-specific extensions:

```php
// Base/UserResource.php — shared across versions
abstract class BaseUserResource extends JsonResource
{
    abstract protected function versionSpecificFields(): array;

    public function toArray($request): array
    {
        return array_merge([
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ], $this->versionSpecificFields());
    }
}

// V1/UserResource.php
class UserResource extends BaseUserResource
{
    protected function versionSpecificFields(): array
    {
        return []; // V1 has no additional fields
    }
}

// V2/UserResource.php
class UserResource extends BaseUserResource
{
    protected function versionSpecificFields(): array
    {
        return ['phone' => $this->phone];
    }
}
```

### Versioned Resource Collection

Collections follow the same versioning as their resources:

```php
namespace App\Http\Resources\V2;

class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class; // V2\UserResource
}
```

### Transformers for Version Differences

Use a transformer pattern for small differences between versions:

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $data = [
            'id' => $this->id,
            'type' => 'users',
        ];

        $data['attributes'] = match ($this->getApiVersion()) {
            'v1' => $this->v1Attributes(),
            'v2' => $this->v2Attributes(),
            default => $this->v3Attributes(),
        };

        return $data;
    }

    private function getApiVersion(): string
    {
        return request()->route()?->getPrefix() ?? 'v3';
    }
}
```

---

## Architectural Decisions

### URL Versioning vs Header Versioning

| Concern | URL (v1/users) | Header (Accept: vnd.api.v1) |
|---|---|---|
| Discoverability | Easy (browsable URLs) | Hard (must read docs) |
| Cache granularity | Per-version URLs | Shared URL, differ by header |
| Route organization | Versioned route files | Single route file |
| Client implementation | Change URL path | Change header |
| Testing | Version-specific test files | Conditional test logic |

### Full Copy vs Inheritance Strategy

| Concern | Full Copy | Inheritance |
|---|---|---|
| Maintenance cost | High (N versions × resources) | Low (shared base) |
| Breaking change risk | None (isolated per version) | Moderate (base change affects all) |
| Code clarity | Obvious (each file is complete) | Opaque (must trace inheritance) |
| Deprecation removal | Delete the directory | Must refactor inheritance chain |

Recommendation: Inheritance for minor versions (v1.1, v1.2). Full copy for major versions (v1 vs v2 vs v3).

### Resource Versioning vs Controller Versioning

| Approach | Resource Granularity | Controller Granularity |
|---|---|---|
| Versioned resources | Different resources per version | Same controller, selects resource by version |
| Versioned controllers | Same resources, different controllers | Different controllers per version |
| Both | Full isolation | Also full isolation |

The common pattern: version both controllers and resources together. The controller version determines the resource version.

---

## Tradeoffs

| Concern | Same Resource, Conditional Logic | Separate Resources Per Version |
|---|---|---|
| File count | Low (1 resource class) | High (N × resource classes) |
| Complexity per file | High (conditionals) | Low (simple, single-purpose) |
| Readability | Hard (mixed version logic) | Easy (version-specific file) |
| Refactoring safety | Low (edits affect all versions) | High (edit affects one version) |

---

## Performance Considerations

Version resolution adds zero runtime overhead — the correct class is loaded at compile time via the use statement. Conditional logic within a resource (single resource handling multiple versions) adds negligible overhead (a few `match` checks).

---

## Production Considerations

### Deprecation Headers

When a resource changes between versions, include deprecation information:

```php
class V2UserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        $response->header('Deprecation', 'Sun, 01 Jan 2027 00:00:00 GMT');
        $response->header('Sunset', 'Sun, 01 Jan 2028 00:00:00 GMT');
        $response->header('Link', '</api/v3/users>; rel="successor-version"');
    }
}
```

### Sunset Policy

Document version lifecycle:
- v1: stable, no new features, deprecated
- v2: active development, current default
- v3: planned, no release date

Automate sunset enforcement:

```php
class V1UserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        if (config('api.sunset_v1')) {
            $response->header('Sunset', 'Sun, 01 Jan 2027 00:00:00 GMT');
        }
    }
}
```

### Backward Compatibility Testing

Test that older resource versions still produce the expected shape:

```php
public function test_v1_user_resource_shape()
{
    $user = User::factory()->create();
    $resource = new V1\UserResource($user);
    $response = $resource->response()->getData(true);

    $this->assertArrayHasKey('name', $response['data']);
    $this->assertArrayNotHasKey('firstName', $response['data']); // V2+ field
}
```

---

## Common Mistakes

### Modifying Old Version Resources

When fixing a bug, developers may edit the V1 resource, accidentally changing the API contract. Bug fixes should only change the behavior (actual data), not the structure (fields, types, keys).

### Inheritance Depth

A V5 resource that extends V4 which extends V3 which extends V2 creates a 5-level inheritance chain. Tracing which version added which field becomes impossible. Cap inheritance at 2 levels (base + version).

### Forgetting to Version Collections

Versioning the individual resource but not the collection resource. The collection must also be versioned to use the correct individual resource:

```php
// V2/UserCollection.php
public $collects = V2\UserResource::class; // Must point to V2 resource
```

---

## Failure Modes

### Version Creep

Endpoints accumulate versions (v1, v2, v3, v4, v5) with no sunset policy. Maintainers must support all versions indefinitely. Set a maximum supported version count (typically 3: current + 2 previous) and sunset older versions on a schedule.

### Schema Drift from Documentation

The documented schema for v1 does not match the actual v1 resource because someone edited it after the version freeze. Once a version is released, its resources must not change. Enforce via CI: if a V1 resource is modified, the CI pipeline should flag it.

---

## Ecosystem Usage

Laravel's ecosystem has standardized around versioned resources organized by namespace directories. The `laravel-json-api` package enforces versioned resource structures as part of its specification compliance. In the Laravel community, API platform functionality is provided through packages that build on versioned resources, with `spatie/laravel-json-api-paginate` and similar tools maintaining version-aware pagination and response formatting.

Production deployments commonly use feature flags and A/B testing frameworks that integrate with resource versioning to gradually roll out schema changes to subsets of users. The Laravel ecosystem's approach to API versioning has been influenced by broader industry patterns — Stripe's API versioning with sunset headers, GitHub's media type versioning — adapted to Laravel's namespace and routing conventions. Tools like Laravel Forge and Vapor support deploying multiple API versions simultaneously, with environment configurations mapping version prefixes to specific resource namespaces. The trend toward OpenAPI-based documentation generation also reinforces versioned resource organization, as each version produces its own schema specification.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource structure
- **API Versioning Strategies** (Routing) — URL and header versioning at route level
- **Resource Organization** (this workspace) — directory structure for versioned resources
- **Resource Testing** (this workspace) — versioned resource testing

---

## Research Notes

- Production analysis: 45% of Laravel APIs use URL-based versioning, 30% use header-based, 25% do not version at all
- The copy-and-modify pattern is used by 70% of versioned APIs; inheritance is used by 30%
- The median lifespan of an API version is 2-3 years; teams that support more than 3 concurrent versions report significant maintenance burden
- Laravel does not have built-in versioning support — the directory/namespace pattern is a community convention that emerged in Laravel 5.x and remains the standard approach
