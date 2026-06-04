# Versioned Resources — Engineering Rules

---

## Rule: Never Modify Old Version Resources After Release

---

## Category

Reliability

---

## Rule

Once a version of a resource is released to consumers, its structure must never change. Freeze old version resources — no field additions, renames, removals, or type changes. Bug fixes must address behavioral data issues only, never the schema contract.

---

## Reason

Old version resources are the API contract for existing clients. Any structural change (adding a field, renaming a key, changing a type) can break clients that depend on the current shape. Freezing the resource guarantees that existing integrations continue working without regression.

---

## Bad Example

```php
// V1/UserResource.php — modified after release
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->name, // Was 'name' in original release
            // 'name' renamed to 'full_name' — breaks all V1 clients
        ];
    }
}
```

---

## Good Example

```php
// V1/UserResource.php — frozen after release
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name, // Never changed
        ];
    }
}

// V2/UserResource.php — new version for changes
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->name, // Renamed in V2
        ];
    }
}
```

---

## Exceptions

Security fixes that must be backported to all supported versions, as long as the fix does not change the JSON structure (field names, types, keys).

---

## Consequences Of Violation

Reliability risks from breaking changes in supposedly frozen versions; client crashes after resource updates; loss of trust in version stability guarantees.

---

## Rule: Cap Inheritance at 2 Levels Maximum

---

## Category

Maintainability

---

## Rule

Limit resource version inheritance to a maximum of 2 levels (base + version-specific override). Never create chains deeper than 2 levels.

---

## Reason

Deep inheritance chains (V5 extends V4 extends V3 extends V2) become untraceable. Tracking which version added which field requires traversing every ancestor. A change in V2 affects all subsequent versions, making the chain fragile and changes risky. At 2 levels, the dependency is immediately visible.

---

## Bad Example

```php
class V2UserResource extends V1UserResource
{
    // V2 adds phone
}

class V3UserResource extends V2UserResource
{
    // V3 removes old_field, adds profile_pic
}

class V4UserResource extends V3UserResource
{
    // V4 renames phone to phone_number
    // Which version added phone? Trace V4 → V3 → V2
    // A change in V2 parent affects V4
}
```

---

## Good Example

```php
class V1UserResource extends JsonResource
{
    // Independent base
}

class V2UserResource extends V1UserResource
{
    // Single-level inheritance from V1 (2 levels: V1 → V2)
    public function toArray($request): array
    {
        return parent::toArray($request) + ['phone' => $this->phone];
    }
}

// V3 copy-and-modify — no inheritance from V2
class V3UserResource extends JsonResource
{
    // Fully independent copy
}
```

---

## Exceptions

No common exceptions. Deep inheritance chains are always an anti-pattern for versioned resources.

---

## Consequences Of Violation

Maintainability risks from traceable field provenance; cascade failures when a base version changes; versioning complexity that discourages refactoring.

---

## Rule: Always Version Collections Alongside Individual Resources

---

## Category

Code Organization

---

## Rule

When creating a versioned individual resource, always create a corresponding versioned collection class. Ensure the collection's `$collects` points to the correct version's resource class.

---

## Reason

A versioned individual resource with an unversioned collection causes the collection endpoint to return items in the old format while the single-item endpoint returns the new format. The collection's `$collects` must be explicitly set to the same version's resource class to maintain consistency.

---

## Bad Example

```php
// V2/UserResource.php — updated for V2
class UserResource extends JsonResource { /* V2 fields */ }

// UserCollection.php — still uses old namespace derivation
class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class; // Points to V1\UserResource, not V2
}
// Collection endpoint returns V1 format despite V2 resource existing
```

---

## Good Example

```php
// V2/UserResource.php
namespace App\Http\Resources\V2;

class UserResource extends JsonResource { /* V2 fields */ }

// V2/UserCollection.php
namespace App\Http\Resources\V2;

class UserCollection extends ResourceCollection
{
    public $collects = UserResource::class; // Points to V2\UserResource
}
```

---

## Exceptions

When the collection format itself has not changed between versions and the collection uses the same `$collects` as the previous version.

---

## Consequences Of Violation

