# Anti-Patterns — Error Response Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Error Response Testing |
| Difficulty | Intermediate |
| Category | Testing Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Only Testing Happy Path | Critical | High | Code review: no error response tests |
| Asserting Status Only, Not Shape | Medium | High | Code review: `assertStatus(422)` without structure assertion |
| Tests Pass with APP_DEBUG=true, Fail in Production | High | Medium | Code review: no production-mode test suite |
| Snapshot Testing Dynamic Values | Medium | Low | Code review: trace_id, timestamp in snapshot files |
| Flaky Tests Due to Rate Limiting | Medium | Low | Bug reports: intermittent test failures from rate limit |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Testing Only Generic Error Shape | Not testing specific error codes per endpoint | Code changes but tests still pass |
| No Negative Testing | Only asserting error IS returned, not what it CONTAINS | Shape changes undetected |
| One Test for All Error Types | Single test that doesn't distinguish between scenarios | Missing coverage for specific error modes |

---

## Anti-Pattern Details

### AP-ERT-01: Only Testing Happy Path

**Description**: Every endpoint has tests for the success case (201 Created, 200 OK), but no tests for any error scenario. Authentication failures, validation errors, not-found scenarios, and server errors are never tested. When the error handling code changes, no test fails — errors silently change shape or disappear.

**Root Cause**: The developer assumes errors "just work" because the framework handles them. Error responses are treated as unimportant implementation details rather than API contract elements.

**Impact**:
- Error responses change silently without detection
- A refactoring that moves error codes breaks clients with no test signal
- Authentication changes that affect 401 shape are not caught
- Production error monitoring is the only "test" for error responses

**Detection**:
- Metrics: test files for endpoints test 100% success, 0% error
- Code review: test class has `test_user_can_register()` but no `test_registration_fails_with_invalid_data()`
- Bug reports: "the error shape changed after the last deploy and our client broke"

**Solution**:
- Test every documented error mode for each endpoint
- Use a data provider that iterates all error scenarios
- Include error test coverage as a CI gate requirement
- Error tests should assert: status code, error code, envelope shape, and (for 422) field-level errors

**Example**:
```php
// BEFORE: Only happy path tested
class RegisterTest extends TestCase
{
    public function test_user_can_register(): void { /* ... */ }
    // No test for validation errors, auth errors, duplicate email, etc.
}

// AFTER: Error modes tested
class RegisterTest extends TestCase
{
    public function test_user_can_register(): void { /* ... */ }
    
    public function test_validation_errors_return_422(): void
    {
        $response = $this->postJson('/api/register', []);
        $response->assertStatus(422)
            ->assertJsonStructure(['error' => ['code', 'message', 'status', 'detail' => ['fields']]])
            ->assertJson(['error' => ['code' => 'VALIDATION_ERROR', 'status' => 422]]);
    }
    
    public function test_duplicate_email_returns_409(): void
    {
        User::factory()->create(['email' => 'test@test.com']);
        $response = $this->postJson('/api/register', ['email' => 'test@test.com', /* ... */]);
        $response->assertStatus(409)
            ->assertJson(['error' => ['code' => 'USER.EMAIL_DUPLICATE']]);
    }
}
```

---

### AP-ERT-02: Asserting Status Only, Not Shape

**Description**: Error tests only check the HTTP status code, never the response body structure. `assertStatus(422)` passes, but the response body may be an HTML error page, a Laravel default validation error array, or an entirely different JSON structure than expected.

**Root Cause**: Minimal testing. The developer focuses on verifying the error happens, not what the error response looks like.

**Impact**:
- Error shape changes silently: status code is correct but body structure is wrong
- HTML error pages for API endpoints are not caught by tests
- Envelope field additions/removals go undetected
- Headers (WWW-Authenticate, Retry-After) are never verified

**Detection**:
- Code review: error tests use `assertStatus()` but not `assertJson()` or `assertJsonStructure()`
- Code review: no assertion of error codes in test
- Code review: no header assertions for error responses

**Solution**:
- Assert the full envelope structure with `assertJsonStructure()`
- Assert the specific error code with `assertJson()`
- Assert relevant headers: `assertHeader('WWW-Authenticate')`, `assertHeader('Retry-After')`
- Use a shared assertion trait for common error response checks

**Example**:
```php
// BEFORE: Status only
public function test_unauthenticated(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertStatus(401); // ❌ could be any 401 body
}

// AFTER: Full shape assertion
public function test_unauthenticated(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertStatus(401)
        ->assertJsonStructure([
            'error' => ['code', 'message', 'status'],
        ])
        ->assertJson([
            'error' => [
                'code' => 'USER.AUTH_UNAUTHENTICATED',
                'status' => 401,
            ],
        ])
        ->assertHeader('WWW-Authenticate', 'Bearer realm="api"');
}
```

---

### AP-ERT-03: No Production-Mode Testing

**Description**: All error response tests run with `APP_DEBUG=true` (the default test environment). Stack traces and file paths appear in error responses during tests, so tests pass. But in production (`APP_DEBUG=false`), the error shape is entirely different — no stack traces, no file paths, no exception class names. The tests don't validate the actual production error contract.

**Root Cause**: The developer never runs tests with `APP_DEBUG=false`. They assume the test environment error shape matches production.

**Impact**:
- A production error response may be missing fields that tests assert
- Sensitive data (file paths, SQL) could leak in production without any test catching it
- Envelope changes that only appear in production mode are undetected
- Clients that parse production errors may fail while all tests pass

**Detection**:
- Code review: no test suite runs with `APP_DEBUG=false`
- Code review: no assertions that stack traces are absent
- Incident analysis: production error shape differs from tested shape

**Solution**:
- Run a dedicated test suite with `APP_DEBUG=false`
- Assert no sensitive data (stack traces, file paths) appears in production-mode tests
- Test both dev mode and production mode error responses
- Use environment-specific test configurations

**Example**:
```php
// BEFORE: Only tested with debug=true
class ErrorResponseTest extends TestCase
{
    // All tests run with default APP_DEBUG=true
    public function test_server_error(): void
    {
        // This test sees stack traces — passes
        // Production clients see no stack traces — untested
    }
}

// AFTER: Production-mode test suite
class ProductionErrorResponseTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        app()->detectEnvironment(fn() => 'production');
        config(['app.debug' => false]);
    }

    public function test_no_stack_trace_in_production(): void
    {
        $response = $this->getJson('/api/non-existent-route');
        $response->assertJsonMissingPath('error.trace');
        $response->assertJsonMissingPath('debug');
    }
}
```
