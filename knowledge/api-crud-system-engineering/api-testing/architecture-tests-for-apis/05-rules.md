# Architecture Tests for APIs — Rules

## Enforce Namespace Conventions
---
## Category
Architecture
---
## Rule
Use PestPHP `arch()->expect()->toExtend()` to enforce that all API controllers, form requests, and services extend correct base classes.
---
## Reason
A controller that extends the wrong base class misses shared functionality (error handling, pagination helpers). A form request that doesn't extend the base request class bypasses shared validation. Architecture tests catch these violations automatically without code review.
---
## Bad Example
```php
// No arch test — developer accidentally extends Controller instead of ApiController
class PostController extends Controller { ... }
```
---
## Good Example
```php
arch('API Controllers')
    ->expect('App\Http\Controllers\Api')
    ->toExtend('App\Http\Controllers\ApiController');

arch('Form Requests')
    ->expect('App\Http\Requests\Api')
    ->toExtend('App\Http\Requests\ApiFormRequest');
```
---
## Exceptions
Utility or abstract base classes within the namespace may intentionally extend different bases — exclude them with `->ignoring()`.
---
## Consequences Of Violation
Controllers miss shared error handling; form requests bypass base class validation; inconsistent behavior across the API.
---

## Enforce Test Coverage Per Controller
---
## Category
Testing
---
## Rule
Use architecture tests to assert that every API controller has a corresponding feature test file.
---
## Reason
Controllers added without tests are invisible to the code review process if the reviewer doesn't notice the missing test file. An architecture test that counts `App\Http\Controllers\Api\*` classes and matches them to `Tests\Feature\Api\*` files enforces coverage mechanically.
---
## Bad Example
```php
// Controller exists but no test file — undetected until QA
```
---
## Good Example
```php
arch('All controllers have feature tests')
    ->expect('App\Http\Controllers\Api')
    ->toHaveTestFile();
```
---
## Exceptions
Abstract base controllers and interfaces that have no concrete routes may be excluded from coverage enforcement.
---
## Consequences Of Violation
New endpoints deployed without test coverage; regression bugs emerge in production; CI passes but quality degrades.
---

## Isolate API Routes From Web Routes
---
## Category
Architecture
---
## Rule
Assert that `routes/api.php` does not reference web middleware, `view()`, or session-related code.
---
## Reason
API routes that accidentally use web middleware introduce session state into stateless API responses. A CSRF token requirement on an API endpoint breaks mobile clients. Architecture testing across the routes file catches these cross-contamination bugs.
---
## Bad Example
```php
// routes/api.php — mixed with web concerns
Route::middleware('web')->group(function () {
    Route::get('/posts', [PostController::class, 'index']);
});
```
---
## Good Example
```php
arch('API routes are isolated')
    ->expect('routes/api.php')
    ->not->toUse('web')
    ->not->toUse('view')
    ->not->toUse('session');
```
---
## Exceptions
API routes that intentionally share session state with the web app (e.g., same-domain APIs) may use web middleware.
---
## Consequences Of Violation
Session-based CSRF failures on API endpoints; stateful responses cached and served to wrong users; mobile clients broken.
---

## Forbid DD And Dump Calls In Production Code
---
## Category
Maintainability
---
## Rule
Use architecture tests to forbid `dd()`, `dump()`, `ray()`, and `var_dump()` calls in production code.
---
## Reason
A single `dd()` left in a production controller breaks the entire API endpoint silently — no error, just blank response. Architecture tests catch these debug calls automatically, preventing deployment of broken endpoints.
---
## Bad Example
```php
// production code — accidentally deployed
public function index(): JsonResponse
{
    dd(Post::all()); // Blank response in production
}
```
---
## Good Example
```php
arch('No debug calls in production')
    ->expect('App')
    ->not->toUse(['dd', 'dump', 'ray', 'var_dump', 'print_r']);
```
---
## Exceptions
Helper or debug-only classes within a `Support\Debug` namespace may be excluded with `->ignoring()`.
---
## Consequences Of Violation
Production endpoint returns blank response; API client receives empty body; debugging requires finding stray dd().
---

## Enforce Dependency Rules Between Layers
---
## Category
Architecture
---
## Rule
Use `->toOnlyUse()` to enforce that form requests, DTOs, and services only import allowed dependencies.
---
## Reason
A form request that imports and calls Eloquent models directly couples validation to the database. A DTO that uses a service class violates the DTO's role as a pure data carrier. Explicit allowed-dependency lists prevent layer violations.
---
## Bad Example
```php
// Form request that uses Eloquent — architectural violation
class StorePostRequest extends FormRequest
{
    public function rules(): array
    {
        $existingCount = Post::count(); // Form request should not touch database
        // ...
    }
}
```
---
## Good Example
```php
arch('Form requests only use validation and rules')
    ->expect('App\Http\Requests')
    ->toOnlyUse(['Illuminate\Validation\Rule', 'App\Rules', 'Illuminate\Http\Request']);

arch('Services do not use HTTP concerns')
    ->expect('App\Services')
    ->not->toUse(['Illuminate\Http\Request', 'Illuminate\Http\JsonResponse']);
```
---
## Exceptions
When the dependency rule excludes framework base classes or shared helpers, list them explicitly in `->toOnlyUse()`.
---
## Consequences Of Violation
Tight coupling between layers; untestable form requests; DTOs with side effects; architecture erosion over time.
---

## Run Arch Tests First In CI
---
## Category
Performance
---
## Rule
Run architecture tests as the first CI stage — they complete in <100ms and catch structural violations before feature tests run.
---
## Reason
Architecture tests are the fastest tests (no framework boot, no database). If they fail, feature tests will structurally fail too (wrong base class, missing test file). Running them first provides instant feedback and saves CI minutes.
---
## Bad Example
```yaml
test:
  script: php artisan test --testsuite=Feature,Unit  # Arch tests mixed in — run later
```
---
## Good Example
```yaml
test:arch:
  script: php artisan test --testsuite=Arch --stop-on-failure

test:feature:
  script: php artisan test --testsuite=Feature
  needs: [test:arch]  # Only runs if arch tests pass
```
---
## Exceptions
When arch tests are new and still discovering violations, they may run as non-blocking until baseline is established.
---
## Consequences Of Violation
CI minutes wasted on feature tests that would fail structurally; slow developer feedback loop.
---
