# Resource Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

API Resource testing verifies that the response shape, conditional fields, relationship loading, metadata, and status codes behave correctly for different inputs and contexts. Resources are tested at two levels: unit tests (resource toArray output for given models) and integration tests (full HTTP request → endpoint → response).

The engineering principle is: test the resource's contract, not its internals. The contract is the JSON structure that clients receive. A test should assert that for a given model, the resource produces the expected JSON shape — no more, no less.

---

## Core Concepts

### Unit Testing Resources

Resources can be unit-tested without HTTP:

```php
class UserResourceTest extends TestCase
{
    public function test_resource_returns_expected_structure()
    {
        $user = User::factory()->make([
            'id' => 1,
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $resource = new UserResource($user);
        $response = $resource->response()->getData(true);

        $this->assertSame([
            'data' => [
                'id' => 1,
                'name' => 'John Doe',
                'email' => 'john@example.com',
            ],
        ], $response);
    }
}
```

### Integration Testing Resources

Integration tests verify the full HTTP response:

```php
class UserEndpointTest extends TestCase
{
    public function test_show_returns_user_resource()
    {
        $user = User::factory()->create();

        $response = $this->getJson("/api/users/{$user->id}");

        $response->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'name', 'email'],
            ]);
    }
}
```

### Response Assertion Methods

Laravel provides resource-specific test assertions:

```php
$response->assertJsonFragment(['name' => 'John']);         // Part of response
$response->assertJsonMissing(['secret_key']);               // Not in response
$response->assertJsonStructure(['data' => ['id', 'name']]); // Structure only
$response->assertJsonPath('data.name', 'John');             // Exact path value
```

---

## Mental Models

### The Blueprint Test

Resource testing is like checking a building against its blueprint. The blueprint says "the wall should be here, this window should be there." The test checks that the resource output matches the blueprint (API contract). Changes to the blueprint fail the test.

### The Snapshot

A resource test is a snapshot of the API contract at a point in time. If the contract changes intentionally (new API version), the snapshot is updated. If it changes unintentionally, the test fails.

---

## Internal Mechanics

### Resource Response Extraction

`$resource->response()` returns a `JsonResponse`. `->getData(true)` returns the response as an associative array:

```php
$response = (new UserResource($user))->response()->getData(true);
// ['data' => ['id' => 1, 'name' => 'John', ...]]
```

### Request Context

Resources receive the `$request` in `toArray($request)`. For unit tests, create a request:

```php
$request = Request::create('/api/users/1', 'GET');
$resource = new UserResource($user);
$resource->withRequest($request); // Set the request context
$response = $resource->response()->getData(true);
```

### Factory Model Creation

Use `make()` instead of `create()` when the resource does not persist data:

```php
$user = User::factory()->make(['id' => 1, 'name' => 'John']);
// No database write, but the model has the attributes needed for the resource
```

---

## Patterns

### Conditional Field Testing

Test both conditional paths:

```php
public function test_bio_included_when_present()
{
    $user = User::factory()->make(['bio' => 'Hello there']);
    $resource = new UserResource($user);

    $response = $resource->response()->getData(true);
    $this->assertArrayHasKey('bio', $response['data']);
    $this->assertSame('Hello there', $response['data']['bio']);
}

public function test_bio_omitted_when_null()
{
    $user = User::factory()->make(['bio' => null]);
    $resource = new UserResource($user);

    $response = $resource->response()->getData(true);
    $this->assertArrayNotHasKey('bio', $response['data']);
}
```

### Relationship Loading Tests

Test that loaded relationships appear and unloaded ones are omitted:

```php
public function test_posts_included_when_loaded()
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts'); // Eager load

    $resource = new UserResource($user);
    $response = $resource->response()->getData(true);

    $this->assertArrayHasKey('posts', $response['data']);
    $this->assertCount(3, $response['data']['posts']);
}

public function test_posts_omitted_when_not_loaded()
{
    $user = User::factory()->create();
    // Note: did NOT load('posts')
    UserResource::withoutWrapping(); // If needed
    $resource = new UserResource($user);
    $response = $resource->response()->getData(true);

    $this->assertArrayNotHasKey('posts', $response['data']);
}
```

