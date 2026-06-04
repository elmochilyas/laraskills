# Thin Controller Principle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Thin Controller Principle
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

The thin controller principle dictates that controllers should only handle HTTP concerns — parsing the request, delegating to a lower layer (service, action, or DTO), and returning a response. Controllers must never contain business logic, database queries, or domain decisions. They act as a glue layer between the HTTP protocol and the application's business logic.

The engineering significance is that thin controllers make business logic testable without HTTP scaffolding, reusable across multiple entry points (HTTP, CLI, queue), and maintainable by enforcing a single responsibility per layer. A controller that contains model queries, conditional business rules, or direct database operations is a controller that couples the HTTP layer to the persistence layer — making every route change a potential database schema change.

---

## Core Concepts

### Single Responsibility: HTTP Only

A controller's responsibility is limited to three operations:
1. **Extract** input from the HTTP request (validated data, route parameters, authenticated user)
2. **Delegate** to a lower layer (action, service, DTO construction)
3. **Respond** with an HTTP response (JSON, redirect, view)

If a controller does anything beyond these three, it violates the thin controller principle.

### The Fat Controller Anti-Pattern

```php
// Fat controller — business logic, queries, and HTTP handling mixed
class UserController
{
    public function store(Request $request)
    {
        $validated = $request->validate([...]);
        if (User::where('email', $validated['email'])->exists()) {
            return back()->withErrors(['email' => 'Taken']);
        }
        $user = User::create($validated);
        $user->assignRole('subscriber');
        event(new UserRegistered($user));
        Mail::to($user)->send(new WelcomeMail($user));
        return redirect()->route('users.show', $user);
    }
}
```

```php
// Thin controller — delegates all business logic
class UserController
{
    public function __construct(
        private RegisterUserAction $registerUser,
    ) {}

    public function store(RegisterUserRequest $request): JsonResponse
    {
        $dto = RegisterUserDto::fromRequest($request);
        $user = $this->registerUser->execute($dto);
        return response()->json($user, 201);
    }
}
```

### Controller as Translator, Not Decision-Maker

The controller translates HTTP concepts to application concepts: `$request->validated()` → DTO, route model binding → entity, HTTP status codes → response. It does not make decisions like "should this user be created?" or "is this email unique?" — those belong in the action or service layer.

---

## Mental Models

### The Receptionist

A controller is a receptionist. It greets the HTTP request, takes its coat (extracts input), directs it to the right person (delegates to action/service), and hands back a result (returns response). The receptionist does not do the work — they direct traffic.

### The Glue Layer

Controllers are the glue that bonds HTTP to application logic. Glue is essential, but it should be thin. Thick glue makes everything stick together — changes to routes affect business logic, and changes to business logic require route updates.

### The Bouncer Model

The controller is the bouncer at the door. It checks the ID (authentication), validates the ticket (authorization via FormRequest/gates), and lets the guest in. Once inside, the guest does whatever they came to do — the bouncer doesn't follow them around.

---

## Internal Mechanics

### Controller Resolution in Laravel

Laravel resolves controllers through the service container. The controller's constructor dependencies are auto-resolved, and method injection provides additional dependencies per route:

```php
// Constructor injection — service resolved once per controller instance
class UserController
{
    public function __construct(
        private UserService $users,
    ) {}
}

// Method injection — resolved per-route call
public function show(User $user, UserService $users): JsonResponse
{
    return response()->json($users->formatProfile($user));
}
```

### Controller Lifecycle

1. Router matches URI to route definition
2. Route resolves controller class from container
3. Middleware stack runs (auth, throttle, etc.)
4. Controller method is invoked with resolved dependencies
5. Response is returned through middleware pipeline
6. Terminable middleware runs after response is sent

Controllers are typically resolved per-request (not singletons), so they can safely hold request-scoped state.

### No Base Controller Business Logic

Laravel's base `Controller` class provides convenience traits (`AuthorizesRequests`, `ValidatesRequests`, `Dispatchable`) but zero business logic scaffolding. Extending the base controller should not add domain methods — those belong in services or actions.

---

## Patterns

### Single Method Delegation

```php
class UserController
{
    public function store(CreateUserRequest $request): JsonResponse
    {
        $user = CreateUserAction::run($request->validated());
        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }
}
```

One method, one action. Minimal indirection.

### DTO Construction in Controller

```php
public function store(CreateUserRequest $request): JsonResponse
{
    $dto = new CreateUserDto(
        name: $request->validated('name'),
        email: $request->validated('email'),
    );
    $user = $this->users->register($dto);
    return response()->json($user, 201);
}
```

The controller constructs a typed DTO from validated input, then passes it to the service layer. The service never touches the request.

### Controller with FormRequest Only

```php
public function store(CreateUserRequest $request): JsonResponse
{
    $user = $this->users->create($request->validated());
    return response()->json($user, 201);
}
```

For simple CRUD, passing `$request->validated()` directly is acceptable — the controller still delegates to a service. The DTO is introduced when complexity warrants it.

---

## Architectural Decisions

### Why Controllers Must Not Contain Business Logic

Business logic in controllers cannot be reused. An Artisan command that needs the same "register user" workflow must duplicate the logic or call the controller — which requires faking an HTTP request. Extracting logic to services or actions makes reuse trivial.

