# Anti-Patterns — Form Request Unit Testing

## Anti-Pattern 1: Feature-Test-Only Validation Coverage

**Category**: Testing methodology

**Description**: Testing validation rules exclusively through HTTP feature tests, never instantiating form requests directly to unit-test their methods.

**Warning Signs**:
- Complex form requests with conditional rules have no direct unit tests
- Every validation scenario requires a full HTTP request → controller → form request round trip
- Debugging a rule bug requires reading test output from a 422 response rather than a direct assertion

**Why It's Harmful**: Feature-test-only validation is slow (100-200ms per test vs <5ms for unit tests). Complex conditional rules with 10+ combinations require 10+ HTTP round trips for full coverage. The feedback loop discourages thorough edge-case testing.

**Real-World Consequence**: A form request has 8 conditional rule paths based on `status`, `role`, and `is_featured`. The team writes only 3 feature tests (happy path, missing title, missing body). Five conditional paths are untested. A `required_if` for `published_at` when `status=published` is missing in production.

**Preferred Alternative**: Unit-test conditional rules with datasets for fast, exhaustive coverage. Keep one feature test per form request for routing verification.

**Refactoring Strategy**:
1. Identify all form requests with conditional rules
2. Write unit tests for `rules()` return value using datasets to cover each condition
3. Write unit tests for `authorize()` with different user states
4. Keep one feature-level validation test per form request for route wiring

**Detection Checklist**:
- [ ] Complex form requests have unit tests, not just feature tests
- [ ] Conditional rules are tested via datasets
- [ ] `authorize()` is tested with different user states

**Related Rules**: Test Rules Return Value, Test Dynamic Rules With Data Providers
**Related Skills**: Test Form Requests Unit
**Related Decision Trees**: Tree 1 — Unit Test vs Feature Test for Validation

---

## Anti-Pattern 2: Testing Only Validation Pass/Fail, Not Rules Structure

**Category**: Testing completeness

**Description**: Asserting only that `$request->validator()->fails()` or `->passes()` returns the correct boolean, without verifying which rules were applied.

**Warning Signs**:
- Tests call `$request->validator()->fails()` but never inspect `$request->rules()`
- A rule change that swaps `required` for `nullable` produces the same pass/fail result — test doesn't catch it
- Conditional rules are tested only by their outcome, not by the rule array they produce

**Why It's Harmful**: Pass/fail testing reveals whether validation succeeded but not which rules produced that result. A form request that applies `required` when it should apply `nullable` may still pass/fail the same way under test. Only inspecting the `rules()` array directly confirms the correct rules are applied.

**Real-World Consequence**: A form request changes `'title' => 'required|string'` to `'title' => 'nullable|string'`. The feature test passes because it sends a title. The unit test passes because it only checks pass/fail. In production, users can now submit posts without titles — a regression undetected by tests.

**Preferred Alternative**: Assert the `rules()` return value directly: `expect($request->rules()['title'])->toContain('required')`.

**Refactoring Strategy**:
1. For each form request, add assertions on `$request->rules()` keys and values
2. Assert specific rule strings for critical fields
3. Use datasets to test different rule sets for different conditions

**Detection Checklist**:
- [ ] Rules structure is tested (not just pass/fail)
- [ ] Critical fields have explicit rule string assertions
- [ ] Conditional rules produce different rule arrays verified by tests

**Related Rules**: Test Rules Return Value
**Related Skills**: Test Form Requests Unit

---

## Anti-Pattern 3: Missing Authorize Tests

**Category**: Security

**Description**: Testing validation rules but never testing the `authorize()` method with different user states.

**Warning Signs**:
- Form request tests only cover `rules()` and validation pass/fail
- No test sets up a user resolver and calls `$request->authorize()`
- Authorization logic in form requests is untested

**Why It's Harmful**: The `authorize()` method is the gatekeeper for endpoint access. If it returns `true` for unauthenticated users, or `false` for authorized users, the entire endpoint is compromised. Feature-level tests may miss this because middleware may intercept the request before authorization runs.

