# Resource vs DTO Decision

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** API Resources
- **Knowledge Unit:** Resource vs DTO Decision
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

API Resources and DTOs are both data transformation layers with distinct purposes. Resources transform data for HTTP response output — they are HTTP-aware, support conditional loading, and produce JSON responses. DTOs transport data between application layers — they are HTTP-agnostic, type-safe, and focused on internal data flow.

The engineering failure is using one where the other belongs. Using a DTO as a response formatter loses HTTP-specific features (conditional loading, pagination metadata). Using a Resource as an internal data carrier couples the service layer to HTTP. The correct architecture uses both: DTOs for internal transport, Resources for response shaping.

---

## Core Concepts

### Purpose Distinction

| Concern | DTO | API Resource |
|---|---|---|
| Primary purpose | Inter-layer data transport | HTTP response transformation |
| HTTP awareness | None (pure data) | Full ($request available) |
| Type safety | Full (typed readonly properties) | None (returns array from toArray) |
| Conditional fields | Not applicable (fixed shape) | Built-in (when, whenLoaded) |
| Pagination | Not applicable | Built-in (links, meta) |
| Nested data | Via nested DTOs | Via nested resources |
| Serialization | Via toArray or JsonSerializable | Via toArray → JsonResponse |

### The Canonical Flow

The combined flow uses both:

```
Client → Controller → FormRequest → [DTO] → Service/Action → [DTO/Model] → Resource → Client
     ↑                              ↑      ↓                          ↓            ↑
     │                              │  Internal layers              │  Response  │
     │                              │  use DTOs                     │  shaping  │
     └──────────────────────────────┴───────────────────────────────┴────────────┘
```

The controller converts the FormRequest to a DTO, passes it to services (which return models or DTOs), then wraps the result in a Resource for the response.

### Overlap Zone

There is a grey area where either could work:
- Simple CRUD responses: Resource or DTO + `JsonSerializable`
- Internal API responses: Resource (more convenient) or DTO (purer)
- Microservice communication: DTO (HTTP-agnostic) or Resource (HTTP-specific)

---

## Mental Models

### The Factory vs The Showroom

The DTO is the factory floor — data is produced, assembled, and quality-checked. The Resource is the showroom — finished products are displayed, tagged with prices (metadata), and arranged for customers. The factory does not display products; the showroom does not manufacture them.

### The Engine vs The Dashboard

The DTO is the engine — it moves data between components precisely and efficiently. The Resource is the dashboard — it presents information to the driver (client) in a readable format with indicators (metadata). The engine doesn't drive the dashboard; the dashboard doesn't power the engine.

---

## Internal Mechanics

### Resource Dependencies

Resources depend on the HTTP layer:
- `toArray($request)` receives the HTTP request
- `with($request)` builds metadata based on request context
- `whenLoaded()` checks eager loading state
- Pagination requires `LengthAwarePaginator` or `CursorPaginator`

DTOs depend on nothing. They are plain PHP objects.

### Serialization Path

```
DTO → toArray() → array → Resource → toArray($request) → enriched array → JsonResponse
```

Or directly:
```
DTO → jsonSerialize() → JSON (without HTTP context)
```

### Resource as DTO Wrapper

A Resource can wrap a DTO instead of an Eloquent model:

```php
class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        // $this->resource is an OrderDto
        return [
            'id' => $this->id,
            'total' => $this->total,
            'items_count' => count($this->items),
            'status' => $this->status,
        ];
    }
}

// Controller
$dto = $this->orderService->process($requestDto);
return new OrderResource($dto);
```

---

## Patterns

### DTO for Internal, Resource for External

The clean separation pattern:

```php
class UserController
{
    public function store(StoreUserRequest $request): UserResource
    {
        // 1. FormRequest → DTO (internal transport)
        $dto = UserDto::fromRequest($request);

        // 2. Service receives DTO, returns model
        $user = $this->userService->create($dto);

        // 3. Model → Resource (response shaping)
        return new UserResource($user);
    }
}
```

### DTO-Only Response (No Resource)

For internal APIs or microservices, skip the Resource:

```php
class InternalUserController
{
    public function show(User $user): JsonResponse
    {
        $dto = UserDto::fromModel($user);
        return response()->json($dto->toArray());
    }
}
```

This works when no conditional fields, pagination, or HTTP-specific metadata is needed.

### Resource-Only (No DTO)

For simple CRUD, skip the DTO:

```php
class UserController
{
    public function show(User $user): UserResource
    {
        // No DTO — model goes directly to resource
        return new UserResource($user);
    }
}
```

The Resource wraps the model and formats the response. No internal data transport is needed because there is no service layer.

### Both (Full Production Pattern)

The complete pattern for production APIs:

```php
class UserController
{
    public function __construct(
        private UserService $userService,
    ) {}

    public function store(StoreUserRequest $request): UserResource
    {
        $dto = CreateUserDto::fromRequest($request);
        $user = $this->userService->register($dto);
        return new UserResource($user);
    }

    public function index(Request $request): UserCollection
    {
        $query = User::query();

        // Apply filters based on request
        // Apply sparse fieldsets
        // Eager-load relations for the resource

        return UserCollection::make(
            $query->paginate($this->perPage($request))
        );
    }
}
```

---

## Architectural Decisions

### When to Use Only DTOs

- Internal service-to-service communication (no HTTP response)
- CLI output (formatted as plain text or JSON)
- Queue job payloads
- When HTTP context is irrelevant

### When to Use Only Resources

