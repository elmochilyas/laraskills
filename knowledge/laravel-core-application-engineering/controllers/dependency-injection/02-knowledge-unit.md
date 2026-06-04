# Dependency Injection in Controllers

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Dependency Injection in Controllers
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-01

---

## Executive Summary

Controllers receive dependencies through two injection points: constructor injection (resolved by `Container::make()` at controller instantiation) and method injection (resolved by `ResolvesRouteDependencies` trait at method dispatch time). Constructor injection is for services shared across multiple methods. Method injection is for request-specific data or services used by a single endpoint.

The engineering significance of the constructor vs method injection choice is that constructor injection resolves ALL dependencies during controller instantiation, even if the current request only needs one method. Method injection resolves lazily — only the dependencies of the called method are resolved. In controllers where many methods share common services, constructor injection is more efficient (resolved once). In controllers where each method has unique dependencies, method injection avoids resolving unused services.

The `transformDependency()` algorithm in `ResolvesRouteDependencies` implements a priority chain: route parameters take precedence over container resolution. If a route model binding has already injected a `User` instance into the parameters, the method's `User $user` parameter receives the bound model rather than a fresh resolution from the container. This prevents model bindings from being overwritten by container resolution.

---

## Core Concepts

### Constructor Injection
Dependencies are declared in the controller's constructor:
```php
class UserController extends Controller
{
    public function __construct(
        private UserService $service,
        private SettingsService $settings,
    ) {}
}
```

Resolved by `Container::make()` during `Route::getController()`. The container reflects on the constructor parameters, resolves each type-hinted class recursively, and creates the controller instance with all dependencies. Constructor injection is resolved once per request — the same controller instance (with its resolved dependencies) is used for all methods.

### Method Injection
Dependencies are declared on individual controller methods:
```php
public function store(StoreUserRequest $request, UserService $service)
```

Resolved by `ResolvesRouteDependencies::resolveMethodDependencies()` during `ControllerDispatcher::resolveParameters()`. The method iterates the method's `ReflectionParameter` list and resolves each dependency that is not already in the route parameters.

### ResolvesRouteDependencies Algorithm

```php
resolveMethodDependencies(array $parameters, ReflectionFunctionAbstract $reflector)
  ├── $instanceCount = 0
  ├── $values = array_values($parameters)
  ├── foreach $reflector->getParameters() as $key => $parameter:
  │     ├── $instance = transformDependency($parameter, $parameters)
  │     │     ├── Check for contextual attribute
  │     │     ├── $className = Reflector::getParameterClassName($parameter)
  │     │     ├── if $className && !alreadyInParameters($className, $parameters):
  │     │     │     └── return $container->make($className)
  │     │     └── return skippable sentinel
  │     │
  │     ├── if instance resolved:
  │     │     ├── $instanceCount++
  │     │     └── spliceIntoParameters($parameters, $key, $instance)
  │     │
  │     └── elseif default value available:
  │           └── spliceIntoParameters($parameters, $key, $defaultValue)
  │
  └── return $parameters (now includes resolved dependencies)
```

### alreadyInParameters Check
`transformDependency()` checks if the parameter's class is already present among the route parameters:
```php
protected function alreadyInParameters($class, array $parameters)
{
    return ! is_null(Arr::first($parameters, fn ($value) => $value instanceof $class));
}
```

This prevents re-resolving implicit route model bindings. If `{user}` has been resolved to a `User` model, a `User $user` parameter in the method receives the bound model rather than triggering a new `$container->make(User::class)`.

### transformDependency Edge Cases
- **Enums with default values**: Returns the default value (supports nullable enum parameters)
- **Enums without defaults**: Falls through to `$container->make()` (resolves from container)
- **Non-enum classes with defaults**: Returns `null` (does not resolve — the default value is used instead)
- **Classes without defaults**: Resolves from `$container->make()`

---

## Mental Models

### Constructor for What the Controller IS
Constructor dependencies define the controller's capabilities — the services it needs to perform all its operations. A `UserController` IS a service that needs `UserService`, `SettingsService`, and `Logger`. These are always needed regardless of which method is called.

