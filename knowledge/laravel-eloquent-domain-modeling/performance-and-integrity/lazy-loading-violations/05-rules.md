## Enable preventLazyLoading in Development with Throw Behavior
---
## Category
Performance
---
## Rule
Call `Model::preventLazyLoading()` with `true` in the `AppServiceProvider::boot()` method, gated by `app()->isLocal()`.
---
## Reason
`preventLazyLoading(true)` converts every accidental lazy load into an immediate `LazyLoadingViolationException` with a clear stack trace. This catches N+1 violations at development time when they are cheapest to fix, rather than in production when they degrade user experience.
---
## Bad Example
```php
public function boot(): void
{
    // No lazy loading prevention — N+1 goes unnoticed
}
```
---
## Good Example
```php
public function boot(): void
{
    Model::preventLazyLoading(app()->isLocal());
}
```
---
## Exceptions
Codebases with many third-party packages that use lazy loading internally. Use a custom handler to ignore specific model/relation combinations instead of disabling globally.
---
## Consequences Of Violation
N+1 queries ship to production. Page load times degrade silently as data grows. The issue is discovered through user complaints or monitoring alerts, not during development.
---
## Enable shouldBeStrict in Development and CI
---
## Category
Maintainability
---
## Rule
Call `Model::shouldBeStrict()` in the `AppServiceProvider::boot()` for local and CI environments.
---
## Reason
`shouldBeStrict()` (Laravel 10+) bundles `preventLazyLoading()`, `preventSilentlyDiscardingAttributes()`, and `preventAccessingMissingAttributes()` — three data integrity protections in one call. This prevents both N+1 violations and subtle bugs from silently discarded `fill()` values or accessed missing attributes.
---
## Bad Example
```php
public function boot(): void
{
    Model::preventLazyLoading(app()->isLocal());
    // Silently discarded attributes and missing attribute access are unchecked
}
```
---
## Good Example
```php
public function boot(): void
{
    if (app()->isLocal()) {
        Model::shouldBeStrict();
    }
}
// All three protections enabled
```
---
## Exceptions
Third-party package incompatibility. Disable individual modes (`preventSilentlyDiscardingAttributes(false)`) while keeping others active, rather than disabling `shouldBeStrict()` entirely.
---
## Consequences Of Violation
Developers overwrite model attributes that were silently discarded, or access missing attributes getting `null` instead of an error. These bugs are subtle and often discovered in production.
---
## Never Enable Throw Behavior in Production
---
## Category
Reliability
---
## Rule
Do not pass `true` to `preventLazyLoading()` or enable `shouldBeStrict()` in production environments.
---
## Reason
A single lazy load in a hot code path throws `LazyLoadingViolationException`, breaking the entire request for all users. Production environments should log violations, not throw exceptions. Even well-audited codebases can trigger lazy loads through third-party packages or edge cases.
---
## Bad Example
```php
public function boot(): void
{
    Model::preventLazyLoading(true); // Enabled in production — crashes on any lazy load
}
```
---
## Good Example
```php
public function boot(): void
{
    Model::preventLazyLoading(false, function ($model, $relation) {
        Log::warning("Lazy load: {$model->getTable()}.{$relation}");
    });
}
// Logs violations instead of throwing
```
---
## Exceptions
No common exceptions. Production throw behavior is never acceptable.
---
## Consequences Of Violation
500 errors for any code path with an accidental lazy load. A single missing `with()` in a Blade view that renders on every page crashes the entire page for all users.
---
## Configure Custom Handler for Package Compatibility
---
## Category
Maintainability
---
## Rule
Use a custom violation handler to ignore known package lazy loads instead of disabling strict mode globally.
---
## Reason
Third-party packages may internally lazy-load relationships. Disabling `preventLazyLoading()` globally because of packages removes enforcement for your application code too. A custom handler selectively ignores known package violations while keeping enforcement active for your own code.
---
## Bad Example
```php
public function boot(): void
{
    // Package triggers violations — disabled globally
    // Model::preventLazyLoading(false);
    // Now your code's N+1 violations are also undetected
}
```
---
## Good Example
```php
public function boot(): void
{
    Model::preventLazyLoading(false, function ($model, $relation) {
        $ignored = ['media' => SpatieMediaLibrary::class];
        if (($ignored[$relation] ?? null) === get_class($model)) {
            return; // Ignore — known package behavior
        }
        throw new LazyLoadingViolationException($model, $relation);
    });
}
```
---
## Exceptions
No third-party packages that use lazy loading — the default throw behavior is sufficient.
---
## Consequences Of Violation
All N+1 enforcement is lost because the global flag is disabled. Your application code's N+1 violations go undetected, and performance degrades silently.
---
## Enable in TestCase::setUp
---
## Category
Testing
---
## Rule
Add `Model::preventLazyLoading()` to the `setUp()` method of your base `TestCase` class.
---
## Reason
Test suite enforcement catches N+1 violations before they reach staging or production. Every test that accidentally triggers lazy loading will fail immediately with a clear cause, preventing the violation from being merged into the main branch.
---
## Bad Example
```php
class TestCase extends BaseTestCase
{
    // No setUp — tests don't catch lazy loading violations
}
```
---
## Good Example
```php
class TestCase extends BaseTestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Model::preventLazyLoading();
    }
}
```
---
## Exceptions
Tests that intentionally test lazy loading behavior (rare). Disable enforcement per-test with `Model::preventLazyLoading(false)` in that specific test.
---
## Consequences Of Violation
N+1 violations pass CI and ship to production. The test suite produces green results for code that triggers hundreds of queries on a single page load.
---
## Combine with Query Count Assertions for Full Coverage
---
## Category
Testing
---
## Rule
Pair `preventLazyLoading()` with `assertQueryCountLessThan()` tests to cover both property-access lazy loads and method-chain lazy loads.
---
## Reason
`preventLazyLoading()` only catches dynamic property access (`$model->relation`). Method-chain lazy loads (`$model->relation()->where(...)->get()`) are intentional query builder invocations and are not caught. Query count assertions catch both patterns.
---
## Bad Example
```php
public function test_post_index(): void
{
    Model::preventLazyLoading();
    $response = $this->get('/posts');
    // Only catches $post->comments property access
    // Misses $post->comments()->where('approved', 1)->get() inside a Blade component
}
```
---
## Good Example
```php
public function test_post_index(): void
{
    Model::preventLazyLoading();
    $response = $this->get('/posts');
    $response->assertOk();
    $this->assertQueryCountLessThan(10);
    // Catches both property access N+1 and method-chain N+1
}
```
---
## Exceptions
Endpoints that legitimately use method-chain lazy loading (rare pattern — usually a design smell).
---
## Consequences Of Violation
False sense of security. The team believes strict mode prevents all N+1, but method-chain lazy loads in Blade components, accessors, or API resources continue to cause query explosions.