**Real-World Consequence**: A form request's `authorize()` method checks `$this->user()->isAdmin()` but doesn't handle the null user case. An unauthenticated request throws a `NullPointerException` returning 500 instead of 401. Tests never called `authorize()` directly, so the bug goes undetected.

**Preferred Alternative**: Test `authorize()` with both permitted (expect true) and forbidden (expect false) user states for every form request that has custom authorization logic.

**Refactoring Strategy**:
1. For each form request with `authorize()` overridden, identify all user states
2. Add a test for each state using `$request->setUserResolver(fn() => $user)`
3. Include null user (unauthenticated) as a test case

**Detection Checklist**:
- [ ] `authorize()` is tested for each form request with custom authorization
- [ ] Both permitted and forbidden user states are covered
- [ ] Null/unauthenticated user is tested

**Related Rules**: Test Authorize With Different User States
**Related Skills**: Test Form Requests Unit
**Related Decision Trees**: Tree 2 — Authorize Method Testing

---

## Anti-Pattern 4: Not Testing PrepareForValidation

**Category**: Testing completeness

**Description**: Never explicitly testing the `prepareForValidation()` method, or testing it indirectly through validator output.

**Warning Signs**:
- Form requests with `prepareForValidation()` are tested only through `$request->validator()->passes()`
- No test calls `$request->prepareForValidation()` directly and asserts transformed input
- Input transformation logic (slug generation, data cleansing) is untested

**Why It's Harmful**: `prepareForValidation()` transforms input before validation runs. Testing it indirectly through validation results leaves a gap — the transformation may be partially correct but produce wrong values. Direct testing catches transformation bugs before they reach validation.

**Real-World Consequence**: A `prepareForValidation()` method generates a slug from the title but doesn't handle special characters: "Hello World!" becomes "hello-world" instead of "hello-world-1". No direct test catches this. Production data has duplicate slugs.

**Preferred Alternative**: Call `$request->prepareForValidation()` explicitly and assert the transformed input values.

**Refactoring Strategy**:
1. Identify all form requests that override `prepareForValidation()`
2. Add a test that calls the method and asserts the transformed input
3. Include edge cases for the transformation logic (special chars, empty input, long input)

**Detection Checklist**:
- [ ] `prepareForValidation()` is tested directly for each form request that uses it
- [ ] Input transformation edge cases are covered
- [ ] Test asserts specific transformed values, not just that transformation ran

**Related Rules**: Test PrepareForValidation Transformations
**Related Skills**: Test Form Requests Unit

---

## Anti-Pattern 5: Incomplete Validation Boundary Testing

**Category**: Testing completeness

**Description**: Testing only that invalid data fails validation without also testing that valid data passes.

**Warning Signs**:
- Form request tests contain only `->fails()` assertions, no `->passes()` assertions
- Tests exercise only error scenarios, not the boundary between valid and invalid
- A change that makes valid data invalid goes undetected

**Why It's Harmful**: Testing only failure cases means you've verified that errors are caught, but you haven't verified that correct data is accepted. A rule change that accidentally makes a valid input invalid (e.g., changing `max:255` to `max:100`) would still pass all existing failure tests.

**Real-World Consequence**: A form request adds `'title' => 'required|string|min:10'`. Existing tests check that empty titles fail — they pass. But valid titles with 5 characters now fail, and no test catches this regression.

**Preferred Alternative**: For each rule boundary, write both a passing test (valid data) and a failing test (invalid data).

**Refactoring Strategy**:
1. For each validation rule, identify the boundary between valid and invalid
2. Add a test with data just inside the boundary (expect `->passes()`)
3. Add a test with data just outside the boundary (expect `->fails()`)

**Detection Checklist**:
- [ ] Each rule has both a passing and a failing test
- [ ] Boundary values are tested (min-1, min, max, max+1)
- [ ] No rule is tested only for its failure case

**Related Rules**: Test Validation Persistence
**Related Skills**: Test Form Requests Unit
