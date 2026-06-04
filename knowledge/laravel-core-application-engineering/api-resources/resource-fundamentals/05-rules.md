# Resource Fundamentals — Engineering Rules

---

## Rule: Always Explicitly List Every Field in toArray

---

## Category

Security

---

## Rule

Always return an explicit array with individually listed fields from `toArray()`. Never use `$this->resource->toArray()`, `getAttributes()`, or any dynamic method that returns all model attributes.

---

## Reason

A resource is the whitelist of what the API exposes. Using `$this->resource->toArray()` exposes every model attribute, including sensitive fields (`password`, `remember_token`), internal timestamps, and any columns added later to the database table. Explicit listing makes the API contract visible and auditable.

---

## Bad Example

```php
public function toArray($request): array
{
    return $this->resource->toArray();
    // Exposes password, remember_token, created_at, updated_at, deleted_at
}
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'name' => $this->name,
        'email' => $this->email,
    ];
}
```

---

## Exceptions

Truly internal endpoints where the model is guaranteed to contain only safe, public fields (rare in practice — prefer explicit listing).

---

## Consequences Of Violation

Security risks from sensitive field exposure; data breach liability when new model columns are automatically exposed; regulatory compliance violations (GDPR, HIPAA).

---

## Rule: Keep toArray as Pure Transformation — No Business Logic

---

## Category

Architecture

---

## Rule

Resources must only format and present pre-computed data. Never execute business logic (database queries, external API calls, complex computations, authorization checks) inside `toArray()`.

---

## Reason

Business logic inside resources is untestable in isolation, versioned implicitly (changing the logic requires changing the resource), and duplicated across multiple resources when the same computation is needed elsewhere. Resources are part of the HTTP layer and must be thin presenters.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'discount' => $this->calculateDiscount(), // Business logic in resource
        'permissions' => Permission::forUser($this->id)->pluck('name'), // DB query
    ];
}
```

---

## Good Example

```php
// Service layer computes values
class OrderService
{
    public function calculateDiscount(Order $order): float { /* ... */ }
}

// Controller pre-computes, passes to resource
public function show(Order $order): OrderResource
{
    $discount = $this->orderService->calculateDiscount($order);
    return (new OrderResource($order))->additional(['discount' => $discount]);
}

// Resource only formats
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'amount' => $this->amount,
    ];
}
```

---

## Exceptions

Trivial formatting rules (date formatting, string casing, type casting) that are presentation concerns and involve no external dependencies.

---

## Consequences Of Violation

Maintainability risks from scattered business logic; testing complexity (must test through HTTP layer); scalability risks from database queries inside response formatting; versioning challenges when business rules change.

---

## Rule: Never Pass Resources into Services

---

## Category

Architecture

---

## Rule

Services must receive typed DTOs, Eloquent models, or primitives — never `JsonResource` instances. Resources must only be returned from controllers.

---

## Reason

Resources carry HTTP context (`$request`), wrapping configuration, and response metadata. When a service depends on a Resource, it becomes coupled to the HTTP layer, making it untestable from CLI, queue jobs, or other non-HTTP contexts. The service cannot be reused without constructing an HTTP request.

---

## Bad Example

```php
class OrderService
{
    public function process(OrderResource $resource): void
    {
        // Service depends on HTTP-aware resource
        $order = $resource->resource;
        // Cannot be called from CLI or queue
    }
}

// Controller
public function store(StoreOrderRequest $request): OrderResource
{
    $resource = new OrderResource($request->order());
    $this->orderService->process($resource); // Passes resource to service
}
```

---

## Good Example

```php
class OrderService
{
    public function process(Order $order, OrderDto $dto): void
    {
        // Service receives model and typed DTO — no HTTP dependency
    }
}

