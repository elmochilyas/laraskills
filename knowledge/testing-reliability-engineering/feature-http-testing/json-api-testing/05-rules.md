# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: JSON API Testing

---

### Rule 1: Assert both structure and values for every API endpoint

| Field | Value |
|-------|-------|
| **Name** | Assert structure and values |
| **Category** | Response Assertion |
| **Rule** | For every API endpoint test, assert the JSON structure (via `assertJsonStructure()`) plus 1-3 specific values (via `assertJsonPath()` or `AssertableJson`). |
| **Reason** | Structure assertions catch contract breaks (missing or renamed fields). Value assertions catch business logic errors (wrong data). Neither alone is sufficient — structure without values misses wrong data; values without structure misses contract changes. |
| **Bad Example** | `$this->getJson('/api/users/1')->assertJsonPath('data.name', 'John')` — doesn't verify the structure. |
| **Good Example** | `$this->getJson('/api/users/1')->assertJsonStructure(['data' => ['id', 'name']])->assertJsonPath('data.name', $user->name)`. |
| **Exceptions** | Endpoints returning dynamic structures (e.g., dashboard aggregation). |
| **Consequences Of Violation** | API structure changes silently. Consumers break without warning. |

---

### Rule 2: Prefer `assertJson()` (partial match) over `assertExactJson()` for most tests

| Field | Value |
|-------|-------|
| **Name** | Use partial match for most assertions |
| **Category** | Response Assertion |
| **Rule** | Use `assertJson()` (partial match — checks given data exists in response) for most tests. Use `assertExactJson()` only for idempotency tests or when verifying no extra fields exist. |
| **Reason** | Partial match is less brittle — adding a new field to the response does not break existing tests. Exact match fails on every response addition. |
| **Bad Example** | `assertExactJson(['data' => ['id' => 1]])` — adding a `name` field breaks this test. |
| **Good Example** | `assertJson(['data' => ['id' => 1]])` — adding fields does not break the assertion. |
| **Exceptions** | Idempotency tests where the contract says "exactly these fields and no more" (e.g., security-sensitive responses). |
| **Consequences Of Violation** | Tests are brittle. Adding response fields requires updating every test. |

---

### Rule 3: Assert types (not hardcoded values) for dynamic fields like IDs and timestamps

| Field | Value |
|-------|-------|
| **Name** | Assert types for dynamic fields |
| **Category** | Type Assertion |
| **Rule** | Use `whereType('data.id', 'integer')` and `whereType('data.created_at', 'string')` for IDs, timestamps, UUIDs, and other dynamically-generated fields. Never hardcode these values. |
| **Reason** | Hardcoded IDs and timestamps create brittle tests that break on every run. The contract cares about the field's type, not its specific generated value. |
| **Bad Example** | `assertJsonPath('data.id', 1)` — fails if seeding order changes or parallel test uses different database. |
| **Good Example** | `assertJson(fn (AssertableJson $json) => $json->whereType('data.id', 'integer')->whereType('data.created_at', 'string')->etc())`. |
| **Exceptions** | Fields with deterministic values set by the test (e.g., `data.status` = `'active'`). |
| **Consequences Of Violation** | Tests fail on every run due to changing IDs/timestamps. Developers learn to ignore test failures. |

---

### Rule 4: Test empty states and collection boundaries

| Field | Value |
|-------|-------|
| **Name** | Test empty states and collection sizes |
| **Category** | Edge Cases |
| **Rule** | Test collection endpoints with 0, 1, and multiple items. Verify empty collections return `{"data": []}` (not 404 or null) and that pagination metadata is correct for each case. |
| **Reason** | Empty collection handling is a common API bug. Returning 404 for an empty collection breaks consumers that expect an empty array. Pagination metadata (total, per_page, last_page) must be correct for all collection sizes. |
| **Bad Example** | Testing only with 10 items — empty collection case returns 404 or null. |
| **Good Example** | Separate tests: `test_list_returns_empty_array()`, `test_list_returns_single_item()`, `test_list_returns_paginated_results()`. |
| **Exceptions** | Endpoints that are guaranteed to always have data (e.g., static reference data). |
| **Consequences Of Violation** | Frontend crashes on empty states. Consumers must handle both array and null responses. |

---

### Rule 5: Use `AssertableJson` fluent API for deeply nested or multi-field assertions

| Field | Value |
|-------|-------|
| **Name** | Use `AssertableJson` for complex assertions |
| **Category** | Response Assertion |
| **Rule** | For responses with deeply nested structures or multiple field assertions, use `$response->assertJson(fn (AssertableJson $json) => ...)` with the fluent API. |
| **Reason** | Nested `assertJson()` calls are hard to read and maintain for deep structures. The `AssertableJson` fluent API provides `where()`, `whereType()`, `has()`, `missing()`, and `etc()` in a readable chain. |
| **Bad Example** | Three levels of nested `assertJson()` calls for a paginated response. |
| **Good Example** | `$json->has('data', 10)->has('meta', fn ($meta) => $meta->where('current_page', 1)->etc())->etc()`. |
| **Exceptions** | Simple responses with flat structures and 1-2 field assertions. |
| **Consequences Of Violation** | Tests for nested responses are unreadable and hard to debug. |

---

### Rule 6: Test all error response formats (422, 401, 403, 404, 500)

| Field | Value |
|-------|-------|
| **Name** | Test every error response format |
| **Category** | Error Contracts |
| **Rule** | For every API endpoint, verify the JSON error format for validation errors (422), authentication errors (401), authorization errors (403), not-found (404), and server errors (500). |
| **Reason** | API consumers parse error responses programmatically. Inconsistent error formats (different field names, different nesting) cause consumer-side crashes and complex error handling code. |
| **Bad Example** | Only testing success responses — error format inconsistent across endpoints. |
| **Good Example** | Each endpoint has structured error tests: `test_validation_errors_format()`, `test_unauthenticated_format()`, `test_not_found_format()`. |
| **Exceptions** | Endpoints that cannot produce certain error types (e.g., public endpoints cannot return 401). |
| **Consequences Of Violation** | Consumer error handling is inconsistent. Frontend displays raw error objects or crashes. |
