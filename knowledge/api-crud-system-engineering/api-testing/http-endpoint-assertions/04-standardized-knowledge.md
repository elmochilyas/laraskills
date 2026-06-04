# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-testing
**Knowledge Unit:** Http Endpoint Assertions
**Difficulty:** Intermediate
**Category:** Testing & Quality Assurance
**Last Updated:** 2026-06-03

---

# Overview

HTTP Endpoint Assertions are the structured validation of API responses in feature tests — covering status codes, JSON structure, specific data values, response headers, error envelopes, and boundary conditions. They exist because API contracts are only as reliable as the tests that verify them. Without comprehensive assertions, response changes silently break consumers.

Engineers must care because an API that returns wrong status codes, missing fields, or incorrect headers is indistinguishable from a broken API to consumers. Assertions are the first line of defense against contract drift. Proper assertion patterns catch regressions before deployment, document expected behavior, and serve as executable API specifications.

---

# Core Concepts

**Status Code Specificity:** Testing precise HTTP status codes (201, 422, 401) rather than generic ranges (2xx, 4xx). Each status communicates specific semantics to consumers.

**JSON Structure Assertion:** Validating the shape of a JSON response using `assertJsonStructure()` — verifying that expected keys exist at expected locations without testing exact values. This catches structural regressions.

**JSON Fragment Assertion:** Testing that specific key-value pairs exist in a response using `assertJsonFragment()`. Useful for confirming data correctness without asserting the entire response.

**JSON Exact Assertion:** Testing the complete response body against an expected value using `assertExactJson()`. Fragile and best reserved for stable, small responses.

**Response Header Assertion:** Validating response headers like `Content-Type`, `X-Api-Version`, `Link`, and security headers. Headers are part of the API contract.

**Error Envelope Assertion:** Testing that error responses follow the standardized error envelope structure — status, code, message, details array.

**Boundary Condition:** Testing edge cases of input — empty collections, maximum pagination sizes, minimum/maximum field values, missing optional parameters.

**Content Negotiation:** Testing that versioned responses return correct content based on Accept headers, and that deprecation/sunset headers appear when expected.

---

# When To Use

- Every API endpoint feature test — happy path and error paths
- Integration test suites that validate the HTTP layer boundary
- Contract testing pipelines that detect breaking changes
- Pre-deployment regression prevention
- When verifying API documentation accuracy against actual behavior

---

# When NOT To Use

- Unit testing models, services, or actions — plain PHPUnit assertions are more appropriate
- Tests that only need to confirm a successful response without specific structure validation
- Tests run before the response format is stable (early development)

---

# Best Practices

**Always assert specific status codes.** Never use `assertSuccessful()` or `assertStatus(200)` for creation endpoints — assert 201. For validation errors, assert 422. Generic assertions hide contract violations.

**Use assertJsonStructure for contract validation.** Structure assertions verify the shape of the response (which fields exist, at which nesting levels) without testing values. This catches field removals and restructuring.

**Layer assertions: status first, then structure, then data.** Always verify the response status code first (fails fast), then verify JSON structure (catches shape changes), then verify specific data values (confirms correctness).

**Test error response structure separately.** Error envelopes have different shapes than success responses. Ensure error structure tests exist for each error type (validation, auth, not-found, server error).

**Include header assertions for contract-critical headers.** Content-Type, X-Api-Version, deprecation headers, and caching headers are part of the API contract and must be tested.

**Cover boundary conditions for list endpoints.** Test empty collections (returns empty array, not null), single element, maximum page size, sorting boundaries.

---

# Architecture Guidelines

**Assertions belong in feature tests, not unit tests.** HTTP endpoint assertions test the controller layer, which requires the full Laravel HTTP kernel. Unit tests for services and actions use direct method calls and PHPUnit assertions.

**Test helper methods reduce duplication.** Extract common assertion patterns (e.g., `assertErrorEnvelope()`, `assertPaginatedStructure()`) into test helper traits or base test classes.

**One assertion concern per test method.** A test that checks status, structure, data, and headers is testing four concerns. Split into multiple test methods when the concerns are independent.

**Schema-first teams should generate assertions from OpenAPI specs.** Contract testing tools can validate responses against OpenAPI schemas, replacing manual assertion structures.

