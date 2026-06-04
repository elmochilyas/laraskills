# Resource vs DTO Decision — Engineering Rules

---

## Rule: Never Pass Resources as Arguments to Services

---

## Category

Architecture

---

## Rule

Services must never receive a `JsonResource` instance as a method argument. Services should receive typed DTOs, Eloquent models, or primitives.

---

## Reason

Resources carry HTTP context (`$request`), wrapping configuration, and response metadata. A service that depends on a Resource becomes coupled to the HTTP layer, making it unusable from CLI commands, queue jobs, or other non-HTTP contexts.

---

## Bad Example

```php
class OrderService
{
    public function process(OrderResource $resource): void
    {
        $order = $resource->resource; // Hidden HTTP dependency
    }
}

class OrderController
{
    public function store(StoreOrderRequest $request): OrderResource
    {
        $resource = new OrderResource($request->order());
        $this->orderService->process($resource);
        return $resource;
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function process(Order $order, OrderDto $dto): Order
    {
        $order->update($dto->toArray());
        return $order;
    }
}

class OrderController
{
    public function store(StoreOrderRequest $request): OrderResource
    {
        $dto = OrderDto::fromArray($request->validated());
        $order = $this->orderService->process($request->order(), $dto);
        return new OrderResource($order);
    }
}
```

---

## Exceptions

No common exceptions. Passing Resources to services is always an architectural violation.

---

## Consequences Of Violation

Architectural coupling between HTTP layer and business logic; inability to reuse services from CLI/queue; testing complexity from HTTP simulation.

---

## Rule: Never Return Bare DTOs from Controllers When Resources Are Available

---

## Category

Architecture

---

## Rule

Controllers must return `JsonResource` or `ResourceCollection` instances for HTTP responses. Do not return DTOs directly via `response()->json($dto)` when resource features would be useful.

---

## Reason

DTOs lack HTTP-specific features: conditional field support (`when()`, `whenLoaded`), automatic pagination metadata, JSON:API compliance, and response header customization. Returning a DTO directly bypasses all capabilities, preventing future response structure evolution.

---

## Bad Example

```php
public function show(User $user): JsonResponse
{
    $dto = UserDto::fromModel($user);
    return response()->json($dto->toArray());
    // No conditionals, no pagination, no wrapping
}
```

---

## Good Example

```php
public function show(User $user): UserResource
{
    $dto = UserDto::fromModel($user);
    return UserResource::make($dto);
    // Resource provides conditionals, wrapping, metadata
}
```

---

## Exceptions

Internal APIs with no conditional response needs, no pagination, and a single trusted internal consumer.

---

## Consequences Of Violation

Missing response features (conditionals, pagination); architectural refactoring needed when features are added later; inconsistent response patterns.

---

## Rule: Keep DTOs HTTP-Agnostic

---

## Category

Architecture

---

## Rule

DTOs must not reference HTTP concepts: no `$request`, no `whenLoaded()`, no authorization checks, no response formatting. DTOs are pure data carriers for inter-layer transport.

---

## Reason

A DTO that depends on HTTP context cannot be used from CLI, queues, or event listeners. Adding HTTP dependencies contaminates the data layer with presentation concerns and prevents reuse across contexts.

---

## Bad Example

```php
class UserDto
{
    public static function fromRequest(Request $request): self
    {
        return new self(name: $request->input('name'));
    }

    public function shouldIncludeBio(Request $request): bool
    {
        return $request->user()?->isAdmin() ?? false; // HTTP-aware logic
    }
}
```

---

## Good Example

```php
class UserDto
{
    public readonly string $name;

    public static function fromArray(array $data): self
    {
        $dto = new self();
        $dto->name = $data['name'];
        return $dto;
    }
}

// Controller handles HTTP concerns
public function store(StoreUserRequest $request): UserResource
{
    $dto = UserDto::fromArray($request->validated());
    $user = $this->userService->register($dto);
    return new UserResource($user);
}
```

---

## Exceptions

No common exceptions. HTTP context in DTOs is always a violation.

---

## Consequences Of Violation

Inability to reuse DTOs outside HTTP context; layer coupling between transport and presentation; testing complexity from HTTP dependencies.

---

## Rule: Use Both DTOs and Resources for Public APIs with Complex Logic

---

## Category

Architecture

---

## Rule

Public APIs with complex business logic and multiple client types must use both DTOs (for internal transport) and Resources (for response shaping). Simple CRUD endpoints without a service layer may use Resources only.

---

## Reason

DTOs provide type-safe, HTTP-agnostic data transport. Resources provide HTTP-specific features (conditionals, pagination, JSON:API). Using only DTOs loses response features. Using only Resources couples services to HTTP. The "both" pattern gives each layer the right tool.

---

## Bad Example

```php
public function store(Request $request): OrderResource
{
    $order = $this->orderService->process($request->all()); // No type safety
    return new OrderResource($order);
}
```

---

## Good Example

```php
public function store(StoreOrderRequest $request): OrderResource
{
    $dto = CreateOrderDto::fromRequest($request);
    $order = $this->orderService->process($dto); // Typed transport
    return new OrderResource($order);            // Response shaping
}
```

---

## Exceptions

Simple CRUD endpoints with no service layer and no external API consumers.

---

## Consequences Of Violation

Architectural fragility from mixed concerns; inability to reuse business logic across contexts; type safety gaps in service boundaries.

---

## Rule: Maintain Clear Dependency Direction — DTOs Never Depend on Resources

