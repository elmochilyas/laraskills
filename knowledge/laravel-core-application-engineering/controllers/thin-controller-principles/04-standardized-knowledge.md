# ECC Standardized Knowledge — Thin Controller Principles

---

## Metadata

| Field | Value |
|---|---|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Controllers |
| **Knowledge Unit** | Thin Controller Principles |
| **Difficulty** | Advanced |
| **Category** | Application Architecture — HTTP Layer |
| **Last Updated** | 2026-06-02 |

---

## Overview

Thin controller principles dictate that controllers should contain minimal code — only the logic necessary to translate an HTTP request into a business operation call and convert the result back into an HTTP response. The canonical thin controller pattern is: validate (via FormRequest), delegate (to service/action), return (as response/resource).

The principle addresses the most common Laravel anti-pattern: fat controllers that mix validation, business logic, query building, response formatting, and side effects. Thin controllers are testable without HTTP bootstrapping, readable at a glance, and maintainable because each concern lives in its proper layer.

---

## Core Concepts

### The Three-Step Controller
1. **Validate** — FormRequest validates input and authorizes
2. **Delegate** — Call a service or action with the validated data
3. **Return** — Return a view, redirect, JSON response, or resource

### Separation of Concerns
Controllers handle HTTP. Services/Actions handle business logic. Resources handle response transformation. Form Requests handle validation. Each layer has exactly one responsibility.

### Testability
Thin controllers can be tested with HTTP tests (feature tests) that verify the response, while the delegated business logic can be unit-tested in isolation.

---

## When To Use

- EVERY controller in a Laravel application — this is not optional
- Resource controllers for CRUD
- Single-action controllers for non-CRUD operations
- API controllers for JSON endpoints

---

## When NOT To Use

- Trivial redirect-only routes (use `Route::redirect()`)
- Routes that don't need logic (static pages via `Route::view()`)
- Prototyping (can be refactored later)

---

## Best Practices

### Target 5-10 Lines Per Method
Controller methods should fit in a single screen (5-10 lines maximum).

**Why:** If a method exceeds 10 lines, it's doing something beyond validate-delegate-return. Each additional line should be justified as a necessary part of the HTTP translation.

### Never Query in Controllers
No `User::where()`, `DB::table()`, or Eloquent queries in controller methods. Delegates to services or actions.

**Why:** Database queries in controllers couple the HTTP layer to the data layer. Queries cannot be reused across entry points and are untestable without HTTP bootstrapping.

### Never Format Responses in Controllers
No array construction for JSON responses in controllers. Use API Resources for response transformation.

**Why:** Response formatting in controllers duplicates formatting logic across methods and makes response changes require controller modifications.

### Delegate to Services or Actions
Every business operation should be delegated to a dedicated class.

**Why:** Delegated logic is independently testable, reusable across entry points (HTTP, CLI, queue), and maintainable without touching the HTTP layer.

---

## Architecture Guidelines

### Fat Controller (Avoid)
```php
class UserController extends Controller
{
    public function index()
    {
        $users = User::where('active', true)
            ->with('posts')
            ->paginate(20);

        return response()->json([
            'data' => $users->map(fn($user) => [
                'id' => $user->id,
                'name' => $user->name,
                'post_count' => $user->posts->count(),
            ]),
            'meta' => ['total' => $users->total()],
        ]);
    }
}
```

### Thin Controller (Preferred)
```php
class UserController extends Controller
{
    public function __construct(
        private UserService $service,
    ) {}

    public function index(ListUsersRequest $request): UserCollection
    {
        $users = $this->service->listActiveUsers($request->validated());
        return new UserCollection($users);
    }
}
```

---

## Common Mistakes

### 50-Line Controller Methods
Desc: Methods that validate, query, format, and return all in one function.
Cause: Not extracting concerns to dedicated layers.
Consequence: Untestable, unreadable, violates SRP.
Better: Extract queries to services, formatting to resources.

### Controllers with Business Logic
Desc: Complex calculations, authorization logic, or multi-step workflows in controllers.
Cause: Convenience — controller is the first code reached.
Consequence: Business logic coupled to HTTP; cannot be reused in CLI/queue.
Better: Extract to services or actions.

### Controllers That Know Too Much
Desc: Controllers that import 10+ different classes: Models, Requests, Resources, Services, Events, Mailables.
Cause: Controller doing too many things.
Consequence: High coupling; every change requires controller modification.
Better: Extract all non-HTTP concerns to dedicated classes.

---

## Anti-Patterns

### Query-and-Respond Controller
Every method calls Eloquent directly and builds the response inline. This is the default for beginners but does not scale beyond tiny applications.

### Controller as Orchestrator
Controller that calls multiple services, handles transactions, sends emails, and logs. This orchestration belongs in a service class, not the HTTP layer.

---

## Examples

### The Three-Step Pattern
```php
class PostController extends Controller
{
    public function __construct(
        private PostService $service,
    ) {}

    // Step 1: FormRequest validates
    // Step 2: Service executes
    // Step 3: Response returned

    public function store(StorePostRequest $request): PostResource
    {
        $post = $this->service->create($request->validated());
        return new PostResource($post);
    }

    public function destroy(Post $post): JsonResponse
    {
        $this->service->delete($post);
        return response()->json(['message' => 'Deleted']);
    }
}
```

---

## Related Topics

### Prerequisites
- **Controller Architecture** — Foundation for thin controllers
- **Service Layer Pattern** — Delegation target for business logic

### Closely Related
- **Form Requests** — Validation extraction
- **API Resources** — Response transformation extraction
- **Action Pattern** — Alternative delegation target

### Advanced
- **Controller Organization** — Managing thin controllers at scale

---

## AI Agent Notes

### Important Decisions
- Thin controller is not optional — it is the standard for production Laravel applications
- Every expert recommendation emphasizes thin controllers as the highest-priority pattern
- The three steps (validate, delegate, return) cover 95% of controller actions
- Controllers should NOT contain imports for Models, DB, or query builders

### Important Constraints
- Controller methods should be <10-15 lines
- Business logic MUST NOT be in controllers
- Queries MUST NOT be in controllers
- Response formatting MUST be delegated to API Resources or views

### Rules Generation Hints
- Enforce maximum method length of 15 lines for controllers
- Ban Eloquent/DB imports in controllers (Pest architecture test)
- Ban direct `Model::method()` calls in controllers
- Require FormRequest for every store/update action

---

## Verification

This document has been validated against:
- Expert consensus from Spatie, Tighten, Beyond Code, Laravel Daily
- Production codebase analysis (Monica CRM, Akaunting)
- `Illuminate\Routing\Controller` patterns