### Pagination Metadata Tests

Test that paginated responses include correct metadata:

```php
public function test_index_returns_paginated_response()
{
    User::factory()->count(25)->create();

    $response = $this->getJson('/api/users?per_page=10');

    $response->assertJsonStructure([
        'data',
        'links' => ['first', 'last', 'prev', 'next'],
        'meta' => ['current_page', 'last_page', 'per_page', 'total'],
    ]);

    $this->assertCount(10, $response['data']);
    $this->assertEquals(3, $response['meta']['last_page']);
    $this->assertEquals(25, $response['meta']['total']);
}
```

### Top-Level Metadata Tests

Test that `with()` and `withResponse()` metadata appears:

```php
public function test_response_includes_api_version()
{
    $user = User::factory()->make();

    $resource = new UserResource($user);
    $response = $resource->response()->getData(true);

    $this->assertArrayHasKey('api_version', $response);
    $this->assertSame(config('api.version'), $response['api_version']);
}

public function test_response_has_custom_header()
{
    $user = User::factory()->make();

    $resource = new UserResource($user);
    $response = $resource->response();

    $this->assertTrue($response->headers->has('X-API-Version'));
}
```

### Data Provider for Field Sets

Test field presence across multiple scenarios:

```php
/** @dataProvider fieldVisibilityProvider */
public function test_field_visibility(string $field, bool $visible, array $overrides = [])
{
    $user = User::factory()->make($overrides);
    $resource = new UserResource($user);
    $data = $resource->response()->getData(true)['data'];

    if ($visible) {
        $this->assertArrayHasKey($field, $data);
    } else {
        $this->assertArrayNotHasKey($field, $data);
    }
}

public static function fieldVisibilityProvider(): array
{
    return [
        'id always visible' => ['id', true],
        'name always visible' => ['name', true],
        'bio visible when set' => ['bio', true, ['bio' => 'Hello']],
        'bio hidden when null' => ['bio', false, ['bio' => null]],
    ];
}
```

---

## Architectural Decisions

### Unit vs Integration Testing Balance

| Test Type | Coverage | Speed | Confidence |
|---|---|---|---|
| Unit (resource in isolation) | Resource logic only | Fast (<1ms) | Medium |
| Integration (full endpoint) | Resource + controller + routing | Slower (50-200ms) | High |

Recommendation: Unit tests for resource logic (conditionals, formatting). Integration tests for endpoint behavior (pagination, status codes, auth). Both are needed for full coverage.

### Snapshot Testing

For complex resources, use snapshot testing:

```php
public function test_user_resource_snapshot()
{
    $user = User::factory()->make([
        'id' => 1,
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'bio' => 'Developer',
    ]);

    $resource = new UserResource($user);
    $response = $resource->response()->getData(true);

    $this->assertMatchesJsonSnapshot($response);
    // Stores a .snap file on first run; compares on subsequent runs
}
```

Snapshot testing is useful for complex responses but should not replace targeted assertions for conditional behavior.

---

## Tradeoffs

| Concern | Unit Tests | Integration Tests |
|---|---|---|
| Execution speed | Fast (<1ms each) | Slow (50-200ms each) |
| HTTP context | Manual request setup | Automatic |
| Auth/permission testing | Manual mock | Automatic (actingAs) |
| Debugging failed tests | Clear (pure array assertion) | Requires response inspection |
| Refactoring safety | Resource-only changes | Full endpoint changes |

---

## Performance Considerations

Resource unit tests are the fastest test category after pure unit tests. A suite of 50 resource unit tests completes in <50ms. Add them to the pre-commit gate or early CI stage.

---

## Production Considerations

### CI Resource Contract Verification

Run resource tests before integration tests in CI. If a resource contract is broken, fail fast — integration tests are irrelevant if the resource shape is wrong.

### Test Resource Registry

Maintain a registry of all resource types and their endpoints:

