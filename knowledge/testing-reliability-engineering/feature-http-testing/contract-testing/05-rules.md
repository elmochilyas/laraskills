# Rules

## Domain: Testing & Reliability Engineering
## Subdomain: Feature & HTTP Testing
## Knowledge Unit: Contract Testing

---

### Rule 1: Assert JSON structure (shape) plus specific values for every API endpoint

| Field | Value |
|-------|-------|
| **Name** | Assert structure and values for API endpoints |
| **Category** | Contract Testing |
| **Rule** | For every public API endpoint, assert both the JSON structure (using `assertJsonStructure()`) and 1-3 specific values (using `assertJsonPath()` or `AssertableJson`). |
| **Reason** | Structure assertions catch contract breaks (missing fields, wrong nesting). Value assertions catch business logic errors. Neither alone provides sufficient contract coverage. |
| **Bad Example** | `->assertOk()` with no structure or value assertions — response could be anything. |
| **Good Example** | `->assertJsonStructure(['data' => ['id', 'name']])->assertJsonPath('data.name', $user->name)`. |
| **Exceptions** | Internal-only endpoints where structure changes are coordinated with the single consumer. |
| **Consequences Of Violation** | API contract changes silently. Consumers break without warning. Mobile apps crash on next update. |

---

### Rule 2: Treat snapshot test changes as deliberate contract changes requiring review

| Field | Value |
|-------|-------|
| **Name** | Review snapshot changes as contract changes |
| **Category** | Snapshot Contracts |
| **Rule** | When using snapshot testing for API contract validation, require deliberate review and explicit commit of snapshot changes. Set `CREATE_SNAPSHOTS=false` in CI to prevent automatic updates. |
| **Reason** | Automatic snapshot updates can silently accept breaking API changes. A snapshot change IS a contract change — it must be reviewed like any other contract modification. |
| **Bad Example** | CI automatically updates snapshots on failure — API response changes go undetected in PRs. |
| **Good Example** | Snapshot update requires a separate commit with clear message: "Update API snapshot — added email field to user endpoint." |
| **Exceptions** | During active development of a new API before any consumers depend on it. |
| **Consequences Of Violation** | Breaking API changes reach consumers without review. Mobile apps and third-party integrations break unexpectedly. |

---

### Rule 3: Contract-test error responses with the same rigor as success responses

| Field | Value |
|-------|-------|
| **Name** | Include error responses in contract coverage |
| **Category** | Error Contracts |
| **Rule** | Write contract tests for validation error responses (422), authentication errors (401), authorization errors (403), and server errors (500) — each with structure assertions. |
| **Reason** | Error format changes break consumer error handling just as much as success changes. Consumers parse error responses programmatically — structure changes break error display and logging. |
| **Bad Example** | Contract tests only for `GET /api/users/1` (200) — error format changes go undetected. |
| **Good Example** | Separate contract tests for `test_validation_error_format()`, `test_auth_error_format()`, `test_not_found_format()`. |
| **Exceptions** | Internal endpoints where error responses are not consumed programmatically. |
| **Consequences Of Violation** | Consumer error handling breaks. Users see raw error messages or application crashes on validation failures. |

---

### Rule 4: Assert minimum required structure, not exact exhaustive structure

| Field | Value |
|-------|-------|
| **Name** | Assert minimum contract structure |
| **Category** | Contract Testing |
| **Rule** | In contract tests, assert the minimum required structure that consumers depend on. Do not assert exhaustive field lists that include every optional field. |
| **Reason** | Over-specifying contracts makes every addition of an optional field a "breaking change." Consumers care about required fields, not the complete field list. |
| **Bad Example** | `assertExactJson(['data' => ['id' => 1, 'name' => 'John', 'optional_field' => null]])` — adding a new field breaks this assertion. |
| **Good Example** | `assertJsonStructure(['data' => ['id', 'name']])` — required fields only. Optional fields are not part of the contract assertion. |
| **Exceptions** | Idempotency tests where verifying no extra fields exist is the point (e.g., ensuring no sensitive data leaks). |
| **Consequences Of Violation** | Adding optional fields triggers false-positive test failures. Developers hesitate to evolve the API. |

---

### Rule 5: Use `AssertableJson` for type-level contract enforcement

| Field | Value |
|-------|-------|
| **Name** | Assert field types with `AssertableJson` |
| **Category** | Type Contracts |
| **Rule** | Use `$response->assertJson(fn (AssertableJson $json) => $json->whereType('id', 'integer')->whereType('email', 'string')->etc())` to enforce field types in API contracts. |
| **Reason** | Structure assertions check key presence but not value types. A field that was an integer and becomes a string is a breaking change for typed consumers (TypeScript, Swift, Kotlin). Type assertions catch this. |
| **Bad Example** | `assertJsonStructure(['data' => ['id', 'amount']])` — doesn't catch that `amount` changed from integer to string. |
| **Good Example** | `$json->whereType('data.id', 'integer')->whereType('data.amount', 'numeric')` — type contract enforced. |
| **Exceptions** | Fields with dynamic types (e.g., `meta` payload that varies by context). |
| **Consequences Of Violation** | Type mismatches between API and consumer cause runtime errors in typed clients. Mobile apps crash on deserialization. |

---

### Rule 6: Maintain separate contract tests per API version

| Field | Value |
|-------|-------|
| **Name** | Version-specific contract tests |
| **Category** | Versioning |
| **Rule** | For versioned APIs, maintain separate contract test files per version. Each version's contract tests must only assert the structure for that version. |
| **Reason** | Cross-version contamination occurs when shared contract tests pass for one version but fail for another. Separate tests ensure each version's contract is independently verified. |
| **Bad Example** | Shared `ApiContractTest` tests both v1 and v2 — v2 changes break v1 assertions. |
| **Good Example** | `tests/Feature/Api/V1/Contracts/` and `tests/Feature/Api/V2/Contracts/` — independent test suites. |
| **Exceptions** | APIs with backward-compatible versioning where all versions share the same structure. |
| **Consequences Of Violation** | A breaking change to v2 causes v1 contract tests to fail. Versioning provides no actual isolation. |
