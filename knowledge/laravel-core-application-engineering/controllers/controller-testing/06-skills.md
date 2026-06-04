# Skill: Write Feature Tests for Controller Actions

## Purpose

Create comprehensive feature tests for every controller action that verify HTTP behavior — status codes, redirects, response structure, validation errors, and authorization — without testing business logic. Ensures the HTTP contract between the application and its consumers is correct and regression-proof.

## When To Use

- Every controller action in every controller (index, store, show, update, destroy)
- Adding a new action to an existing controller
- After refactoring a controller to ensure no behavioral change
- Before deploying changes that affect HTTP responses

## When NOT To Use

- Testing business logic (use service/action unit tests)
- Testing response formatting details (use API Resource tests)
- Testing framework internals (the framework is already tested)
- Testing query behavior (use model/repository tests)

## Prerequisites

- PHPUnit or Pest configured for the project
- `RefreshDatabase` or `DatabaseTransactions` trait available
- Model factories defined for test data creation
- Route definitions existing for the controller being tested

## Inputs

- Controller class and its route URI patterns
- FormRequest classes and their validation rules
- Authorization rules for each action (guest, authenticated, admin)
- Expected response structures (view names, JSON structures, redirect targets)

## Workflow

1. **Create the test file**

   ```bash
   php artisan make:test {ControllerName}Test
   ```
   
   Or create manually in `tests/Feature/{ControllerName}Test.php`.

2. **Set up database isolation**

   Add `use RefreshDatabase;` (or `use DatabaseTransactions;`) to the test class.

3. **Write a test for each authorization scenario**

   For every protected action, test three scenarios:
   
   a. **Guest (unauthenticated)** — verify redirect to login or 401:
      ```php
      public function test_guests_cannot_view_users(): void
      {
          $this->get('/users')->assertRedirect('/login');
      }
      ```
   
   b. **Unauthorized (wrong role/permission)** — verify 403:
      ```php
      public function test_non_admin_users_cannot_delete_users(): void
      {
          $user = User::factory()->create();
          $this->actingAs($user)
              ->delete("/users/{$user->id}")
              ->assertForbidden();
      }
      ```
   
   c. **Authorized (happy path)** — verify successful response:
      ```php
      public function test_admin_can_view_users(): void
      {
          $this->actingAs(User::factory()->admin()->create())
              ->get('/users')
              ->assertOk();
      }
      ```

4. **Write validation error tests for store and update actions**

   For each validation rule in the FormRequest, submit invalid data and assert errors:
   ```php
   public function test_store_requires_title(): void
   {
       $this->actingAs(User::factory()->create())
           ->post('/posts', ['body' => 'Content without title'])
           ->assertSessionHasErrors(['title']);
   }
   ```

5. **Write response structure tests**

   a. For JSON endpoints, use `assertJsonStructure()` to verify the contract:
      ```php
      $response->assertOk()
          ->assertJsonStructure(['data' => [['id', 'title']]]);
      ```
   
   b. For web endpoints, use `assertViewIs()` and `assertViewHas()`:
      ```php
      $response->assertOk()
          ->assertViewIs('users.index')
          ->assertViewHas('users');
      ```

6. **Write redirect and status code tests**

   ```php
   public function test_store_redirects_to_index(): void
   {
       $this->actingAs(User::factory()->create())
           ->post('/users', ['name' => 'John', 'email' => 'john@test.com'])
           ->assertRedirect('/users');
   }
   
   public function test_store_creates_user_in_database(): void
   {
       $this->actingAs(User::factory()->create())
           ->post('/users', ['name' => 'John', 'email' => 'john@test.com']);
       
       $this->assertDatabaseHas('users', ['email' => 'john@test.com']);
   }
   ```

7. **Verify one behavior per test method**

   Each test method should verify exactly one concern:
   - Status code test
   - Redirect test
   - Validation error test (per field)
   - Response structure test
   - Database state test (`assertDatabaseHas`)

## Validation Checklist

- [ ] Every controller action has at least one test
- [ ] All three authorization scenarios are tested per protected action (guest, unauthorized, authorized)
- [ ] Validation errors are tested for each rule in store and update FormRequests
- [ ] No business logic assertions (service calls, complex calculations) in controller tests
- [ ] `RefreshDatabase` or `DatabaseTransactions` is used for database isolation
- [ ] `$this->actingAs()` is used for authenticated routes
- [ ] Response structure assertions use `assertJsonStructure()` not `assertExactJson()`
- [ ] Each test method verifies one behavior
- [ ] No mocks or partial mocks of services in controller tests

