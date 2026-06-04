# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Testing & Reliability Engineering |
| Subdomain | Feature & HTTP Testing |
| Knowledge Unit | JSON API Testing |
| Difficulty | Foundation |
| Maturity | Stable |
| Priority | P0 |
| Status | Initial Draft |
| Last Updated | 2026-06-02 |
| Dependencies | HTTP test helpers, Eloquent API resources, Route design |
| Related KUs | Authentication testing, Validation testing, Contract testing, API resource serialization |
| Source | domain-analysis.md K004 |

# Overview

JSON API testing validates the structure, content, and contracts of JSON responses returned by Laravel applications. Laravel provides `getJson()`, `postJson()`, `putJson()`, `patchJson()`, and `deleteJson()` HTTP helpers alongside the fluent `AssertableJson` class for deep JSON structure assertions. JSON API tests are the most important test type for modern Laravel applications (which typically serve as backends for SPAs, mobile apps, or third-party integrations). Fluent JSON path assertions catch contract violations before they reach consumers.

# Core Concepts

- **`getJson()`, `postJson()`, etc.**: HTTP helpers that send/receive JSON. Automatically set proper headers.
- **`assertJson(array $data)`**: Partial match — checks the given data exists in the response.
- **`assertExactJson(array $data)`**: Exact match — verifies the response matches exactly.
- **`assertJsonStructure(array $structure)`**: Validates JSON structure (keys and types) without checking values.
- **`assertJsonPath(string $path, $expected)`**: Asserts a value at a dot-notation path.
- **`AssertableJson` fluent API**: `assertJson(fn (AssertableJson $json) => $json->where('id', 1)->whereType('name', 'string'))`.

# When To Use

- For every API endpoint (JSON responses)
- When validating API contracts (structure, types, values)
- When testing JSON:API or similar specification compliance
- For paginated response validation
- For error response format validation

# When NOT To Use

- For HTML/Blade responses (use `get()` and `assertSee()`)
- When testing the API through a browser (use E2E tests for JS rendering)
- For non-JSON responses (file downloads, redirects)
- When asserting response time or performance (use dedicated performance tests)

# Best Practices (WHY)

- **Always assert structure plus values**: Structure assertions (`assertJsonStructure`) catch contract breaks. Value assertions (`assertJsonPath`) catch business logic errors. Both are needed.
- **Use `assertJson()` (partial match) for most tests**: It's less brittle than `assertExactJson()`. Use `assertExactJson()` only for idempotency tests or when you need to verify no extra fields exist.
- **Prefer `assertJsonPath()` over `assertJson()` for specific values**: `assertJsonPath('data.user.name', 'John')` is more precise and readable than `assertJson(['data' => ['user' => ['name' => 'John']]])`.
- **Don't hardcode IDs**: Use `whereType('data.id', 'integer')` instead of `assertJsonPath('data.id', 1)`. IDs change with different data setups.
- **Test empty states and error states**: Test `GET /api/users` with 0, 1, and 100 users. Ensure empty responses return `{"data": []}` not 404. Test validation errors return consistent JSON structure.
- **Use `AssertableJson` for deep nested structures**: The fluent API is significantly more readable than nested `assertJson()` calls for deeply nested responses.

# Architecture Guidelines

- **`assertJson()` vs `assertExactJson()`**: Partial match for most tests (less brittle). Exact match for idempotency tests.
- **`assertJsonPath()` vs `AssertableJson`**: Simple path assertions use `assertJsonPath()`. Multi-value nested assertions use `AssertableJson`.
- **Structure + values**: One endpoint test should assert: status code, structure, and 1-3 specific values. Too many value assertions make tests brittle.
- **API versioning**: Include version in URL path (`/api/v1/users`). Test each version separately.

# Performance Considerations

- Large JSON responses (1000+ items) take longer to decode and assert. Paginate in tests to 10-15 items.
- `AssertableJson` chain overhead: Each fluent call adds <0.5ms for 20+ assertions.
- `assertJson()` with large expected arrays is slower than `assertJsonPath()` with specific values.

# Security Considerations

