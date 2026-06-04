# Thin Controller Principles

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Controllers Architecture
- **Knowledge Unit:** Thin Controller Principles
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-01

---

## Executive Summary

A thin controller is a controller whose methods do nothing beyond validating input, delegating to a service or action, and returning a response. The concept is rooted in the single-responsibility principle applied at the HTTP boundary: controllers are traffic cops, not brains. They route requests to the appropriate business logic and return the result without containing any business logic themselves.

The engineering significance of thin controllers is testability, reusability, and maintainability. Business logic trapped in controllers can only be tested through HTTP requests — slow, fragile, and coupled to framework infrastructure. Logic extracted to services and actions is testable in isolation, reusable across entry points (HTTP, CLI, queues), and navigable by name. A thin controller method typically runs 5–15 lines. A fat controller grows to 200–800+ lines, hiding bugs inside deeply nested conditionals.

The thin controller principle does not mean controllers are unimportant. The controller is the HTTP boundary — it validates input via Form Requests, delegates via injected services/actions, and returns responses via Resources/views. Its job is orchestration at the HTTP layer, not operation at the business layer. Violating this boundary by putting business logic in controllers is the most common architectural degradation in Laravel applications.

---

## Core Concepts

### The Delegation Chain
The canonical thin controller pattern is a three-step delegation:
```
Controller Method
  1. Accept a FormRequest (validation + authorization handled automatically)
  2. Delegate to a Service or Action class (business logic)
  3. Return a Response (view, redirect, JSON resource)
```

Each step has a clear responsibility boundary. The controller owns none of the business logic — it is the messenger between HTTP and application layers.

### What Does NOT Belong in a Controller
Universal consensus across all authoritative sources:

| Code Type | Why It Doesn't Belong | Correct Location |
|-----------|----------------------|------------------|
| Database queries (beyond `Model::find()`) | Couples controller to storage layer; unreusable | Service, Action, Query class |
| Business logic (calculations, state transitions) | Untestable without HTTP; unreusable | Service or Action class |
| Inline validation rules | Duplicates logic; untestable independently | FormRequest class |
| Response data transformation | Mixes presentation with request handling | API Resource, ViewModel |
| Side effects (emails, API calls, notifications) | Makes testing complex; couples to infrastructure | Service/Action class |
| Authorization logic | Business rule, not HTTP concern | Policy class |
| Multiple sequential operations | Indicates orchestration needing a workflow | Service or Action class |
| `new` keyword for dependencies | Prevents mocking; hides coupling; bypasses DI | Constructor/method injection via container |

### Line Count Guidelines
Convergent guidelines from multiple authoritative sources:

| Source | Target | Warning Line |
|--------|--------|--------------|
| Steve McDougall (Sevalla) | 5–10 lines | 20–30 lines: extract to action |
| ButterCMS (Laravel Best Practices 2026) | Under 15 lines | Over 15 lines: extract |
| mayahi.net (Clean Code in Laravel) | One screen | If you scroll, too much |
| Laravel Daily Structure Audit | Under 20 lines | Over 20 lines: flag |
| Community consensus | 5–15 lines | 20+ lines: smell |

The guidelines refer to lines of actual logic, excluding blank lines, type hints, and closing braces.

### The Three-Act Controller Method
Every controller method should contain exactly three logical acts:

1. **Accept input** — Type-hint the FormRequest, which validates and authorizes
2. **Delegate** — Call a service or action with the validated data
3. **Respond** — Return a view, redirect, or JSON response

Any fourth act (queries, calculations, formatting) is a violation.

---

## Mental Models

### Controller as Traffic Cop
A traffic cop does not drive the cars. They direct traffic: which lane to enter, when to stop, when to go. Similarly, a controller does not execute business logic — it directs the request to the right service and sends the response back. The moment the cop starts driving, traffic collapses.

### Balloon Squeezing
Steve McDougall's "balloon squeezing" metaphor describes a common anti-pattern: extracting business logic from a fat controller into a fat service. The problem moves but doesn't shrink. True thinness requires splitting business logic into single-purpose actions or cohesive services rather than dumping everything into a `UserService` with 40 methods.