## Common Failures

- **Testing without `actingAs()`**: Authenticated routes get 302 redirect to login instead of the expected response. Prevention: always add `->actingAs(User::factory()->create())` for authenticated routes.
- **Not testing validation errors**: Only the happy path is tested. Prevention: write a test for every validation rule in store/update FormRequests.
- **Mocking services**: Using `$this->mock()` to replace service dependencies. Prevention: use real service implementations with factory-created data.
- **Over-asserting response details**: Using `assertExactJson()` or asserting HTML content. Prevention: use `assertJsonStructure()` for JSON and `assertViewHas()` for views.
- **Testing business logic**: Asserting tax calculations, service call counts, or complex results. Prevention: leave those assertions to service-level unit tests.

## Decision Points

- **`RefreshDatabase` vs. `DatabaseTransactions`**: `RefreshDatabase` is slower but guarantees clean schema. `DatabaseTransactions` is faster but requires stable migrations. Use `DatabaseTransactions` for CI speed, `RefreshDatabase` for local development.
- **`assertJsonStructure()` vs. `assertExactJson()`**: Use `assertJsonStructure()` for contract verification. Use `assertExactJson()` only when testing idempotent operations with known output.
- **`assertSessionHasErrors()` vs. `assertInvalid()`**: `assertSessionHasErrors()` is traditional. `assertInvalid()` is available in Laravel 8+ and provides better error messages.

## Performance Considerations

- Controller tests boot the framework — they are slower than unit tests (100-500ms per test).
- Use `DatabaseTransactions` instead of `RefreshDatabase` for faster test runs when schema is stable.
- Test one behavior per method — this produces more tests but each is faster to debug on failure.
- Do not mock services — real implementations with factories are more reliable and don't hide wiring issues.

## Security Considerations

- Testing authorization scenarios detects permission escalation vulnerabilities before deployment.
- Always test that guests cannot access protected actions — this is the most common security gap.
- Test that the `authorize()` method in FormRequests correctly denies unauthorized users.
- Testing validation rules prevents invalid or malicious input from reaching business logic.

## Related Rules

- `05-rules.md` Rule: "Test Every Controller Action"
- `05-rules.md` Rule: "Test Three Authorization Scenarios Per Protected Action"
- `05-rules.md` Rule: "Test Validation Errors for Every Store and Update Action"
- `05-rules.md` Rule: "Do Not Mock Services in Controller Tests"
- `05-rules.md` Rule: "Test One Behavior Per Test Method"
- `05-rules.md` Rule: "Use RefreshDatabase or DatabaseTransactions for Isolation"
- `05-rules.md` Rule: "Use actingAs() for Authenticated Routes"
- `05-rules.md` Rule: "Do Not Assert Business Logic in Controller Tests"
- `05-rules.md` Rule: "Avoid Over-Asserting Response Details"

## Related Skills

- "Design and Implement Controller Architecture" — understanding what controllers should do
- "Apply Dependency Injection to Controllers" — understanding controller wiring for testing
- "Refactor a Fat Controller into a Thin Controller" — prerequisite for writing clean tests

## Success Criteria

- Every controller action has at least one passing test
- Authorization is verified for all three scenarios per protected action
- Validation errors are tested for every rule in store/update FormRequests
- No business logic assertions exist in controller tests
- All tests pass without mocking services
- The test suite completes in reasonable time with database isolation

---

# Skill: Write Controller Tests for a Store Action

## Purpose

Create a complete test suite for a single store action that covers validation, authorization, response behavior, and database state. Provides a repeatable template for testing create operations across all controllers.

## When To Use

- Testing the `store()` method of a resource controller
- Testing a `POST` endpoint that creates a new resource
- Adding tests for a newly created store action
- Extending an existing test file with missing store tests

## When NOT To Use

- Testing non-POST endpoints (use the appropriate HTTP helper)
- Testing endpoints that don't persist data (use response structure tests instead)

## Prerequisites

- Route exists for the store action (`POST /resource`)
- FormRequest class exists with validation rules
- `RefreshDatabase` or `DatabaseTransactions` is applied to the test class
- Model factory exists if database assertions are needed

## Inputs

- Route URI (`POST /users`)
- FormRequest class name (`StoreUserRequest`)
- Validation rules (list of fields and their rules)
- Authorization rules (who can create)
- Expected response after creation (redirect or JSON)

## Workflow

1. **Create the store test method**

   Start with the authorization scenarios:
   ```php
   public function test_guests_cannot_create_users(): void
   {
       $this->post('/users', ['name' => 'Test'])->assertRedirect('/login');
   }
   ```

