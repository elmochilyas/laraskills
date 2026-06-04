# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: Validation Testing with Datasets

---

### Rule 1: Test every boundary, not every value

| Field | Value |
|-------|-------|
| **Name** | Use boundary testing for validation |
| **Category** | Validation Coverage |
| **Rule** | For each validation rule (max length, min value, file size), test exactly at the boundary (N), one below (N-1), and one above (N+1). Do not test every value in the valid range. |
| **Reason** | Boundary testing provides maximum coverage per test case. Most validation bugs occur at boundaries, not in the middle of valid ranges. Testing every value from 1-255 adds 253 redundant tests with zero additional coverage. |
| **Bad Example** | Testing `required|max:255` with lengths 1, 2, 3, ..., 255 — 255 test cases for one rule. |
| **Good Example** | Testing with length 254 (passes), 255 (passes), 256 (fails) — 3 test cases for the same coverage. |
| **Exceptions** | Enum/whitelist validation where each valid value must be explicitly allowed. |
| **Consequences Of Violation** | Test suite bloated with redundant test cases. CI runtime increases without coverage improvement. |

---

### Rule 2: For every field, test valid, missing, and one invalid format

| Field | Value |
|-------|-------|
| **Name** | Three scenarios per field |
| **Category** | Validation Coverage |
| **Rule** | For each field in a Form Request, test at minimum three scenarios: valid data passes, missing field fails, and one invalid format fails (wrong type, out of range, bad format). |
| **Reason** | Each scenario tests a different failure mode. Missing field tests are the most commonly omitted and catch the most validation gaps. Invalid format tests ensure rules are correctly applied. |
| **Bad Example** | Testing only with valid complete payload — no missing or invalid field scenarios. |
| **Good Example** | Dataset: `['valid email' => ['user@example.com', true]], ['missing email' => ['', false]], ['invalid format' => ['not-email', false]]`. |
| **Exceptions** | Fields that are optional and have no format validation (only need valid/missing tests). |
| **Consequences Of Violation** | Missing field validation not tested. Required fields may be accidentally marked as optional. |

---

### Rule 3: Test Form Requests in isolation for speed; test via HTTP for integration

| Field | Value |
|-------|-------|
| **Name** | Isolate Form Request tests for speed |
| **Category** | Test Strategy |
| **Rule** | Test Form Request validation rules directly (using `$this->assertValidationFails($request, $data)`) for fast rule verification. Supplement with HTTP integration tests for end-to-end validation (CSRF, middleware, error display). |
| **Reason** | Direct Form Request tests run in <5ms per scenario. HTTP tests run in ~30-50ms per scenario. For a Form Request with 20 rule combinations, isolated tests save 500ms-1s per endpoint. |
| **Bad Example** | Testing all 20 validation scenarios for a Form Request via HTTP POST — each test boots Laravel. |
| **Good Example** | 18 scenarios via direct Form Request tests (<5ms each), 2 scenarios via HTTP for integration coverage. |
| **Exceptions** | Validation that depends on the full HTTP context (uploaded files, request headers). |
| **Consequences Of Violation** | Test suite is significantly slower than necessary. Developers wait longer for validation test feedback. |

---

### Rule 4: Use named datasets for readable failure output

| Field | Value |
|-------|-------|
| **Name** | Name dataset cases semantically |
| **Category** | Test Readability |
| **Rule** | Use string keys for every dataset case: `->with(['valid email' => [$value, true], 'empty string' => [$value, false]])`. Never use unnamed arrays. |
| **Reason** | Named dataset keys appear in test failure output, immediately identifying which validation case failed. Numeric indices require manual mapping back to source data. |
| **Bad Example** | `->with([['user@example.com', true], ['', false]])` — failure shows `(#0)`. |
| **Good Example** | `->with(['valid email' => ['user@example.com', true], 'empty string' => ['', false]])` — failure shows `(empty string)`. |
| **Exceptions** | Programmatically generated datasets where keys provide no meaningful information. |
| **Consequences Of Violation** | Debugging validation test failures requires manually counting array indices to identify the failing case. |

---

### Rule 5: Assert error structure, not exact error message text

| Field | Value |
|-------|-------|
| **Name** | Assert error keys, not exact messages |
| **Category** | Error Assertions |
| **Rule** | Use `assertJsonValidationErrors(['email'])` or `assertSessionHasErrors(['email'])` to verify errors exist for specific fields. Do not assert exact error message strings like `assertSee('The email field is required.')`. |
| **Reason** | Error messages change between Laravel versions, with locale settings, and with copy updates. Field-level error structure is stable — exact message text is brittle. |
| **Bad Example** | `$response->assertSee('The email field is required.')` — breaks if message template changes or locale is not English. |
| **Good Example** | `$response->assertJsonValidationErrors(['email'])` — verifies email field has an error without matching the exact message. |
| **Exceptions** | Tests that specifically verify custom error message content or localization. |
| **Consequences Of Violation** | Tests break on Laravel upgrades, locale changes, or copy updates. Developers waste time fixing message text assertions. |

---

### Rule 6: Test Form Request `authorize()` method separately from validation rules

| Field | Value |
|-------|-------|
| **Name** | Test authorization separately from validation |
| **Category** | Form Request Testing |
| **Rule** | Test the `authorize()` method of Form Requests in separate tests with different user roles. Do not conflate authorization testing with validation rule testing. |
| **Reason** | The `authorize()` method and `rules()` method are independent. A Form Request may pass all validation but fail authorization, or pass authorization but fail validation. Testing them together makes it unclear which failed. |
| **Bad Example** | One test covering both validation and authorization — cannot distinguish which failed. |
| **Good Example** | Separate tests: `test_admin_can_store_user()` and `test_user_cannot_store_user()`. Separate validation tests: `test_store_user_validates_required_fields()`. |
| **Exceptions** | Form Requests where `authorize()` always returns `true`. |
| **Consequences Of Violation** | Authorization bugs in Form Requests go undetected. Users may access endpoints they should not. |
