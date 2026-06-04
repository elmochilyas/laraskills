# ECC Standardized Knowledge — Contract Testing with OpenAPI

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Contract Testing with OpenAPI |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Contract testing validates that API responses conform to their OpenAPI specification — ensuring the running implementation matches the documented contract. Tests parse the OpenAPI schema, make real requests, and validate responses against schema definitions for status codes, headers, request bodies, and response bodies. Tools like `league/openapi-psr7-validator`, `marc-mabe/php-openapi`, and custom Laravel test macros enable in-test schema validation. Contract tests catch discrepancies between documentation and implementation before they reach consumers.

## Core Concepts

- **OpenAPI spec**: Defines paths, methods, parameters, request bodies, and response schemas
- **Contract testing**: Automates verification that responses match schemas
- **Spectator**: Laravel package that auto-validates all test requests/responses against the spec
- **Schema parsing**: `league/openapi-psr7-validator` validates PSR-7 messages against JSON Schema
- **Coverage**: Status codes, response headers, response body structure, response body types
- **TestResponse macro**: `$response->assertMatchesOpenApiSpec()` for explicit assertion

## When To Use

- Every API endpoint that has a corresponding OpenAPI specification
- CI pipeline to prevent spec-implementation drift
- Teams producing SDKs or client libraries from OpenAPI specs
- API versioning with per-version spec files

## When NOT To Use

- Consumer-driven contract testing (Pact.io) — different methodology
- Writing the OpenAPI spec itself (documentation concern)
- Unit testing of individual service/action classes
- Exploratory or manual API testing

## Best Practices

- **Auto-validation via middleware**: Install Spectator or custom middleware that validates every test request/response against the spec.
- **Unit-test the spec file itself**: Validate `openapi.yaml` against the OpenAPI schema using `swagger-cli validate` or `openapi-examples-validator`.
- **Selective endpoint validation**: Use `#[OpenApiTest]` attribute or `->withoutContractValidation()` for endpoints with dynamic schemas.
- **Version-specific spec files**: Maintain per-version OpenAPI files and test each version group against its spec.
- **Cache parsed spec**: Parse the OpenAPI file once and cache in memory to avoid YAML parsing overhead on every request.

## Architecture Guidelines

- The OpenAPI spec is the single source of truth — if the spec and implementation diverge, fix whichever is wrong.
- Treat spec validation failures as CI blocking errors.
- Never deploy an API version without a corresponding OpenAPI spec.
- Consider runtime schema validation for incoming requests in production using `league/openapi-psr7-validator` middleware.

## Performance Considerations

- Schema validation on every response adds 5-50ms overhead per assertion.
- Run contract validation as a separate CI pipeline stage, not in the fast-feedback unit/feature stage.
- Cache the parsed OpenAPI file in memory — parsing YAML on every request is expensive.
- Validate only on a subset of representative tests for quick feedback.

## Security Considerations

- Ensure OpenAPI spec files don't contain hardcoded secrets, API keys, or example credentials.
- Validate that error response schemas don't expose internal implementation details.
- If performing runtime schema validation in production, ensure it doesn't leak spec structure to unauthorized users.

## Common Mistakes

- Letting the OpenAPI spec drift from implementation — spec changes are not validated against tests.
- Validating response schema but not request schema — request validation may reject spec-compliant requests.
- Testing against an outdated spec file — CI must ensure the spec file is the current version.
- Ignoring `oneOf`/`anyOf` schemas — complex schema composition requires deeper validation logic.

## Anti-Patterns

- **Spec-first without contract testing**: Writing the spec first but never verifying the implementation matches it — spec and code diverge immediately.
- **All-or-nothing validation**: Applying contract validation to every test including non-API routes — noisy failures.
- **Ignoring schema evolution**: Not testing backward compatibility when changing schemas — breaking consumers without warning.

## Examples

```php
// Explicit per-test contract validation
it('matches OpenAPI spec for post index', function () {
    $response = $this->getJson('/api/posts');
    $response->assertStatus(200);
    $response->assertMatchesOpenApiSpec();
});

// Using Spectator for auto-validation
it('validates all responses against spec', function () {
    Spectator::using('openapi-v1.yaml');
    $response = $this->getJson('/api/posts');
    $response->assertValidRequest();
    $response->assertValidResponse();
});

// Validate spec file itself
it('openapi spec is valid', function () {
    $result = exec('swagger-cli validate openapi.yaml');
    expect($result)->toContain('valid');
});
```

## Related Topics

- **Prerequisites**: OpenAPI Specification 3.x, response-shape-testing, response-status-code-testing
- **Siblings**: architecture-tests-for-apis, api-version-behavior-testing
- **Advanced**: Consumer-driven contract testing (Pact.io), Schema evolution and backward compatibility checking, Auto-generating tests from OpenAPI specs

## AI Agent Notes

- Contract testing shifts validation from "does the API return the right data?" to "does the API match its documented contract?"
- Start with explicit per-test assertions for critical endpoints, expand to auto-validation middleware once the spec stabilizes.
- Per-version spec files require per-version contract tests — mirror the version structure in test organization.

## Verification

- [ ] Every API endpoint's response is validated against its OpenAPI schema
- [ ] Spec file is validated for structural correctness in CI
- [ ] Contract validation failures block CI pipeline
- [ ] Per-version spec files are maintained and tested separately
- [ ] Schema changes are validated for backward compatibility
