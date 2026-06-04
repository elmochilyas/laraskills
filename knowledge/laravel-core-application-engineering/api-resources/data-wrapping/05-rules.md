# Data Wrapping — Engineering Rules

---

## Rule: Keep Wrapping Strategy Consistent Across All Endpoints

---

## Category

Architecture

---

## Rule

Every endpoint within the same API version must use the same wrapping strategy. Do not mix wrapped and unwrapped responses in the same version.

---

## Reason

Clients must know the response format before parsing. A client expecting `response.data` on one endpoint should not need to use `response` directly on another endpoint within the same version. Inconsistent wrapping forces per-endpoint client logic, increasing integration complexity and bug surface.

---

## Bad Example

```php
// GET /api/users → { "data": { "id": 1, "name": "John" } }
// GET /api/posts → { "id": 1, "title": "Hello" }  // Unwrapped — same version
```

---

## Good Example

```php
// AppServiceProvider::boot()
JsonResource::withoutWrapping();

// All endpoints return unwrapped
// GET /api/users → { "id": 1, "name": "John" }
// GET /api/posts → { "id": 1, "title": "Hello" }
```

---

## Exceptions

Versioned APIs where one version uses wrapping and another does not — the consistency requirement applies per version, not across versions.

---

## Consequences Of Violation

Maintenance risks from per-endpoint client logic; scalability risks as each new client must handle multiple response formats; reliability risks from client parsing errors.

---

## Rule: Always Wrap Collection Responses from the Start

---

## Category

Scalability

---

## Rule

Every collection endpoint must return wrapped data, even when the collection is not paginated. Use the `data` key wrapper for all collection responses.

---

## Reason

An unwrapped collection returns a bare JSON array `[{...}, {...}]`. Adding pagination metadata later requires changing the response to `{ "data": [...], "meta": {...} }`, which is a breaking change for every client. Wrapping from the start allows adding pagination metadata without breaking the response structure.

---

## Bad Example

```php
// Initially — unwrapped collection
// GET /api/users → [ { "id": 1 }, { "id": 2 } ]

// Later — pagination added, response format MUST change
// GET /api/users → { "data": [ { "id": 1 } ], "meta": {...} }
// Breaking change for all clients
```

---

## Good Example

```php
// Initially — wrapped collection (no pagination yet)
// GET /api/users → { "data": [ { "id": 1 }, { "id": 2 } ] }

// Later — pagination added
// GET /api/users → { "data": [ { "id": 1 } ], "links": {...}, "meta": {...} }
// Non-breaking — data key is stable
```

---

## Exceptions

Internal APIs where every consumer is known and can be updated atomically with the API change.

---

## Consequences Of Violation

Scalability risks from breaking changes when pagination is added; reliability risks from client crashes after format changes; maintenance overhead from coordinating client updates with API changes.

---

## Rule: Mirror Production Wrapping in Test Configuration

---

## Category

Testing

---

## Rule

Configure test wrapping behavior to match production. If production uses `JsonResource::withoutWrapping()`, call it in the test base class `setUp()`.

---

## Reason

Tests that check for a `data` key will fail when production uses `withoutWrapping()`, and tests that assert flat responses will fail when production wraps. Mismatched wrapping configuration causes tests that pass locally but fail in CI or, worse, pass in CI but do not reflect production behavior.

---

## Bad Example

```php
// Production: AppServiceProvider calls JsonResource::withoutWrapping()
// Test: no wrapping configuration
public function test_user_resource(): void
{
    $response = (new UserResource($user))->response()->getData(true);
    // Expects { "id": 1 } but gets { "data": { "id": 1 } }
    // Test fails or tests wrong behavior
}
```

---

## Good Example

```php
abstract class ApiTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        JsonResource::withoutWrapping(); // Match production
    }
}

class UserResourceTest extends ApiTestCase
{
    public function test_returns_expected_structure(): void
    {
        $response = (new UserResource($user))->response()->getData(true);
        $this->assertSame(['id' => 1, 'name' => 'John'], $response);
    }
}
```

---

## Exceptions

Tests specifically designed to verify wrapping behavior itself (testing both wrapped and unwrapped states).

---

## Consequences Of Violation

Reliability risks from tests that do not reflect production behavior; CI failures from environment-specific configuration mismatches; false confidence from passing tests with wrong wrapping.

---

## Rule: Never Rely on $wrap for Nested Resource Formatting

---

## Category

Design

---

## Rule

Only set `$wrap` on resources that are returned as top-level responses. Do not expect a nested resource's `$wrap` property to apply when the resource is nested inside another resource.

---

## Reason

Only the outer (top-level) resource's wrapping is applied during serialization. Sub-resources nested inside a parent resource lose their `$wrap` property — the nested data appears unwrapped. Relying on `$wrap` for nesting creates the illusion of control that does not exist at runtime.

---

## Bad Example