### Method for What the Request SENDS
Method dependencies define what the current request provides — the validated input (FormRequest), the authenticated user, or a service needed only for this specific operation. The `store()` method receives `StoreUserRequest` because the request carries new user data. The `show()` method receives `User $user` because the route resolved which user to display.

### Route Parameters First, Container Second
The `alreadyInParameters()` check establishes a priority: if a route parameter already provides an instance of the requested class, the route parameter wins. This ensures route model bindings override container resolution. Without this check, a method with `User $user` would resolve a fresh User from the container instead of using the route-bound model.

---

## Internal Mechanics

### ControllerDispatcher::resolveParameters()

```php
ControllerDispatcher::resolveParameters(Route $route, $controller, $method)
  ├── $parameters = $route->parametersWithoutNulls()
  ├── return $this->resolveClassMethodDependencies(
  │         $parameters,
  │         new ReflectionMethod($controller, $method)
  │     )
  └── // Returns: merged array [route params + resolved dependencies]
```

The method combines route parameters (which may include already-resolved models) with newly resolved dependencies. The `alreadyInParameters()` check prevents duplicate resolution.

### Route::parametersWithoutNulls()

```php
Route::parametersWithoutNulls()
  ├── return array_filter($this->parameters(), fn ($p) => ! is_null($p))
```

Removes parameters that have null values (optional route parameters that were not provided in the URL). This prevents null from being passed to method parameters that expect concrete instances.

### injectParameters From Matching

The route parameter resolution chain:
```
Route::matches()
  ├── RouteParameterBinder::bind()
  │     ├── Extract path parameters (from URI regex)
  │     └── Extract host parameters (from domain regex)
  │
  ├── Router::substituteBindings()       [explicit bindings]
  │     ├── RouteBinding::performBinding()
  │     └── Replaces raw strings with resolved models
  │
  ├── Router::substituteImplicitBindings() [implicit bindings]
  │     ├── ImplicitRouteBinding::resolveForRoute()
  │     └── Replaces remaining strings with models/enums
  │
  └── Route parameters now contain resolved objects + raw strings
```

By the time `ControllerDispatcher::resolveParameters()` runs, some parameters may already be resolved models (from explicit or implicit binding). These are passed through `alreadyInParameters()` and are not re-resolved.

---

## Patterns

### Service Constructor, Request Method Pattern
The universal recommended pattern:
```php
class UserController extends Controller
{
    public function __construct(
        private UserService $userService,
        private Logger $logger,
    ) {}

    public function index()
    {
        return UserResource::collection($this->userService->list());
    }

    public function store(StoreUserRequest $request)
    {
        $user = $this->userService->create($request->toDto());
        $this->logger->info('User created', ['id' => $user->id]);
        return new UserResource($user);
    }
}
```
Services are in the constructor (shared across methods). Request data is in the method (per-request).

### Mixed Injection (Lazy Service)
```php
public function generateReport(GenerateReportRequest $request, ReportGenerator $generator)
{
    return $generator->generate($request->toDto());
}
```
`ReportGenerator` is injected via method injection because it's used by only one endpoint. If `generateReport()` is never called this request, `ReportGenerator` is never resolved.

### Enum Method Injection
```php
public function filter(Category $category)  // Category is a backed enum
{
    // $category is already resolved by enum binding
}
```
Backed enums are resolved by `ImplicitRouteBinding::resolveBackedEnumsForRoute()` before model binding runs. They are in the route parameters when `resolveMethodDependencies()` executes.

### Contextual Attribute Pattern
TransformDependency checks for `Util::getContextualAttributeFromDependency($parameter)` before standard resolution. This allows custom attributes to control how dependencies are resolved:
```php
public function __construct(
    #[CurrentTeam] private Team $team,
) {}
```
The `#[CurrentTeam]` attribute tells the container to resolve `Team` from the current request context rather than from route binding or container binding.

---

## Architectural Decisions

### Why Route Parameters Take Priority
The `alreadyInParameters()` check prevents the container from re-resolving models that route binding has already provided. Without this check, a method with signature `show(User $user)` would receive a fresh `User::make()` from the container instead of the specific user resolved from the `{user}` route parameter. The route parameter priority ensures that route binding is meaningful — developers can type-hint bound models without worrying about container resolution overriding them.

