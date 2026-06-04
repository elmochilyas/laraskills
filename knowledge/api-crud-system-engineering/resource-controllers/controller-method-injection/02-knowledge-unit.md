# Controller Method Injection

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** Resource Controllers
- **Knowledge Unit:** Controller Method Injection
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Beyond constructor injection, Laravel also supports injecting dependencies directly into controller methods. The container resolves type-hinted parameters in controller methods on every call, providing per-action dependencies that are specific to that endpoint. This is most commonly used for `Illuminate\Http\Request` instances and form requests, but works for any class the container can resolve.

Method injection excels for dependencies that vary per action — a `StorePhotoRequest` for the `store` method, a `ShowPhotoRequest` for the `show` method. It also enables injecting services that are only needed by one or two methods, keeping the constructor lean. The key distinction from constructor injection is lifetime: method-injected dependencies are re-resolved on every request, while constructor-injected ones are resolved once per controller instantiation.

---

## Core Concepts

- **Per-Action Resolution**: Dependencies are resolved fresh on every method call, not cached per request.
- **Type-Hinted Parameters**: Any parameter that the container can resolve is automatically injected.
- **Route Model Binding Integration**: Model bindings are resolved before method injection, giving access to route parameters.
- **Request as Primary Example**: `public function store(StorePhotoRequest $request)` — the most common form.
- **Mixed Parameters**: Method injection and route parameters can coexist; Laravel differentiates by type-hint and parameter name.

---

## Mental Models

- **Action-Scoped Dependencies**: Think of method parameters as scoped to that single invocation. Each call gets a fresh dependency.
- **Route Parameters + Services**: The method signature lists "what comes from the URL" (route parameters) and "what comes from the container" (type-hinted services).
- **Manual Wiring Not Needed**: Like constructor injection, the container handles everything automatically.

---

## Internal Mechanics

When `ControllerDispatcher::dispatch()` calls a controller method, it uses the container's `call()` method:

```php
protected function callMethod($route, $controller, $method)
{
    $dependencies = $this->container->callMethod($controller, $method, $route->parametersWithoutNulls());
    // ...
}
```

`Container::call()` uses reflection to inspect the method's parameter list. For each parameter:

1. If the parameter name matches a route parameter key, the route value is injected.
2. If the parameter has a type-hint that the container can resolve, the resolved instance is injected.
3. If neither applies and a default value exists, the default is used.
4. If none of the above, an exception is thrown.

This is how `public function update(UpdatePhotoRequest $request, Photo $photo)` works: `UpdatePhotoRequest` is resolved by the container (step 2), and `Photo $photo` is resolved from the route parameter `{photo}` (step 1).

---

## Patterns

- **Form Request Injection**:
  ```php
  public function store(StorePhotoRequest $request)
  {
      return new PhotoResource($this->photos->create($request->validated()));
  }
  ```
- **Route Model Binding + Service**:
  ```php
  public function show(Photo $photo, PhotoViewService $viewer)
  {
      return new PhotoResource($viewer->enrich($photo));
  }
  ```
- **Multiple Services in One Method**:
  ```php
  public function index(PhotoFilterService $filter, PhotoCacheService $cache)
  {
      return $cache->remember(fn () => $filter->apply(Photo::query()));
  }
  ```
- **Optional Service with Default**:
  ```php
  public function show(Photo $photo, ?LoggerInterface $logger = null)
  {
      $logger?->info('Photo viewed', ['id' => $photo->id]);
      return new PhotoResource($photo);
  }
  ```

---

## Architectural Decisions

- **Why method injection over constructor injection for some dependencies?** Some dependencies are only relevant to one action. Injecting them in the constructor forces the controller to carry unused dependencies for all other methods.
- **Why Request objects are always method-injected, never constructor-injected?** The Request object is populated during route matching, which occurs after the controller is instantiated. Constructor injection occurs too early.
- **Why not method-inject everything?** Method injection re-resolves dependencies on every call. For shared dependencies (repositories, services), constructor injection is more efficient and clearer.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Keeps constructor lean | Dependencies are not visible in constructor signature | Scanning method signatures is required to know the full dependency set |
| Per-action dependency freshness | Re-resolution overhead on each call | Negligible for most services; relevant for HTTP-heavy services |
| Natural for varying dependencies | Mixed route params + service params can be confusing | Parameter naming must avoid collision with route keys |

