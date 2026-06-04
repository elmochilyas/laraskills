# Controller Architecture

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Controller Architecture
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-01

---

## Executive Summary

A controller is a class that groups related HTTP request handling logic. The framework does not require extending a base class — any class with invokable methods can act as a controller. The base `Illuminate\Routing\Controller` is a convenience class providing middleware registration and a `callAction()` interception point, but it is not a framework-enforced contract.

The engineering significance of controllers lies in their role as the HTTP boundary layer. Every incoming request that reaches application code passes through a controller method (or a closure, which the controller system replaces in production via route caching). The controller's architectural role is delegation: it validates the request (via Form Requests), invokes business logic (via Services/Actions), and returns a response (via Resources/views). The quality of this delegation determines the maintainability of the entire HTTP layer.

Controller dispatch follows a deterministic pipeline: `Router::dispatch()` → `Route::run()` → `ControllerDispatcher::dispatch()` → `callAction()` → `$this->{$method}()`. The controller instance is resolved from the container once and cached on the Route object for the request lifetime. Method dependencies are resolved at dispatch time via the `ResolvesRouteDependencies` trait, which injects route parameters first and then resolves remaining type-hinted dependencies from the container.

---

## Core Concepts

### Controller Resolution
Controllers are resolved from the container at dispatch time via `Route::getController()`, which calls `$this->container->make(ltrim($class, '\\'))`. The resolved instance is cached on the Route object (`$this->controller`) so that middleware gathering and dispatch share the same instance without re-resolution.

### Two Dispatch Paths
`ControllerDispatcher::dispatch()` checks for the existence of `callAction()` on the controller:
1. **If `callAction()` exists** (controller extends base `Controller` class): calls `$controller->callAction($method, $parameters)`, which defaults to `$this->{$method}(...array_values($parameters))`. The `callAction()` method can be overridden to intercept dispatch (used by `AuthorizesRequests` and `ValidatesRequests` traits).
2. **If `callAction()` does not exist** (plain PHP class): calls `$controller->{$method}(...array_values($parameters))` directly.

Both paths use `array_values()` to discard named keys from the route parameters array and splat them as positional arguments.

### Base Controller Class
`Illuminate\Routing\Controller` is abstract with zero abstract methods. It provides:
- **`$middleware` array** — stores middleware registrations with their `only`/`except` options
- **`middleware($middleware, $options)`** — registers middleware, returns `ControllerMiddlewareOptions` for fluent chaining
- **`callAction($method, $parameters)`** — default dispatch: `$this->{$method}(...array_values($parameters))`
- **`__call($method, $parameters)`** — throws `BadMethodCallException` for undefined methods (provides the error when a resource method is missing)
- **`getMiddleware()`** — returns the raw middleware array

The base class is convenience, not enforcement. A controller that extends it gets middleware registration and `callAction()` interception for free. A controller that does not extend it must use route-level middleware and cannot intercept dispatch.

### Controller Lifecycle

```
Route::run()
  ├── isControllerAction() ? runController() : runCallable()
  │
  ├── runController():
  │     ├── getController() — Container::make(), cached on Route
  │     ├── getControllerMethod() — parses @method from action string
  │     ├── gatherMiddleware() — merges route + controller middleware
  │     └── ControllerDispatcher::dispatch($route, $controller, $method)
  │           ├── resolveParameters() — method dependency injection
  │           │     ├── Route parameters injected first (by position)
  │           │     ├── Missing type-hinted deps resolved from container
  │           │     └── Already-resolved models skipped (alreadyInParameters check)
  │           ├── callAction() or direct call
  │           └── Return controller result
  │
  └── Router::prepareResponse() — normalizes all return types to Response
```

### Route Action Parsing
`RouteAction::parse()` processes the route definition:
- **Closure**: stored as `['uses' => $closure]`
- **Array callable** `[Class::class, 'method']`: normalized to string `'Class@method'`
- **String without `@`**: `makeInvokable()` checks for `__invoke`, appends `@__invoke`
- **String with `@`**: stored as `['uses' => 'Class@method']`

The `isControllerAction()` check returns true when `uses` is a string (not a Closure) and the string is not a serialized closure. All normalized formats (`Class@method` and `Class@__invoke`) pass this check.

---

## Mental Models

