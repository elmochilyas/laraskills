# API Version Behavior Testing — Rules

## Mirror Version Directory Structure In Tests
---
## Category
Code Organization
---
## Rule
Mirror the version directory structure in your test directory: `tests/Feature/Api/V1/`, `tests/Feature/Api/V2/`.
---
## Reason
A developer looking for `v2/posts` tests should find them at `tests/Feature/Api/V2/PostsTest.php`, not by guessing or searching. Version-mirrored directories make it visually obvious which version each test covers and prevent accidental version mixing.
---
## Bad Example
```
tests/Feature/Api/
├── V1PostsTest.php       # Unclear versioning — might test v2 by mistake
├── PostsV2Test.php       # Inconsistent naming convention
├── OldPostsTest.php      # Which version is "old"?
```
---
## Good Example
```
tests/Feature/Api/
├── V1/
│   ├── PostsTest.php     # Tests for /api/v1/posts
│   └── AuthTest.php      # Tests for /api/v1/auth
├── V2/
│   ├── PostsTest.php     # Tests for /api/v2/posts
│   └── AuthTest.php      # Tests for /api/v2/auth
```
---
## Exceptions
Single-version APIs with no plans for versioning may flatten the test structure.
---
## Consequences Of Violation
Version confusion; tests against wrong version pass/fail incorrectly; removing a version requires identifying scattered test files.
---

## Share Common Assertions Via Base Test Class
---
## Category
Maintainability
---
## Rule
Extract shared assertions (error shape, pagination shape, auth failure) into a base test class extended by all version-specific tests.
---
## Reason
Error shape and pagination structure should be identical across versions. Duplicating these assertions in every version's test suite creates maintenance burden when the shared shape changes. A base class keeps shared contract tests in one place.
---
## Bad Example
```php
class V1PostsTest extends TestCase
{
    it('returns consistent 401 shape', fn () => $this->getJson('/api/v1/posts')->assertExactJson(['message' => 'Unauthenticated.']));
}

class V2PostsTest extends TestCase
{
    it('returns consistent 401 shape', fn () => $this->getJson('/api/v2/posts')->assertExactJson(['message' => 'Unauthenticated.']));
    // Duplicated assertion — same contract, different URL prefix
}
```
---
## Good Example
```php
abstract class ApiVersionTestCase extends TestCase
{
    abstract protected function apiPrefix(): string;

    protected function getJson($uri, array $headers = []): TestResponse
    {
        return parent::getJson($this->apiPrefix() . $uri, $headers);
    }

    /** @test */
    public function it_returns_consistent_error_shape()
    {
        $this->getJson('/posts')->assertUnauthorized()->assertExactJson(['message' => 'Unauthenticated.']);
    }
}

class V1PostsTest extends ApiVersionTestCase
{
    protected function apiPrefix(): string { return '/api/v1'; }
}

class V2PostsTest extends ApiVersionTestCase
{
    protected function apiPrefix(): string { return '/api/v2'; }
}
```
---
## Exceptions
When versions intentionally differ in shared contracts (e.g., v2 changed error shape), extract version-specific traits instead.
---
## Consequences Of Violation
Duplicate test logic across versions; shared shape changes require editing every version test; high maintenance cost.
---

## Test Deprecation Headers On Deprecated Versions
---
## Category
Testing
---
## Rule
Always assert `Deprecation: true` and `Sunset` headers on deprecated API versions.
---
## Reason
RFC 8594 defines the `Deprecation` and `Sunset` headers for API deprecation signaling. Without these headers, clients have no programmatic way to know a version is deprecated. Automated tests ensure deprecation signaling is applied before manual deprecation announcements.
---
## Bad Example
```php
it('returns v1 posts', function () {
    $this->getJson('/api/v1/posts')->assertOk();
    // No deprecation header assertion — v1 may be deprecated silently
});
```
---
## Good Example
```php
it('signals v1 deprecation', function () {
    $this->getJson('/api/v1/posts')
        ->assertOk()
        ->assertHeader('Deprecation', 'true')
        ->assertHeader('Sunset', 'Sat, 1 Jan 2026 00:00:00 GMT');
});

it('v2 has no deprecation header', function () {
    $this->getJson('/api/v2/posts')
        ->assertOk()
        ->assertHeaderMissing('Deprecation');
});
```
---
## Exceptions
When no API version is currently deprecated, deprecation header tests may be prepared but skipped.
---
## Consequences Of Violation
Clients unaware of deprecation; sunset date passes without migration; broken clients after version removal.
---

