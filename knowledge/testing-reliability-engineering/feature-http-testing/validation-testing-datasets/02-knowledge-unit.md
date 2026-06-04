# Metadata
Domain: Testing & Reliability Engineering
Subdomain: Feature & HTTP Testing
Knowledge Unit: Validation Testing with Datasets
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary
Validation testing verifies that form requests and controller validation rules correctly accept valid data and reject invalid data with appropriate error messages. Pest datasets enable compact, data-driven validation tests where each row tests a specific input combination. Comprehensive validation tests are the highest-ROI testing activity for web applications—most security vulnerabilities and business logic bugs originate from missing or incorrect validation. Dataset-driven validation tests provide high coverage density with minimal code.

# Core Concepts
- **Form Request testing**: Test custom form request classes directly with `$this->assertValidationPasses()` and `$this->assertValidationFails()` (requires `\Tests\TestCase` or `ValidatesRequests` trait).
- **Controller validation testing**: Send HTTP requests with invalid data and assert `assertSessionHasErrors()` (Blade) or `assertJsonValidationErrors()` (JSON API).
- **Pest datasets**: `->with([['valid_email', true], ['invalid', false]])` iterates over test cases. Each dataset row becomes a separate test.
- **Boundary testing**: Test edge cases: empty strings, max length, special characters, SQL injection attempts, unicode, very large payloads.
- **Error message assertions**: `assertSee('The email field is required.')` (Blade) or `assertJsonValidationErrorFor('email')` (API).
- **Rules testing**: Unit-test custom `ValidationRule` objects with `$rule->validate('attribute', $value, $fail)`.

# Mental Models
- **Dataset as validation matrix**: Each dataset row = one validation scenario. The matrix covers: valid data, missing fields, invalid formats, boundary values, and special cases.
- **Validation = security boundary**: Every form field is an attack vector. Validation tests document the accepted format for each field and verify injection/overflow protection.
- **Test once per rule boundary, not per value**: Test the boundary between valid and invalid, not every possible value. One "max length minus 1" and one "max length" test cover the boundary.
- **Form Request as self-contained testable unit**: A Form Request encapsulates validation rules, authorization logic, and sometimes after-validation hooks. Test it independently.

