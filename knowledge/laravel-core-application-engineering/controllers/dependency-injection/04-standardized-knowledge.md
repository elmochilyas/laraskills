# ECC Standardized Knowledge — Controller Dependency Injection

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Dependency Injection |
| **Difficulty** | Intermediate |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Laravel provides two forms of dependency injection for controllers: **constructor injection** (dependencies available to all methods) and **method injection** (dependencies resolved per-method). Constructor injection is for shared service dependencies. Method injection is for request-specific dependencies like Form Requests and route parameters.

Understanding when to use each form is critical for controller design. Constructor injection is preferred for services used by multiple methods. Method injection is preferred for Form Requests (which must be validated before the method executes) and for dependencies that are only needed by a single method.

---

## Core Concepts

### Constructor Injection
Dependencies declared in `__construct()` are resolved by the container when the controller is instantiated. Available to all methods.

### Method Injection
Parameters type-hinted in controller methods are resolved by `Controller::callAction()` using the container's `call()` method. Form Requests are validated before the method body executes.

### Injection Resolution Order
1. Route parameters (named parameters from the URL)
2. Request instances
3. Form Request instances
4. Other type-hinted services

---

## When To Use

### Constructor Injection
- Services used by multiple methods (repositories, services, loggers)
- Shared infrastructure (config, event dispatcher, cache)
- Dependencies that are always needed

### Method Injection
- Form Requests (validated before method body)
- Dependencies used by only one method
- Optional dependencies that should not be class-wide

---

## When NOT To Use

- Don't inject `Request` in constructor (it's request-scoped)
- Don't inject route parameters in constructor (they're resolved at method level)
- Don't inject heavy services into every controller if only one method uses them

---

## Best Practices

### Prefer Constructor Injection for Shared Dependencies
Inject services used by multiple methods via the constructor.

**Why:** Constructor injection makes dependencies visible in the class signature. Shared dependencies are resolved once, not per-method.

### Use Method Injection for Form Requests
Type-hint Form Requests in individual methods.

**Why:** Form Requests are validated before the method executes. Validation errors are generated before the method body runs, preventing invalid data from reaching the method.

### Avoid Request in Constructor
Never inject `Illuminate\Http\Request` via the constructor.

**Why:** Request is request-scoped — its data changes per request. Constructor injection resolves it once, making the controller effectively stateful. Use method injection for Request.

---

## Architecture Guidelines

### Constructor Injection Example
```php
class UserController extends Controller
{
    public function __construct(
        private UserService $service,
        private Logger $logger,
    ) {}

    public function index(): View { /* $this->service and $this->logger available */ }
    public function show(User $user): View { /* same here */ }
}
```

### Method Injection Example
```php
class UserController extends Controller
{
    public function store(StoreUserRequest $request): RedirectResponse
    {
        // $request is validated before this line executes
        User::create($request->validated());
        return redirect()->route('users.index');
    }
}
```

### Method Injection Order
```php
public function update(UpdateUserRequest $request, User $user): RedirectResponse
{
    // Route parameter $user (model binding)
    // FormRequest $request (validated input)
    // Order doesn't matter — resolved by type and name
}
```

---

## Common Mistakes

### Request in Constructor
Desc: Injecting `Request` in the controller constructor.
Cause: Convenience — want request accessible in all methods.
Consequence: Request is captured at construction time; data may be stale or wrong for subsequent method calls.
Better: Use method injection for Request.

### Unused Constructor Dependencies
Desc: Injecting services that are only used by one method.
Cause: Defaulting to constructor injection for all dependencies.
Consequence: Unnecessary instantiation cost for methods that don't need them.
Better: Use method injection for method-specific dependencies.

### Forgetting Form Request Type Hint
Desc: Type-hinting `Request` instead of `StoreUserRequest`.
Cause: Not creating a dedicated Form Request class.
Consequence: Request is not validated; manual validation needed in method body.
Better: Create and use a Form Request class for each store/update operation.

---

## Anti-Patterns

### Service Locator in Controllers
Using `app()->make()` inside controller methods instead of declaring dependencies via injection. Creates hidden dependencies and makes testing harder.

### Constructor Bloat
10+ constructor dependencies in a single controller. Indicates the controller is doing too much. Extract related operations to dedicated classes.

---

## Examples

### Complete DI Example
```php
class PostController extends Controller
{
    public function __construct(
        private PostService $service,        // Constructor injection
        private Logger $logger,
    ) {}

    public function index(): View            // No method injection
    {
        $posts = $this->service->list();
        return view('posts.index', compact('posts'));
    }

    public function store(StorePostRequest $request): RedirectResponse  // Method injection
    {
        $this->logger->info('Creating post');
        $post = $this->service->create($request->validated());
        return redirect()->route('posts.show', $post);
    }

    public function show(Post $post): View    // Route model binding (method injection)
    {
        return view('posts.show', compact('post'));
    }
}
```

---

## Related Topics

### Prerequisites
- **Service Container Basics** — Understanding resolution mechanics
- **Controller Architecture** — Foundation for DI in controllers

### Closely Related
- **Form Requests** — Method injection for validation
- **Route Model Binding** — Method injection for model resolution

### Advanced
- **Service Layer Pattern** — Delegating to injected services

---

## AI Agent Notes

### Important Decisions
- Constructor injection: shared dependencies, resolved once per controller instance
- Method injection: request-specific dependencies, resolved per-call
- Form Requests must be method-injected (not constructor) for proper validation timing
- Route parameters (model bindings) are resolved via method injection

### Important Constraints
- Request in constructor creates stale state — never do it
- Constructor dependencies are resolved when the controller is instantiated
- Method injection follows resolution order: route params > request > type hints
- Method injection works via `Controller::callAction()` → `Container::call()`

### Rules Generation Hints
- Enforce constructor injection for shared services
- Enforce method injection for Form Requests and Request
- Ban `Request` in controller constructors

---

## Verification

This document has been validated against:
- `Illuminate\Routing\ControllerDispatcher::dispatch()` — method injection resolution
- `Illuminate\Container\Container::call()` — call-time injection
- `Illuminate\Http\Request` — request-scoped lifecycle