Inconsistent response formats between collection and single-resource endpoints; client confusion when list and detail endpoints return different schemas; debugging overhead from version mismatch.

---

## Rule: Use Deprecation Headers on Old Versions

---

## Category

Reliability

---

## Rule

Set `Deprecation`, `Sunset`, and `Link` HTTP headers on responses from old API versions to inform clients about the deprecation timeline.

---

## Reason

Clients cannot prepare for version sunset unless they know about it. `Deprecation` header signals the version is deprecated. `Sunset` header gives the end-of-life date. `Link` header with `rel="successor-version"` tells clients where to migrate. These headers give clients actionable information without requiring out-of-band communication.

---

## Bad Example

```php
// V1 resources — no deprecation headers
class V1UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
    // Clients have no way to know V1 is deprecated
}
```

---

## Good Example

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

---

## Exceptions

Internal APIs where the consumer is known and can be updated atomically without deprecation notice.

---

## Consequences Of Violation

Client disruption from unannounced version sunset; support overhead from version removal without notice; poor API developer experience and trust erosion.

---

## Rule: Set a Sunset Policy with Maximum 3 Concurrent Versions

---

## Category

Scalability

---

## Rule

Support a maximum of 3 concurrent API versions (current + 2 previous). Define and document a sunset policy that phases out old versions on a predictable schedule.

---

## Reason

Each supported version adds maintenance burden: backporting security fixes, running version-specific tests, and supporting client migration. Without a sunset limit, the number of supported versions grows indefinitely, creating unsustainable maintenance overhead. Three versions balances client migration time with team maintenance capacity.

---

## Bad Example

```php
// 5 active versions — unsustainable
app/Http/Resources/
├── V1/   // Released 2020
├── V2/   // Released 2021
├── V3/   // Released 2022
├── V4/   // Released 2023
└── V5/   // Current (2025)
// No sunset policy — all must be maintained
```

---

## Good Example

```php
// 3 active versions — sustainable sunset policy
// Sunset policy: support current + 2 previous versions
// V1: Sunset date passed — removed
app/Http/Resources/
├── V2/   // Deprecated (Sunset: 2027-01-01)
├── V3/   // Deprecated (Sunset: 2027-06-01)
└── V4/   // Active
```

---

## Exceptions

Enterprise contracts with specific multi-year support commitments. Even then, version count should be limited through contractual SLAs.

---

## Consequences Of Violation

Scalability risks from unsustainable version maintenance; developer burnout from supporting multiple versions; inability to evolve the API due to version maintenance burden.

---

## Rule: Prefer Copy-and-Modify for Major Versions, Inheritance for Minor

---

## Category

Architecture

---

## Rule

Use copy-and-modify (full isolation) for major version changes involving structural differences. Use inheritance (extending the previous version) only for minor additive changes that do not remove or rename fields.

---

## Reason

Copy-and-modify eliminates all risk of breaking older versions — changes to V2 can never affect V1 because V1 is a fully independent copy. Inheritance shares code and reduces duplication but creates coupling: a change in the base could affect all derived versions. Major structural changes deserve the safety of full isolation.

---

## Bad Example

```php
// Inheritance used for major V2 breaking change
class V2UserResource extends V1UserResource
{
    public function toArray($request): array
    {
        $data = parent::toArray($request);
        unset($data['old_field']); // Remove deprecated field
        $data['phone'] = $this->phone;
        return $data;
    }
}
// Bug fix in V1 could accidentally affect V2's output
```

---

## Good Example

```php
// V1 — independent, frozen
class V1UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'old_field' => $this->old];
    }
}

// V2 — fully independent copy, no inheritance
class V2UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'phone' => $this->phone];
    }
}

// V2 minor update (additive only) could inherit from V2
class V2MinorUserResource extends V2UserResource
{
    public function toArray($request): array
    {
        return parent::toArray($request) + ['new_field' => $this->new];
    }
}
```

---

## Exceptions

Internal APIs where the consuming application is maintained by the same team and can be updated atomically.

---

## Consequences Of Violation

Risk of accidental cross-version breakage; debugging complexity from shared code paths; inability to freeze old versions independently.

---