### Fits on One Screen
A controller method that fits on one screen is thin enough. If you must scroll to see the full method, it is doing too much. This is a practical heuristic that works regardless of team preferences — a 15-line method with three delegation calls fits on any screen; a 50-line method with nested conditionals does not.

---

## Internal Mechanics

### How the Framework Enables Thin Controllers

The framework's architecture actively supports thin controllers through several mechanisms:

**FormRequest auto-validation:**
```php
public function store(StorePostRequest $request)
// The FormRequest validates and authorizes BEFORE the method body runs.
// The controller never sees invalid data.
```

**Method injection:**
```php
public function store(StorePostRequest $request, CreatePostAction $action)
// Dependencies are resolved and injected by the container at dispatch time.
// No `new` keyword needed. No manual resolution.
```

**Resource auto-transformation:**
```php
public function show(Post $post)
{
    return new PostResource($post);
}
// The resource handles data transformation, not the controller.
```

**Automatic route model binding:**
```php
public function show(Post $post) // Post resolved from {post} parameter
// No manual query needed.
```

These framework features eliminate the three most common sources of controller bloat: validation, dependency resolution, and query execution.

### Why Fat Controllers Happen Despite Framework Support

The framework provides the tools for thin controllers, but does not enforce them. Fat controllers emerge when developers:

1. Inline validation instead of creating FormRequest classes
2. Execute Eloquent queries directly in controller methods
3. Write conditional business logic inline rather than extracting to services
4. Format response data directly instead of using Resources
5. Handle authorization inline instead of using Policies
6. Instantiate dependencies with `new` instead of using injection

Each individual violation seems harmless in isolation — 3 extra lines here, 5 extra lines there — until the controller reaches 300+ lines and any change risks breaking unrelated functionality.

---

## Patterns

### The Canonical Thin Controller Method

```php
class PostController extends Controller
{
    public function store(
        StorePostRequest $request,     // 1. FormRequest validates + authorizes
        CreatePostAction $action       // 2. Action injected by container
    ): RedirectResponse {
        $post = $action->execute(       // 3. Delegate business logic
            $request->toDto()
        );

        return redirect()               // 4. Return response
            ->route('posts.show', $post)
            ->with('success', 'Post created!');
    }
}
```

5 lines of logic. Three distinct responsibilities: accept, delegate, respond.

### Thin Resource Controller

```php
class PostController extends Controller
{
    public function index(): View
    {
        return view('posts.index', [
            'posts' => Post::recent()->paginate(20),
        ]);
    }

    public function create(): View
    {
        return view('posts.create');
    }

    public function store(StorePostRequest $request, CreatePostAction $action): RedirectResponse
    {
        $post = $action->execute($request->toDto());
        return redirect()->route('posts.show', $post)->with('success', 'Created');
    }

    public function show(Post $post): View
    {
        return view('posts.show', compact('post'));
    }

    public function edit(Post $post): View
    {
        return view('posts.edit', compact('post'));
    }

    public function update(
        UpdatePostRequest $request,
        UpdatePostAction $action,
        Post $post
    ): RedirectResponse {
        $action->execute($post, $request->toDto());
        return redirect()->route('posts.show', $post)->with('success', 'Updated');
    }

    public function destroy(Post $post, DeletePostAction $action): RedirectResponse
    {
        $action->execute($post);
        return redirect()->route('posts.index')->with('success', 'Deleted');
    }
}
```

Every method fits on one screen. Each delegates to a dedicated action. No method exceeds 6 lines of logic.

### Controller with Service (Multi-Method Orchestrator)

When a service handles multiple related operations:

```php
class SubscriptionController extends Controller
{
    public function __construct(
        private SubscriptionService $service
    ) {}

    public function store(CreateSubscriptionRequest $request): RedirectResponse
    {
        $this->service->create($request->user(), $request->toDto());
        return redirect()->route('dashboard')->with('success', 'Subscribed');
    }

    public function cancel(CancelSubscriptionRequest $request): RedirectResponse
    {
        $this->service->cancel($request->user());
        return redirect()->route('dashboard')->with('success', 'Cancelled');
    }

    public function resume(): RedirectResponse
    {
        $this->service->resume(Auth::user());
        return redirect()->route('dashboard')->with('success', 'Resumed');
    }
}
```

The service is injected via constructor. Each controller method delegates a single operation. The service encapsulates the shared context (user subscription management).

### Thin Single-Action Controller

Single-action controllers are naturally thin because they enforce single-responsibility:

```php
class PublishPostController extends Controller
{
    public function __invoke(
        PublishPostAction $action,
        Post $post
    ): RedirectResponse {
        $action->execute($post);
        return redirect()->route('posts.index')
            ->with('success', 'Post published!');
    }
}
```

---

## Architectural Decisions

### Why Extract Business Logic from Controllers
Business logic in controllers has three specific costs:
1. **Testability cost** — The logic can only be tested through HTTP tests (slow, require database, test framework concerns alongside business rules)
2. **Reusability cost** — The same logic cannot be invoked from CLI commands, queue jobs, or scheduled tasks without duplicating the HTTP wrapper
3. **Maintainability cost** — Changes to a controller method risk breaking both HTTP handling and business rules simultaneously

Extraction decouples these concerns. The controller can change HTTP behavior (status codes, redirect URLs, headers) without touching business rules. The service/action can change business rules without touching HTTP behavior.

### Why Not Extract Everything
Thin controllers have a cost: file proliferation. Each extracted action creates a new file. Each service dependency creates a new constructor parameter. The tradeoff favors thin controllers for all but the simplest CRUD at scale. For a 3-line controller method that calls `Model::find()` and returns a view, extraction adds ceremony without benefit.

### Why Form Requests Are Separate from Controllers
Form Requests are the validation boundary. They are not part of the controller even though they are called by the controller. Separating them keeps validation rules discoverable, testable, and reusable. A FormRequest can be attached to multiple routes or reused across different controllers.

---

## Tradeoffs

### Thin Controller vs Fat Controller

| Aspect | Thin Controller | Fat Controller |
|--------|----------------|----------------|
| Lines per method | 5–15 | 30–100+ |
| Testability | HTTP tests for routing; unit tests for logic | Only HTTP tests, slow and coupled |
| Reusability | Logic usable from CLI, jobs, queues | Logic trapped in HTTP layer |
| Navigation | Many small files in organized directories | Few large files with mixed responsibilities |
| Onboarding | Traceable: route → controller → action | One giant method to decipher |
| Merge conflicts | Rare (one file per operation) | Frequent (multiple devs editing same controller) |
| Refactoring confidence | High (isolated services have tests) | Low (everything is coupled) |

### Thin Controller + Service vs Thin Controller + Action

| Pattern | Benefit | Cost |
|---------|---------|------|
| Service (UserService with 7 methods) | Centralized navigation, shared constructor DI | Can grow to 400+ lines (squeezed balloon) |
| Action (CreateUser, UpdateUser, etc. — separate classes) | Single responsibility, zero merge conflicts | More files, duplicated DI across similar actions |

### When Thin Controllers Are Over-Engineering
- Simple CRUD where each method is 3 lines (validate, query, return)
- Prototypes and MVPs before requirements stabilize
- Read-only endpoints with no business logic (index, show returning cached data)
- When the team is small and the application is under 10 routes

### When Thin Controllers Are Essential
- APIs with complex business rules
- Applications with multiple entry points (HTTP + queue + CLI)
- Teams of 3+ developers working on the same codebase
- Any controller that has grown beyond one screen

---

## Performance Considerations

### Method Resolution Overhead
Thin controllers with method-injected services incur the same resolution cost as fat controllers with internal `app()` calls. The difference is distribution: thin controllers resolve many small dependencies across dispatch, while fat controllers resolve few large dependencies upfront. For most applications, the difference is negligible (~0.01ms per resolution).