### Controller as HTTP Boundary
The controller marks the boundary between HTTP concerns (request parsing, response formatting, status codes) and application concerns (business logic, data access, domain rules). Code on the HTTP side belongs in middleware, Form Requests, and Resources. Code on the application side belongs in Services, Actions, and domain logic. The controller sits at the boundary and connects them.

### Controller as Delegation Layer
A controller's job is to delegate: accept the validated request, decide which service to invoke, decide which response to return. It does not implement business logic. It does not query the database. It does not format HTML or JSON directly. It receives, delegates, and returns.

### Instance vs. Per-Request
The controller instance is created once per request and cached on the Route object. This means constructor injection resolves once, and the same instance is used for middleware gathering and method dispatch. The controller is not a singleton across requests — each request gets a fresh instance from the container.

---

## Internal Mechanics

### Route::getController() Resolution

```php
Route::getController()
  ├── if $this->controller is set (cached): return it
  ├── $class = $this->getControllerClass()
  │     └── Parse 'Class@method', return 'Class'
  ├── $this->controller = $this->container->make(ltrim($class, '\\'))
  ├── // Controller instance is cached for the route's lifetime
  └── return $this->controller
```

The container's `make()` method resolves constructor dependencies via reflection. If the controller has a constructor with type-hinted parameters, they are resolved recursively from the container. This is the mechanism for constructor injection.

### ControllerDispatcher::dispatch() Flow

```php
ControllerDispatcher::dispatch(Route $route, $controller, $method)
  ├── $this->resolveParameters($route, $controller, $method)
  │     └── resolveClassMethodDependencies(
  │              $route->parametersWithoutNulls(),
  │              new ReflectionMethod($controller, $method)
  │          )
  │
  ├── if method_exists($controller, 'callAction'):
  │     └── $controller->callAction($method, $parameters)
  │           └── // Default: $this->{$method}(...array_values($parameters))
  │
  └── else:
        └── $controller->{$method}(...array_values($parameters))
```

The `resolveClassMethodDependencies()` method performs the dependency injection:
1. Iterates the `ReflectionMethod` parameters
2. For each parameter, calls `transformDependency()`:
   - If parameter matches a route parameter (by type): skip (already injected)
   - If parameter has a type hint not in route params: resolve from container
   - If parameter has a default value: use it
3. Returns the merged parameter array

### Controller Caching on Route

The controller instance is cached on `Route::$controller` after first resolution. This means:
- `Route::getController()` always returns the same instance for the same route
- `Route::controllerMiddleware()` (called during middleware gathering) uses the same instance
- The controller is not resolved multiple times

### Route::runController() Dispatch Entry

```php
Route::runController()
  ├── $this->getController()  // Resolve + cache
  ├── $method = $this->getControllerMethod()  // Parse @method
  ├── return $this->controllerDispatcher()->dispatch(
  │         $this,
  │         $this->getController(),
  │         $method
  │     )
  └── // Result flows to Router::prepareResponse() for normalization
```

---

## Patterns

### Canonical Controller Method Pattern
```php
public function store(StoreUserRequest $request, UserService $service)
{
    $user = $service->create($request->toDto());
    return new UserResource($user);
}
```
Form request validates → Service executes → Resource formats response. The controller delegates both directions.

### Action Interception Pattern
Overriding `callAction()` for cross-cutting behavior:
```php
protected function callAction($method, $parameters)
{
    $this->logAction($method);
    $result = parent::callAction($method, $parameters);
    $this->logResponse($result);
    return $result;
}
```
Used internally by `AuthorizesRequests` and `ValidatesRequests` traits.

### Resource Controller Pattern
```php
class UserController extends Controller
{
    public function index() { /* list */ }
    public function create() { /* form */ }
    public function store(Request $request) { /* persist */ }
    public function show(User $user) { /* single */ }
    public function edit(User $user) { /* form */ }
    public function update(Request $request, User $user) { /* update */ }
    public function destroy(User $user) { /* delete */ }
}
```
The 7 standard RESTful methods matching `Route::resource('users', UserController::class)`. This is the default convention.

### Invokable Controller Pattern
```php
class ShowDashboardController extends Controller
{
    public function __invoke()
    {
        return view('dashboard');
    }
}
```
Single-action controller dispatched via `Route::get('/dashboard', ShowDashboardController::class)`.

---

## Architectural Decisions