## Rule: Version Controllers and Resources Together

---

## Category

Architecture

---

## Rule

When a new API version is created, create version-specific controllers that import and use the corresponding version's resource classes. Do not reuse controllers across versions.

---

## Reason

A controller that returns V1 resources cannot be reused for V2 resources without import changes. If the controller is shared, resource versioning becomes implicit and error-prone (a developer may accidentally update the import, affecting all versions). Version-specific controllers make the version contract explicit at every level.

---

## Bad Example

```php
// Single controller serving both V1 and V2
class UserController
{
    public function show(Request $request, User $user): JsonResource
    {
        $version = $request->segment(1); // 'v1' or 'v2'

        return $version === 'v1'
            ? new V1\UserResource($user)  // Conditional branching
            : new V2\UserResource($user);
    }
}
```

---

## Good Example

```php
namespace App\Http\Controllers\V1;

class UserController
{
    public function show(User $user): V1\UserResource
    {
        return new V1\UserResource($user);
    }
}

namespace App\Http\Controllers\V2;

class UserController
{
    public function show(User $user): V2\UserResource
    {
        return new V2\UserResource($user);
    }
}
```

---

## Exceptions

Minor additive changes where the same controller logic applies and only the resource class differs. Even then, prefer separate controllers for clarity.

---

## Consequences Of Violation

Conditional version branching in controllers; implicit version coupling that is easy to break; testing complexity from version-conditional code paths.

---

## Rule: Never Use Conditional Version Logic Inside a Single Resource

---

## Category

Maintainability

---

## Rule

Do not handle version differences with conditional logic inside a single resource class. Create separate versioned resource classes instead.

---

## Reason

A single resource with version conditionals (`if ($version === 'v1')`) creates a monolithic class that serves multiple API contracts simultaneously. It is untestable (each conditional multiplies the test matrix by versions), hard to read, and impossible to freeze for old versions.

---

## Bad Example

```php
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        $version = $request->segment(1);

        return [
            'id' => $this->id,
            'name' => $this->name,
            $version !== 'v1' ? 'phone' => $this->phone : [], // Conditional per version
            $version === 'v1' ? 'old_field' => $this->old : [],
        ];
    }
}
```

---

## Good Example

```php
// V1/UserResource.php
public function toArray($request): array
{
    return ['id' => $this->id, 'name' => $this->name, 'old_field' => $this->old];
}

// V2/UserResource.php
public function toArray($request): array
{
    return ['id' => $this->id, 'name' => $this->name, 'phone' => $this->phone];
}
// Clean, testable, freeze-able independently
```

---

## Exceptions

Temporary migration shims during a transition period (max 1 release cycle) while eliminating old resources.

---

## Consequences Of Violation

Maintainability risks from monolithic version logic; testing combinatorial explosion (version × fields); inability to freeze old versions independently.

---

## Rule: Backport Security Fixes to All Supported Versions

---

## Category

Security

---

## Rule

When a security fix is applied to the current API version, backport the same fix to all supported older versions. Old versions must not become a security gap.

---

## Reason

Old versions are often less secure by design (they lack newer security features). When a vulnerability is discovered and fixed in the current version, old versions that do not receive the fix become an attack vector. Security fixes must be applied to all supported versions, even if those versions are frozen for structural changes.

---

## Bad Example

```php
// Security fix applied only to V4
class V4\UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            // SQL injection fix applied
            'name' => htmlspecialchars($this->name, ENT_QUOTES, 'UTF-8'),
        ];
    }
}

// V2 and V3 — no fix, still vulnerable
class V2\UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name]; // No escaping
    }
}
```

---

## Good Example

```php
// Security fix applied to ALL supported versions
class V2\UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => htmlspecialchars($this->name, ENT_QUOTES, 'UTF-8'),
        ];
    }
}

class V3\UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => htmlspecialchars($this->name, ENT_QUOTES, 'UTF-8'),
        ];
    }
}
```

---

## Exceptions

Versions that have passed their sunset date and are no longer supported.

---

## Consequences Of Violation

Security risks from unpatched old versions; compliance violations when known vulnerabilities remain in supported versions; liability from data breaches through old version exploits.
