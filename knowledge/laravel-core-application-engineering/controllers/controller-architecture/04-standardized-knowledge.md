# ECC Standardized Knowledge — Controller Architecture

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Controller Architecture |
| **Difficulty** | Foundation |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Controllers are the HTTP entry point to application logic. They receive requests, delegate to services/actions, and return responses. The controller's role is translation — converting an HTTP request into a business operation and converting the result back into an HTTP response. Controllers should contain no business logic; they are the "thin glue" between HTTP and domain layers.

Laravel controllers are resolved by the service container, enabling automatic dependency injection via the constructor. The framework provides three controller patterns: resource controllers (7 standard methods), single-action controllers (invokable), and plain controllers (custom methods).

---

## Core Concepts

### Controller Resolution
Controllers are resolved by the service container when routes are dispatched. The router calls `Container::make(Controller::class)` which auto-injects constructor dependencies.

### Controller::callAction()
The base `Controller` class provides `callAction()` which the router uses to invoke the controller method. It supports method injection — type-hinted parameters are resolved from the container at call time.

### Base Controller
`Illuminate\Routing\Controller` provides: `middleware()` for constructor middleware assignment, `callAction()` for method invocation, and error handling for validation exceptions.

### Response Types
Controllers return: views, redirects, JsonResponse, Response objects, or strings/arrays (converted to responses by the framework).

---

## When To Use

- Every HTTP endpoint that requires business logic
- Grouping related request handling (by resource or feature)
- Where dependency injection is needed for request handling

---

## When NOT To Use

- Business logic (belongs in services/actions)
- Validation logic (belongs in Form Requests)
- Response transformation (belongs in API Resources)
- Cross-cutting concerns (belongs in Middleware)

---

## Best Practices

### Keep Controllers Thin
Controller methods should be under 10-15 lines: validate (FormRequest), delegate (service/action), return (response/resource/view).

**Why:** Fat controllers violate single responsibility and are untestable without HTTP bootstrapping. Thin controllers are easy to test, read, and maintain.

### Use Constructor Injection for Shared Dependencies
Inject services that the controller needs across multiple methods via the constructor.

**Why:** Constructor injection avoids repeating the same DI in every method. It makes shared dependencies visible in the class signature.

### Use Method Injection for Request-Specific Dependencies
Type-hint Form Requests and other request-specific services in individual controller methods.

**Why:** Method injection provides dependencies only where needed. Form Requests are validated before the method executes.

### Return Responses Explicitly
Always return explicit response types: views, redirects, JSON responses, resource collections.

**Why:** Implicit returns (strings, arrays) work but are less expressive. Explicit responses communicate intent and support response customization.

---

## Architecture Guidelines

### Controller Flow
```
Request → Route → Middleware → Controller
    ↓
Validate (FormRequest)
    ↓
Delegate (Service/Action)
    ↓
Respond (View/Resource/Redirect/JsonResponse)
```

### Namespace Convention
`App\Http\Controllers\{Domain}\{ControllerName}`. Group by domain for large applications.

### Dependency Direction
Controllers depend on services/actions. Services/actions must NOT depend on controllers. Controllers know about HTTP; services/actions must not.

---

## Performance Considerations

Controller resolution adds minimal overhead (~1-3ms for typical dependency graphs). Method injection adds reflection overhead per method call. Controllers are not singletons by default — a new instance is created per request.

---

## Security Considerations

Controller methods receive validated data (via Form Requests). Never trust `$request->all()` directly — always use validated data from Form Requests or explicitly retrieved input.

---

## Common Mistakes

### Business Logic in Controllers
Desc: Database queries, calculations, and complex logic in controller methods.
Cause: Convenience — it's the first place data arrives.
Consequence: Untestable without HTTP, violates separation of concerns.
Better: Delegate to services or actions.

### Fat Controller Methods
Desc: 50+ line controller methods handling validation, logic, and response.
Cause: Not delegating to dedicated classes.
Consequence: Unreadable, untestable, violates single responsibility.
Better: Extract each concern to its proper layer.

### Mixing Response Types Inconsistently
Desc: Some methods return views, others return JSON in the same controller.
Cause: Not separating web and API concerns.
Consequence: Inconsistent API surface for consumers.
Better: Use separate controllers for web and API, or use dedicated API controllers.

---

## Anti-Patterns

### Controller as Service
Using controllers as the only organizational pattern — putting business logic, validation, and response formatting all in the controller. This works for tiny applications but does not scale.

### God Controller
A controller with 20+ methods handling every operation for a resource. Extract related operations to dedicated service classes or action classes.

---

## Examples

### Thin Controller Pattern
```php
class UserController extends Controller
{
    public function __construct(
        private UserService $service,
    ) {}

    public function index(): View
    {
        return view('users.index', ['users' => $this->service->list()]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $this->service->create($request->validated());
        return redirect()->route('users.index');
    }
}
```

---

## Related Topics

### Prerequisites
- **Route Definition** — Route-to-controller mapping
- **Service Container Basics** — Controller DI resolution

### Closely Related
- **Resource Controllers** — Standardized CRUD controller pattern
- **Single-Action Controllers** — Invokable controllers for single operations
- **Dependency Injection** — Constructor and method injection patterns
- **Thin Controller Principles** — Keeping controllers lean

### Advanced
- **Controller Organization** — Namespace and directory strategies

---

## AI Agent Notes

### Important Decisions
- Controllers are resolved by the container — constructor DI is automatic
- Method injection is supported via `callAction()` reflection
- The base `Controller` class provides `middleware()` and `callAction()`
- Controllers should return `View`, `RedirectResponse`, `JsonResponse`, or `Response`

### Important Constraints
- Controllers must NOT contain business logic
- Controller methods should be <10-15 lines
- A controller instance is created per request (not singleton)
- Method injection parameters are resolved by type hint

### Rules Generation Hints
- Enforce maximum method length (10-15 lines)
- Enforce FormRequest usage for validation
- Enforce service/action delegation for business logic

---

## Verification

This document has been validated against:
- `Illuminate\Routing\Controller` — base controller class
- `Illuminate\Routing\ControllerDispatcher` — controller resolution and method invocation