// Controller
public function store(StoreOrderRequest $request): OrderResource
{
    $dto = OrderDto::fromRequest($request);
    $order = $this->orderService->process($request->order(), $dto);
    return new OrderResource($order);
}
```

---

## Exceptions

No common exceptions. Resource-to-service dependency is always an architectural violation.

---

## Consequences Of Violation

Architectural coupling between HTTP layer and business logic; testing complexity (must simulate HTTP context); inability to reuse services from CLI or queues.

---

## Rule: Match Resource Names to API Resource Names, Not Model Names

---

## Category

Design

---

## Rule

Name resource classes according to the API resource name (what the client sees), not the underlying Eloquent model name.

---

## Reason

The API contract is independent of the database schema. If the API exposes "profiles," the resource should be `ProfileResource` even if it wraps a `User` model. This decouples the API contract from the internal implementation and allows schema refactoring without API changes.

---

## Bad Example

```php
// Model is User, but API resource is called "profile"
class UserResource extends JsonResource
{
    // Client sees "profile" but resource is named "UserResource"
}
// Confusing — does not match API documentation
```

---

## Good Example

```php
// API exposes "profiles" — resource matches
class ProfileResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'display_name' => $this->name,
            'avatar' => $this->avatar_url,
        ];
    }
}
```

---

## Exceptions

When the API resource name matches the model name exactly (most CRUD resources).

---

## Consequences Of Violation

Maintenance risks when model names change but resource names stay; confusion between model and API contract; onboarding friction for developers mapping API docs to code.

---

## Rule: Use Per-Endpoint Resources When Shape Varies Significantly

---

## Category

Design

---

## Rule

When the same entity requires significantly different field sets across endpoints (list vs detail vs admin), create separate resources per endpoint rather than using excessive conditionals in a single resource.

---

## Reason

A single resource handling list, detail, and admin views via conditionals becomes unreadable, untestable (2^n combinations), and hard to version. Separate resources make each endpoint's contract explicit and independently testable.

---

## Bad Example

```php
// Single resource handling all views
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            $this->when($this->isDetail, 'email' => $this->email),
            $this->when($this->isDetail, 'bio' => $this->bio),
            $this->when($this->isAdmin, 'secret_key' => $this->secret_key),
            $this->when($this->isAdmin, 'permissions' => $this->permissions),
        ];
    }
}
```

---

## Good Example

```php
class UserListResource extends JsonResource
{
    public function toArray($request): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}

class UserDetailResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'bio' => $this->bio,
        ];
    }
}

class AdminUserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'secret_key' => $this->secret_key,
        ];
    }
}
```

---

## Exceptions

When the difference between endpoint shapes is 1-2 conditional fields. In that case, conditionals are acceptable.

---

## Consequences Of Violation

Maintainability risks from complex conditional logic; testing combinatorial explosion; client confusion from unpredictable field presence across endpoints.

---

## Rule: Use Resources for All Public API Endpoints

---

## Category

Architecture

---

## Rule

Every public API endpoint that returns model data must use a resource class. Do not return `response()->json($model->toArray())` or similar raw responses.

---

## Reason

Without a resource, the API contract is implicitly defined by the model schema. Any change to the model (attribute rename, addition, deletion) immediately changes the API response. Resources create a decoupling layer where the API contract is explicitly defined and versioned independently of the database schema.

---

## Bad Example

```php
// Controller returns raw model data — no resource
public function show(User $user): JsonResponse
{
    return response()->json($user->toArray());
    // Adding hashed_password to User model exposes it in the API
}
```

---

## Good Example

```php
// Controller uses resource
public function show(User $user): UserResource
{
    return new UserResource($user);
}

// Resource defines the explicit contract
class UserResource extends JsonResource
{
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
        ];
    }
}
```

---

## Exceptions

Trivial internal endpoints where the response shape matches the model exactly and will never change, AND there is no external consumer.

---

## Consequences Of Violation

Security risks from accidental attribute exposure; maintenance risks from tight model-to-response coupling; breaking changes when model attributes change.

---

## Rule: Never Access Relationships Without Eager Loading in Resources

---

## Category

Performance

---

## Rule

Every relationship access (`$this->relation`) inside a resource must be guarded by `whenLoaded()` or guaranteed to be eager-loaded. Never access a relationship that may not be loaded.

---

## Reason

Accessing an unloaded relationship triggers lazy loading — a separate SQL query per model instance. In a collection of 100 items, a single lazy-loaded relationship adds 100 extra queries, turning a 1-query operation into a 101-query N+1 disaster.

---

## Bad Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'comments' => CommentResource::collection($this->comments), // Triggers lazy load
    ];
}
// Collection of 100 posts → 101 queries
```

---

## Good Example

```php
public function toArray($request): array
{
    return [
        'id' => $this->id,
        'comments' => CommentResource::collection($this->whenLoaded('comments')),
    ];
}
// Collection of 100 posts → 1 query (when controller eager-loads)
```

---

## Exceptions

Relationships loaded via the model's `$with` property that are guaranteed to always be loaded.

---

## Consequences Of Violation

Performance risks from N+1 queries; scalability risks as collection size grows; database server load spikes on list endpoints.
