# Resource Testing — Engineering Rules

---

## Rule: Use make() Instead of create() for Unit Tests

---

## Category

Performance

---

## Rule

Use `Model::factory()->make()` for resource unit tests that only need model attributes. Only use `create()` when persistence or relationship loading is required.

---

## Reason

`make()` constructs the model in memory without writing to the database, eliminating the write query and the transaction cleanup. Resource unit tests typically only test transformation logic (field presence, formatting), which requires model attributes but not database persistence. `make()` reduces test execution time by 10-100x for resource suites.

---

## Bad Example

```php
public function test_returns_expected_fields(): void
{
    $user = User::factory()->create([  // Database write — unnecessary
        'name' => 'John',
        'email' => 'john@test.com',
    ]);

    $response = (new UserResource($user))->response()->getData(true);
    $this->assertSame('John', $response['data']['name']);
}
```

---

## Good Example

```php
public function test_returns_expected_fields(): void
{
    $user = User::factory()->make([  // No database write
        'name' => 'John',
        'email' => 'john@test.com',
    ]);

    $response = (new UserResource($user))->response()->getData(true);
    $this->assertSame('John', $response['data']['name']);
}
```

---

## Exceptions

Tests that require relationship loading (e.g., testing `whenLoaded`, `whenCounted`) must use `create()` because relationships need persisted models.

---

## Consequences Of Violation

Performance risks from unnecessary database writes; slower test suites (10-100x slower for resource tests); CI pipeline slowdowns from avoidable DB operations.

---

## Rule: Test Both Inclusion and Omission for Every Conditional

---

## Category

Testing

---

## Rule

For every `when()`, `whenHas()`, `whenNotNull()`, `whenLoaded()`, `whenCounted()`, and `whenAggregated()` call, write test cases that verify both the field-present and field-omitted states.

---

## Reason

A conditional field that is always absent (because the condition is always false) is functionally equivalent to a missing feature — clients expect the field but never receive it. Testing only the "included" path provides false confidence. Both paths must be explicitly verified.

---

## Bad Example

```php
public function test_bio_included_when_set(): void
{
    $user = User::factory()->make(['bio' => 'Hello']);
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayHasKey('bio', $response['data']);
    // Never tests omission path — bio could be always present despite conditional
}
```

---

## Good Example

```php
/** @dataProvider bioVisibilityProvider */
public function test_bio_visibility(bool $hasBio, bool $shouldAppear): void
{
    $overrides = $hasBio ? ['bio' => 'Hello'] : ['bio' => null];
    $user = User::factory()->make($overrides);
    $response = (new UserResource($user))->response()->getData(true);

    if ($shouldAppear) {
        $this->assertArrayHasKey('bio', $response['data']);
    } else {
        $this->assertArrayNotHasKey('bio', $response['data']);
    }
}

public static function bioVisibilityProvider(): array
{
    return [
        'bio visible when set' => [true, true],
        'bio hidden when null' => [false, false],
    ];
}
```

---

## Exceptions

No common exceptions. Every conditional path must be tested.

---

## Consequences Of Violation

Reliability risks from untested conditional omission; client crashes from missing expected fields; regression bugs when condition logic changes.

---

## Rule: Mirror Production Wrapping in Test Configuration

---

## Category

Testing

---

## Rule

Configure test wrapping to match production. If `AppServiceProvider` calls `JsonResource::withoutWrapping()`, call it in the test base class `setUp()`.

---

## Reason

Mismatched wrapping causes tests to assert the wrong response structure. Tests expecting a `data` key pass in CI but the real API does not wrap, or tests that pass locally fail in CI where wrapping differs. The test environment must be a faithful reproduction of the production response format.

---

## Bad Example

