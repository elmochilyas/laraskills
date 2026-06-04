# Single-Action Invokable Controllers

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Single-Action Invokable Controllers
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Laravel supports invokable controllers—controllers that handle a single action via the `__invoke` magic method. When a controller only needs one method, the invokable pattern eliminates the class boilerplate of naming and defining a method. The route points directly to the controller class without specifying a method.

This pattern is ideal for simple, focused actions: a dashboard showing statistics, a contact form submission handler, a search endpoint, or a redirect. By reducing the controller to its essential action, invokable controllers encourage small, single-responsibility classes that are easier to test, understand, and maintain.

---

## Core Concepts

- **__invoke Method**: The single method that handles the incoming request. No other public methods exist.
- **Route Without Method**: `Route::get('/dashboard', DashboardController::class)` — no `@method` suffix.
- **Single Responsibility**: Each invokable controller does exactly one thing.
- **Auto-Resolution**: Laravel's service container resolves the controller and calls `__invoke` automatically.
- **Naming Convention**: Typically `{Action}Controller` (e.g., `SearchPostsController`) or `{Feature}` (e.g., `DashboardController`).

---

## Mental Models

- **Action as Class**: An invokable controller is a function wrapped in a class. It is a callable object.
- **Handler Pattern**: Similar to command handlers or action classes — one class, one purpose, one entry point.
- **Route as Function Call**: `Route::get('/search', SearchPostsController::class)` means "when `/search` is requested, call this object."

---

## Internal Mechanics

When a route is defined without a method (`Route::get('/dashboard', DashboardController::class)`), the `Router` checks if the controller class has a `__invoke` method. During route dispatching, `ControllerDispatcher::dispatch()` resolves the controller from the container and calls `$controller->__invoke(...)`.

This is the relevant path in `Illuminate\Routing\ControllerDispatcher`:

```php
public function dispatch(Route $route, $controller, $method)
{
    $method = method_exists($controller, $method) ? $method : '__invoke';
    return $this->callMethod($route, $controller, $method);
}
```

If the specified method does not exist, `__invoke` is used as the fallback. This means a route like `Route::get('/dashboard', [DashboardController::class, 'index'])` will also work if only `__invoke` exists (though this is non-idiomatic).

Invokable controllers support all the same features as regular controllers: dependency injection via constructor and method signatures, middleware, and form request injection.

---

## Patterns

- **Basic Invokable Controller**:
  ```php
  class ShowDashboardController extends Controller
  {
      public function __invoke()
      {
          return view('dashboard', [
              'stats' => DashboardStats::get(),
          ]);
      }
  }
  ```
  ```php
  Route::get('/dashboard', ShowDashboardController::class);
  ```
- **Invokable with Dependency Injection**:
  ```php
  class SearchPostsController extends Controller
  {
      public function __invoke(SearchRequest $request, PostRepository $posts)
      {
          return PostResource::collection($posts->search($request->validated()));
      }
  }
  ```
- **Invokable for API Endpoints**:
  ```php
  class RestoreTrashedPostController extends Controller
  {
      public function __invoke(Post $post)
      {
          $post->restore();
          return response()->noContent();
      }
  }
  ```

---

## Architectural Decisions

- **Why invokable over a named method?** When the controller does exactly one thing, naming the method is redundant. `$controller->__invoke()` communicates "this object is callable" rather than "pick a method name."
- **Why invokable over a closure route?** Closures cannot be cached in `route:cache`. Invokable controllers are fully cacheable and testable in isolation.
- **Why not make all controllers invokable?** Resource controllers serve multiple actions by design. Invokable is for single-purpose endpoints only.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Clear single-responsibility signal | File-per-action overhead | Large apps may have dozens of controller files |
| No method name decision needed | Cannot handle multiple related actions in one class | Related endpoints require separate classes or a resource controller |
| Fully cacheable (unlike closures) | Slightly more ceremony than a closure | Acceptable tradeoff for route caching benefits |