---

# Performance Considerations

**Full response assertions are slower than targeted assertions.** `assertJsonStructure()` with deeply nested trees adds measurable overhead. Test structure depth proportional to risk — test envelope and data sections, not every nested object.

**assertExactJson() compares entire payloads** and is the most expensive assertion type. Use only for small, stable responses where exact matching is required.

**Paginated endpoint tests should test metadata, not all pages.** Assert pagination structure exists and first page is correct. Don't iterate through all pages in a single test.

---

# Security Considerations

**Never assert sensitive data in response bodies.** Tokens, secrets, personal information in responses should be verified absent using `assertJsonMissing()` or `assertDontSee()`.

**Test that security headers are present.** `X-Frame-Options`, `Strict-Transport-Security`, `X-Content-Type-Options` must be asserted in relevant security tests.

**Verify error responses don't leak stack traces.** Assert that error responses do not contain file paths, stack traces, or SQL queries.

**Test rate limit headers** (`X-RateLimit-Remaining`, `Retry-After`) in authenticated endpoint tests.

---

# Common Mistakes

**Testing only assertJson without structure.** `$response->assertJson(['status' => 'ok'])` passes even if the response contains extra fields or has wrong structure. Structural regressions go undetected.

**Asserting only 200 status.** All endpoints look successful in tests, but 404, 422, and 500 cases remain untested. Consumers will find these paths in production.

**Missing boundary conditions.** Paginated endpoints tested with exactly one element — empty collections, max page sizes, and sort-order edge cases are not covered.

**Over-reliance on assertExactJson.** Exact JSON matching makes tests fragile — any unrelated change to the response breaks the test. Use structure or fragment assertions.

**No header assertions.** API contract changes involving versioning, deprecation, CORS, or caching headers go untested.

---

# Anti-Patterns

**Assertion Anemia:** Testing only that the response is 200 OK with no structure or data verification. The test passes even if the response body is completely wrong.

**Copy-Paste Assertions:** Duplicating the same assertion patterns across every test without extracting to helpers. Changes to response structure require updating hundreds of tests.

**Golden File Testing:** Storing entire response fixtures and comparing responses byte-for-byte. Changes to unrelated parts of the response cascade into test failures.

---

# Examples

**Happy path endpoint test:**
```
$response = $this->getJson('/api/v1/users');
$response->assertStatus(200)
    ->assertJsonStructure([
        'data' => [
            '*' => ['id', 'name', 'email']
        ],
        'meta' => ['current_page', 'per_page', 'total']
    ])
    ->assertJsonFragment(['name' => 'Alice'])
    ->assertHeader('Content-Type', 'application/json');
```

**Error path endpoint test:**
```
$response = $this->postJson('/api/v1/users', []);
$response->assertStatus(422)
    ->assertJsonStructure([
        'error' => [
            'code',
            'message',
            'details' => [
                '*' => ['field', 'rule']
            ]
        ]
    ]);
```

**Boundary condition test:**
```
$response = $this->getJson('/api/v1/users?per_page=0');
$response->assertStatus(422);
```

---

# Related Topics

**Prerequisites:**
- Laravel HTTP Test Methods — understanding `getJson`, `postJson`, `putJson`, `deleteJson`
- HTTP Status Code Semantics — knowing which status codes to expect

**Closely Related Topics:**
- Feature Test Structure — organizing test files
- Authentication Test Patterns — auth-specific assertions
- Pagination Response Testing — pagination metadata assertions
- Error Response Testing Patterns — error envelope assertions

**Advanced Follow-Up Topics:**
- Contract Testing with OpenAPI — automated schema validation
- Response Shape Testing — comprehensive structure validation

**Cross-Domain Connections:**
- Response Format Decision Framework — choosing response envelope structure
- Standardized Error Envelope — error response format that assertions validate

---

# AI Agent Notes

- Layer assertions: status first (fastest feedback), structure second (contract validation), data third (correctness)
- Test error shapes before success shapes — errors are more likely to change
- Extract common assertion patterns into helpers to reduce duplication
- Boundary conditions are the most commonly missed assertion category
- Security header assertions are often forgotten until audit time
