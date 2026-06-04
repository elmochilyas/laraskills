# Anti-Patterns — Form Request Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Input Validation Architecture |
| Knowledge Unit | Form Request Testing |
| Difficulty | Intermediate |
| Category | Testing Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Testing All Rules Only via HTTP | High | High | Code review: validation tests only use HTTP test methods |
| No Negative Testing | Critical | High | Code review: only passing cases tested |
| Testing Error Message Text Exactly | Medium | Medium | Code review: assertions on exact error message strings |
| Skipping Authorization Tests | High | High | Code review: no tests for `authorize()` method |
| One Test Per FormRequest | Medium | Medium | Code review: single test covering all rules superficially |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Testing Only With Default Data | No edge cases, boundary values, or malformed input | Validation may fail for unexpected but valid inputs |
| No Shared Validation Assertion Helpers | Each test class reinvents assertion logic | Inconsistent testing; boilerplate duplication |
| Not Testing validationData Override | Input scope restriction not verified | Route parameters may leak into validated data |

---

## Anti-Pattern Details

### AP-FRT-01: Testing All Rules Only via HTTP

**Description**: Every validation scenario is tested by making full HTTP requests to the endpoint — setting up middleware, authentication, route binding, and database state for every test case. A FormRequest with 10 fields × 3 edge cases each = 30 full HTTP tests. The test suite becomes slow (minutes instead of seconds), so developers skip edge cases and test only the happy path.

**Root Cause**: Only knowing HTTP testing. The developer uses `postJson()`, `putJson()` for every validation test without realizing they can test rules directly with `Validator::make()`.

**Impact**:
- Validation test suite runs in minutes instead of seconds
- Developers skip edge cases because tests are too slow
- CI pipeline latency for validation-only changes
- Tests are fragile: route changes, auth changes, and middleware changes break validation tests

**Detection**:
- Code review: validation test class only uses HTTP methods like `postJson()`, `actingAs()`, etc.
- Test review: no calls to `Validator::make()` in validation tests
- Slow CI: validation tests dominate test suite runtime

**Solution**:
- Use `Validator::make()` for fast, focused unit tests of rules
- Reserve HTTP tests for integration scenarios (authorization, error shape)
- Follow the 80/20 rule: 80% unit (Validator::make), 20% HTTP

**Example**:
```php
// BEFORE: All HTTP tests
public function test_title_is_required(): void
{
    $response = $this->actingAs($user)->postJson('/api/v1/posts', ['body' => 'test']);
    $response->assertStatus(422);
    $response->assertJsonValidationErrorFor('title');
}

public function test_title_max_length(): void
{
    $response = $this->actingAs($user)->postJson('/api/v1/posts', [
        'title' => str_repeat('a', 256), 'body' => 'test',
    ]);
    $response->assertStatus(422);
}

// AFTER: Unit tests with Validator::make
public function test_title_is_required(): void
{
    $this->assertValidationFails(
        ['body' => 'test'],
        (new StorePostRequest())->rules(),
        'title'
    );
}

public function test_title_max_length(): void
{
    $this->assertValidationFails(
        ['title' => str_repeat('a', 256), 'body' => 'test'],
        (new StorePostRequest())->rules(),
        'title'
    );
}
```

---

### AP-FRT-02: No Negative Testing

**Description**: Validation test classes only test that valid data passes validation — never that invalid data fails. The test suite has 100% coverage on happy-path validation but zero coverage on rejection scenarios. Invalid data may pass validation silently until a production bug reveals the gap.

**Root Cause**: Optimism bias. The developer writes tests to confirm their code works and doesn't consider failure modes.

**Impact**:
- Validation rules may not actually reject invalid data
- A typo in a rule (e.g., `'reuqired'` instead of `'required'`) silently allows invalid data
- Business logic corrupts from unvalidated input
- False confidence: green test suite with broken validation

**Detection**:
- Code review: validation test class only has `assertValidationPasses` calls
- Code review: no test data with missing fields, wrong types, or boundary values
- Test review: test method names only describe success scenarios (`test_valid_data_passes`)

**Solution**:
- Test every rule on both sides: pass and fail
- Use parameterized tests for exhaustive edge case coverage
- Create a `ValidatesFormRequest` trait with both `assertValidationPasses` and `assertValidationFails`

**Example**:
```php
// BEFORE: Only positive tests
public function test_valid_data_passes(): void
{
    $this->assertValidationPasses($this->validData, (new StorePostRequest())->rules());
}
// ❌ no test for missing title, empty title, too-long title, invalid status, etc.

// AFTER: Both pass and fail
/** @testWith ["title", ""] */
/** @testWith ["title", null] */
/** @testWith ["title", str_repeat("a", 256)] */
/** @testWith ["status", "invalid_status"] */
public function test_title_validation_fails(string $field, mixed $value): void
{
    $this->assertValidationFails(
        array_merge($this->validData, [$field => $value]),
        (new StorePostRequest())->rules(),
    );
}

public function test_valid_data_passes(): void
{
    $this->assertValidationPasses($this->validData, (new StorePostRequest())->rules());
}
```

---

### AP-FRT-03: Testing Error Message Text Exactly

**Description**: Assertions check the exact text of validation error messages: `$response->assertSee('The title field is required.')`. Error messages are subject to localization, framework version changes, and custom message overrides. Exact message assertions break when the locale changes or when the team customizes message files.