```php
// Production: JsonResource::withoutWrapping() in AppServiceProvider
// Tests: no wrapping configuration
class UserResourceTest extends TestCase
{
    public function test_returns_user_fields(): void
    {
        $user = User::factory()->make();
        $response = (new UserResource($user))->response()->getData(true);

        $this->assertArrayHasKey('id', $response); // Fails — actually in $response['data']
    }
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
        JsonResource::withoutWrapping();
    }
}

class UserResourceTest extends ApiTestCase
{
    public function test_returns_user_fields(): void
    {
        $user = User::factory()->make();
        $response = (new UserResource($user))->response()->getData(true);

        $this->assertArrayHasKey('id', $response); // Matches production format
    }
}
```

---

## Exceptions

Tests specifically designed to verify wrapping behavior in both wrapped and unwrapped configurations.

---

## Consequences Of Violation

Reliability risks from test inconsistencies with production; CI failures from environment configuration mismatches; false confidence from tests that pass but do not reflect production behavior.

---

## Rule: Run Resource Tests Early in CI

---

## Category

Testing

---

## Rule

Execute resource unit tests in the earliest CI pipeline stage, before integration tests, end-to-end tests, or other slower suites.

---

## Reason

Resource tests are the fastest test category (<50ms for a suite of 50 tests) and test the API contract. If a resource shape is wrong, all integration tests that hit the endpoint will also fail — but only after spending 50-200ms per test on HTTP handling. Running resource tests first provides immediate feedback on contract changes.

---

## Bad Example

```bash
# CI pipeline — integration tests first
- stage: integration
  script: php artisan test --testsuite=Feature  # ~5 minutes

# Resource tests run late in pipeline
- stage: unit
  script: php artisan test --testsuite=Unit      # ~30 seconds
# Contract breaks discovered late — developer waits 5 minutes to learn
```

---

## Good Example

```bash
# CI pipeline — resource tests first
- stage: contract
  script: php artisan test tests/Feature/Http/Resources/  # ~50ms

- stage: integration
  script: php artisan test --testsuite=Feature
```

---

## Exceptions

CI pipelines where test ordering is not configurable.

---

## Consequences Of Violation

Delayed feedback on contract-breaking changes; wasted CI resources running integration tests that will fail due to resource shape issues; developer productivity loss from long feedback cycles.

---

## Rule: Use Fixed Values in Snapshot Tests

---

## Category

Testing

---

## Rule

When using snapshot testing for resources, always pass fixed, deterministic values to model factories via `make(['id' => 1, 'name' => 'John'])`. Never use `create()` with auto-increment IDs or dynamic timestamps.

---

## Reason

Snapshot tests compare the entire response output against a stored snapshot file. Auto-increment IDs change every test run. Dynamic timestamps (current time, `now()`) differ between runs. These dynamic values cause snapshot mismatches on every test execution, requiring constant snapshot updates that reduce confidence and increase maintenance.

---

## Bad Example

```php
public function test_user_resource_snapshot(): void
{
    $user = User::factory()->create(); // Auto-increment ID, dynamic timestamps
    $response = (new UserResource($user))->response()->getData(true);

    $this->assertMatchesJsonSnapshot($response);
    // Fails on every run because ID and timestamps differ
}
```

---

## Good Example

```php
public function test_user_resource_snapshot(): void
{
    $user = User::factory()->make([
        'id' => 1,
        'name' => 'John Doe',
        'email' => 'john@example.com',
        'created_at' => new Carbon('2025-01-01 00:00:00'),
        'updated_at' => new Carbon('2025-01-01 00:00:00'),
    ]);

    $response = (new UserResource($user))->response()->getData(true);

    $this->assertMatchesJsonSnapshot($response);
    // Stable — never produces false positives
}
```

---

## Exceptions

No common exceptions. Snapshot tests for resources must always use fixed values.

---

## Consequences Of Violation

Brittle tests requiring frequent snapshot updates; reduced confidence in snapshot tests (developers ignore failures); maintenance overhead from constant snapshot regenerations.

---

## Rule: Test Relationship Loaded and Unloaded States

---

## Category

Testing

