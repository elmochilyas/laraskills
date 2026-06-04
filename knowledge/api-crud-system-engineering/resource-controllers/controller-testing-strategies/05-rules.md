## Write HTTP Tests For Controllers, Not Unit Tests
---
## Category
Testing
---
## Rule
Always write HTTP tests using $this->getJson(), $this->postJson(), $this->putJson(), and $this->deleteJson() for controller testing; never write unit tests that instantiate controllers directly.
---
## Reason
HTTP tests exercise the full stack — routing, middleware, validation, controller execution, and response construction — providing the highest confidence. Unit-testing controllers in isolation misses integration bugs.
---
## Bad Example
`php
public function test_store(): void {  = new PhotoController();  = ->store(new Request(['title' => 'test'])); ->assertEquals(201, ->getStatusCode()); }
`
---
## Good Example
`php
public function test_can_create_a_photo(): void {  = Photo::factory()->raw(); ->postJson('/api/photos', )->assertCreated()->assertJsonStructure(['data' => ['id', 'title']]); ->assertDatabaseHas('photos', ['title' => ['title']]); }
`
---
## Exceptions
Unit tests for action classes or form requests should remain plain PHPUnit tests without HTTP stack.
---
## Consequences Of Violation
Integration bugs (middleware, routing, binding) missed; false confidence from isolated test passes; production incidents from untested integration paths.

## Always Test Failure Paths Per Action
---
## Category
Testing
---
## Rule
Always write at least one failure-path test (unauthenticated, unauthorized, validation error, not-found) for every controller action; never test only the happy path.
---
## Reason
Happy-path-only testing misses error responses that crash clients. Failure paths are exercised more often in production than the happy path during abuse scenarios.
---
## Bad Example
`php
public function test_can_create_a_photo(): void {  = Photo::factory()->raw(); ->postJson('/api/photos', )->assertCreated(); } // No auth/validation tests
`
---
## Good Example
`php
public function test_can_create_a_photo(): void { ... } // Happy path
public function test_guests_cannot_create_photos(): void { ->postJson('/api/photos', [])->assertUnauthorized(); }
public function test_create_validates_required_fields(): void { ->actingAs(User::factory()->create())->postJson('/api/photos', [])->assertStatus(422)->assertJsonValidationErrors(['title']); }
`
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Unauthenticated access works in production; validation errors crash mobile clients; 404 errors unhandled; authorization gaps undetected.

## Use assertJsonStructure For Shape Validation
---
## Category
Testing
---
## Rule
Always use ssertJsonStructure() for response shape validation and ssertJsonFragment() for specific value assertions; never use ssertJson() with hardcoded IDs.
---
## Reason
ssertJson() with hardcoded IDs creates brittle tests that fail on unrelated data changes. ssertJsonStructure() validates the contract without coupling to specific values.
---
## Bad Example
`php
->postJson('/api/photos', )->assertJson(['id' => 1, 'title' => 'My Photo']); // Brittle — fails if ID changes
`
---
## Good Example
`php
->postJson('/api/photos', )->assertCreated()->assertJsonStructure(['data' => ['id', 'title', 'created_at']]); // Shape validation
->assertDatabaseHas('photos', ['title' => ['title']]); // Value validation
`
---
## Exceptions
When testing idempotent endpoints where specific values must be verified (e.g., "order total must equal .00").
---
## Consequences Of Violation
Brittle test suite; tests fail on unrelated data changes; developers lose trust in tests and start ignoring failures.

## Assert Database State For Mutating Actions
---
## Category
Testing
---
## Rule
Always add ssertDatabaseHas() or ssertDatabaseMissing() assertions for mutating actions (store, update, destroy); never rely on response assertions alone.
---
## Reason
A controller could return a successful HTTP status code but not persist data correctly due to database errors, event failures, or rollback issues.
---
## Bad Example
`php
public function test_can_create_a_photo(): void { ->postJson('/api/photos', )->assertCreated(); } // No database assertion
`
---
## Good Example
`php
public function test_can_create_a_photo(): void { ->postJson('/api/photos', )->assertCreated(); ->assertDatabaseHas('photos', ['title' => ['title']]); }
`
---
## Exceptions
Read-only actions (index, show) do not need database state assertions.
---
## Consequences Of Violation
Database write failures go undetected; test suite passes despite broken persistence; production data loss not caught by tests.

## Keep Tests Independent
---
## Category
Testing
---
## Rule
Always create fresh data per test method; never share state across tests via class properties or static fixtures.
---
## Reason
Shared state causes intermittent failures depending on test execution order. Test isolation guarantees deterministic results.
---
## Bad Example
`php
class PhotoControllerTest extends TestCase { private Photo ; protected function setUp(): void { parent::setUp(); ->photo = Photo::factory()->create(); } // Shared — modified by first test, breaks second test }
`
---
## Good Example
`php
public function test_can_show_a_photo(): void {  = Photo::factory()->create(); ->getJson("/api/photos/{->id}")->assertOk(); }
public function test_can_update_a_photo(): void {  = Photo::factory()->create(); ->putJson("/api/photos/{->id}", [...])->assertOk(); }
`
---
## Exceptions
Expensive fixture setup (e.g., creating a tenant with all relationships) may be shared with @depends when explicitly documented.
---
## Consequences Of Violation
Intermittent test failures; debugging wasted on non-deterministic tests; CI flakiness reduces team trust in test suite.

## Use RefreshDatabase Or DatabaseTransactions
---
## Category
Testing
---
## Rule
Always apply RefreshDatabase or DatabaseTransactions trait to controller test classes; never leave database state to accumulate between tests.
---
## Reason
Without transaction isolation, tests leak data into subsequent tests, causing cascading failures that are hard to debug.
---
## Bad Example
`php
class PhotoControllerTest extends TestCase { // No transaction trait — tests pollute each other }
`
---
## Good Example
`php
use RefreshDatabase;
class PhotoControllerTest extends TestCase { use RefreshDatabase; }
`
---
## Exceptions
Use DatabaseTransactions instead of RefreshDatabase when tests don't modify schema to avoid re-migration overhead.
---
## Consequences Of Violation
Test pollution; intermittent failures; data-dependent test order; false positives from leftover database state.
