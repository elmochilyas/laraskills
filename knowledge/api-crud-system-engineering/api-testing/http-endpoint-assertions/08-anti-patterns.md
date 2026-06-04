# Anti-Patterns: HTTP Endpoint Assertions

## Assertion Anemia
**Description:** Testing only that the response is 200 OK without validating structure, data, or headers. The test passes even if the response body is empty or completely wrong.
**Why it happens:** Developers focus on quick coverage numbers rather than meaningful validation.
**Consequences:** Silent regressions — response shape changes without test failure.
**Better approach:** Every endpoint test must include at least status, structure, and one data/hader assertion.

## Status Range Generalization
**Description:** Using `assertSuccessful()` (matches 200-299) or `assertStatus(200)` for all success cases, including resource creation (which should be 201).
**Why it happens:** Developers treat all success responses identically.
**Consequences:** Creation endpoints returning 200 instead of 201 pass tests but break REST semantics for consumers.
**Better approach:** Assert exact status codes: 200 for reads, 201 for creation, 204 for deletion.

## Fragile Exact Matching
**Description:** Using `assertExactJson()` on large or changing responses, causing unrelated changes to cascade into test failures.
**Why it happens:** Developers want comprehensive validation and choose the easiest comprehensive assertion.
**Consequences:** Frequent test maintenance, developer frustration, eventual test abandonment.
**Better approach:** Use `assertJsonStructure()` for shape and `assertJsonFragment()` for data values. Use exact matching only for small stable responses.

## Error Blindness
**Description:** Testing only the happy path and never asserting error response shapes.
**Why it happens:** Developers assume errors are handled generically by the framework.
**Consequences:** Custom error handling breaks silently; consumers receive inconsistent error formats.
**Better approach:** Every endpoint must have tests for its most likely error responses.

## Copy-Paste Assertions
**Description:** Duplicating the same assertion patterns across every test file without extracting to shared helpers.
**Why it happens:** Quick development, lack of test refactoring discipline.
**Consequences:** Changing the response format requires updating hundreds of test files.
**Better approach:** Extract common assertions (error envelope, pagination structure, success envelope) into test helper traits or base classes.