### File Autoloading
Thin controller architectures produce more files. PHP OpCache caches compiled files after the first autoload, so the one-time cost of loading 100 action files is ~10ms total. Per-request autoloading is zero after OpCache warmup. File count is not a performance concern.

### Constructor Injection Across Many Controllers
Multiple thin controllers injecting the same service each pay the resolution cost independently. If `CreatePostAction` is injected into 10 different controllers, each request that hits any of those controllers resolves it once. This is the same cost as if a single fat controller resolved it once — the resolution happens once per request regardless of how many files reference the dependency.

---

## Production Considerations

### Enforcement Strategy
Thin controllers require team discipline. Common enforcement approaches:

1. **Code review checklist** — "Does this controller method do more than 3 things? Does it contain any `if` statements that are not response-related?"
2. **Static analysis** — Custom PHPStan rules flagging Eloquent queries, inline validation, and `new` keywords in controller methods
3. **Laravel Daily Structure Audit** — AI workflow that flags controller methods longer than 20 lines of logic
4. **CI pipeline** — Maximum method length check (e.g., `phpcs --standard=PSR12 --sniffs=Generic.Metrics.CyclomaticComplexity`)

### Refactoring Sequence
When refactoring a fat controller, the recommended order is:

1. Extract inline validation to FormRequest classes
2. Extract inline Eloquent queries to query scopes or query classes
3. Extract business logic conditionals to service methods
4. Split large services into single-purpose actions
5. Add API Resources or ViewModels for response formatting

This sequence minimizes change risk at each step. Each step is independently testable and deployable.

### Reading Controller Boundaries
When reviewing a controller in production, the question is not "how many lines?" but "does each method have exactly one reason to change?" A controller method should change only when:
- The HTTP contract changes (status codes, redirects, headers)
- The routing changes (URL structure, parameter names)
- The response format changes (view → JSON, JSON structure change)

If the method changes when business logic changes, it is too fat.

---

## Common Mistakes

### The Fat Service Anti-Pattern
Why it happens: Developers extract logic from a 300-line controller into a 300-line service. The logic moves but the problem doesn't shrink. Why it's harmful: The service becomes a dumping ground for unrelated operations. Testing still requires mocking half the application. Better approach: Split by responsibility. A service should have cohesive methods (all related to the same domain concept). If a service has 20+ methods on unrelated topics, split into multiple services or actions.

### Keeping Logic in Controllers "Because It's Simple"
Why it happens: A 3-line inline validation and query seems too small to extract. Why it's harmful: Ten 3-line violations create a 300-line controller. Each individual decision is rational; the aggregate is a maintenance nightmare. Better approach: Extract anything that could change independently of the HTTP contract. A validation rule change should not require a controller change.

### Passing the Full Request to Services
Why it happens: The service needs data from the request, so the entire request object is passed. Why it's harmful: The service becomes coupled to the HTTP layer. It cannot be used from CLI or queue jobs. Testing requires mocking a full Request object. Better approach: Extract validated data into DTOs or pass only primitive values.

### Creating "Empty" Services
Why it happens: Following the thin controller pattern mechanically. Why it's harmful: A service that just forwards calls to Eloquent with no real logic adds indirection without benefit. A 3-line controller calling a 3-line service that calls a model is ceremony. Better approach: If the service method is a one-liner that just calls the model, keep the logic in the controller or use an action class when the action has real behavior.

### Making Every Controller Use Single-Action
Why it happens: Enthusiasm for the single-responsibility principle. Why it's harmful: 7 files per resource for simple CRUD operations. File proliferation makes navigation harder, not easier. Better approach: Use resource controllers for CRUD clusters. Use single-action controllers for standalone non-CRUD operations with unique middleware or authorization.

---

## Failure Modes

### Business Logic Hidden in Controllers
A controller refactoring that adds a business rule inline ("if order total > 100, apply discount") is invisible to developers looking for business logic in services or actions. The rule is inside the HTTP boundary, hidden from the business logic layer. This causes bugs when the same operation needs to run from a CLI command — the business rule is duplicated or missed.

