# ECC Standardized Knowledge — Thin Controller Principle

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | Thin Controller Principle |
| Difficulty | Foundation |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

The thin controller principle dictates that controllers should only handle HTTP concerns — parsing the request, delegating to a lower layer (service, action, or DTO), and returning a response. Controllers must never contain business logic, database queries, or domain decisions. They act as a glue layer between the HTTP protocol and the application's business logic. Thin controllers make business logic testable without HTTP scaffolding, reusable across multiple entry points (HTTP, CLI, queue), and maintainable by enforcing a single responsibility per layer.

## Core Concepts

- **Single Responsibility: HTTP Only**: A controller's responsibility is limited to three operations: Extract input from HTTP, Delegate to a lower layer, Respond with an HTTP response.
- **Controller as Translator**: Translates HTTP concepts to application concepts — `$request->validated()` → DTO, route model binding → entity, HTTP status codes → response. Does not make business decisions.
- **The Fat Controller Anti-Pattern**: Controllers that contain model queries, conditional business rules, event dispatching, or mailing logic — coupling the HTTP layer to persistence and business logic.
- **Controller Lifecycle**: Router matches URI → Controller resolved from container → Middleware runs → Method invoked → Response returned → Terminable middleware runs.

## When To Use

- Always — the thin controller principle is universally applicable to any Laravel application
- For API controllers that return JSON responses
- For web controllers that return views (delegate data preparation to services/actions)
- As the foundational principle for all other CRUD architecture patterns

## When NOT To Use

- The principle does not apply to closures in route files (though the same separation of concerns should be maintained)
- Simple prototyping where speed is prioritized over architecture (introduce thin controllers before production)
- There is no production scenario where fat controllers are preferable

## Best Practices

- Enforce in code review: no Eloquent queries, no business conditionals, no email/mailing, no event dispatching, no queue dispatching in controllers
- A controller file exceeding 50 lines of executable code (excluding boilerplate, imports) signals logic leaking in
- Use FormRequests for all controller methods that accept input
- Return resources, DTOs, or explicitly mapped arrays — never return Eloquent models directly
- Keep HTTP tests focused on HTTP concerns; test business logic against the service/action layer directly

## Architecture Guidelines

- Controllers are resolved per-request (not singletons) — they can safely hold request-scoped state
- The base `Controller` class provides convenience traits but zero business logic scaffolding
- Never extend the base controller to add domain methods — those belong in services or actions
- API controllers return JSON, never views — separate API and web controller concerns
- Use constructor injection for services/actions; use method injection for route-specific dependencies

## Performance Considerations

- Thin controllers add zero performance overhead — delegating adds ~0.001ms for container resolution
- The file count increase from thin controllers (more classes, smaller files) is irrelevant with OpCache enabled

## Security Considerations

- Thin controllers prevent accidental exposure of sensitive model attributes (password, remember_token) via `return Model::find()` — always use resources or DTOs
- FormRequests (used by thin controllers) provide centralized validation, preventing malformed data from reaching business logic
- Controllers that bypass services/actions bypass authorization and business rule enforcement

## Common Mistakes

- **The Fat Controller Creep**: Adding "just one query" or "just one conditional" normalizes fat controllers. Solution: Extract to an action or service before writing the controller line.
- **Putting Validation in Controller Methods**: Using `$request->validate()` inline. Solution: Create FormRequests — 30 seconds to create, permanent maintenance benefit.
- **Returning Eloquent Models Directly**: `return User::find($id)` exposes all attributes including sensitive fields. Solution: Return a resource, DTO, or explicitly mapped array.
- **Business Logic Hidden in Controllers**: New team members add rules to controllers because "that's where the other logic is." Solution: Code review must enforce thin controller rules.

## Anti-Patterns

- **The God Controller**: 15+ methods, 600+ lines, mixing CRUD with custom endpoints. Every route change requires modifying this single file.
- **Controller as Service**: Controller contains business logic that should be in a service — untestable without HTTP and unreusable from CLI/queue.
- **Controller as Query Layer**: Controller calls `Model::where()->get()` directly — bypassing all business logic and scoping.
- **Controller as Event Dispatcher**: Controller dispatches events that should be dispatched by the service/action layer.

## Examples

### Fat Controller vs Thin Controller
```php
// FAT — business logic, queries, HTTP handling mixed
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

// THIN — delegates all business logic
class UserController
{
    public function __construct(private RegisterUserAction $registerUser) {}

    public function store(RegisterUserRequest $request): JsonResponse
    {
        $dto = RegisterUserDto::fromRequest($request);
        $user = $this->registerUser->execute($dto);
        return response()->json($user, 201);
    }
}
```

### Code Review Checklist for Controllers
- No Eloquent queries (`User::where()`, `DB::table()`)
- No business conditionals (`if ($user->isAdmin())`)
- No email/mailing logic
- No event dispatching
- No queue dispatching

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Laravel Routing Fundamentals | Route-to-controller binding basics | Prerequisite |
| Service Container | Controller dependency injection resolution | Prerequisite |
| Controller-DTO-Action Flow | Standard thin controller delegation | Related |
| Controller-DTO-Service Flow | Thin controller with service delegation | Related |
| Layer Isolation Rules | Rules preventing layer skipping from controllers | Related |
| Request Lifecycle Complete Flow | End-to-end HTTP-to-response flow | Related |
| Action Class Design | The delegation target for thin controllers | Follow-up |
| FormRequest Patterns | Validation layer that keeps controllers thin | Follow-up |

## AI Agent Notes

- The thin controller principle is the most universally agreed-upon convention in the Laravel ecosystem
- It is not a style preference — it is a structural requirement for maintainable Laravel applications
- When generating a controller, the body should be 3-5 lines max: validate → DTO → action → response
- If a controller method exceeds 10 lines, extract logic to an action or service
- Controller tests focus on HTTP concerns only — status codes, headers, response structure

## Verification

- [ ] Controller has no Eloquent queries (no `::find`, `::where`, `DB::`)
- [ ] Controller has no business conditionals
- [ ] Controller has no email, event, or queue dispatching
- [ ] Controller uses FormRequests for input validation
- [ ] Controller delegates to actions or services
- [ ] Controller does not return Eloquent models directly
- [ ] Controller method body is fewer than 10 lines of executable code
- [ ] Controller tests focus on HTTP concerns, not business logic