---

## Performance Considerations

- Invokable controllers have identical performance to named-method controllers. The `__invoke` fallback is resolved once during the first request and cached in the route configuration.
- Route caching works identically: `php artisan route:cache` serializes the fully qualified class name.
- No reflection overhead after the first request; Laravel caches the controller method resolution.

---

## Production Considerations

- Name invokable controllers descriptively: `SearchPostsController` not `PostSearchController` to keep the action verb first.
- Keep invokable controllers under a reasonable line count (20–30 lines). If it grows, delegate to service or action classes.
- Use invokable controllers for webhook handlers, callback endpoints, search endpoints, and simple form submissions.
- Register them with `php artisan make:controller --invokable` in Laravel 8+.

---

## Common Mistakes

- **Using invokable for multi-action controllers**: A controller that needs `index()`, `store()`, and `__invoke()`.
  - *Why it happens:* Gradually adding methods to an invokable controller.
  - *Why it's harmful:* Violates single-responsibility; route registration becomes ambiguous.
  - *Better approach:* Convert to a resource controller or split into multiple invokable controllers.

- **Forgetting the `__invoke` method**: Class exists, route is registered, but `__invoke` is not defined.
  - *Why it happens:* Defining an `index()` method instead of `__invoke()`.
  - *Why it's harmful:* `ControllerDispatcher` returns a 500 error.
  - *Better approach:* Use `php artisan make:controller --invokable` to generate the skeleton.

- **Using invokable where a resource belongs**: Registering separate invokable controllers for `index`, `show`, `store`, etc., instead of a single resource controller.
  - *Why it happens:* Over-application of the invokable pattern.
  - *Why it's harmful:* Proliferation of files and non-standard route registration.
  - *Better approach:* Use `Route::resource()` unless the endpoint is genuinely standalone.

---

## Failure Modes

- **Invokable controller with middleware in `$routeMiddleware` instead of constructor**: Middleware applied in constructor may not execute if the route caches differently. *Detection:* Missing middleware behavior on cached routes. *Mitigation:* Apply middleware in `routes/api.php` or use controller middleware methods.

- **Missing `__invoke` causes 500 error at route dispatch time**: The framework does not validate `__invoke` existence at registration time. *Detection:* 500 error when hitting the route. *Mitigation:* Write a test that issues a GET/HEAD request to each invokable route to verify it resolves.

- **Route caching with invokable classes that have constructor dependencies requiring the app context**: If the constructor depends on a request-aware binding, cached routes may resolve incorrectly. *Detection:* Different behavior between cached and non-cached routes. *Mitigation:* Avoid request-aware constructor dependencies in invokable controllers.

---

## Ecosystem Usage

- **Laravel Horizon (Dashboard)**: Uses `HomeController@__invoke` (or equivalent invokable) for the single-dashboard endpoint.
- **Spatie Medialibrary**: Provides invokable controllers for temporary upload handling (single-action upload endpoint).
- **Laravel Spark (Webhooks)**: Invokable controllers for Stripe webhook handling, where each webhook type has its own single-action controller.

---

## Related Knowledge Units

### Prerequisites
- Controller Fundamentals
- Route Registration Basics

### Related Topics
- Partial Resource Routes
- Single-Action Invokable Controllers

### Advanced Follow-up Topics
- Controller Action Delegation
- Controller Dependency Injection

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ControllerDispatcher::dispatch()` — invokable fallback logic
- `Illuminate\Routing\Router::get('/url', SomeController::class)` — no-method route registration

### Key Insight
The `__invoke` pattern transforms a controller into a callable, making the class its own route handler. The framework's method resolution checks for the named method first and falls back to `__invoke` — meaning the pattern works even if not explicitly intended.

### Version-Specific Notes
- `php artisan make:controller --invokable` introduced in Laravel 8.
- The `__invoke` fallback in `ControllerDispatcher` has existed since Laravel 5.3+.
- No behavioral changes in Laravel 9–11.