---

## Rule

For every `whenLoaded()` relationship in a resource, write two tests: one verifying the relationship field is present when the relation is loaded, and one verifying the field is omitted when the relation is not loaded.

---

## Reason

Relationship conditionals are the most common source of silent field omission. A missing eager load in the controller causes the relationship field to silently disappear. Tests that only verify the "loaded" state miss the most common failure mode: the "not loaded" state where the relationship was forgotten.

---

## Bad Example

```php
public function test_user_resource_includes_posts(): void
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts');
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayHasKey('posts', $response['data']);
    // Only tests loaded state — missing the unloaded state
}
```

---

## Good Example

```php
public function test_posts_included_when_loaded(): void
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    $user->load('posts');
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayHasKey('posts', $response['data']);
    $this->assertCount(3, $response['data']['posts']);
}

public function test_posts_omitted_when_not_loaded(): void
{
    $user = User::factory()->has(Post::factory()->count(3))->create();
    // No $user->load('posts')
    $response = (new UserResource($user))->response()->getData(true);
    $this->assertArrayNotHasKey('posts', $response['data']);
}
```

---

## Exceptions

Relationships that are always loaded (model `$with` property, always eager-loaded in every controller).

---

## Consequences Of Violation

Reliability risks from untested silent omission; debugging overhead when relationship fields disappear; regression bugs when controller loading strategy changes.

---

## Rule: Test Resource Contract, Not Internals

---

## Category

Testing

---

## Rule

Assert on the resource's JSON output (field presence, values, structure), not on its implementation details (class type, parent class, method calls).

---

## Reason

A test that asserts `assertInstanceOf(JsonResource::class, $resource)` provides zero confidence that the resource produces correct output. The contract is the JSON that clients receive — that is what must be verified. Internal implementation tests pass even when the resource produces wrong output.

---

## Bad Example

```php
public function test_user_resource_is_json_resource(): void
{
    $user = User::factory()->make();
    $resource = new UserResource($user);

    $this->assertInstanceOf(JsonResource::class, $resource);
    $this->assertTrue(method_exists($resource, 'toArray'));
    // Tests implementation, not contract — provides no confidence
}
```

---

## Good Example

```php
public function test_user_resource_returns_expected_structure(): void
{
    $user = User::factory()->make([
        'id' => 1,
        'name' => 'John Doe',
        'email' => 'john@example.com',
    ]);

    $response = (new UserResource($user))->response()->getData(true);

    $expected = [
        'data' => [
            'id' => 1,
            'name' => 'John Doe',
            'email' => 'john@example.com',
        ],
    ];

    $this->assertSame($expected, $response);
}
```

---

## Exceptions

No common exceptions. Resource tests must always verify output, not structure.

---

## Consequences Of Violation

False confidence from tests that pass but do not verify the contract; untested field transformations and conditional logic; maintenance overhead from implementation-tracking tests.

---

## Rule: Use Data Providers for Exhaustive Conditional Coverage

---

## Category

Testing

---

## Rule

Use PHPUnit data providers to test conditional field visibility across multiple model states instead of writing individual test methods for each state.

---

## Reason

Resources with 5+ conditional fields require multiple states. Writing individual methods (one per conditional path) produces code duplication and makes it easy to skip states. Data providers enumerate all relevant states in one place, ensuring every condition is tested and making it obvious which states are covered.

---

## Bad Example

```php
public function test_bio_included(): void { /* ... */ }
public function test_bio_omitted(): void { /* ... */ }
public function test_role_included_for_admin(): void { /* ... */ }
public function test_role_omitted_for_user(): void { /* ... */ }
// Repeating for every conditional — 2^n methods for n conditionals
```

---

## Good Example

