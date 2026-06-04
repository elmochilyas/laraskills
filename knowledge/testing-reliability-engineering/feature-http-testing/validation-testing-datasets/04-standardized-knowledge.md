# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Validation Testing with Datasets |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | Form Request basics, HTTP test helpers, Pest datasets |
| Related KUs | Authentication testing, JSON API testing, Error handling testing, Custom rule development |
| Source | domain-analysis.md K019 |

# Overview

Validation testing verifies that form requests and controller validation rules correctly accept valid data and reject invalid data with appropriate error messages. Pest datasets enable compact, data-driven validation tests where each row tests a specific input combination. Comprehensive validation tests are the highest-ROI testing activity for web applications — most security vulnerabilities and business logic bugs originate from missing or incorrect validation. Dataset-driven validation tests provide high coverage density with minimal code.

# Core Concepts

- **Form Request testing**: Test form requests directly with `$this->assertValidationPasses()` and `$this->assertValidationFails()`.
- **Controller validation testing**: Send HTTP requests with invalid data and assert `assertSessionHasErrors()` (Blade) or `assertJsonValidationErrors()` (JSON API).
- **Pest datasets**: `->with([['valid_email', true], ['invalid', false]])` iterates over test cases.
- **Boundary testing**: Test edge cases: empty strings, max length, special characters, SQL injection, unicode.
- **Rules testing**: Unit-test custom `ValidationRule` objects with `$rule->validate('attribute', $value, $fail)`.

# When To Use

- For every Form Request in the application
- For every custom validation rule
- For every field validation boundary (max length, format, required, unique)
- When testing security-relevant input (XSS, SQL injection, file upload)
- When testing validation error messages and localization

# When NOT To Use

- For testing business logic beyond validation (extract to separate unit tests)
- For testing authorization (use separate authentication/authorization tests)
- When datasets would obscure the test intent (use descriptive case names)
- For exhaustive value testing (test boundaries, not every value)

# Best Practices (WHY)

- **Test every boundary, not every value**: For a max-length rule, test with N-1, N, and N+1 characters. Don't test every value from 1 to 255. Boundary testing provides maximum coverage per test case.
- **Test valid, missing, and invalid for every field**: Each field should have at least three scenarios: valid data passes, missing data fails, and invalid format fails. Missing field tests catch the most common validation gap.
- **Use dataset functions for reusable test cases**: Extract common datasets (validEmails(), invalidEmails()) to functions. Share across Form Request and controller tests. Centralized datasets are easier to maintain.
- **Test Form Requests in isolation for speed**: Direct Form Request tests validate rule logic in <5ms. Use HTTP tests only for integration validation (CSRF, middleware, error display).
- **Don't hardcode error message text**: Assert error structure (field has error) rather than exact message text. Copy changes and locale differences break text-based assertions.

# Architecture Guidelines

- **Form Request test vs HTTP test**: Test Form Requests directly for rule correctness. Test via HTTP for end-to-end validation integration.
- **Dataset function vs inline arrays**: Extract datasets to functions for reuse across tests. Inline for one-off cases.
- **Boundary value selection**: Test exactly at the boundary, one below, one above.
- **Valid data factory**: Create a helper `validData()` returning a valid payload. Tests override specific fields for invalid scenarios.

# Performance Considerations

- Form Request tests: <5ms per test (instantiate request, run validate).
- HTTP validation tests: ~30-50ms per test (full request pipeline).
- Rule unit tests: <1ms per scenario. Use for all custom rules.
- Dataset explosion: Combining multiple dataset dimensions can generate thousands of tests. Use targeted combinations.

# Security Considerations

- Validation IS the primary security boundary against injection attacks.
- Test that SQL injection, XSS, and command injection payloads are rejected.
- Test that file upload validation rejects malicious files.
- Test that mass assignment protection works through Form Requests.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Only testing valid data | Happy-path validation only | Missing/invalid data may pass through, causing errors | For every field, test: valid, missing, and one invalid format |
| Testing validation via controller only | Rely on HTTP tests for all coverage | Slower tests; validation logic embedded in HTTP tests | Test Form Requests in isolation for speed; HTTP for integration |
| Hardcoding error message text | assertSee('The email field is required.') | Copy changes break tests; locale changes break | Assert error structure rather than exact text |
| Testing all possible invalid values | Trying to test every permutation | Large test suites with diminishing returns | Test boundaries, one representative invalid per format, and security inputs |
| Not testing Form Request authorization | Only testing validation rules | Forgot that authorize() may return wrong value | Test authorize() separately with different user roles |

# Anti-Patterns

- **Validation as an afterthought**: Writing validation tests after implementation or not at all. Instead, write validation tests first (they define the API contract).
- **Exhaustive value testing**: Testing every invalid value instead of boundaries. Instead, test one representative value per rule type plus boundaries.
- **Testing validation through browser**: Using Dusk/Playwright for validation testing instead of HTTP tests. Instead, use fast HTTP tests for validation and reserve E2E for critical flows.
- **Ignoring Form Request authorization**: Testing validation rules but not the `authorize()` method. Instead, test both validation and authorization for each Form Request.

# Examples

```php
// Dataset-driven validation test
test('email field validation', function ($value, $shouldPass) {
    $response = $this->postJson('/api/users, ['email' => $value]);

    if ($shouldPass) {
        $response->assertJsonMissingValidationErrors('email');
    } else {
        $response->assertJsonValidationErrors('email');
    }
})->with([
    'valid email' => ['user@example.com', true],
    'missing email' => ['', false],
    'invalid format' => ['not-an-email', false],
    'too long' => [str_repeat('a', 244) . '@test.com', false], // >255 total
]);

// Form Request isolation test
public function test_store_user_request_validates_required_fields()
{
    $request = new StoreUserRequest();
    $request->setUserResolver(fn () => User::factory()->admin()->create());

    // Must fail without required fields
    $this->assertValidationFails($request, []);
}

// Custom rule unit test
public function test_uppercase_rule()
{
    $rule = new UppercaseRule();
    $failed = false;

    $rule->validate('name', 'john', function ($message) use (&$failed) {
        $failed = true;
    });

    $this->assertTrue($failed);

    $failed = false;
    $rule->validate('name', 'JOHN', function ($message) use (&$failed) {
        $failed = true;
    });

    $this->assertFalse($failed);
}
```

# Related Topics

- **Prerequisites**: Form Request basics, HTTP test helpers, Pest datasets
- **Related**: Authentication testing, JSON API testing, Error handling testing, Custom rule development
- **Advanced**: Dataset factory patterns, Custom validation rule unit testing, Multilingual validation testing

# AI Agent Notes

- Validation testing is the highest-ROI testing activity. Start by identifying all Form Requests in the project (typically in `app/Http/Requests/`). Each Form Request should have a corresponding test file.
- Use Pest datasets with descriptive names. The test output will show the case name on failure, making it easy to identify which scenario failed.
- For security-relevant fields (email, password, file upload), always include XSS and injection test cases in the dataset.

# Verification

- [ ] Every Form Request has a corresponding validation test file
- [ ] Every custom validation rule has a unit test
- [ ] Each field is tested with valid, missing, and invalid scenarios
- [ ] Validation boundaries are tested (not every value)
- [ ] Form Requests are tested in isolation (fast) and via HTTP (integration)
- [ ] Error message structure is asserted (not exact text)
- [ ] Security-relevant inputs (XSS, SQL injection) are tested
- [ ] Form Request authorize() method is tested separately