### Why Base Controller Is Optional
Controllers that do not extend the base class still work because the dispatch system only requires a callable method. The base class provides middleware registration and `callAction()` interception — features that are valuable but not mandatory. This flexibility allows controllers to be plain PHP objects when middleware and interception are handled at the route level.

### Why Two Dispatch Paths Exist
The two-path dispatch (callAction vs direct) provides an interception hook without requiring inheritance from the base class. Controllers that extend `Controller` get `callAction()` by default. Controllers that don't extend it fall through to direct method invocation. The `method_exists()` check is the distinguisher.

### Why Controller Is Cached on Route
The controller instance is cached on the Route object because both middleware gathering (`controllerMiddleware()` → `getMiddleware()`) and method dispatch (`runController()` → `dispatch()`) need access to the same instance. Caching prevents double-resolution and ensures middleware and dispatch operate on the same state.

### Why array_values() Is Used in Dispatch
Route parameters maintain named keys (`['user' => $user, 'post' => $post]`), but PHP method parameters are positional. `array_values()` strips the named keys so the parameters splat correctly into the method signature in the correct order.

---

## Tradeoffs

### Extending Base Controller vs Plain Class

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Base: Middleware registration via `$this->middleware()` | Couples controller to framework base class | Cannot use in contexts that require zero dependencies |
| Base: `callAction()` interception for cross-cutting hooks | Extra method call in dispatch chain | Negligible performance cost but adds conceptual complexity |
| Plain: Zero framework coupling, pure PHP | No middleware registration, no interception | All middleware must be route-level |

### Controller vs Closure Routes

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Controller: Cacheable, testable, middleware-able | Requires class file | More files, but each route is independently testable |
| Closure: Zero ceremony, inline with route | NOT cacheable by route:cache | Single closure blocks all route caching |
| Controller: Constructor DI for shared dependencies | Resolution on every request | Container::make() adds ~0.5-2ms per controller resolution |
| Closure: No resolution needed, directly callable | No DI support without manual wiring | Must use helper functions or container directly |

---

## Performance Considerations

### Controller Resolution Cost
`Container::make()` resolves constructor dependencies via reflection. For a typical controller with 2-3 service dependencies, resolution adds ~1-3ms. The controller is cached on the Route object after first resolution, so the cost is paid once per request regardless of how many times `getController()` is called.

### Method Dependency Resolution Cost
`ResolvesRouteDependencies::resolveMethodDependencies()` reflects on the method parameters on every dispatch. This is NOT cached — each request re-reflects the method signature. For typical methods with 2-4 parameters, reflection adds ~0.5-1ms per call.

### Controller Dispatch Overhead
The total dispatch overhead (controller resolution + method dependency resolution + method invocation) for a typical controller is ~2-5ms per request. This is negligible compared to database queries and business logic execution.

### callAction() Overhead
The `callAction()` path adds one extra method call (`callAction()` → `{$method}()`) compared to direct invocation. The `array_values()` call creates a new array. Combined overhead is <0.01ms.

---

## Production Considerations

### Controller Method Signature Stability
Controller method signatures are part of the route contract. Changing a method signature (adding/removing parameters) breaks the route dispatch. Unlike route URIs which are documented, method signatures are implicit — a deployment that changes a controller method signature without updating its route causes runtime errors.

### Missing Controller Method Detection
A route referencing a non-existent controller method throws `BadMethodCallException` (via `Controller::__call()`) at runtime. This cannot be detected at compile time. Production CI should include route smoke tests that hit every named route.

### Controller Instance Freshness
Each request creates a fresh controller instance. Controllers must not store request-scoped state in class properties — doing so can cause state leakage in Octane (long-running process) environments.

### Octane Considerations
In Laravel Octane, the controller class is resolved once and cached. Controllers with mutable state will leak state across requests. Controllers must be stateless — all request-specific data must be stored in method parameters or the request object.

---

## Common Mistakes

### Storing State on Controller Properties
Why it happens: Convenient way to share data between middleware, method, and `callAction()`. Why it's harmful: State leaks across requests in Octane (long-running process). The property set by one request persists for the next. Better approach: Store request-specific data on the Request object via `$request->attributes->set()`.

### Expecting Controller to Be Singleton
Why it happens: Controller is resolved once per route match. Why it's harmful: Developers add caching or shared state assuming the controller persists across requests. Better approach: Treat every controller as a fresh instance per request.