# Internal Mechanics
- **`assertValidationFails()`**: Calls the Form Request's `validator()` method. If validation fails, the assertion passes. If it passes, the assertion fails. The Form Request is instantiated and its rules/messages methods are invoked.
- **`assertSessionHasErrors()`**: After a POST request, checks the session store for error messages keyed by field name. Works with Blade validation display (`@error` directives).
- **`assertJsonValidationErrors()`**: Parses the JSON response body for `errors` key (Laravel's default validation error format for API requests). Asserts the field has validation errors.
- **Pest dataset expansion**: Each dataset row creates an independent test case. `with(['case name' => [$input, $expected]])` names the case for clearer failure output.
- **Rule `validate()` method**: Custom rules receive `$attribute`, `$value`, and `$fail` closure. The closure is called if validation fails. Testing involves calling `validate()` and asserting `$fail` was/wasn't called.

# Patterns
- **Pattern: Dataset-driven field validation**
  - Purpose: Test a single field against multiple validation scenarios
  - Benefits: Compact, exhaustive, easy to extend
  - Tradeoffs: One test file per field group can be many files
  - Implementation: `test('email validation', function ($value, $shouldPass) { ... })->with(validAndInvalidEmails())`

- **Pattern: Form Request authorization boundary testing**
  - Purpose: Test that authorize() method returns correct boolean for different user roles
  - Benefits: Auth logic isolated from controller tests
  - Tradeoffs: Form Request auth often duplicates policy tests
  - Implementation: `$request->setUserResolver(fn () => $user); $this->assertTrue($request->authorize())`

- **Pattern: Error message format assertion**
  - Purpose: Verify validation error messages are user-friendly and consistent
  - Benefits: Error quality standard across the application
  - Tradeoffs: Message text assertions are brittle (text changes break tests)
  - Implementation: `assertSee('The :attribute field is required.')` or `assertJsonValidationErrorFor('email')->assertJsonFragment(['email' => ['required']])`

- **Pattern: Nested/array validation testing**
  - Purpose: Test validation of nested array fields (`items.*.quantity`)
  - Benefits: Complex form structures validated correctly
  - Tradeoffs: Array validation assertions are verbose
  - Implementation: `post('/orders', ['items' => [['quantity' => -1]]])` → `assertSessionHasErrors(['items.0.quantity'])`

# Architectural Decisions
- **Form Request test vs HTTP test for validation**: Test Form Requests directly for rule correctness. Test via HTTP for end-to-end validation integration (CSRF, middleware, error display).
- **Dataset function vs inline arrays**: Extract datasets to functions for reuse across tests. Inline for one-off test cases.
- **Boundary value selection**: Test exactly at the boundary, one below, one above. Example: string max 255, test with 254, 255, and 256 characters.
- **Valid data factory**: Create a helper function `validOrderData()` that returns a valid payload. Tests override specific fields to make invalid data. Reduces test duplication.

# Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Datasets make validation tests compact | Debugging dataset failures is harder | Use named datasets for clear failure output |
| Exhaustive boundary testing catches edge cases | Many test cases = slower execution | Acceptable; validation tests are fast (no DB usually) |
| Form Request isolation tests are fast | May miss middleware/HTTP integration issues | Layer HTTP tests for critical validation paths |
| Error message assertions ensure quality | Brittle if copy changes | Use semantic assertions where possible |

# Performance Considerations
- **Form Request tests**: Instantiate a Form Request class and run `validate()`. No HTTP overhead. <5ms per test.
- **HTTP validation tests**: Full request pipeline. ~30-50ms per test. Dataset with 30 rows = ~1-1.5 seconds.
- **Rule unit tests**: Fastest option (<1ms per rule scenario). Use for all custom rules.
- **Dataset explosion**: Combining multiple dataset dimensions (field × value × user_role) can generate thousands of tests. Use targeted combinations instead of full cartesian product.

# Production Considerations
- **Validation coverage target**: Every custom Form Request should have a test file. Every custom rule should have a unit test. Every `required` field should have a missing-field test.
- **Input sanitization vs rejection**: Decide whether invalid input should be sanitized (trimmed, stripped) or rejected with an error. Test accordingly.
- **Error message internationalization**: If using `__()` for messages, test that messages render in each supported locale.
- **API vs web error format**: API endpoints should return `assertJsonValidationErrors()`. Web endpoints should return `assertSessionHasErrors()`. Test both formats where routes serve both.

# Common Mistakes
- **Mistake: Only testing valid data**
  - Why: Happy-path validation only
  - Why harmful: Missing/invalid data may pass through, causing application errors
  - Better: For every field, test at least: valid, missing, and one invalid format

- **Mistake: Testing validation via controller only (no Form Request tests)**
  - Why: Rely on HTTP tests for all validation coverage
  - Why harmful: Controller tests are slower; validation logic is embedded in HTTP tests
  - Better: Test Form Requests in isolation for speed; use HTTP tests for integration

- **Mistake: Hardcoding error message text**
  - Why: `assertSee('The email field is required.')`
  - Why harmful: Copy changes break tests; locale changes break tests
  - Better: Assert error message structure rather than exact text, or use `assertValidationFails()`

- **Mistake: Testing all possible invalid values**
  - Why: TDD fatigue; trying to test every permutation
  - Why harmful: Huge test suites with diminishing returns
  - Better: Test boundary values, one representative invalid value per format rule, and security-relevant inputs (SQL injection, XSS)

# Failure Modes
- **Missing validation test for new fields**: A Form Request adds a new `required` field but no test verifies the behavior. Unknown until production. Add test for each new validation field.
- **Validation rule dependency on external state**: A rule checks database existence or API response. Test with faked/stubbed external state.
- **Form Request authorization bypass**: A Form Request's `authorize()` returns `true` for unauthorized users. Test authorization separately from validation.
- **Dataset false negatives**: A dataset entry designed to be invalid passes validation because the rule wasn't applied to that field. Cross-check field names in Form Request vs dataset.

# Ecosystem Usage
- **Laravel Form Requests**: All Laravel projects with form requests should have dedicated validation tests. Laravel docs demonstrate Form Request testing.
- **Pest datasets**: Pest's dataset feature is the standard approach for validation testing in the Pest ecosystem.
- **Laravel Nova**: Custom Nova validation rules are tested using the same pattern.
- **Spatie Laravel Validation**: The `spatie/laravel-validation-rules` package provides pre-built rules that should be integration-tested.

# Related Knowledge Units
- **Prerequisites**: Form Request basics, HTTP test helpers, Pest datasets
- **Related Topics**: Authentication testing, JSON API testing, Error handling testing, Custom rule development
- **Advanced Follow-up**: Dataset factory patterns, Custom validation rule unit testing, Multilingual validation testing

# Research Notes
- Laravel's HTTP test helpers (get(), post(), put(), delete()) provide a full-stack testing experience without starting a web server � requests flow through the kernel internally
- Response assertions (ssertStatus(), ssertJson(), ssertSee()) are chainable and provide clear failure messages for debugging test failures
- Pest's higher-order expectations (expect()->toBeOk()) provide a more expressive syntax than PHPUnit's $response->assertOk()
- Test datasets (#[DataProvider]) reduce boilerplate when testing multiple input variations for validation and API endpoint testing
- Exception handling testing requires intercepting Laravel's exception handler to assert specific exceptions are thrown with expected messages