- JSON responses may expose sensitive data (PII, internal IDs). Test that sensitive fields are excluded from API responses.
- Assert that error responses don't leak stack traces or internal configuration.
- Test that authenticated endpoints return proper 401/403 JSON responses for unauthorized access.

# Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using assertJson() for exact matching | Misunderstanding partial match behavior | Test passes with extra unexpected data; API contract may diverge | Use assertExactJson() or assertJsonStructure() + assertJsonPath() |
| Hardcoding IDs in assertions | Using assertJsonPath('data.id', 1) | Test breaks when seed order changes | Assert type: whereType('data.id', 'integer') |
| Not testing JSON structure (only values) | Focus on business logic values | API response structure changes break consumers silently | Always assert structure in addition to values |
| Asserting dates/timestamps as exact strings | Using assertJsonPath with exact date string | Fails on timezone, format, or second differences | Assert date format or use Carbon to parse and compare |
| Not testing error response format | Only testing success responses | API consumers can't rely on error structure | Test validation, auth, and server error format |

# Anti-Patterns

- **Partial match for exact contract testing**: Using `assertJson()` when you need to verify the complete response shape. Instead, use `assertExactJson()` or `assertJsonStructure()` for contract validation.
- **In-line expected data**: Duplicating fixture data in assertions. Instead, use factory `make()` and assert against the same data.
- **No pagination structure tests**: Not verifying paginated response metadata (links, meta). Instead, always assert pagination contract.
- **Ignoring JSON type coercion**: Not testing that numeric values return as integers (not strings) or dates in the expected format.

# Examples

```php
// Structure-first, values-second approach
public function test_show_user_returns_correct_structure()
{
    $user = User::factory()->create();

    $this->getJson(route('api.users.show', $user))
        ->assertOk()
        ->assertJsonStructure([
            'data' => [
                'id',
                'name',
                'email',
                'created_at',
                'updated_at',
            ],
        ]);
}

// AssertableJson fluent API for nested structures
public function test_posts_index_returns_paginated_response()
{
    Post::factory()->count(15)->create();

    $this->actingAs(User::factory()->create())
        ->getJson(route('api.posts.index'))
        ->assertOk()
        ->assertJson(fn (AssertableJson $json) =>
            $json->has('data', 10) // per page
                ->has('meta', fn (AssertableJson $meta) =>
                    $meta->where('current_page', 1)
                        ->where('last_page', 2)
                        ->where('total', 15)
                        ->where('per_page', 10)
                )
                ->has('links')
        );
}

// Validation error format
public function test_create_post_validates_required_fields()
{
    $this->actingAs(User::factory()->create())
        ->postJson(route('api.posts.store'), [])
        ->assertStatus(422)
        ->assertJsonValidationErrors(['title', 'body']);
}
```

# Related Topics

- **Prerequisites**: HTTP test helpers, Eloquent API resources, Route design
- **Related**: Authentication testing, Validation testing, Contract testing, API resource serialization
- **Advanced**: OpenAPI contract testing, Consumer-driven contracts, JSON:API specification testing

# AI Agent Notes

- JSON API tests are the most important test type for modern Laravel applications. Every API endpoint should have tests for: success response, validation errors, auth errors, and not-found scenarios.
- When writing JSON API tests, always use `getJson()`/`postJson()` variants, not `get()`/`post()`. The JSON variants set proper headers and fail with better error messages.
- For deeply nested responses, use `AssertableJson` callback syntax. It's more readable than chained `assertJsonPath()` calls.
- Use `assertJsonStructure()` for contract validation on all endpoints. A structure change IS a breaking change for API consumers.

# Verification

- [ ] Every API endpoint has tests for success, validation error, auth error, and not-found
- [ ] getJson()/postJson() are used for API endpoint tests
- [ ] assertJsonStructure() validates the contract for every endpoint
- [ ] assertJsonPath() or AssertableJson is used for specific value assertions
- [ ] IDs are asserted by type (integer), not by hardcoded value
- [ ] Empty states and error states return consistent JSON structure
- [ ] Paginated responses include structure assertions for links and meta
- [ ] Timestamps/date assertions use format validation, not exact equality