**Root Cause**: Over-specificity. The developer asserts on the human-readable message rather than the error code, field name, or HTTP status.

**Impact**:
- Tests break when messages are translated or customized
- Localization changes require updating every validation test
- False negatives: test fails even though validation logic is correct
- Brittle tests discourage message improvements

**Detection**:
- Code review: `assertSee()`, `assertSeeText()`, or `assertJsonFragment()` on error message strings
- Code review: assertions that contain exact English-language error text
- CI failures: tests break after running `php artisan lang:publish`

**Solution**:
- Assert on error codes, field names, and HTTP status codes instead of message text
- Use `assertJsonValidationErrorFor()` for field-level assertions
- If testing messages, use custom error codes rather than human-readable text

**Example**:
```php
// BEFORE: Testing exact message text
$response->assertJsonFragment(['message' => 'The title field is required.']); // ❌ brittle

// AFTER: Testing structure and codes
$response->assertStatus(422);
$response->assertJsonValidationErrorFor('title');
$response->assertJsonFragment(['code' => 'VALIDATION_ERROR']); // ✅ code, not message
```

---

### AP-FRT-04: Skipping Authorization Tests

**Description**: The `authorize()` method in the FormRequest has no dedicated test coverage. The test suite validates that data rules work correctly but never verifies that unauthorized users receive 403, that authorized users pass, or that edge cases (null user, missing resource) are handled. The security boundary of the endpoint is untested.

**Root Cause**: Authorization tested at the controller or route level via middleware, so developers assume FormRequest-level authorization testing is redundant.

**Impact**:
- Authorization regressions go undetected
- Accidental `return true` removal from `authorize()` silently locks all users out
- Edge cases (null user, resource not found) may produce 500 instead of 403
- Policy changes are not validated against FormRequest contracts

**Detection**:
- Code review: no test class for `authorize()` logic
- Code review: test class only imports and tests `rules()`, never `authorize()`
- Bug reports: users getting 403 when they should have access, or vice versa

**Solution**:
- Write dedicated authorization tests for each FormRequest's `authorize()` method
- Test both authorized and unauthorized scenarios
- Test edge cases: unauthenticated, wrong resource owner, admin bypass

**Example**:
```php
// BEFORE: No authorization tests
// (empty test class or only tests rules())

// AFTER: Dedicated authorization tests
class StorePostRequestAuthorizationTest extends TestCase
{
    public function test_authenticated_user_can_create_post(): void
    {
        $user = User::factory()->create();
        $request = StorePostRequest::create('/api/v1/posts', 'POST');
        $request->setUserResolver(fn() => $user);

        $this->assertTrue($request->authorize());
    }

    public function test_guest_cannot_create_post(): void
    {
        $this->expectException(AuthenticationException::class);
        $request = StorePostRequest::create('/api/v1/posts', 'POST');
        // ❌ no user set — user() returns null
        $request->authorize(); // should return false or throw
    }

    public function test_authorize_returns_false_for_unauthorized(): void
    {
        $user = User::factory()->create();
        $anotherUser = User::factory()->create();
        $post = Post::factory()->create(['user_id' => $anotherUser->id]);

        $request = UpdatePostRequest::create("/api/v1/posts/{$post->id}", 'PUT');
        $request->setUserResolver(fn() => $user);
        $request->setRouteResolver(fn() => (object) ['parameters' => ['post' => $post]]);

        $this->assertFalse($request->authorize());
    }
}
```

---

### AP-FRT-05: One Test Per FormRequest

**Description**: A single test method exercises the entire FormRequest — sending valid data, asserting a 200 response, and concluding that validation works. No individual rules are tested in isolation. This test passes even if half the validation rules are silently failing (typos, wrong rule names) because the valid test data happens to match the rules.

**Root Cause**: Minimal testing approach. The developer adds one "smoke test" per endpoint to confirm the basic flow works.

**Impact**:
- Silent rule failures: a rule with a typo (`max:2555` instead of `max:255`) never catches edge cases
- No regression detection: adding a new rule without testing it
- False confidence: 100% endpoint coverage but 10% rule coverage
- Cannot identify which specific rule fails when a bug occurs

**Detection**:
- Code review: one test method per FormRequest
- Code review: test method sends one payload and only checks the HTTP status
- Test review: test class has fewer test methods than the request has fields

**Solution**:
- Write one test method per field or per constraint
- Use parameterized tests for edge case coverage
- Map every rule to at least one failing and one passing test case

**Example**:
```php
// BEFORE: One test for everything
public function test_store_post_request(): void
{
    $response = $this->actingAs($user)->postJson('/api/v1/posts', [
        'title' => 'Valid Title',
        'body' => 'Valid body content',
        'status' => 'draft',
    ]);
    $response->assertStatus(201);
}
// ❌ doesn't test any failure cases

// AFTER: Per-field tests
public function test_title_is_required(): void { /* ... */ }
public function test_title_max_length(): void { /* ... */ }
public function test_body_is_required(): void { /* ... */ }
public function test_status_must_be_valid(): void { /* ... */ }
public function test_tags_are_optional(): void { /* ... */ }
public function test_tags_max_count(): void { /* ... */ }
```
