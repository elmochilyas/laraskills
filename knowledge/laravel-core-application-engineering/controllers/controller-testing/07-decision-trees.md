# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Controllers
**Knowledge Unit:** Controller Testing
**Generated:** 2026-06-03

---

# Decision Inventory

* Feature Test (HTTP) vs Unit Test for Controller Behavior
* Test Scope: What to Assert in Controller Tests
* Authorization Scenario Coverage

---

# Architecture-Level Decision Trees

---

## Decision 1: Feature Test (HTTP) vs Unit Test for Controller Behavior

---

## Decision Context

Whether to test a controller's behavior using a feature test (boot framework, send HTTP request) or a unit test (instantiate controller, call method directly).

---

## Decision Criteria

* Whether the test needs to verify HTTP concerns (status code, redirect, JSON structure)
* Whether business logic needs to be verified
* Whether middleware, validation, or route binding needs to be tested

---

## Decision Tree

Does this test need to verify HTTP concerns (status code, redirect, response format)?
↓
YES → Feature test: `$this->get('/route')->assertOk()`
    Reason: HTTP concerns require the full framework stack (middleware, routing, response)
NO → Does the test verify business logic (calculations, service calls, model state)?
    YES → Unit test (service or action class):
        ```php
        $service = new OrderService();
        $result = $service->calculateTotal($items);
        $this->assertEquals(100.0, $result);
        ```
    NO → Does the test verify controller-specific wiring (delegation to services)?
        YES → Feature test is still preferred — real implementations, no mocks
        NO → Unit test
NO → Does the test need to verify validation rules or FormRequest behavior?
    YES → Feature test (validation runs in the HTTP stack)
    NO → Does the test need to verify authorization (guest, unauthorized, authorized)?
        YES → Feature test (auth runs in middleware)
        NO → Unit test

---

## Rationale

Controller tests verify HTTP behavior — status codes, redirects, JSON structure. Business logic assertions belong in service/action unit tests. Using feature tests for business logic creates slow, brittle tests; using unit tests for HTTP concerns misses the middleware pipeline.

---

## Recommended Default

**Default:** Feature tests for HTTP behavior and authorization; unit tests for business logic — never mix the two
**Reason:** Each test type has a clear purpose. Controller tests verify the HTTP contract; unit tests verify business logic correctness.

---

## Risks Of Wrong Choice

* Mocking services in feature tests: Couples test to injection implementation, misses wiring errors
* Business logic in feature tests: Slow suite, brittle assertions, duplicates service tests
* Feature test for simple calculation: 200ms framework boot for a 1ms assertion

---

## Related Rules

* Do Not Mock Services in Controller Tests (05-rules.md)
* Do Not Assert Business Logic in Controller Tests (05-rules.md)

---

## Related Skills

* Skill: Write Feature Tests for Controller Actions

---

## Decision 2: Test Scope — What to Assert in Controller Tests

---

## Decision Context

What aspects of a controller action to verify in tests — status, response structure, redirect, database state.

---

## Decision Criteria

* Whether the action is a web (HTML) or API (JSON) endpoint
* Whether the action creates, reads, updates, or deletes data
* Whether the response is a view, redirect, or JSON

---

## Decision Tree

Is this a web (HTML) or API (JSON) endpoint?
↓
Web → Assert:
    1. Status code: `->assertOk()` or `->assertRedirect($uri)`
    2. View: `->assertViewIs('users.index')` — verify correct view
    3. View data: `->assertViewHas('users')` — verify data is passed
    4. For store/update: `->assertRedirect()` and `assertDatabaseHas()`
API → Assert:
    1. Status code: `->assertOk()`, `->assertCreated()`, `->assertNoContent()`
    2. JSON structure: `->assertJsonStructure(['data' => ['id', 'name']])`
    3. JSON content: `->assertJson(['data' => ['name' => 'John']])`
    4. For store: `->assertCreated()` with `->assertJsonStructure()`
NO → Does the action redirect (store, update, destroy)?
    YES → Assert redirect target: `->assertRedirect('/users')`
    NO → Assert status code and response structure
NO → Does the action operate on data (create, update, delete)?
    YES → Assert database state: `assertDatabaseHas()`, `assertDatabaseMissing()`, `assertDatabaseCount()`
    NO → Read-only actions: status + view/data/structure is sufficient

---

## Rationale

Controller tests should verify the HTTP contract: correct status, correct response structure, correct redirect. For data-modifying actions, a database existence check confirms the delegation happened. Business logic details (tax calculations, formatting) should not be asserted.

---

## Recommended Default

**Default:** Assert status + view/structure + redirect (if applicable) + database state (if data modification)
**Reason:** These assertions cover the controller's responsibility — correct handling of the HTTP request and delegation to the business layer.

---

## Risks Of Wrong Choice

* Over-asserting HTML/JSON content: Brittle tests break on minor formatting changes
* Not asserting database state: Missing confirmation that data was created/updated
* Asserting business logic values (tax, total): Duplicates service tests, slow

---

## Related Rules

* Test One Behavior Per Test Method (05-rules.md)
* Avoid Over-Asserting Response Details (05-rules.md)

---

## Related Skills

* Skill: Write Feature Tests for Controller Actions

---

## Decision 3: Authorization Scenario Coverage

---

## Decision Context

How many authorization scenarios to test for each protected controller action.

---

## Decision Criteria

* Whether the action requires authentication
* Whether the action has role/permission-based access control
* Whether the action handles sensitive data

---

## Decision Tree

Does the action require authentication (auth middleware)?
↓
NO → Public action — test only the happy path (200 for valid request)
YES → Does the action have role/permission-based access control (admin only)?
    YES → Test THREE scenarios:
        1. Guest (unauthenticated): `->assertRedirect('/login')` or `->assertUnauthorized()`
        2. Authenticated but unauthorized: `->assertForbidden()`
        3. Authenticated and authorized: `->assertOk()` or expect status
    NO → Test TWO scenarios:
        1. Guest (unauthenticated): `->assertRedirect('/login')`
        2. Authenticated: `->assertOk()` or expect response
NO → Does the action display sensitive data (admin panel, edit buttons)?
    YES → Test that authorized user sees the data AND unauthorized user does NOT see it
    NO → Happy path test for public actions

---

## Rationale

Each authorization scenario can fail independently. Guests should be redirected to login, unauthorized users should receive 403, and authorized users should receive the expected response. Testing only the happy path misses permission escalation and access control bugs.

---

## Recommended Default

**Default:** Three scenarios for role-based actions (guest, unauthorized, authorized); two scenarios for auth-only actions (guest, authenticated)
**Reason:** Role-based actions have three distinct states. Auth-only actions have two (blocked vs allowed).

---

## Risks Of Wrong Choice

* Only happy path: Permission escalation goes undetected
* Missing guest test: Public accidentally protected? Auth middleware missing? Not verified
* Missing unauthorized test: Any authenticated user can perform admin actions — not caught
* Testing all three for public actions: Unnecessary — public actions have no auth to test

---

## Related Rules

* Test Three Authorization Scenarios Per Protected Action (05-rules.md)
* Use actingAs() for Authenticated Routes (05-rules.md)

---

## Related Skills

* Skill: Write Feature Tests for Controller Actions