## Test Unsupported Version Returns 404
---
## Category
Testing
---
## Rule
Assert that accessing an unsupported version (e.g., `/api/v3/posts` when v3 doesn't exist) returns 404 or a documented error.
---
## Reason
An unsupported version prefix may accidentally match an unrelated route, return a 500 error, or worse — return data from the default version without the client knowing. Testing the unsupported version response ensures the versioning middleware correctly rejects unknown versions.
---
## Bad Example
```php
// No test for version that doesn't exist
it('lists v2 posts', fn () => $this->getJson('/api/v2/posts')->assertOk());
```
---
## Good Example
```php
it('rejects unsupported version with 404', function () {
    $this->getJson('/api/v3/posts')
        ->assertNotFound()
        ->assertJson(['message' => 'Not Found.']);
});

it('rejects future version with 404', function () {
    $this->getJson('/api/v99/posts')->assertNotFound();
});
```
---
## Exceptions
When the versioning strategy uses accept-header or query-parameter (not URL prefix), test the unsupported version value in the header/parameter.
---
## Consequences Of Violation
Unsupported version returns default version data silently; client thinks it's using v3 but gets v1 data; data misinterpretation.
---

## Use PestPHP Describe With Version Prefix
---
## Category
Maintainability
---
## Rule
Use PestPHP `describe()` with `beforeEach` to set the version base URL, reducing repetition across version-specific tests.
---
## Reason
Every version-specific test method must target the correct URL prefix. Repeating `/api/v2/posts`, `/api/v2/users` in every test creates noise and increases the chance of version-mixing bugs. A `describe()` + `beforeEach` block sets the prefix once.
---
## Bad Example
```php
it('v2 lists posts', fn () => $this->getJson('/api/v2/posts')->assertOk());
it('v2 shows a post', fn () => $this->getJson('/api/v2/posts/1')->assertOk());
it('v2 creates a post', fn () => $this->postJson('/api/v2/posts', $data)->assertCreated());
// Repetitive '/api/v2/' prefix in every test
```
---
## Good Example
```php
describe('V2 API', function () {
    beforeEach(fn () => $this->prefix = '/api/v2');

    it('lists posts', fn () => $this->getJson("{$this->prefix}/posts")->assertOk());
    it('shows a post', fn () => $this->getJson("{$this->prefix}/posts/1")->assertOk());
    it('creates a post', fn () => $this->postJson("{$this->prefix}/posts", $data)->assertCreated());
});
```
---
## Exceptions
When the API only has one version, a prefix variable may be unnecessary overhead.
---
## Consequences Of Violation
Repetitive hardcoded URL prefixes; version copy-paste errors; high noise-to-signal ratio in test code.
---

## Version Per-Endpoint Response Shape Separately
---
## Category
Testing
---
## Rule
Assert that v1 and v2 of the same endpoint return their documented (potentially different) response shapes.
---
## Reason
V2 may add fields, rename keys, or restructure nested data compared to v1. A single shape test applied to both versions passes for one and fails for the other. Version-specific shape tests ensure each version's contract is independently verified.
---
## Bad Example
```php
it('returns posts with author_name', function () {
    // Used by both V1 and V2 — but V2 may not have author_name
})->group('v1', 'v2');
```
---
## Good Example
```php
describe('V1', function () {
    beforeEach(fn () => $this->prefix = '/api/v1');

    it('returns posts with author_name field', function () {
        $this->getJson("{$this->prefix}/posts")
            ->assertJsonStructure(['data' => ['*' => ['id', 'author_name']]]);
    });
});

describe('V2', function () {
    beforeEach(fn () => $this->prefix = '/api/v2');

    it('returns posts with nested author object', function () {
        $this->getJson("{$this->prefix}/posts")
            ->assertJsonStructure(['data' => ['*' => ['id', 'author' => ['id', 'name']]]]);
    });
});
```
---
## Exceptions
When versions share the exact same response shape, a shared shape helper may be used instead of duplicated assertions.
---
## Consequences Of Violation
Cross-version shape contamination; v2 changes validated against v1 expectations; contract breaks undetected.
---
