# Resource Testing

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource Testing
- **Difficulty:** Intermediate
- **ECC Version:** 1.0
- **Last Updated:** 2026-06-02

## Overview
API Resource testing verifies that the response shape, conditional fields, relationship loading, metadata, and status codes behave correctly for different inputs and contexts. Resources are tested at two levels: unit tests (resource `toArray` output for given models) and integration tests (full HTTP request → endpoint → response).

The engineering principle is: test the resource's contract, not its internals. The contract is the JSON structure that clients receive. A test should assert that for a given model, the resource produces the expected JSON shape — no more, no less.

## Core Concepts
- **Unit testing:** `(new UserResource($user))->response()->getData(true)` returns the response as an associative array for direct assertions.
- **Integration testing:** Full HTTP request via `$this->getJson()` asserting response structure, status codes, and headers.
- **`make()` vs `create()`:** Use `User::factory()->make()` for unit tests (no database write, faster). Use `create()` only when relationships or persistence are needed.
- **Data providers:** Test multiple conditional states with parameterized test cases.
- **Snapshot testing:** `$this->assertMatchesJsonSnapshot($response)` for complex, stable resource outputs.
- **Conditional field assertions:** `assertArrayHasKey` / `assertArrayNotHasKey` for `when()` conditions.
- **Request context:** Use `$resource->withRequest($request)` to set the HTTP request for unit tests.

## When To Use
- Unit tests for resource logic: conditional fields, formatting, relationship inclusion/omission.
- Integration tests for endpoint behavior: pagination metadata, status codes, authentication, headers.
- Snapshot tests for complex resources with many fields.
- Version compatibility tests to ensure old versions still produce expected shapes.
- Data provider tests for exhaustive conditional field coverage.

## When NOT To Use
- Do not test that `JsonResource` works (e.g., `assertInstanceOf(JsonResource::class, $resource)`). Test your resource's specific output.
- Do not create integration tests for every resource unit test — unit tests are faster and sufficient for pure resource logic.
- Do not use snapshot tests for resources with dynamic values (timestamps, random IDs, auto-increment) without fixing the model state.

## Best Practices (WHY)
- **Run resource tests first in CI.** Resource contract tests are fast (<50ms for a suite). If the resource shape is wrong, integration tests will fail too — fail fast.
- **Use data providers for conditional field testing.** Test each conditional independently rather than combinatorial explosion.
- **Use `make()` instead of `create()` for unit tests.** `make()` is faster (no database write) and sufficient for most resource tests.
- **Test both conditional paths.** For every `when()`, test the true case (field present) and false case (field omitted).
- **Mirror production wrapping in tests.** If production uses `withoutWrapping()`, call it in test `setUp()`.
- **Use fixed values in snapshot tests.** `User::factory()->make(['id' => 1, 'name' => 'John'])` produces reproducible output.

## Architecture Guidelines
- Structure test files to mirror resource organization: `tests/Feature/Http/Resources/V1/UserResourceTest.php`.
- Use a base `ResourceTestCase` that configures wrapping, request defaults, and common assertions.
- Version compatibility tests should assert that old version resources lack new version fields.
- For collection resources, test empty collection, single item, multiple items, and paginated states.
- Resource unit tests should not hit the database unless relationship loading is being tested.

## Performance
- Resource unit tests are the fastest test category after pure unit tests. A suite of 50 unit tests completes in <50ms.
- Integration tests are slower (50-200ms each) due to full framework boot and HTTP handling.
- Use `make()` to avoid database writes in unit tests — saves the write query and the cleanup (transaction rollback).
- Group resource tests in early CI stages for fast feedback on contract changes.

## Security
- Resource tests should verify that sensitive fields are never exposed, regardless of conditional state.
- Test that authorization-conditional fields are properly omitted for unauthorized contexts.
- Version compatibility tests ensure that old resource versions do not accidentally expose new fields.
- Test that metadata does not leak internal information (server paths, query logs, configuration).

## Common Mistakes

### Testing Framework Behavior (desc)
Testing that the resource extends a class or exists, rather than testing its output.
- **Cause:** Using a testing template without understanding what to assert.
- **Consequence:** Tests pass but provide zero confidence in the resource contract.
- **Better:** Assert specific field presence, values, and structure in the resource output.