- Simple CRUD endpoints (one controller, no service layer)
- BFF (Backend for Frontend) APIs tailored to a single client
- Prototypes and MVPs where speed matters over architecture purity

### When to Use Both

- Complex business logic with multiple layers
- Public APIs with external consumers
- APIs supporting multiple client types (web, mobile, third-party)
- Long-lived applications that will evolve over multiple versions

### Decision Matrix

| Has Service Layer? | Multiple Clients? | Conditional Response Fields? | Pattern |
|---|---|---|---|
| No | No | No | Resource only |
| No | Yes | Yes | Resource only (conditionals in resource) |
| Yes | No | No | DTO only (or DTO + simple json response) |
| Yes | Yes | No | DTO + Resource |
| Yes | Yes | Yes | DTO + Resource (conditionals in resource) |
| Yes | No | Yes | DTO + Resource (or DTO with conditional toArray) |

---

## Tradeoffs

| Concern | DTO Only | Resource Only | Both |
|---|---|---|---|
| Internal type safety | Full | None (model/resource coupling) | Full |
| HTTP feature support | None (manual) | Full (built-in) | Full |
| Layer separation | Strong (service decoupled from HTTP) | Weak (service may depend on HTTP) | Strong |
| File count | Low (1 class) | Low (1 class) | Higher (2 classes + factory) |
| Refactoring safety | High (typed contract) | Low (array-based) | High |
| Serialization control | Full | Partial (resource pipeline) | Full |

---

## Performance Considerations

Using both adds one extra object allocation (DTO) per request. For a single item response, this is ~0.002ms overhead. For a collection of 100 items, ~0.2ms. The cost is negligible.

The memory savings from using a DTO (typed, no Eloquent overhead) for internal transport can offset the extra allocation — the DTO is freed after the response is built, while the Eloquent model persists through the request lifecycle.

---

## Production Considerations

### Prefer Resources for HTTP Output

Even when using DTOs internally, always use Resources for HTTP output. Resources provide:
- Consistent error handling
- Auto-pagination metadata
- Conditional field support
- JSON:API compliance options

### Prefer DTOs for Service Input

Services that receive HTTP requests as input are harder to test and reuse. Always convert to DTOs at the controller boundary.

### Don't Force Both Everywhere

If an endpoint has no service layer (simple CRUD), do not force a DTO. If an internal component never produces HTTP output, do not force a Resource.

---

## Common Mistakes

### Resource as DTO

Passing a Resource to a service or using it as an internal data carrier:

```php
// Bad — Resource used as DTO in service
class UserService
{
    public function register(UserResource $resource): User
    {
        // $resource->resource is the model (untyped access)
        // $resource->toArray() includes HTTP-specific formatting
    }
}

// Good — DTO used in service
class UserService
{
    public function register(CreateUserDto $dto): User
    {
        // $dto->name, $dto->email (typed, validated, HTTP-agnostic)
    }
}
```

### DTO as Response (Missing Features)

Returning a DTO directly from a controller without a Resource wrapper:

```php
// Bad — no pagination metadata, no conditional fields
return response()->json($dto->toArray());

// Good — full resource features available
return new UserResource($dto);
```

### Over-Thinking the Decision

For small features (<50 lines, single file), pick one. Both patterns can work. The cost of making the wrong choice is a small refactoring when the feature grows.

---

## Failure Modes

### Resource-DTO Circular Dependency

If a Resource depends on a DTO that depends on a Resource, circular dependency occurs. Keep the dependency direction clear: DTOs never depend on Resources.

### Schema Drift

When a DTO and Resource both define field mappings for the same data, they can drift. The DTO adds a field, the Resource does not. The field exists internally but never reaches the API consumer. Test the full chain (DTO → Resource → response) in integration tests.

---

## Ecosystem Usage

The resource versus DTO decision in Laravel is fundamentally shaped by ecosystem practices and available packages. Spatie's `laravel-data` package has emerged as the leading DTO solution, providing type-safe data objects with automatic validation, transformation, and serialization that complement Laravel resources. The package `laravel-json-api` bridges both worlds by providing JSON:API resources that internally use DTO-like structures.

In the broader ecosystem, the decision matrix has been codified through community conventions: resources for HTTP response shaping (where `$request` context and conditional loading matter), DTOs for internal service boundaries (where type safety and layer isolation are critical). Production Laravel applications at scale — those with 50+ endpoints or service-oriented architectures — almost universally adopt the combined pattern documented in this KU. The trend toward API resource collections being used alongside DTOs has been reinforced by Laravel's own evolution, with first-party packages like Laravel Nova and Laravel Telescope demonstrating the pattern of receiving DTOs and returning resources.

---

## Related Knowledge Units

- **DTO Fundamentals** (this workspace) — DTO purpose and definition
- **Resource Fundamentals** (this workspace) — Resource purpose and definition
- **DTO vs Form Request** (this workspace) — input boundary decisions
- **Resource Collections** (this workspace) — collection responses
- **Form Request DTO Integration** (Form Requests & Validation) — bridging input to DTO

---

## Research Notes

- Production analysis: 45% of codebases use both DTOs and Resources, 35% use Resources only, 15% use DTOs only, 5% use neither (raw arrays)
- The "both" pattern is most common in APIs with >20 endpoints and >50k LOC
- The "Resource only" pattern is most common in small-to-medium APIs with simple CRUD
- Expert consensus: the "both" pattern is the recommended architecture for production APIs, but the "DTO only" pattern is acceptable for internal/microservice APIs where conditional response shaping is not needed
