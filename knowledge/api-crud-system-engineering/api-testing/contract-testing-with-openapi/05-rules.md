# Contract Testing with OpenAPI — Rules

## Validate Every Response Against OpenAPI Spec
---
## Category
Testing
---
## Rule
Every API endpoint test should validate its response against the OpenAPI specification.
---
## Reason
An OpenAPI spec that is never validated against real responses is aspirational documentation, not a contract. Automated contract validation catches every discrepancy between documentation and implementation — renamed fields, missing keys, wrong types, incorrect status codes. Without validation, the spec and code diverge immediately.
---
## Bad Example
```php
it('lists posts', function () {
    $this->getJson('/api/posts')
        ->assertOk()
        ->assertJsonStructure(['data' => ['*' => ['id', 'title']]]);
    // No OpenAPI contract validation — spec may define different shape
});
```
---
## Good Example
```php
it('lists posts matching OpenAPI spec', function () {
    $this->getJson('/api/posts')
        ->assertOk()
        ->assertMatchesOpenApiSpec(); // Validates against openapi.yaml
});
```
---
## Exceptions
Endpoints with dynamic response schemas (e.g., search results with variable fields) may use selective contract validation.
---
## Consequences Of Violation
OpenAPI spec and implementation drift with every deployment; client SDKs generated from spec fail against actual API.
---

## Validate The Spec File Itself
---
## Category
Testing
---
## Rule
Validate the OpenAPI YAML/JSON file for structural correctness in CI before running any API tests.
---
## Reason
An invalid OpenAPI spec (broken references, invalid schema syntax, missing required fields) causes all contract tests to fail, or worse, pass because the validator silently skipped invalid parts. Validating the spec independently ensures the spec is parseable before it's used for contract testing.
---
## Bad Example
```php
// No spec validation — broken YAML goes undetected until contract test failures surface
it('matches spec', function () {
    $this->getJson('/api/posts')->assertMatchesOpenApiSpec();
    // Silent failure if spec is invalid: validator may skip validation entirely
});
```
---
## Good Example
```php
it('openapi spec is structurally valid', function () {
    $result = shell_exec('swagger-cli validate openapi.yaml 2>&1');

    expect($result)->toContain('valid');
});

it('lists posts matching spec', function () {
    $this->getJson('/api/posts')->assertMatchesOpenApiSpec();
});
```
---
## Exceptions
When the spec is generated from code (e.g., using Scribe or blueprint), validation may be redundant.
---
## Consequences Of Violation
Invalid spec deployed; contract tests silently skip validation; API consumers download broken spec files.
---

## Use Per-Version Spec Files
---
## Category
Architecture
---
## Rule
Maintain separate OpenAPI spec files for each API version, and validate each version's tests against its respective spec.
---
## Reason
A single spec file cannot accurately describe both v1 and v2 of an endpoint when they differ in shape. Validating v1 responses against a v2 spec causes failures. Per-version spec files keep each version's contract independently verified.
---
## Bad Example
```
resources/
└── openapi.yaml  # Single spec for all versions
```
---
## Good Example
```
resources/
├── openapi-v1.yaml  # Spec for /api/v1/*
└── openapi-v2.yaml  # Spec for /api/v2/*
```
---
## Exceptions
When the API only has one active version, a single spec file is sufficient.
---
## Consequences Of Violation
Cross-version contract contamination; v1 responses validated against v2 shape expectations; false-positive or false-negative contract tests.
---

## Cache Parsed Spec In Memory
---
## Category
Performance
---
## Rule
Cache the parsed OpenAPI spec in memory to avoid YAML/JSON parsing overhead on every request.
---
## Reason
Parsing a YAML spec file takes 10-50ms per invocation. With a feature test suite of 200+ endpoints, uncached parsing adds 10+ seconds of overhead. Caching the parsed schema reduces this to a single parse per test run.
---
## Bad Example
```php
// No caching — spec is parsed on every assertion
it('validates spec on each endpoint', function () {
    $this->getJson('/api/posts')->assertMatchesOpenApiSpec();
    // Parses openapi.yaml on every test — 50ms × 200 tests = 10s overhead
});
```
---
## Good Example
```php
// In TestCase setUp or service provider
protected function setUp(): void
{
    parent::setUp();
    $this->app->singleton(OpenApiSchema::class, function () {
        return OpenApiSchema::fromYaml(resource_path('openapi.yaml'));
    });
}

it('validates spec', function () {
    $this->getJson('/api/posts')->assertMatchesOpenApiSpec();
    // Reuses cached schema — minimal overhead per test
});
```
---
## Exceptions
When the spec file is small (<50KB) and total test count is low, caching is optional.
---
## Consequences Of Violation
Slow test suite; developers skip contract validation to save time; spec-implementation drift accelerates.
---

## Run Contract Validation As Separate CI Stage
---
## Category
Performance
---
## Rule
Separate contract validation tests from fast-feedback unit/feature tests in the CI pipeline.
---
## Reason
Contract validation adds 5-50ms of schema validation overhead per assertion. Running it alongside every feature test slows the fast-feedback loop. A dedicated CI stage for contract tests allows developers to get quick feature-test results while validator runs separately.
---
## Bad Example
```yaml
# CI runs all tests together — contract validation overhead delays feedback
test:
  script: php artisan test
```
---
## Good Example
```yaml
test:feature:
  script: php artisan test --testsuite=Feature

test:contract:
  script: php artisan test --testsuite=Contract
  needs: []  # Runs in parallel with feature tests
```
---
## Exceptions
Small projects with fewer than 50 endpoints may run all tests together without noticeable delay.
---
## Consequences Of Violation
Slow CI pipeline; developers tempted to reduce contract coverage to speed up builds; spec drift undetected.
---

## Treat Spec Validation Failures As CI Blocking
---
## Category
Architecture
---
## Rule
Never deploy an API version with failing contract validation — spec violations must block the CI pipeline.
---
## Reason
A spec violation means documentation and implementation disagree. Deploying without fixing either the code or the spec means the documented contract is a lie. SDKs generated from the spec will fail against the deployed API.
---
## Bad Example
```yaml
# Contract failures are warnings — deployment proceeds
test:contract:
  allow_failure: true  # Spec violations not blocking
```
---
## Good Example
```yaml
test:contract:
  script: php artisan test --testsuite=Contract --stop-on-failure
  # No allow_failure — contract violations block deployment
```
---
## Exceptions
When the spec intentionally documents future features not yet implemented, those paths may be excluded from validation.
---
## Consequences Of Violation
Deployed API breaks consumers; SDK generation produces invalid clients; production incidents blamed on "passing CI."
---
