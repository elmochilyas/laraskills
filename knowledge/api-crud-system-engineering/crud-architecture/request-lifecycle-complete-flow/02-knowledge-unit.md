# Request Lifecycle Complete Flow

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Request Lifecycle Complete Flow
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

The request lifecycle complete flow traces an HTTP request from entry point through every architectural layer to the response. It connects all the CRUD architecture patterns — routing, middleware, controllers, DTOs, actions/services, repositories, and response serialization — into a single end-to-end narrative. This KU is the capstone that shows how all other KUs fit together.

The engineering significance is that developers must understand the complete flow to debug effectively, add new features consistently, and reason about where each concern is handled. A developer who only understands the controller or the model misses how middleware affects their code, how DTOs transform data between layers, and how the response is built.

---

## Core Concepts

### The Complete Flow

```
1. HTTP Request
2. Entry Point (public/index.php)
3. Bootstrap (app bootstrap, kernel resolution)
4. Router (URI matching)
5. Route Middleware (global + route-specific)
6. Controller Resolution (container)
7. Controller Method (extract validated data)
8. DTO Construction (from validated request)
9. Action/Service Execution (business logic)
10. Repository/Model (data access)
11. Response Construction (JSON, resource, redirect)
12. Terminable Middleware (post-response cleanup)
```

### Layer Responsibility Summary

| Step | Layer | Responsibility |
|------|-------|---------------|
| 1-3 | Kernel/Bootstrap | Application initialization |
| 4 | Router | URI → route match |
| 5 | Middleware | Auth, throttle, session, CSRF |
| 6-7 | Controller | HTTP concerns |
| 8 | DTO | Type-safe data carrier |
| 9 | Action/Service | Business logic |
| 10 | Repository/Model | Data access |
| 11 | Response | HTTP response building |
| 12 | Middleware | Post-response |

---

## Mental Models

### The River

The request is a river flowing from source (HTTP) to sea (response). Each layer is a section of the river with a specific geography (middleware = rapids, controller = riverbank, service = deep channel). The water (data) passes through every section, shaped by each.

### The Airport

The request is a passenger arriving at an airport: Entry (arrivals) → Security (middleware) → Check-in (controller) → Baggage (DTO) → Flight (action/service) → Destination (response). Each step is necessary and ordered.

---

## Internal Mechanics

### Complete HTTP Flow Through CRUD Layers

```
HTTP Request
  → public/index.php (entry point)
    → bootstrap/app.php (application bootstrap)
      → Kernel::handle($request) (kernel resolution)
        → Router::dispatch($request) (URI matching)
          → Middleware stack (auth, throttle, session, CSRF)
            → Controller resolution (container injection)
              → FormRequest validation (input validation)
                → DTO construction (data transformation)
                  → Action/Service execution (business logic)
                    → Repository/Eloquent (data access)
                      → SQL query execution
                        → Response construction (JSON/resource)
                          → Response sent to client
                            → Terminable middleware (post-response cleanup)
```

### Framework Bootstrap Sequence

At the entry point, `public/index.php` loads the Composer autoloader (`vendor/autoload.php`), then bootstraps the Laravel application via `bootstrap/app.php`. The kernel is resolved from the container — `App\Http\Kernel::class` for HTTP requests. The kernel's `handle()` method runs the middleware pipeline and dispatches the request to the router.

### Container Resolution Chain

Each layer is resolved by the service container when it is type-hinted as a dependency. The controller is resolved first (with its constructor dependencies), then the form request is validated, the DTO is constructed in userland code, the action/service is resolved (with its dependencies), and finally the repository/Eloquent model is resolved or accessed statically.

---

## Detailed Flow

### Step 1-3: Entry and Bootstrap

```
public/index.php
  → require autoload.php
  → $app = require bootstrap/app.php
  → $kernel = $app->make(Kernel::class)
  → $response = $kernel->handle($request)
```