### Why Controllers Should Not Return Views in APIs

API controllers return JSON or other serialized responses. Returning views from API controllers couples the API layer to the presentation layer. For API-first applications, all responses should be structured data — leave Blade rendering for web controllers.

### FormRequest vs Manual Validation in Controller

The framework validates in FormRequests, not in controllers. Controllers that call `$request->validate()` inline bypass the separation of concerns that FormRequests provide — validation logic is embedded in the controller rather than its own class.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Business logic is reusable across entry points | Additional classes (actions/services/DTOs) per endpoint | More files to navigate, but each file has a clear purpose |
| Controllers are trivially testable | Requires discipline to avoid "just one query" slip | Code review must enforce the principle |
| Layer isolation prevents HTTP coupling | Ceremony for simple CRUD operations | Thin controller with service pass-through still adds a class |
| Changes to business rules don't touch HTTP layer | Developers must navigate to find business logic | Requires consistent directory conventions |

---

## Performance Considerations

Thin controllers add zero performance overhead. Delegating to a service or action class adds ~0.001ms for container resolution — negligible. The file count increase from thin controllers (more classes, smaller files) is irrelevant with OpCache enabled.

---

## Production Considerations

### Code Review Rules for Controllers

Enforce these rules in code review:
- No Eloquent queries in controllers (`User::where()`, `DB::table()`)
- No business conditionals (`if ($user->isAdmin())`)
- No email/mailing logic
- No event dispatching
- No queue dispatching

These all belong in services, actions, or event listeners.

### Controller File Size Signal

A controller file exceeding 50 lines of executable code (excluding boilerplate, docblocks, imports) is a signal that logic is leaking in. Measure the method body — not the file.

### Testing Strategy

Thin controllers make HTTP tests focused on HTTP concerns — status codes, headers, response structure. Business logic tests go against the service/action layer directly, without HTTP scaffolding.

---

## Common Mistakes

### The Fat Controller Creep
Why it happens: Adding "just one query" or "just one conditional" to a controller feels harmless in isolation. Why it's harmful: Each addition normalizes fat controllers, and the pattern compounds across all controllers in the codebase. Better approach: If a controller method needs a conditional or a query, extract it to an action or service before writing the controller line.

### Putting Validation in Controller Methods
Why it happens: Using `$request->validate()` inline is faster than creating a FormRequest class. Why it's harmful: Validation logic is scattered across controllers instead of centralized in FormRequests. Better approach: Create FormRequests for every controller method that accepts input. The class creation cost is ~30 seconds; the maintenance benefit is permanent.

### Returning Eloquent Models Directly
Why it happens: `return User::find($id)` from a controller works perfectly. Why it's harmful: Exposes all model attributes to the API response, including sensitive fields (`password`, `remember_token`). Better approach: Return a resource, DTO, or explicitly mapped array.

---

## Failure Modes

### The God Controller
A controller with 15+ methods handling multiple related routes. The file is 600+ lines, mixes CRUD operations with custom endpoints, and every route change requires modifying this single file. Splitting into dedicated controllers per resource is the only fix.

### Business Logic Hidden in Controllers
New team members add business rules to controllers because "that's where the other logic is." Over six months, the controller accumulates payment processing, email logic, and complex calculations. The codebase becomes impossible to test without HTTP calls.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream controllers are consistently thin — they validate via FormRequests, delegate to action classes, and return responses. No Jetstream controller contains business logic. This is the canonical example of the thin controller principle from the framework authors.

### Laravel Spark
Spark controllers follow the same pattern: request validation in FormRequests, delegation to actions/services, minimal HTTP-only logic in the controller.

### Spatie Laravel Permission
The `RoleController` and `PermissionController` in Spatie's package examples demonstrate thin CRUD controllers — validation, delegation, response. No business logic.

---

## Related Knowledge Units

### Prerequisites
- Laravel Routing Fundamentals — Route-to-controller binding basics
- Service Container — Controller dependency injection resolution

### Related Topics
- Controller-DTO-Action Flow — The standard thin controller delegation pattern
- Controller-DTO-Service Flow — Thin controller with service delegation
- Layer Isolation Rules — Rules preventing layer skipping from controllers
- Request Lifecycle Complete Flow — End-to-end HTTP-to-response flow

### Advanced Follow-up Topics
- Action Class Design — The delegation target for thin controllers
- FormRequest Patterns — Validation layer that keeps controllers thin

---

## Research Notes

### Source Analysis
- Laravel documentation explicitly recommends thin controllers: "get out of the controller as quickly as possible"
- Laravel Jetstream source code: `App/Actions` — all business logic in action classes
- Taylor Otwell's Laravel 5 talk: "Controllers should be as thin as possible"

### Key Insight
The thin controller principle is the most universally agreed-upon convention in the Laravel ecosystem. Every major package, every framework author's project, and every mature codebase follows it. It is not a style preference — it is a structural requirement for maintainable Laravel applications.

### Version-Specific Notes
- Laravel 11+ `ProcessesRequests` trait removed, making controllers even simpler
- Controller route binding resolved in `__invoke` via `RouteServiceProvider` — applies to all Laravel versions 8+