2. **Test validation errors for EACH required field**

   Submit missing the required field and assert the error:
   ```php
   public function test_store_requires_name(): void
   {
       $this->actingAs(User::factory()->create())
           ->post('/users', ['email' => 'test@test.com'])
           ->assertSessionHasErrors(['name']);
   }
   
   public function test_store_requires_valid_email(): void
   {
       $this->actingAs(User::factory()->create())
           ->post('/users', ['name' => 'Test', 'email' => 'not-an-email'])
           ->assertSessionHasErrors(['email']);
   }
   ```

3. **Test uniqueness constraints**

   ```php
   public function test_store_email_must_be_unique(): void
   {
       User::factory()->create(['email' => 'taken@test.com']);
       
       $this->actingAs(User::factory()->create())
           ->post('/users', [
               'name' => 'Test',
               'email' => 'taken@test.com',
           ])
           ->assertSessionHasErrors(['email']);
   }
   ```

4. **Test the successful creation**

   ```php
   public function test_store_creates_user_and_redirects(): void
   {
       $this->actingAs(User::factory()->create())
           ->post('/users', [
               'name' => 'John Doe',
               'email' => 'john@test.com',
           ])
           ->assertRedirect('/users');
   
       $this->assertDatabaseHas('users', [
           'name' => 'John Doe',
           'email' => 'john@test.com',
       ]);
   }
   ```

5. **Test the response for API endpoints**

   ```php
   public function test_store_returns_created_json(): void
   {
       $this->actingAs(User::factory()->create())
           ->postJson('/api/users', [
               'name' => 'John',
               'email' => 'john@test.com',
           ])
           ->assertCreated()
           ->assertJsonStructure(['data' => ['id', 'name', 'email']]);
   }
   ```

6. **Verify a helper test is complete**

   Run `phpunit --filter {ControllerName}::test_store` to run all store tests.

## Validation Checklist

- [ ] Guest access test verifies redirect to login (or 401)
- [ ] Validation error test exists for every rule that can fail
- [ ] Uniqueness constraint is tested if applicable
- [ ] Successful creation test verifies the redirect/status code
- [ ] Successful creation test verifies the record exists in the database (web) or response structure (API)
- [ ] No business logic assertions exist in the store tests
- [ ] `actingAs()` is used for authenticated tests

## Common Failures

- **Missing authorization test**: Only testing the happy path. Prevention: always add a guest test even for non-sensitive resources.
- **Missing edge-case validation tests**: Testing only required fields but not format rules (email, min, max, unique). Prevention: write a test for every distinct rule.
- **Business logic in store test**: Asserting tax calculations, service calls, or complex results. Prevention: limit assertions to HTTP behavior + database existence.
- **Flaky tests from database state**: Not using `RefreshDatabase` or `DatabaseTransactions`. Prevention: always apply one of these traits.

## Decision Points

- **`$this->post()` vs. `$this->postJson()`**: Use `post()` for form submissions (web routes). Use `postJson()` for API routes.
- **`assertSessionHasErrors()` vs. `assertJsonValidationErrors()`**: Use `assertSessionHasErrors()` for web routes with form validation. Use `assertJsonValidationErrors()` for API routes.
- **`assertCreated()` vs. `assertStatus(201)`**: `assertCreated()` is more readable and equivalent to `assertStatus(201)`.

## Performance Considerations

- One store action typically requires 5-10 test methods (authorization + validation rules + success).
- Use `DatabaseTransactions` for faster execution if schema is stable.
- Group store tests together in the test class for logical organization.

## Security Considerations

- Testing guest access prevents unauthenticated resource creation.
- Testing validation prevents invalid data injection.
- Testing authorization (via `authorize()` in FormRequest) prevents unauthorized creation.

## Related Rules

- `05-rules.md` Rule: "Test Validation Errors for Every Store and Update Action"
- `05-rules.md` Rule: "Test Three Authorization Scenarios Per Protected Action"
- `05-rules.md` Rule: "Test One Behavior Per Test Method"
- `05-rules.md` Rule: "Use actingAs() for Authenticated Routes"

## Related Skills

- "Write Feature Tests for Controller Actions" — broader workflow covering all actions
- "Create a Resource Controller for CRUD Operations" — the action being tested

## Success Criteria

- Guest is redirected to login (or receives 401) when accessing the store endpoint
- Every validation rule rejects invalid input with the correct error
- Valid input creates the resource and redirects (web) or returns 201 with JSON (API)
- The created record exists in the database
- All store tests pass without mocking