The application boots: service providers are registered, config is loaded, and the kernel is resolved. This is framework infrastructure — rarely modified in CRUD applications.

### Step 4-5: Routing and Middleware

```
Router::dispatch($request)
  → Match URI to route (Route::get('/users', [UserController::class, 'index']))
  → Resolve route middleware (auth, throttle, api)
  → Run global middleware stack
  → Run route-specific middleware
```

Middleware may reject the request (401 Unauthenticated, 429 Too Many Requests) before reaching the controller.

### Step 6-7: Controller

```php
class UserController
{
    public function __construct(
        private CreateUserAction $createUser,
    ) {}

    public function store(CreateUserRequest $request): JsonResponse
    {
        // Controller only handles HTTP concerns
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->createUser->execute($dto);
        return response()->json($user, 201);
    }
}
```

The controller is resolved by the container with its dependencies. The method receives the validated request data, constructs a DTO, and delegates to an action.

### Step 8: DTO Construction

```php
class CreateUserDto
{
    public static function fromRequest(CreateUserRequest $request): self
    {
        return new self(
            name: $request->validated('name'),
            email: $request->validated('email'),
        );
    }
}
```

The DTO is constructed from validated data only. Raw request input never enters the DTO.

### Step 9: Action/Service Execution

```php
class CreateUserAction
{
    public function execute(CreateUserDto $dto): User
    {
        return DB::transaction(fn() => User::create($dto->toArray()));
    }
}
```

The action executes the business logic. It may call repositories, dispatch events, or compose other actions.

### Step 10: Data Access

```php
// Direct Eloquent
User::create($dto->toArray());

// Via repository
$this->users->create($dto->toArray());
```

Data is persisted. The choice of direct Eloquent vs repository is based on query complexity and cross-cutting concerns.

### Step 11-12: Response and Termination

```php
// Controller returns response
return response()->json($user, 201);

// Response sent to client
// Terminable middleware runs
// Kernel terminates
```

The response is built and sent. Terminable middleware (those with a `terminate()` method) runs after the response is sent.

---

## Patterns

### Complete CRUD Create Flow

```php
// POST /api/users
// 1. Request → public/index.php
// 2. Bootstrap → Kernel
// 3. Route: api.php → UserController@store
// 4. Middleware: auth:api, throttle:60,1
// 5. Controller resolved with CreateUserAction
// 6. CreateUserRequest validated
// 7. CreateUserDto constructed from validated data
// 8. CreateUserAction::execute($dto)
// 9. DB::transaction → User::create()
// 10. Response: 201 JSON
// 11. Terminable middleware runs
```

### Complete CRUD List Flow

```php
// GET /api/users?per_page=15&role=admin
// 1-4. Same bootstrap and middleware
// 5. UserController@index(UserIndexRequest)
// 6. UserIndexDto from request (page, perPage, filters)
// 7. ListUsersAction::execute($dto)
// 8. User::query()->filter($criteria)->paginate()
// 9. UserResource::collection($users)
// 10. Response: 200 JSON collection
```

---

## Architectural Decisions

### Where Each Concern Lives

| Concern | Layer | Reason |
|---------|-------|--------|
| Authentication | Middleware | Cross-cutting, happens before controller |
| Input validation | FormRequest | Centralized per-route validation |
| Data transformation | DTO | Layer boundary between HTTP and business |
| Business rules | Action/Service | Single responsibility per operation |
| Data access | Repository/Model | Persistence logic |
| Response formatting | Resource/Controller | HTTP serialization |

### The Non-Negotiable Path

Data must always flow through: Controller → DTO → Action/Service → Data Access. Skipping any step requires explicit justification (see When to Skip Layers).

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Complete traceability — every request path is predictable | Many files to trace through for a single operation | Navigator tools (IDE, grep) mitigate this |
| Clear ownership of each concern | Onboarding requires understanding the full flow | Invest in architecture documentation |
| Independent testability of each layer | Integration tests must traverse all layers | Unit test each layer; integration test the flow |