### Why Method Injection Is Not Cached
Unlike constructor injection (which is resolved once per controller instantiation), method injection is resolved fresh every dispatch. The `ResolvesRouteDependencies` trait does not cache reflection results. This is because method signatures are simple (typically 2-4 parameters) and the reflection cost is negligible compared to the clarity of always having current resolution behavior.

### Why Enum Defaults Are Handled Specially
Enums with default values return the default rather than resolving from the container because nullable enum parameters are common (`Category $category = null`). Resolving from the container would break the optionality. Enums without defaults fall through to container resolution.

---

## Tradeoffs

### Constructor vs Method Injection

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Constructor: Resolved once per request | All dependencies resolved even if method not called | Wasted resolution for unused dependencies |
| Constructor: Visible at instantiation time | Harder to lazy-load | All services must be available at construction |
| Method: Resolved only when method called | Re-resolved on every method call | Reflection cost on every dispatch (negligible for small params) |
| Method: Clear per-method dependencies | Not visible until method is called | Must inspect each method to understand its requirements |

### The Universal Heuristic
**Constructor for services, method for request data.** This is the most widely recommended approach across the community:
- Constructor: Services, repositories, gateways, loggers, event dispatchers
- Method: Form Requests (auto-validated), specific service needed only for one endpoint, route model bindings

### Explicit vs Implicit Injection

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Explicit (type-hinted): Clear, IDE-compatible | More verbose than array access | 3-4 parameters max before readability suffers |
| Implicit (facade/helper): Saves parameter space | Hidden dependencies | Testing requires global state management |

---

## Performance Considerations

### Constructor Resolution Cost
Each `Container::make()` call resolves all constructor dependencies recursively. For a controller with 3 service dependencies (each with their own 2-3 dependencies), resolution costs ~2-5ms. This is paid once per request during `Route::getController()`.

### Method Resolution Cost
`resolveMethodDependencies()` reflects on the method parameters and resolves missing dependencies. For typical methods with 2-4 parameters, this costs ~0.5-1ms. The reflection results are NOT cached between requests.

### alreadyInParameters Check
The check iterates the route parameters array looking for an instance of the target class. For typical route sets with 1-3 parameters, this is O(n) where n < 3 — negligible.

### New Instance vs Singleton Resolution
Constructor injection creates fresh service instances (unless the service is registered as singleton). Method injection also calls `$container->make()`, respecting the container's shared/instance state. If a service is registered as singleton, both injection points receive the same instance.

---

## Production Considerations

### Constructor Injection Before Middleware
The controller constructor runs BEFORE middleware because the controller is resolved during `getController()`, which is called during `runController()`, which is inside the middleware pipeline's innermost callback. This means:
- Constructor dependencies are resolved before middleware executes
- Authentication state set by middleware is NOT available in the constructor
- Use method injection for dependencies that require auth context