```php
/** @dataProvider conditionalFieldProvider */
public function test_conditional_field_visibility(
    string $field,
    bool $shouldAppear,
    array $overrides
): void {
    $user = User::factory()->make($overrides);
    $data = (new UserResource($user))->response()->getData(true);

    if ($shouldAppear) {
        $this->assertArrayHasKey($field, $data['data']);
    } else {
        $this->assertArrayNotHasKey($field, $data['data']);
    }
}

public static function conditionalFieldProvider(): array
{
    return [
        'id always present' => ['id', true, []],
        'bio included when set' => ['bio', true, ['bio' => 'Hello']],
        'bio omitted when null' => ['bio', false, ['bio' => null]],
        'role included for admin' => ['role', true, ['role' => 'admin']],
        'role omitted for user' => ['role', false, ['role' => 'user']],
    ];
}
```

---

## Exceptions

When conditionals interact (field A only present when field B is also present), test the combination separately.

---

## Consequences Of Violation

Test duplication across conditional states; incomplete coverage from skipped states; maintenance overhead when adding new conditionals.

---

## Rule: Do Not Use Snapshots as Sole Contract Validation

---

## Category

Testing

---

## Rule

Accompany every snapshot test with individual field-level assertions that document the expected contract. Do not rely on snapshot tests as the only validation mechanism.

---

## Reason

Snapshot tests detect changes but do not document the contract. A developer looking at a snapshot test cannot tell what fields are expected without examining the snapshot file. When a snapshot changes, it is unclear whether the change is intentional or a bug. Individual assertions make the contract explicit and readable.

---

## Bad Example

```php
public function test_user_resource(): void
{
    $user = User::factory()->make(['id' => 1, 'name' => 'John']);

    $response = (new UserResource($user))->response()->getData(true);

    $this->assertMatchesJsonSnapshot($response);
    // No field-level assertions — contract is hidden in snapshot file
}
```

---

## Good Example

```php
public function test_user_resource(): void
{
    $user = User::factory()->make(['id' => 1, 'name' => 'John']);

    $response = (new UserResource($user))->response()->getData(true);

    // Explicit contract:
    $this->assertSame(1, $response['data']['id']);
    $this->assertSame('John', $response['data']['name']);
    $this->assertArrayNotHasKey('password', $response['data']);

    // Snapshot as secondary — catches unexpected changes
    $this->assertMatchesJsonSnapshot($response);
}
```

---

## Exceptions

No common exceptions. Snapshot tests should always be paired with explicit assertions.

---

## Consequences Of Violation

Undocumented API contracts; difficulty distinguishing intentional changes from bugs; onboarding friction for developers reading snapshot-only tests.

---

## Rule: Test Version Compatibility

---

## Category

Testing

---

## Rule

Write version compatibility tests that assert old version resources do not include new version fields, and new version resources include all expected fields.

---

## Reason

Version compatibility ensures that old API consumers are not accidentally affected by new field additions. A regression where V1 resource accidentally includes a V2 field breaks existing clients silently. Version compatibility tests make the contract boundary between versions explicit and enforced.

---

## Bad Example

```php
// Only tests the latest version
public function test_user_resource(): void
{
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V2\UserResource($user);
    $data = $resource->response()->getData(true);
    $this->assertArrayHasKey('phone', $data['data']);
    // V1 could also have phone — no test verifies it doesn't
}
```

---

## Good Example

```php
public function test_v1_user_resource_has_no_phone_field(): void
{
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V1\UserResource($user);
    $data = $resource->response()->getData(true);
    $this->assertArrayNotHasKey('phone', $data['data']);
}

public function test_v2_user_resource_includes_phone_field(): void
{
    $user = User::factory()->make(['phone' => '555-0100']);
    $resource = new V2\UserResource($user);
    $data = $resource->response()->getData(true);
    $this->assertArrayHasKey('phone', $data['data']);
}
```

---

## Exceptions

APIs with no versioning (single version, flat structure).

---

## Consequences Of Violation

Reliability risks from accidental cross-version field leakage; client crashes when old versions unexpectedly include new fields; breaking changes in supposedly frozen versions.
