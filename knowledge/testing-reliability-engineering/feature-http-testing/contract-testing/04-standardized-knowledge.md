# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | Contract Testing |
| Difficulty | Intermediate |
| Maturity | Emerging |
| Priority | P2 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | JSON API testing, Snapshot testing, Feature test HTTP helpers |
| Related KUs | OpenAPI/Swagger specification, JSON Schema validation, Integration testing |
| Source | domain-analysis.md K024 |

# Overview

Contract testing verifies that API consumers and producers agree on request/response formats, ensuring changes on one side don't break the other. In the Laravel ecosystem, contract testing is primarily achieved through JSON structure assertions (`assertJsonStructure`, `AssertableJson`), OpenAPI/Swagger specification validation, and consumer-driven contract (CDC) patterns. While no dominant Laravel-native CDC framework exists (2026), lightweight contract tests via feature tests are the pragmatic approach.

# Core Concepts

- **Consumer-driven contracts (CDC)**: API consumer defines the expected response shape. Producer tests verify the API still satisfies consumer expectations.
- **OpenAPI/Swagger specification validation**: Define API contracts in OpenAPI format. Test that responses match the specification.
- **JSON structure assertions**: `assertJsonStructure(['data' => ['id', 'name']])` validates the shape without specifying values.
- **Response fixture testing**: Store expected JSON responses as fixtures; compare actual responses to fixtures.
- **Snapshot testing for contracts**: Use snapshot testing (Spatie Snapshot Assertions) to detect unintended API response changes.
- **Pact (PHP)**: The Pact PHP library supports consumer-driven contract testing with a Pact broker. Niche in Laravel but available.
- **Lightweight CDC**: For most Laravel projects, feature test assertions against the JSON structure serve as sufficient contract tests.

# When To Use

- For public API endpoints consumed by external teams or mobile apps
- For inter-service communication in microservice architectures
- For versioned APIs where backward compatibility is critical
- When multiple consumers depend on the same API shape
- When using OpenAPI/Swagger as API documentation

# When NOT To Use

- For internal-only endpoints with a single consumer (test with the consumer directly)
- For endpoints that change frequently during early development (contracts add overhead)
- When structure assertions alone provide sufficient coverage for the project's scale
- When the overhead of maintaining an OpenAPI spec exceeds the benefit

# Best Practices (WHY)

- **Structure over values**: Contract tests care about "what fields exist" and "what types they are" more than "what values they contain." Use `assertJsonStructure` for shape, `whereType` for types.
- **Contract-test error responses with the same rigor as success**: Error format changes break consumer error handling just as much as success changes. Test both paths.
- **Treat snapshot changes as deliberate contract changes**: A failing snapshot test means the API contract changed. Require explicit review and justification in PRs.
- **Focus contract tests on public API endpoints**: Not every endpoint needs contract tests. Reserve them for endpoints consumed by external teams or mobile apps.
- **Use `AssertableJson` for type-level contract enforcement**: `$response->assertJson(fn (AssertableJson $json) => $json->whereType('id', 'integer')->etc())` provides type validation that structure assertions miss.

# Architecture Guidelines

- **Lightweight structure assertions vs Pact**: Most Laravel projects never need Pact. Structure assertions + snapshot tests cover 90% of contract testing needs. Use Pact only for multi-service architectures.
- **OpenAPI spec contract vs test-based contract**: OpenAPI spec is documentation + contract. Test-based contract is simpler but less visible. Use both for best coverage.
- **Snapshot baseline management**: Store snapshots in version control. Review snapshot diffs in PRs. A snapshot change means an API contract change.
- **Versioned contracts**: For versioned APIs, maintain separate contract tests per version. Structure assertions per version prevent cross-version contamination.

# Performance Considerations

- Structure assertions: <1ms per response. Fast enough for every API test.
- OpenAPI validation: 10-50ms. Run in CI-only or a subset of tests.
- Snapshot comparisons: <5ms per comparison. Acceptable for all endpoints.
- Pact verification: Slower; run in a separate CI workflow.

# Security Considerations

- Contract tests for security-related endpoints (auth, token refresh) should verify that sensitive fields are never exposed in responses.
- Error responses should not leak internal details (stack traces, query parameters). Contract-test the error format.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Treating snapshot tests as contracts without review | Snapshots auto-update with flag | API changes silently accepted; consumers break | Require deliberate snapshot update commits |
| Over-specifying contracts | Asserting exact structure with every optional field | Adding a new field is a "breaking change" | Assert minimum required structure; use `assertJsonStructure` for optional fields |
| No contract tests for error responses | Only contract-testing success responses | Error format changes break consumer error handling | Contract-test error responses with same rigor as success |
| Ignoring consumer feedback on contracts | Producer defines contracts unilaterally | API doesn't serve consumer needs | Involve consumers in contract definition; use consumer-driven approach |

# Anti-Patterns

- **Snapshot as contract without review**: Letting snapshots auto-update in CI without review. Instead, require explicit snapshot update commits with justification.
- **Testing all fields with exact match**: Asserting every field including timestamps and UUIDs. Instead, use structure assertions for stable shape and reserve exact assertions for stable values.
- **No versioning in contracts**: Testing only the latest API version. Instead, maintain contract tests per API version to prevent backward-incompatible changes.

# Examples

```php
// Lightweight structure assertion as contract
public function test_user_endpoint_matches_contract()
{
    $response = $this->actingAs($user)->getJson('/api/users/1');

    $response->assertJsonStructure([
        'data' => [
            'id',
            'name',
            'email',
            'created_at',
        ]
    ]);
}

// Type-level contract enforcement
public function test_user_endpoint_field_types()
{
    $this->actingAs($user)
        ->getJson('/api/users/1')
        ->assertJson(fn (AssertableJson $json) =>
            $json->whereType('data.id', 'integer')
                 ->whereType('data.email', 'string')
                 ->whereType('data.created_at', 'string')
                 ->etc()
        );
}

// Snapshot-based contract change detection
public function test_user_endpoint_has_not_changed()
{
    $this->actingAs($user)
        ->getJson('/api/users/1')
        ->assertMatchesSnapshot();
}

// Error response contract
public function test_validation_error_format()
{
    $this->postJson('/api/users', [])
        ->assertJsonStructure([
            'message',
            'errors' => [
                'name',
                'email',
            ]
        ]);
}
```

# Related Topics

- **Prerequisites**: JSON API testing, Snapshot testing, Feature test HTTP helpers
- **Related**: OpenAPI/Swagger specification, JSON Schema validation, Integration testing
- **Advanced**: Pact contract testing, Consumer-driven contract patterns, Multi-service API governance

# AI Agent Notes

- Most Laravel projects don't need Pact. Start with `assertJsonStructure` for shape validation and snapshot tests for change detection. Add Pact only if you have multiple services with formal contracts.
- When writing contract tests, think from the consumer's perspective. What fields does the frontend/mobile app need? What shape does it expect?
- Error responses are part of the contract. Always include error format contract tests.
- For snapshot-based contracts, use `CREATE_SNAPSHOTS=false` in CI to prevent accidental snapshot updates.

# Verification

- [ ] Public API endpoints have contract tests (structure or snapshot)
- [ ] Error responses are contract-tested with the same rigor as success
- [ ] Contract tests assert minimum required structure, not exact match
- [ ] Snapshot-based contracts require explicit review and update
- [ ] Versioned APIs have separate contract tests per version
- [ ] Type-level assertions are used where field types are critical
- [ ] OpenAPI spec (if used) is validated against actual responses in CI
- [ ] Consumer feedback informs contract evolution