### Testing with Database When Not Needed (desc)
Using `User::factory()->create()` when `make()` suffices.
- **Cause:** Defaulting to `create()` out of habit or template.
- **Consequence:** Slower tests (database write + cleanup) with no additional coverage.
- **Better:** Use `make()` for unit tests that only need model attributes, not persistence.

### Forgetting Wrapping Configuration (desc)
Tests check for `data` key but production uses `withoutWrapping()`.
- **Cause:** Test configuration does not mirror production.
- **Consequence:** Tests fail or, worse, pass but do not reflect production behavior.
- **Better:** Call `JsonResource::withoutWrapping()` in the base test class `setUp()`.

### Brittle Snapshot Tests (desc)
Snapshot tests fail on every run due to dynamic values.
- **Cause:** Using `create()` (auto-increment IDs) or dynamic timestamps.
- **Consequence:** Tests require frequent snapshot updates, reducing their value.
- **Better:** Use `make()` with fixed values for snapshot tests.

## Anti-Patterns
- **Over-testing conditionals:** Testing every combination of 8 conditional fields (2^8 = 256 tests). Test each condition independently; test combinations only for critical interactions.
- **Snapshots as sole contract:** Using snapshot tests without individual field assertions. Snapshots catch changes but do not document the contract.
- **No resource unit tests:** Relying entirely on integration tests for resource coverage. Integration tests are slower and provide less precise failure information.

## Examples

### Unit Test with make()
```php
class UserResourceTest extends TestCase
{
    public function test_returns_expected_structure()
    {
        $user = User::factory()->make([
            'id' => 1,
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ]);

        $response = (new UserResource($user))->response()->getData(true);

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

### Conditional Field Testing
```php
class UserResourceTest extends TestCase
{
    /** @dataProvider fieldVisibilityProvider */
    public function test_field_visibility(string $field, bool $visible, array $overrides = [])
    {
        $user = User::factory()->make($overrides);
        $data = (new UserResource($user))->response()->getData(true)['data'];

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
}
```

### Relationship Loading Test
```php
public function test_posts_included_when_loaded()
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts');

    $response = (new UserResource($user))->response()->getData(true);

    $this->assertArrayHasKey('posts', $response['data']);
    $this->assertCount(3, $response['data']['posts']);
}

public function test_posts_omitted_when_not_loaded()
{
    $user = User::factory()->create();

    $response = (new UserResource($user))->response()->getData(true);

    $this->assertArrayNotHasKey('posts', $response['data']);
}
```

### Version Compatibility Test
```php
public function test_v1_user_resource_has_no_phone_field()
{
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V1\UserResource($user);
    $data = $resource->response()->getData(true);

    $this->assertArrayNotHasKey('phone', $data['data']);
}

public function test_v2_user_resource_includes_phone_field()
{
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V2\UserResource($user);
    $data = $resource->response()->getData(true);

    $this->assertArrayHasKey('phone', $data['data']);
}
```

### Integration Test for Paginated Endpoint
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

## Related Topics
- Resource Fundamentals — baseline resource structure to test
- Conditional Attributes — testing `when()`, `whenHas()`, `whenNotNull()`
- Conditional Relationships — testing `whenLoaded()`, `whenCounted()`
- Pagination Metadata — testing pagination structure
- Top-Level Meta Data — testing `with()` and `withResponse()`

## AI Agent Notes
- **Generate:** `php artisan make:test V1/UserResourceTest --unit` for resource unit test scaffolding.
- **Key constraint:** Use `make()` for unit tests (no DB writes), `create()` only when relationships are needed.
- **Validation:** Every `when()` condition should have both true and false test cases.
- **Common fix:** If a resource test fails unexpectedly, check wrapping configuration — the test may expect `data` key while production uses `withoutWrapping()`.
- **Testing pattern:** `(new UserResource($user))->response()->getData(true)` is the standard unit test extraction pattern.

## Verification
- [ ] Every conditional field has both inclusion and omission test cases.
- [ ] Unit tests use `make()` instead of `create()` where possible.
- [ ] Test wrapping configuration matches production (`withoutWrapping()` in test base class).
- [ ] Version compatibility tests verify old versions lack new fields.
- [ ] Paginated collection tests verify `links` and `meta` structure.
- [ ] Resource tests are fast (<50ms suite) and run early in CI.
- [ ] Snapshot tests use fixed, reproducible model values.