---

## Performance Considerations

The complete flow adds ~1-5ms overhead from framework bootstrap, middleware, routing, and container resolution. For typical CRUD operations, this is 5-20% of total request time (the rest is database queries). Optimization should focus on database queries, not the flow overhead.

---

## Production Considerations

### Debugging the Flow

When a request produces unexpected behavior, trace through each layer:
1. Did middleware reject it? (Check response status)
2. Did the controller receive the right data? (Check validation)
3. Was the DTO constructed correctly? (Check factory method)
4. Did the action execute correctly? (Check business logic)
5. Did the data access return the right result? (Check query)

### Monitoring Points

Add monitoring at layer boundaries:
- Controller entry/exit times
- Action execution times
- Repository query times
- Response serialization times

---

## Common Mistakes

### Assuming the Flow is Shorter Than It Is
Why it happens: "The request goes from route to controller to model" — ignoring middleware, DTOs, and response formatting. Why it's harmful: Bugs in middleware, DTO construction, or response serialization are attributed to the wrong layer. Better approach: Trace the full flow for every new endpoint.

### Skipping Steps in the Flow
Why it happens: Controller calls `Model::create()` directly with `$request->all()`. Why it's harmful: Bypasses validation, DTO construction, and business logic. Better approach: Follow the complete flow — every step exists for a reason.

### Not Understanding Where to Add New Logic
Why it happens: Adding a business rule in the controller because "that's where the code was." Why it's harmful: The controller is not the correct layer for business rules. Better approach: Identify the correct layer based on the concern type.

---

## Failure Modes

### Flow Short-Circuit
Middleware returns a response before reaching the controller (e.g., auth middleware blocks the request). The developer debugs "why is my controller not being called?" but the issue is in middleware. Mitigate: Check middleware response codes early in debugging.

### DTO Construction Failure
DTO construction throws an exception because validated data doesn't match the expected shape. The error propagates as a 500 error. Mitigate: Test DTO factories with various valid/invalid inputs.

### Silent Data Loss in Response
An Eloquent model attribute is appended to the response via `$appends`, but the resource or DTO doesn't include it. The data is in the database but not in the response. Mitigate: Test response shapes explicitly.

---

## Ecosystem Usage

### Laravel Documentation
The framework documentation covers each step in the flow independently: entry point, service providers, routing, middleware, controllers, responses. This KU synthesizes those steps into a complete narrative.

### Production Monitoring
Platforms like Laravel Pulse, Telescope, and DataDog trace the complete request flow for each request, showing time spent in each layer.

---

## Related Knowledge Units

### Prerequisites
- All CRUD Architecture KUs — Each KU covers a step in the flow

### Related Topics
- Thin Controller Principle — Step 6-7
- Data Transfer Object Design — Step 8
- Action Class Design — Step 9
- Service Class Design — Step 9
- Repository Pattern Design — Step 10

### Advanced Follow-up Topics
- Response Serialization Patterns — Step 11
- Middleware Design — Step 5
- Octane Lifecycle — The flow under Laravel Octane

---

## Research Notes

### Source Analysis
- Laravel documentation: Request Lifecycle chapter
- Laravel source: Kernel.php handle() method, Router dispatch()
- Production monitoring: Average request traverses 8-12 layers in CRUD architecture

### Key Insight
The complete request lifecycle is the synthesis of all CRUD architecture patterns. Understanding the full flow is the difference between a developer who can maintain the codebase and one who can design it. Each layer in the flow exists because it solves a specific problem — middleware for cross-cutting concerns, DTOs for type safety, actions for business logic, repositories for data access.

### Version-Specific Notes
- Laravel 11+: Simplified bootstrap (bootstrap/app.php), middleware in Kernel class removed
- Laravel 10: Traditional bootstrap (bootstrap/app.php returns Application)
- The flow structure is consistent across Laravel 8-13