### Controller That "Just Works" But Cannot Be Tested in Isolation
A fat controller with 50 lines of logic mixed with HTTP handling can only be tested through feature tests. If the logic is complex enough to need multiple edge cases, each feature test runs the full framework stack. A test suite exercising 20 edge cases of a single fat controller method takes 10–30 seconds instead of 0.1 seconds.

### Refactoring That Breaks the HTTP Contract
Extracting logic from a fat controller changes the structure but not the behavior. However, a mistake during extraction (wrong parameter order, missing validation, incorrect response) can change the HTTP contract. Each extraction step must be verified against the original behavior.

---

## Ecosystem Usage

### Laravel Jetstream
Jetstream uses thin controllers with injected action classes. The `App\Actions` directory contains classes like `CreateTeam`, `UpdateTeam`, `AddTeamMember`, each with a single `handle()` method. The controllers delegate to these actions and return redirects. Jetstream is the canonical example of the thin controller pattern from the framework authors themselves.

### Laravel Breeze
Breeze uses controller methods that are thin by default. The authentication controllers (`AuthenticatedSessionController`, `RegisteredUserController`) delegate to authentication services and return redirects. The controllers are under 15 lines each.

### Spatie Packages
Spatie's `laravel-permission` and `laravel-activitylog` use thin controllers in their administrative interfaces. The controllers delegate to service methods and return responses. Their internal guidelines codify: "Try to keep controllers simple and stick to the default CRUD keywords."

### Monica CRM (Production Open Source)
Monica CRM, a production Laravel application with 200+ controllers, follows the thin controller pattern extensively. Controllers delegate to services (ContactService, ActivityService, etc.) and return views or redirects. Service classes encapsulate business logic. The codebase demonstrates thin controllers at scale.

---

## Related Knowledge Units

### Prerequisites
- Controller Architecture — Controller dispatch and the base Controller class
- Service Container Basics — Dependency injection for thin controller dependencies

### Related Topics
- Single-Action Controllers — Natural enforcement of thin controller discipline
- Resource Controllers — CRUD controllers that stay thin with FormRequests and actions
- Dependency Injection — Constructor vs method injection for thin controllers
- Form Requests — Moving validation out of controllers

### Advanced Follow-up Topics
- Service Layer Pattern — Multi-method service classes for related operations
- Actions Pattern — Single-purpose action classes for discrete operations
- Controller Organization — Structuring directories for thin controllers at scale
- Controller Testing — Testing thin controllers vs testing extracted logic
- API Resources — Moving response formatting out of controllers

---

## Research Notes

### Source Analysis
- Laravel Framework source: `ControllerDispatcher::dispatch()` — shows the minimal dispatch path
- Laravel Jetstream: `App\Actions` directory — canonical thin controller + action pattern from framework authors
- Laravel Breeze: Authentication controllers — thin controllers in official starter kits
- Spatie PHP Guidelines: "Keep controllers simple, stick to CRUD keywords"

### Key Insight
The thin controller principle is not about line count — it is about reason to change. A thin controller method changes only when the HTTP contract changes. Business logic changes should never require controller modifications. Line count is a useful heuristic, but the true test is: "Would this change be necessary if the business logic stayed the same but the response format changed?" If yes, the logic belongs in the controller. If no, it belongs elsewhere.

### Key Controversy
The "fat model" vs "service layer" debate continues in the community. Taylor Otwell advocates for models with rich public APIs that delegate internally. The community increasingly favors dedicated service/action classes. Both approaches produce thin controllers — the difference is where the business logic lives. The shared principle is: controllers should not contain business logic.

### Version-Specific Notes
- Thin controller principles are framework-version-independent
- The mechanisms enabling thin controllers (FormRequests, method injection, route model binding) have been stable since Laravel 5.x
- Laravel 12+ `HasMiddleware` further reduces controller constructor bloat by moving middleware to static methods
- The pattern is consistent across Laravel 5.x through 13.x
