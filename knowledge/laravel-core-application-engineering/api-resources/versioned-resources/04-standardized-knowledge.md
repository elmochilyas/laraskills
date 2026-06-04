# Versioned Resources

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Versioned Resources
- **Difficulty:** Advanced
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
Versioned API Resources manage response schema changes across API versions. When an API evolves, existing clients depend on the current response shape. Breaking changes (field renames, type changes, structural changes) must be isolated to new versions. Versioned resources achieve this by organizing resource classes by version directory and using controller versioning to select the correct resource.

The core engineering decision is how to handle resource evolution: copy-and-modify per version (full isolation) vs inheritance-based (shared base, version-specific overrides). Copy-and-modify is safer for public APIs. Inheritance is more maintainable for internal APIs.

## Core Concepts
- **Directory-based versioning:** Resources organized by version directory (`V1/`, `V2/`, `V3/`) under `app/Http/Resources/`.
- **Controller version selection:** Versioned controllers import and use the correct version's resource class.
- **Resource inheritance:** V2 extends V1 for minor changes — add fields via `parent::toArray()` + merge, remove via `unset`.
- **Copy-and-modify:** Each version has a complete, independent copy — zero risk of breaking older versions.
- **Content negotiation versioning:** Alternative to URL-based — version via `Accept` header with a version resolver.
- **Route-based versioning:** `Route::prefix('v1')` maps to version-specific route files and controllers.

## When To Use
- Public APIs with external consumers who cannot update immediately.
- APIs that have undergone or anticipate breaking schema changes.
- Long-lived applications where the API must evolve over multiple years.
- When different client versions need different response shapes simultaneously.

## When NOT To Use
- Internal APIs with a single consumer that can be updated atomically.
- Prototypes or MVPs where the API has not been released to consumers.
- APIs that can use additive-only evolution (adding fields without removing or changing existing ones).
- When the team cannot commit to maintaining multiple versions concurrently.

## Best Practices (WHY)
- **Prefer copy-and-modify for major versions, inheritance for minor versions.** Full isolation is safer for public APIs where any breakage is unacceptable. Inheritance reduces duplication for internal APIs or minor changes.
- **Cap inheritance at 2 levels (base + version-specific).** Deep inheritance chains (V5 extends V4 extends V3 extends V2) become untraceable.
- **Always version collections alongside resources.** `V2/UserCollection` must point to `V2\UserResource`.
- **Use deprecation headers.** `Deprecation`, `Sunset`, and `Link` headers inform clients about version lifecycle.
- **Freeze old version resources.** Once a version is released, its resources must not change. Enforce via CI: if a V1 resource is modified, flag it.
- **Set a sunset policy.** Support a maximum of 3 versions (current + 2 previous). Sunset older versions on a schedule.

## Architecture Guidelines
- URL-based versioning is more discoverable and testable than header-based. Use URL versioning for most APIs.
- Version controllers and resources together — the controller version determines the resource version.
- Use PHP namespaces to map to version directories: `App\Http\Resources\V1\UserResource`.
- Bug fixes should change behavior (actual data), not structure (fields, types, keys). Structural changes require a new version.
- For additive changes (new fields only), consider whether a new version is needed. Adding fields is non-breaking if clients ignore unknown fields.
- Generate versioned resources via Artisan: `php artisan make:resource V2/User/UserResource`.

## Performance
- Version resolution adds zero runtime overhead — the correct class is resolved at compile time via the `use` statement.
- Conditional logic within a single resource (handling multiple versions via `match`) adds negligible overhead (a few match checks).
- No additional database queries are introduced by versioning.

## Security
- Old version resources may lack security improvements added in newer versions. Ensure security fixes are backported to all supported versions.
- Deprecation headers must not leak information about internal version support windows or future version plans.
- When sunsetting a version, ensure the deprecation response does not expose internal reasons for the sunset.

## Common Mistakes

### Modifying Old Version Resources (desc)
Editing a V1 resource to fix a bug, accidentally changing the API contract.
- **Cause:** Shared codebase convenience — "I'll just fix it in the old version too."
- **Consequence:** Client-visible schema changes in a supposedly frozen version.
- **Better:** Only fix bugs in old versions when they affect behavior (wrong data) — never change structure (field names, types).

### Inheritance Depth (desc)
V5 extends V4 extends V3 extends V2, creating an unmanageable chain.
- **Cause:** Avoiding duplication by always extending the previous version.
- **Consequence:** Tracing which version added which field becomes impossible. A change in V2 affects all subsequent versions.
- **Better:** Cap at 2 levels (base + version). For larger changes, copy-and-modify.

### Forgetting to Version Collections (desc)
Versioning `UserResource` but not `UserCollection`, which still points to the old resource.
- **Cause:** Only updating the individual resource class.
- **Consequence:** Collection endpoint returns old resource format even though the individual endpoint returns the new format.
- **Better:** Version collections alongside resources. Ensure `$collects` points to the correct version's resource.

## Anti-Patterns
- **Version creep:** Maintaining 5+ concurrent versions with no sunset policy. Set a maximum (3 versions) and enforce sunset dates.
- **Conditional versioning in single resource:** Using `if ($version === 'v1')` inside a single resource instead of separate versioned classes. This creates a complex, hard-to-test monolith.
- **Unversioned breaking changes:** Renaming a field in `UserResource::toArray()` without creating a new version, breaking all existing clients.

## Examples

### Directory Structure
```
app/Http/Resources/
├── V1/
│   ├── UserResource.php
│   └── UserCollection.php
├── V2/
│   ├── UserResource.php
│   └── UserCollection.php
└── V3/
    ├── UserResource.php
    └── UserCollection.php
```

### Resource Inheritance (V2 extends V1)
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

### Copy-and-Modify (Full Isolation)
```php
namespace App\Http\Resources\V2;

class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'firstName' => $this->name, // Renamed from "name" in V1
            'email' => $this->email,
            'phone' => $this->phone,    // New in V2
        ];
    }
}
```

### Deprecation Headers
```php
class V1UserResource extends JsonResource
{
    public function withResponse($request, $response): void
    {
        $response->header('Deprecation', 'Sun, 01 Jan 2027 00:00:00 GMT');
        $response->header('Sunset', 'Sun, 01 Jan 2028 00:00:00 GMT');
        $response->header('Link', '</api/v2/users>; rel="successor-version"');
    }
}
```

## Related Topics
- Resource Fundamentals — baseline resource structure
- API Versioning Strategies (Routing) — URL and header versioning at route level
- Resource Organization — directory structure for versioned resources
- Resource Testing — versioned resource testing and backward compatibility

## AI Agent Notes
- **Generate:** Use `php artisan make:resource V2/UserResource` for versioned resource scaffolding.
- **Key constraint:** Never modify old version resources after release. Create new versions for changes.
- **Validation:** Verify versioned collections point to the correct version's resource class.
- **Common fix:** If a V2 endpoint returns V1 structure, check that the controller imports the correct namespace.
- **Testing pattern:** Test each version independently with assertions that the old version does NOT have new version fields.

## Verification
- [ ] Resources are organized by version directory (`V1/`, `V2/`, etc.).
- [ ] Collections are versioned alongside their individual resources.
- [ ] Old version resources are frozen — no structural changes after release (enforced by CI if possible).
- [ ] Deprecation headers are set on old versions.
- [ ] A sunset policy exists and is documented (max 3 concurrent versions).
- [ ] Tests verify each version's resource shape independently.
- [ ] Inheritance is capped at 2 levels maximum.