---

## Category

Architecture

---

## Rule

DTOs must never import, extend, or reference any `JsonResource` class. Resources may import DTOs. DTOs may not import Resources.

---

## Reason

Circular dependencies between DTOs and Resources create an untangleable mess. If a DTO returns a Resource, the DTO becomes HTTP-aware. If a Resource returns a DTO, the response chain loses HTTP features. The dependency must be unidirectional: DTOs are independent value objects.

---

## Bad Example

```php
class UserDto
{
    public function toResource(): UserResource
    {
        return new UserResource($this); // DTO depends on Resource
    }
}
```

---

## Good Example

```php
class UserDto
{
    public readonly string $name;
    public readonly string $email;
}

// Controller handles the Resource creation
public function show(User $user): UserResource
{
    $dto = UserDto::fromModel($user);
    return new UserResource($dto);
}
```

---

## Exceptions

No common exceptions. DTO-to-Resource dependency is always incorrect.

---

## Consequences Of Violation

Circular dependencies between layers; inability to version DTOs independently of Resources; architectural rigidity.

---

## Rule: Use the Decision Matrix for Each Endpoint's Pattern Choice

---

## Category

Architecture

---

## Rule

For every new endpoint, evaluate whether it needs a service layer, has multiple clients, and requires conditional response fields. Use the documented decision matrix to determine Resource-only, DTO-only, or both.

---

## Reason

Applying the same pattern to every endpoint regardless of complexity leads to either over-engineering (DTOs on trivial CRUD) or under-engineering (no DTOs on complex business logic). The decision matrix provides a repeatable, testable framework for pattern selection.

---

## Bad Example

```php
// DTO forced on a trivial CRUD endpoint with no service layer
class UserController
{
    public function index(): UserCollection
    {
        $dtoCollection = User::all()->map(fn($u) => UserDto::fromModel($u));
        return new UserCollection($dtoCollection);
        // Extra DTO step adds no value — model goes directly to Resource
    }
}
```

---

## Good Example

```php
// Trivial CRUD — Resource only
public function index(): UserCollection
{
    return UserResource::collection(User::paginate(20));
}

// Complex business logic — DTO + Resource
public function store(StoreOrderRequest $request): OrderResource
{
    $dto = CreateOrderDto::fromRequest($request);
    $order = $this->orderService->process($dto);
    return new OrderResource($order);
}
```

---

## Exceptions

No common exceptions. The decision matrix should always be consulted for new endpoints.

---

## Consequences Of Violation

Over-engineering (unnecessary DTOs on trivial endpoints); under-engineering (no DTOs on complex logic); architectural inconsistency across the codebase.

---

## Rule: Test the Full DTO-to-Resource Chain

---

## Category

Testing

---

## Rule

Write integration tests that exercise the full DTO-to-Resource chain: FormRequest → DTO → Service → Resource → response. Verify that the final JSON output matches the expected contract.

---

## Reason

Schema drift between DTOs and Resources can silently expose or hide fields. A DTO may carry a field that the Resource omits, or the Resource may reference a DTO field that was renamed. Testing the full chain catches these mismatches at the integration boundary.

---

## Bad Example

```php
// Only tests DTO in isolation
public function test_dto_creates_correctly(): void
{
    $dto = CreateUserDto::fromArray(['name' => 'John']);
    $this->assertSame('John', $dto->name);
    // Never verifies that the Resource actually outputs 'name'
}
```

---

## Good Example

```php
public function test_create_user_endpoint(): void
{
    $response = $this->postJson('/api/users', [
        'name' => 'John',
        'email' => 'john@test.com',
    ]);

    $response->assertStatus(201);
    $response->assertJsonStructure(['data' => ['id', 'name', 'email']]);
    $response->assertJson(['data' => ['name' => 'John']]);
    // Tests full chain: request → DTO → service → Resource → response
}
```

---

## Exceptions

No common exceptions. The full chain must be tested for every public endpoint.

---

## Consequences Of Violation

Schema drift between DTO and Resource; silent field omission or exposure; client-facing contract violations not caught by isolated tests.

---

## Rule: Avoid Circular Dependencies Between DTOs and Resources

---

## Category

Architecture

---

## Rule

Never create a circular dependency where a DTO creates or depends on a Resource and that Resource depends on the same DTO. DTOs must be leaf nodes in the dependency graph.

---

## Reason

Circular dependencies between DTOs and Resources create initialization deadlocks, make testing impossible, and tightly couple what should be independent layers. The dependency graph must be acyclic: DTO → (model, service) → Resource.

---

## Bad Example

```php
class OrderDto
{
    public function toResource(): OrderResource
    {
        return new OrderResource($this);
    }
}

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        $dto = new OrderDto(/* ... */); // Resource creates DTO — circular
        return $dto->toArray();
    }
}
```

---

## Good Example

```php
class OrderDto
{
    public readonly array $items;
    public readonly float $total;
    // No HTTP-aware code, no Resource references
}

class OrderResource extends JsonResource
{
    public function toArray($request): array
    {
        // Wraps DTO, but DTO never knows about Resource
        return [
            'items' => $this->items,
            'total' => $this->total,
        ];
    }
}
```

---

## Exceptions

No common exceptions. Circular dependency between DTOs and Resources is always an architectural defect.

---

## Consequences Of Violation

Initialization deadlocks in complex chains; testing impossibility (cannot isolate either layer); tight coupling that prevents independent versioning.