```php
class UserResource extends JsonResource
{
    public $wrap = 'user';

    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'profile' => new ProfileResource($this->profile), // $wrap ignored here
        ];
    }
}

class ProfileResource extends JsonResource
{
    public $wrap = 'profile'; // Never applied when nested
}
// Response: { "user": { "id": 1, "profile": { "bio": "Hello" } } }
// Expected "profile" wrapper but got unwrapped bio
```

---

## Good Example

```php
class UserResource extends JsonResource
{
    public $wrap = 'user';

    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'profile' => new ProfileResource($this->profile),
        ];
    }
}

class ProfileResource extends JsonResource
{
    // No $wrap — only used as nested resource
    public function toArray($request): array
    {
        return ['bio' => $this->bio];
    }
}
```

---

## Exceptions

No common exceptions. Nested resources must never assume `$wrap` applies.

---

## Consequences Of Violation

Maintenance risks from misleading code (developer expects wrapping that never happens); unreliable response structure for nested data; debugging overhead from phantom wrapper keys.

---

## Rule: Prefer Global withoutWrapping for Unwrapped APIs

---

## Category

Code Organization

---

## Rule

When designing an unwrapped API, use `JsonResource::withoutWrapping()` globally in `AppServiceProvider` rather than relying on per-resource `$wrap = null` or omitting the wrapper per-response.

---

## Reason

A single global call ensures every resource in the application is unwrapped consistently. Per-resource configuration is error-prone — a developer creating a new resource may forget to set `$wrap = null`, resulting in a wrapped response in an otherwise unwrapped API. The global approach makes the wrapping decision explicit and application-wide.

---

## Bad Example

```php
// Some resources set $wrap = null
class UserResource extends JsonResource
{
    public $wrap = null;
}

// New resource — developer forgets
class PostResource extends JsonResource
{
    // No $wrap — defaults to 'data' wrapping
    // Inconsistent with UserResource
}
```

---

## Good Example

```php
// AppServiceProvider::boot()
public function boot(): void
{
    JsonResource::withoutWrapping();
}

// Every resource is unwrapped — no per-class configuration needed
class UserResource extends JsonResource { }
class PostResource extends JsonResource { }
```

---

## Exceptions

APIs where some resources intentionally use custom `$wrap` keys (e.g., `$wrap = 'user'` for a specific format). Even then, the wrapping convention must be consistent across all resources.

---

## Consequences Of Violation

Maintainability risks from inconsistent response formats; onboarding friction as developers learn per-resource conventions; client-side parsing errors from mixed wrapping.

---

## Rule: Avoid Bare JSON Arrays as Top-Level Responses

---

## Category

Scalability

---

## Rule

Never return a bare JSON array (`[{...}, {...}]`) as the top-level structure for any endpoint that may later need metadata, pagination, or version information.

---

## Problem

A bare array is a terminal response format — it cannot be extended with metadata, version information, or pagination links without changing the root type from array to object, which is a breaking change.

---

## Bad Example

```php
// Controller returns bare array
public function index(): array
{
    return User::all()->toArray();
}
// Response: [ { "id": 1 }, { "id": 2 } ]
// Cannot add metadata later without breaking format
```

---

## Good Example

```php
// Controller returns wrapped collection
public function index(): AnonymousResourceCollection
{
    return UserResource::collection(User::all());
}
// Response: { "data": [ { "id": 1 }, { "id": 2 } ] }
// Future: { "data": [...], "meta": { "total": 2 } }
```

---

## Exceptions

Internal CLI command outputs and queue job payloads that are never consumed over HTTP by external clients.

---

## Consequences Of Violation

Scalability risks from breaking changes when response evolution is needed; reliability risks from client crashes after format changes; architectural dead ends preventing metadata addition.

---

## Rule: Use Consistent $wrap Keys Across the API

---

## Category

Design

---

## Rule

When using custom `$wrap` keys, use the same key for the same resource type across the entire API. Never use different wrapper keys for the same resource type.

---

## Reason

Clients parse `response.user` for user data. If one endpoint uses `response.user` and another uses `response.user_data` for the same resource type, the client must track per-endpoint wrapper keys. Consistent keys enable generic client-side response parsing.

---

## Bad Example

```php
class UserResource extends JsonResource
{
    public $wrap = 'user';
}

class AdminUserResource extends JsonResource
{
    public $wrap = 'user_data'; // Different key for same entity
}
```

---

## Good Example

```php
abstract class ApiResource extends JsonResource
{
    // Define wrapping conventions in a base class
}

class UserResource extends ApiResource
{
    public $wrap = 'user';
}

class AdminUserResource extends ApiResource
{
    public $wrap = 'user'; // Same key as UserResource
}
```

---

## Exceptions

Version changes where the wrapper key itself changes between major versions (V1 uses `user`, V2 uses `user_data`).

---

## Consequences Of Violation

Maintenance risks from per-endpoint client parsing logic; scalability risks as client code grows with wrapper-key mapping tables; reliability risks from mismatched key references.