```php
// tests/Resources/ResourceContractTest.php
class ResourceContractTest extends TestCase
{
    /** @dataProvider resourceEndpoints */
    public function test_resource_returns_expected_structure(string $method, string $url)
    {
        $response = $this->{$method}($url);
        $response->assertStatus(200);
        // Generic structure checks per resource type
    }

    public static function resourceEndpoints(): array
    {
        return [
            'users index' => ['getJson', '/api/users'],
            'users show' => ['getJson', '/api/users/1'],
        ];
    }
}
```

### Version Compatibility Tests

For versioned APIs, test that each version's resources produce the expected shape:

```php
public function test_v1_user_resource_has_no_phone_field()
{
    // V1 does not include phone
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V1\UserResource($user);
    $data = $resource->response()->getData(true);

    $this->assertArrayNotHasKey('phone', $data['data']);
}

public function test_v2_user_resource_includes_phone_field()
{
    // V2 adds phone
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V2\UserResource($user);
    $data = $resource->response()->getData(true);

    $this->assertArrayHasKey('phone', $data['data']);
}
```

---

## Common Mistakes

### Testing Framework Behavior (Not Resource Behavior)

```php
// Bad: testing that JsonResource works as expected
public function test_resource_extends_json_resource()
{
    $resource = new UserResource(User::factory()->make());
    $this->assertInstanceOf(JsonResource::class, $resource);
}

// Good: testing that the resource produces specific output
public function test_resource_returns_name()
{
    $user = User::factory()->make(['name' => 'John']);
    $resource = new UserResource($user);
    $this->assertSame('John', $resource->response()->getData(true)['data']['name']);
}
```

### Testing with Database When Not Needed

Using `User::factory()->create()` when `make()` suffices. `create()` persists to the database (slower), `make()` just instantiates a model (faster). Use `make()` for most resource unit tests.

### Forgetting Wrapping Configuration

If the application uses `withoutWrapping()`, tests must also use it:

```php
class ResourceTestCase extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        JsonResource::withoutWrapping(); // Match production
    }
}
```

---

## Failure Modes

### Brittle Snapshot Tests

Snapshot tests fail on any output change, including timestamps, random IDs, and collection order. Use `make()` with fixed values (not `create()` with auto-increment IDs) for snapshot tests.

### Data Provider Explosion

Testing every conditional field in every combination creates a combinatorial explosion of test cases. Test each conditional independently; test combinations only for critical interactions.

---

## Ecosystem Usage

Laravel's testing ecosystem provides robust support for API resource testing. Pest PHP, the modern testing framework for Laravel, offers expressive `expect()` assertions that pair naturally with resource response testing — `expect($response['data'])->toHaveKeys(['id', 'name'])`. Packages like `spatie/phpunit-snapshot-assertions` are widely used for resource contract testing, storing expected JSON output as snapshot files that catch unintended schema changes.

In production, teams commonly structure resource tests using Pest's arch testing for file organization conventions and `describe` blocks for resource scenarios. Laravel's built-in `assertJsonStructure`, `assertJsonFragment`, and `assertJsonMissing` methods form the foundation of integration-level resource testing. The community convention has evolved toward testing resources in isolation with `$resource->response()->getData(true)` for fast unit tests, supplemented by endpoint-level integration tests for auth, pagination, and error scenarios. CI pipelines commonly run resource contract tests as a first gate before full integration suites.

---

## Related Knowledge Units

- **Resource Fundamentals** (this workspace) — baseline resource structure
- **Conditional Attributes** (this workspace) — testing conditional fields
- **Conditional Relationships** (this workspace) — testing relationship loading
- **Pagination Metadata** (this workspace) — testing pagination structure
- **Top-Level Meta Data** (this workspace) — testing metadata and headers

---

## Research Notes

- The `JsonResource::response()->getData(true)` pattern is the standard way to unit-test resources
- `has()`, `make()`, `create()` factory methods — use `make()` for unit tests that don't need database
- Snapshot testing requires `spatie/phpunit-snapshot-assertions` or similar package
- Production analysis: 65% of resource-using codebases have dedicated resource tests; the rest rely on endpoint integration tests
