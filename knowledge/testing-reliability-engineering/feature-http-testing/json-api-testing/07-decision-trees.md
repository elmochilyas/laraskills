# Decision Trees — JSON API Testing

## Decision Tree 1: Which Assertion Method to Use

```
What aspect of the JSON response needs verification?
│
├── Response structure (keys present, regardless of values)?
│   └── Use `assertJsonStructure([...])`
│       Validates the contract — all expected keys exist
│       Example: `assertJsonStructure(['data' => ['id', 'name', 'email']])`
│
├── Specific value at a path?
│   └── Use `assertJsonPath('path.to.value', $expected)`
│       Example: `assertJsonPath('data.user.name', 'John')`
│
├── Partial data match (subset of response should match)?
│   └── Use `assertJson([...])`
│       Partial match — ignores extra fields
│       Example: `assertJson(['data' => ['status' => 'active']])`
│
├── Exact data match (response must match exactly)?
│   └── Use `assertExactJson([...])`
│       Full match — fails on extra or missing fields
│       Only for idempotency/contract tests
│
├── Field types (ID is integer, date is string)?
│   └── Use `AssertableJson::whereType('path', 'type')`
│       Example: `$json->whereType('data.id', 'integer')->whereType('data.name', 'string')`
│
└── Multiple assertions on deeply nested structure?
    └── Use `AssertableJson` fluent API
        ```php
        $json->has('data', 10)
            ->has('meta', fn ($m) => $m->where('current_page', 1)->etc())
            ->etc();
        ```
```

## Decision Tree 2: What Test Cases to Write for an API Endpoint

```
For a given API endpoint, what scenarios need tests?
│
├── Success scenarios
│   ├── GET single: verify structure + values for one item
│   ├── GET collection: test with 0 items, 1 item, multiple items (pagination)
│   ├── POST: verify creation + response structure
│   ├── PUT/PATCH: verify update + response
│   └── DELETE: verify deletion + proper status code (200/204)
│
├── Error scenarios
│   ├── Validation errors (422): assert error format
│   ├── Unauthenticated (401): assert proper JSON error
│   ├── Forbidden (403): assert authorization error format
│   ├── Not found (404): assert proper JSON error
│   └── Server error (500): test error handler returns valid JSON
│
└── Edge cases
    ├── Empty collection: `GET /api/posts` with 0 posts → `{"data": []}`
    ├── Sort/filter: test each sorting and filtering parameter
    └── Nested includes: test eager-loaded relationships in response
```

## Decision Tree 3: Partial Match vs Exact Match

```
Does the API contract require strict response shape or flexible shape?
│
├── Is this a public API consumed by external clients?
│   └── Use `assertExactJson()` for contract validation
│       External consumers rely on exact field presence
│       `assertExactJson(['data' => ['id' => 1, 'name' => 'Test']])`
│       Fails on extra fields — catches breaking changes
│
├── Is this an internal API consumed by owned frontends?
│   └── Use `assertJson()` (partial match)
│       Adding new fields shouldn't break existing tests
│       `assertJson(['data' => ['name' => 'Test']])`
│       Ignores unknown fields
│
└── Are you verifying that NO sensitive fields are exposed?
    └── Use explicit `->missing('data.password')` checks
        Combine with `assertJson()` for the positive assertions
        Use `AssertableJson`:
        `$json->where('data.name', 'Test')->missing('data.password')->etc()`
```