### Not Using Base Controller for Middleware-Only Features
Why it happens: Using a plain class with route-level middleware for everything. Why it's harmful: Loses the per-method middleware filtering (`->only()` / `->except()`) that controller-level middleware provides. Better approach: Extend base Controller when per-method middleware filtering is needed.

### Overriding callAction() Without Calling Parent
Why it happens: Custom interception logic. Why it's harmful: The `AuthorizesRequests` and `ValidatesRequests` traits hook into `callAction()`. Overriding without `parent::callAction()` disables authorization and validation for that controller. Better approach: Use middleware or traits instead of overriding `callAction()`.

---

## Failure Modes

### BadMethodCallException — Method Not Found
A route references a controller method that doesn't exist. `Controller::__call()` throws `BadMethodCallException: Method [methodName] does not exist.`. Most common with resource routes when a method is missing. Cannot be detected at compile time — only at runtime when the route is hit.

### Container Resolution Failure
Controller constructor has a dependency that the container cannot resolve (unbound interface, missing class). `BindingResolutionException` is thrown during `Container::make()` at `getController()` time. The error occurs before middleware or method dispatch runs.

### TypeError at Method Dispatch
Method signature expects parameters in a different order than route parameters provide. PHP 8+ throws `TypeError` when parameter types don't match. Most common when route parameters change without updating the controller method signature.

---

## Ecosystem Usage

### Laravel Framework
First-party packages (Horizon, Telescope, Pulse) use controllers that extend the base `Controller` class. They use `callAction()` for authorization checks (via `AuthorizesRequests` trait). No first-party package uses plain PHP classes as controllers.

### Spatie Packages
Spatie packages that register routes use controllers extending the base class when middleware registration is needed. Some use invokable controllers for simple endpoints.

### Monica CRM
Monica uses controllers that extend the base `Controller` class. Each controller uses `AuthorizesRequests` and `ValidatesRequests` traits for authorization and validation. Controllers are thin — most delegate to services.

### Jetstream
Jetstream controllers extend the base `Controller` class and use `AuthorizesRequests`. They are organized by feature (team management, user profile, API token management).

---

## Related Knowledge Units

### Prerequisites
- Route Definition — How routes map to controllers
- Service Container Basics — Container::make() for controller resolution

### Related Topics
- Dependency Injection — Constructor vs method injection in controllers
- Controller Middleware — Three strategies for middleware on controllers
- Thin Controller Principles — The delegation role of controllers
- Resource Controllers — The 7 standard RESTful methods

### Advanced Follow-up Topics
- Single-Action Controllers — When __invoke() replaces multi-action
- Controller Organization — Namespace and directory strategies
- Controller Testing — HTTP vs unit tests for controllers

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\Controller.php` — Base class (74 lines), middleware storage, `callAction()`, `__call()`
- `Illuminate\Routing\ControllerDispatcher.php` — `dispatch()`, `resolveParameters()`, `getMiddleware()`
- `Illuminate\Routing\Route.php` — `runController()`, `getController()`, `getControllerMethod()`, `controllerMiddleware()`
- `Illuminate\Routing\Router.php` — `dispatch()`, `dispatchToRoute()`, `runRouteWithinStack()`, `gatherRouteMiddleware()`
- `Illuminate\Routing\RouteAction.php` — `parse()`, `makeInvokable()`, `isSerializedClosure()`
- `Illuminate\Routing\ResolvesRouteDependencies.php` — `resolveMethodDependencies()`, `transformDependency()`, `alreadyInParameters()`
- `Illuminate\Routing\CallableDispatcher.php` — Closure dispatch (alternative to controller dispatch)

### Key Insight
The controller is an optional abstraction layer between the route definition and the response. The framework treats controllers and closures equivalently at the dispatch level — both go through dependency resolution, both return values that are normalized by `prepareResponse()`. The only enforced difference is route caching: controller strings are serializable, closures are not. This equivalence suggests that the choice between controllers and closures should be driven by caching and organization needs, not by dispatch behavior.

### Version-Specific Notes
- Controller dispatch behavior is consistent across Laravel 10-13
- `callAction()` interception is stable through all versions
- `ResolvesRouteDependencies` trait replaced `RouteDependencyResolverTrait` in Laravel 11
- Controller caching on Route object is present in all versions