---

## Performance Considerations

- Container `call()` uses reflection on every invocation, but results are cached after the first call per route.
- The overhead of method injection vs. constructor injection is approximately 0.1–0.3ms per call for services with simple constructors.
- Form request validation (which uses method injection) has its own overhead — typically 1–5ms depending on validation rules.
- Route model binding resolution happens before method injection; the model's database query dominates performance, not the injection mechanism.

---

## Production Considerations

- Prefer constructor injection for dependencies used in 3+ methods; use method injection for 1–2 method dependencies.
- Use `#[Override]` or `#[RouteParameter]` attributes (PHP 8+) to clarify which parameters are route bindings vs. injected services.
- Write tests that explicitly assert the method can be called with both route parameters and service parameters.
- Avoid method injection of request-scoped singletons that maintain mutable state across injection calls.

---

## Common Mistakes

- **Confusing route parameters and injected services**: Assuming the order in the method signature determines injection type.
  - *Why it happens:* Both mechanisms use the same parameter list.
  - *Why it's harmful:* A parameter name collision can result in a route value being injected instead of a container-resolved service.
  - *Better approach:* Use distinct naming conventions: route parameters are singular model names, services are descriptive nouns.

- **Method-injecting a dependency used in all methods**: Putting `LoggerInterface $logger` in every method signature.
  - *Why it happens:* Avoiding constructor parameter growth.
  - *Why it's harmful:* Cluttered method signatures, re-resolution overhead.
  - *Better approach:* Inject shared dependencies in the constructor once.

- **Forgetting the `$request` parameter when using form request**: Defining `store(StorePhotoRequest $request, Photo $photo)` but calling `$request->photo_id` instead of using route binding.
  - *Why it happens:* Mixing form request data and route parameters confusingly.
  - *Why it's harmful:* Logic bugs when route and request values diverge.
  - *Better approach:* Use form request for validated input and route binding for model resolution.

---

## Failure Modes

- **Route parameter name conflicts with a container binding**: A route parameter named `{logger}` collides with `LoggerInterface $logger`. *Detection:* The route value (string) is injected instead of the LoggerInterface instance. *Mitigation:* Use PHP 8 attributes like `#[RouteParameter]` or rename route parameters to avoid collisions.

- **Missing type-hint causes parameter to receive route value**: `public function index($photos)` where `{photos}` is a route parameter. *Detection:* The method receives the string from the URL instead of an injected service. *Mitigation:* Always type-hint injectable parameters; leave route parameters untyped or typed as models.

- **Form request's `authorize()` returns false silently**: Method injection succeeds but authorization fails. *Detection:* 403 response that is hard to trace. *Mitigation:* Test form request authorization in isolation.

---

## Ecosystem Usage

- **Laravel Spark**: Injects `BillingService` and `InvoiceService` directly into subscription controller methods alongside form requests.
- **Laravel Cashier**: Webhook controllers method-inject `StripeWebhookService` alongside the incoming request.
- **Laravel Horizon**: Dashboard methods inject `MetricsService` and `JobFilter` as method parameters.

---

## Related Knowledge Units

### Prerequisites
- Service Container Fundamentals
- Controller Dependency Injection

### Related Topics
- Controller Form Request Integration
- Controller Dependency Injection

### Advanced Follow-up Topics
- Controller Action Delegation
- Controller Testing Strategies

---

## Research Notes

### Source Analysis
- `Illuminate\Container\Container::call()` — method resolution logic
- `Illuminate\Routing\ControllerDispatcher::callMethod()` — controller-specific calling
- `Illuminate\Routing\Route::parametersWithoutNulls()` — route parameter resolution

### Key Insight
Method injection is a variant of Laravel's "type-hint and resolve" pattern, identical to how the container resolves any callable. The controller-specific aspect is the merging of route parameters and container-resolved dependencies in a single parameter list.

### Version-Specific Notes
- Method injection has existed since Laravel 5.0.
- PHP 8 attributes (Laravel 9+) provide better disambiguation between route params and injected services, though adoption remains low.
- No behavioral changes in Laravel 8–11.