This is the same timing issue as controller middleware registration (GH #44177). Solutions:
- Use method injection for auth-dependent dependencies
- Use `$request->user()` (available when the method runs, after middleware)
- Use `HasMiddleware` interface for middleware that must run before dependencies

### Dependency Binding Stability
Changing the binding of a depdency in a service provider affects controller construction globally. If `UserService` is rebound from `ImplA` to `ImplB`, every controller that injects `UserService` receives the new implementation. This is the expected behavior of DI, but it means controller behavior can change without controller code changes.

### Testing Constructor vs Method Dependencies
- Constructor dependencies can be mocked by binding mocks into the container before the test request
- Method dependencies are resolved automatically in HTTP tests; no special setup needed for standard types
- Method dependencies that are custom classes may require container binding setup for HTTP tests

---

## Common Mistakes

### Constructor Injection for Request Data
Why it happens: Convenience — inject `Request` or `User` in constructor and use in all methods. Why it's harmful: Constructor runs before middleware — auth state is not yet established. `$this->user()` in constructor returns null. Better approach: Use method injection for `Request $request` and `$request->user()`.

### Method Injection for Shared Services
Why it happens: Developer adds `UserService $service` to each method individually. Why it's harmful: The service is resolved on every method call instead of once in the constructor. Three methods that all use `UserService` resolve it three times per request. Better approach: Constructor injection for services used by multiple methods.

### Forgetting the Type Hint
Why it happens: Adding a parameter without type hinting the class. Why it's harmful: PHP passes the route parameter string instead of resolving the dependency. No error — the controller receives the wrong data type silently. Better approach: Always type-hint controller method parameters.

### Multiple Parameters of the Same Type
Why it happens: Method accepts two services of the same interface. Why it's harmful: `alreadyInParameters()` checks by class — if the first service is resolved, the second receives the same instance. Better approach: Use distinct interfaces or named binding.

### Expecting Method Injection in the Constructor
Why it happens: Using method injection pattern (`Request $request`) in the constructor. Why it's harmful: Constructor parameters are resolved by `Container::make()`, not by `ResolvesRouteDependencies`. Request-type dependencies in the constructor are resolved from the container but without route parameter priority. The constructor receives the raw request, not the route-bound models. Better approach: Use constructor for services only; use method injection for request data.

---

## Failure Modes

### BindingResolutionException — Unresolvable Dependency
A method parameter type-hints a class that the container cannot resolve (interface without binding, non-existent class). `$container->make()` throws. Occurrence: at method dispatch time. Detection: only when the specific route is accessed.

### Route Parameter Overwritten by Container
If `alreadyInParameters()` fails to detect an existing instance (unlikely but possible with proxy objects), the container creates a fresh instance. The route-bound model is replaced by a fresh, empty instance. The controller receives the wrong data.

### NullParameterException
A method parameter has no type hint, no default value, and no route parameter match. `resolveMethodDependencies()` cannot determine what to pass. The framework throws `BindingResolutionException` when it encounters an unresolvable primitive parameter.

---

## Ecosystem Usage

### Laravel Framework
All first-party package controllers use constructor injection for services and method injection for Form Requests and route models. The `AuthorizesRequests` trait uses method injection for policy authorization.

### Spatie Packages
Spatie controllers use constructor injection with PHP 8 promoted properties. Services are injected in the constructor. Form Requests and resources are injected via method injection.

### Jetstream
Jetstream controllers inject `TeamService`, `UserService`, and other services via constructor. Methods receive Form Requests and route models via method injection.

---

## Related Knowledge Units

### Prerequisites
- Controller Architecture — Controller resolution and dispatch lifecycle
- Service Container Basics — Container::make() and binding resolution

### Related Topics
- Route Model Binding — How bound models become method parameters
- Thin Controller Principles — Delegation to injected services
- Single-Action Controllers — Constructor vs method injection in invokable classes

### Advanced Follow-up Topics
- Controller Testing — Mocking constructor vs method dependencies
- Contextual Binding — Resolving the same interface to different implementations per controller
- Octane Considerations — State management with constructor injection in long-running processes

---

## Research Notes

### Source Analysis
- `Illuminate\Routing\ResolvesRouteDependencies.php` — `resolveMethodDependencies()`, `transformDependency()`, `alreadyInParameters()`
- `Illuminate\Routing\ControllerDispatcher.php` — `resolveParameters()`, `dispatch()`
- `Illuminate\Routing\Route.php` — `parametersWithoutNulls()`, `getController()`
- `Illuminate\Container\Container.php` — `make()`, `build()`, `call()`
- `Illuminate\Container\BoundMethod.php` — `call()` for non-controller DI

### Key Insight
The `alreadyInParameters()` check is the critical mechanism that makes implicit route model binding compatible with method injection. Without it, a `User $user` parameter in a controller method would always resolve a new User from the container rather than using the route-bound model. This check is what makes the type-hint convention work for both DI and route binding.

### Version-Specific Notes
- `ResolvesRouteDependencies` trait replaced `RouteDependencyResolverTrait` in Laravel 11 (backward-compatible alias)
- `transformDependency()` behavior is consistent across Laravel 10-13
- Contextual attribute resolution (`Util::getContextualAttributeFromDependency`) added in Laravel 12
- The `alreadyInParameters()` check is unchanged across all versions
