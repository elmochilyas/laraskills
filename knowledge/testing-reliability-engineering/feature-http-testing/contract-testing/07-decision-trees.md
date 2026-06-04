# Decision Trees — Contract Testing

## Decision Tree 1: Lightweight Contract vs Pact vs Snapshot

```
What level of contract testing does this API need?
│
├── Is the API internal with a single frontend consumer?
│   └── Use assertJsonStructure() + assertJsonPath()
│       Lightweight — 90% of projects never need more
│       Structure assertions catch missing/renamed fields
│       Value assertions catch business logic errors
│
├── Is the API public, consumed by mobile apps or external teams?
│   └── Add snapshot testing for change detection
│       Spatie Snapshot Assertions: `->assertMatchesSnapshot()`
│       Treat snapshot changes as deliberate contract changes
│       Require explicit review of snapshot diffs in PRs
│
└── Is the API part of a multi-service microservice architecture?
    └── Consider Pact (Consumer-Driven Contracts)
        Consumer defines expected response → producer verifies
        Run Pact verification in a separate CI workflow
        Significant overhead — only for multi-team/multi-service
```

## Decision Tree 2: Structure Assertion vs Exact Assertion

```
What type of contract assertion should be used?
│
├── Are you verifying the minimum fields consumers depend on?
│   └── Use `assertJsonStructure([...])`
│       Assert only required fields
│       Allows adding optional fields without breaking tests
│
├── Are you verifying field types (int vs string)?
│   └── Use `AssertableJson::whereType()`
│       `$json->whereType('data.id', 'integer')`
│       Catches type-breaking changes (critical for typed clients)
│
├── Are you verifying the response has NO extra fields (security)?
│   └── Use `assertExactJson([...])` or `->missing('sensitive_field')`
│       Verify no sensitive data leakage
│       Use sparingly — very brittle
│
└── Are you verifying error response format?
    └── Use `assertJsonStructure()` on error responses
        Same rigor as success responses
        Test 422, 401, 403, 404, 500 formats
```

## Decision Tree 3: Error Response Contract Testing

```
Should I write contract tests for this error response?
│
├── Is this error response parsed programmatically by consumers?
│   └── YES → Write contract test with structure assertions
│       Validation error (422): `assertJsonStructure(['message', 'errors' => ['field']])`
│       Auth error (401): `assertJsonStructure(['message'])`
│       Not found (404): `assertJsonStructure(['message'])`
│
└── Is this error response only shown to humans (UI/UX)?
    └── May skip contract tests, but still test for security
        Verify no stack traces, no internal paths leaked
        Structure consistency is still valuable
```
