# ECC Standardized Knowledge — API Version Behavior Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | API Version Behavior Testing |
| Difficulty | Advanced |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

API version behavior tests verify that versioned endpoints return the correct responses for each version — asserting that v1 and v2 of the same route return different (or compatible) shapes, status codes, and behaviors. Tests cover URL-prefix versioning (`/api/v1/posts`, `/api/v2/posts`), header-based versioning (`Accept: application/vnd.api+json;version=2`), and query-parameter versioning (`?version=2`). Laravel supports versioning through route grouping, `Route::prefix('v1')`, and custom middleware. Tests assert that the correct version's controller is dispatched, the correct response shape is returned, and deprecated versions return appropriate deprecation headers.

## Core Concepts

- **URL-prefix versioning**: `Route::prefix('v1')->group(...)` — most common in Laravel
- **Header-based versioning**: `Accept: application/vnd.api+json;version=2` — cleaner REST
- **Query-parameter versioning**: `?version=2` — simplest but least RESTful
- **Per-version controllers**: `App\Http\Controllers\Api\V1\PostController`
- **Per-version resources**: `V1\PostResource` vs `V2\PostResource`
- **Deprecation headers**: `Deprecation: true`, `Sunset: Sat, 1 Jan 2025 00:00:00 GMT`
- **Mirror test structure**: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`

## When To Use

- Any API with multiple active versions
- APIs with deprecation schedules and sunset policies
- Teams maintaining backward compatibility across versions
- APIs with per-version OpenAPI specifications

## When NOT To Use

- Single-version APIs (versioning not yet needed)
- Backward-compatible additions only (new fields added to existing version)
- Internal microservices with single consumer

## Best Practices

- **Mirror version directory structure**: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`.
- **Shared base test class**: `ApiTestCase` with common assertions (error shape, pagination shape) extended by both V1 and V2 tests.
- **Per-version test traits**: `V1Assertions` trait for version-specific assertions.
- **Deprecation header tests**: `$response->assertHeader('Deprecation', 'true')` or `Sunset` header.
- **Unsupported version**: `$this->get('/api/v3/posts')->assertStatus(404)`.
- **Version-specific OpenAPI validation**: Contract tests against `openapi-v1.yaml` and `openapi-v2.yaml`.
- **Use PestPHP `describe()` with `beforeEach`** to set version base URL and reduce repetition.

## Architecture Guidelines

- URL-prefix versioning makes version testing explicit — tests directly target `/api/v1/...`.
- The test directory structure should mirror the version directory structure, making it visually obvious which version each test belongs to.
- Shared behavior (error format, pagination) should be tested in a shared base class, not duplicated in each version.
- When removing a version, delete all version tests and the route group — never leave dead test code.

## Performance Considerations

- Per-version test suites duplicate assertion logic — use shared traits to avoid code duplication.
- Use PestPHP `describe()` with `beforeEach` to set the version base URL and reduce repetition.
- Maintain a `BaseApiTest` class with shared endpoint tests that both versions extend.

## Security Considerations

- Deprecated versions may have known security vulnerabilities — test that they still maintain auth/authorization standards.
- Ensure old versions don't expose deprecated security practices (e.g., weak password hashing, old encryption).
- Unsolicited version migration (redirecting v1 to v2) may break clients expecting v1 behavior.
- Test that deprecated versions return proper deprecation headers — don't silently remove security patches from old versions.

## Common Mistakes

- Copy-pasting tests between version test classes without adjusting version-specific assertions.
- Forgetting to version the OpenAPI spec — all versions validate against the same spec file.
- Testing shared behavior (error format, pagination) in every version test class instead of a shared base.
- Not testing that an unsupported version returns 404 (or appropriate error).
- Version-specific bug fixed in v2 but test not added to v1 suite to confirm the bug still exists in v1.

## Anti-Patterns

- **No shared base test class**: Each version duplicates pagination, error shape, and auth assertions — high maintenance.
- **Version leakage in tests**: v2 tests accidentally hit v1 routes or vice versa — version prefix must be explicit.
- **Ignoring deprecation headers**: Testing only response bodies, not verifying `Deprecation`/`Sunset` headers on deprecated versions.

## Examples

```php
// Shared base test class
class ApiTestCase extends TestCase
{
    protected string $apiPrefix = '/api/v1';

    public function getJson($uri, array $headers = []): TestResponse
    {
        return parent::getJson($this->apiPrefix . $uri, $headers);
    }
}

// Version-specific test
describe('V1 Posts', function () {
    beforeEach(fn() => $this->apiPrefix = '/api/v1');

    it('returns posts with legacy author_name field', function () {
        $response = $this->getJson('/posts');
        $response->assertJsonStructure(['data' => ['*' => ['id', 'author_name']]]);
    });
});

describe('V2 Posts', function () {
    beforeEach(fn() => $this->apiPrefix = '/api/v2');

    it('returns posts with nested author object', function () {
        $response = $this->getJson('/posts');
        $response->assertJsonStructure(['data' => ['*' => ['id', 'author' => ['id', 'name']]]]);
    });
});
```

## Related Topics

- **Prerequisites**: Laravel Route Grouping, API Versioning Strategies (URL, header, query parameter)
- **Siblings**: feature-test-structure, response-shape-testing, contract-testing-with-openapi
- **Advanced**: API version deprecation automation, Canary release testing for new versions, Backward compatibility contract testing

## AI Agent Notes

- API version testing is structural as much as behavioral — the test directory structure should mirror the version directory structure.
- Laravel 11 route grouping supports `Route::prefix('v1')->as('api.v1.')->group(...)`.
- The `Deprecation` header (RFC 8594) and `Sunset` header are standardized for API deprecation signaling.

## Verification

- [ ] Each active API version has a corresponding test directory and test class
- [ ] Shared behavior (error shape, pagination) is tested in a shared base class
- [ ] Deprecated versions return `Deprecation` and `Sunset` headers
- [ ] Unsupported versions return 404 or appropriate error
- [ ] Version-specific response shapes are asserted per version
- [ ] OpenAPI specs are versioned and contract-tested per version
