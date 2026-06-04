# Resources vs DTOs — Rules

## Rule 1: Use API Resources for HTTP-Only Serialization; Use DTOs for Multi-Channel Data
---
## Category
Architecture
---
## Rule
Choose API Resources when the data is serialized exclusively for HTTP API responses. Choose DTOs when the same data must cross multiple channels (API + queue + broadcast + CLI).
---
## Reason
Resources are coupled to HTTP (`$request`, `Responsable`, response metadata). Using them for non-HTTP channels carries unnecessary baggage. DTOs are channel-agnostic and work everywhere.
---
## Bad Example
```php
// DTO used for a single HTTP endpoint with no other channel
class UserController
{
    public function show(int $id): array
    {
        return UserDTO::fromModel(User::findOrFail($id))->toArray();
    }
}
```
---
## Good Example
```php
// Single-channel HTTP → API Resource
class UserController
{
    public function show(int $id): UserResource
    {
        return new UserResource(User::findOrFail($id));
    }
}

// Multi-channel → DTO (API + queue + events)
class UserService
{
    public function getProfile(int $id): UserDTO
    {
        return UserDTO::fromModel(User::with('posts')->findOrFail($id));
    }
}
```
---
## Exceptions
Projects already standardized on DTOs for all boundaries where adding Resources for HTTP-only endpoints would create inconsistency.
---
## Consequences Of Violation
HTTP coupling in queue jobs; oversized broadcast payloads; inability to reuse serialization logic across channels.

---

## Rule 2: Never Serialize `JsonResource` Instances to Queues or Events
---
## Category
Architecture
---
## Rule
Do not pass `JsonResource` objects as constructor parameters to queue jobs or event listeners. Use DTOs or plain model identifiers instead.
---
## Reason
`JsonResource` implements `Serializable` but carries the full underlying Eloquent model (with relations, hidden attributes, and HTTP context), producing oversized, leak-prone payloads.
---
## Bad Example
```php
class SendWelcomeEmail implements ShouldQueue
{
    public function __construct(
        public UserResource $user, // Carries HTTP context + full model
    ) {}
}
```
---
## Good Example
```php
class SendWelcomeEmail implements ShouldQueue
{
    public function __construct(
        public UserDTO $user, // Lightweight typed data only
    ) {}
}

// Or with just the ID
class SendWelcomeEmail implements ShouldQueue
{
    public function __construct(
        public int $userId,
    ) {}
}
```
---
## Exceptions
No common exceptions. Resources belong at the HTTP boundary only.
---
## Consequences Of Violation
Oversized queue payloads; lazy loading triggered during queue serialization; hidden attributes exposed in job payloads.

---

## Rule 3: When Using Both, Enforce Layering: Services Return DTOs, Controllers Wrap in Resources
---
## Category
Architecture
---
## Rule
In a layered architecture with both DTOs and Resources, services/actions must return DTOs. Controllers receive DTOs and wrap them in Resources for HTTP response.
---
## Reason
This layering keeps domain boundaries clean (DTOs define the contract) while preserving HTTP-specific features (conditionals, wrapping, pagination metadata) at the presentation layer.
---
## Bad Example
```php
class UserService
{
    public function getProfile(int $id): UserResource // Service returns HTTP-aware object
    {
        $user = User::findOrFail($id);
        return new UserResource($user);
    }
}
```
---
## Good Example
```php
class UserService
{
    public function getProfile(int $id): UserDTO
    {
        return UserDTO::fromModel(User::with('posts')->findOrFail($id));
    }
}

class UserController
{
    public function show(int $id, UserService $service): UserResource
    {
        return UserResource::make($service->getProfile($id));
    }
}
```
---
## Exceptions
Simple CRUD applications where the layering overhead is not justified (use Resources alone in that case, not both).
---
## Consequences Of Violation
Service layer coupled to HTTP; inability to reuse services in queue/CLI contexts; resource logic duplicated across service and presentation.

---

## Rule 4: Use DTOs for Input Validation at Application Boundaries
---
## Category
Security
---
## Rule
Use DTOs (with `spatie/laravel-data` or custom `fromArray()`) as the typed input contract at controllers, queue listeners, and command handlers to validate incoming data shape and types.
---
## Reason
DTOs with typed properties and validation rules provide a strong boundary against malformed data, catching type errors and missing fields early rather than passing them to domain logic.
---
## Bad Example
```php
class UserController
{
    public function store(Request $request): UserResource
    {
        $user = User::create($request->all()); // No typed boundary
        return new UserResource($user);
    }
}
```
---
## Good Example
```php
class UserController
{
    public function store(CreateUserRequest $request, UserService $service): UserResource
    {
        $dto = CreateUserDTO::fromArray($request->validated());
        $user = $service->createUser($dto);
        return new UserResource($user);
    }
}
```
---
## Exceptions
Simple CRUD with Form Request validation already providing sufficient boundary protection.
---
## Consequences Of Violation
Type confusion bugs; malformed data reaching domain logic; inconsistent handling of missing or invalid fields.

---

## Rule 5: Do Not Use DTOs for Every Internal Method Call
---
## Category
Architecture
---
## Rule
Use DTOs only at application boundaries (where data enters or leaves the system). Internal method calls between services within the same bounded context do not require DTOs.
---
## Reason
DTOs everywhere creates accidental complexity — dozens of single-use data classes, constant mapping between similar types, and slowed development velocity without proportional benefit.
---
## Bad Example
```php
class InventoryService
{
    public function checkStock(ProductLookupDTO $dto): StockResultDTO
    {
        // DTO used for internal service-to-service call
    }
}

class OrderService
{
    public function create(OrderDTO $dto): OrderResultDTO
    {
        $result = $this->inventory->checkStock(
            ProductLookupDTO::fromOrder($dto)
        );
        return OrderResultDTO::fromStock($result);
    }
}
```
---
## Good Example
```php
class InventoryService
{
    public function checkStock(int $productId, int $quantity): array
    {
        // Simple parameters for internal call
    }
}

class OrderService
{
    public function create(OrderDTO $dto): OrderResultDTO
    {
        // DTO at boundary; internal calls use simple types
        $result = $this->inventory->checkStock(
            productId: $dto->productId,
            quantity: $dto->quantity,
        );
        return OrderResultDTO::fromResult($result);
    }
}
```
---
## Exceptions
Complex bounded contexts where the internal contract is significant enough to warrant a typed object (document the decision).
---
## Consequences Of Violation
DTO explosion; slower development; frequent trivial mapping code; reduced code readability.

---

## Rule 6: Establish a Project-Wide Convention for Resources vs DTOs and Document It
---
## Category
Maintainability
---
## Rule
Document in the project README or an Architecture Decision Record whether the project uses Resources, DTOs, or both, and the specific rules for when each applies.
---
## Reason
Without a documented convention, different developers make different choices for similar situations, creating an inconsistent codebase where some endpoints use Resources, others use DTOs, and others return models directly.
---
## Bad Example
```php
// Some controllers use Resources
// Some controllers use DTOs
// Some controllers return $model->toArray()
// No consistency — each endpoint is a different pattern
```
---
## Good Example
```php
// ADR-003: Serialization Strategy
// - All HTTP endpoints use API Resources
// - Queue/broadcast/events use DTOs
// - Controllers never return raw models
// - Services never return Resources
```
---
## Exceptions
No common exceptions. The serialization strategy must be explicitly decided and documented.
---
## Consequences Of Violation
Inconsistent codebase; onboarding confusion; mixed patterns that increase maintenance cost and reduce predictability.

---

## Rule 7: Test DTOs at the Unit Level; Test Resources at the Feature Level
---
## Category
Testing
---
## Rule
Write unit tests for DTO mapping and serialization (`fromModel()`, `toArray()`). Write feature tests for Resource output structure via HTTP responses.
---
## Reason
DTOs are pure data objects testable without Laravel bootstrap. Resources require the HTTP layer (`$request`, routing) and are best tested through feature tests that verify the full response.
---
## Bad Example
```php
// Testing DTO through HTTP — slow and unnecessary
public function test_dto(): void
{
    $response = $this->getJson('/api/users/1');
    // Testing DTO via feature test — too slow, wrong layer
}

// Testing Resource via unit test — lacks HTTP context
public function test_resource(): void
{
    $resource = new UserResource(User::factory()->make());
    $resource->toArray(Request::create('/')); // Missing real HTTP context
}
```
---
## Good Example
```php
// DTO unit test — fast, no framework
public function test_dto_from_model(): void
{
    $user = User::factory()->make(['name' => 'John']);
    $dto = UserDTO::fromModel($user);
    $this->assertSame('John', $dto->name);
}

// Resource feature test — full HTTP stack
public function test_resource_output(): void
{
    $response = $this->getJson('/api/users/1');
    $response->assertJsonStructure(['data' => ['id', 'name']]);
}
```
---
## Exceptions
No common exceptions. Tests belong at the layer they verify.
---
## Consequences Of Violation
Slow test suites testing DTOs through HTTP; fragile Resource tests without HTTP context; missed integration bugs between DTO and Resource layers.

---

## Rule 8: Version Serialization Contracts Regardless of Whether You Use Resources or DTOs
---
## Category
Scalability
---
## Rule
Apply API versioning to your serialization contracts (both Resources and DTOs) by creating version-specific classes, not by adding conditional version logic inside a single class.
---
## Reason
Serialization contracts evolve over time. Without versioning, changing a field name, type, or structure breaks all existing consumers. Version-specific classes provide clean evolution paths.
---
## Bad Example
```php
class UserDTO
{
    public function __construct(
        public readonly int $id,
        public readonly string $name,
        public readonly string $email,
    ) {}

    public function toArray(): array
    {
        // Cannot change structure without breaking consumers
        return ['id' => $this->id, 'name' => $this->name];
    }
}
```
---
## Good Example
```php
// V1/UserDTO
namespace App\DataTransferObjects\V1;
class UserDTO
{
    public function toArray(): array
    {
        return ['id' => $this->id, 'name' => $this->name];
    }
}

// V2/UserDTO
namespace App\DataTransferObjects\V2;
class UserDTO
{
    public function toArray(): array
    {
        return ['user_id' => $this->id, 'full_name' => $this->name];
    }
}
```
---
## Exceptions
Internal-only systems with a single consumer that can be updated atomically.
---
## Consequences Of Violation
Breaking changes for API consumers; inability to evolve the serialization contract; coupling between internal changes and external integrations.

---

## Rule 9: Do Not Use DTOs as an Excuse to Avoid Learning API Resources
---
## Category
Framework Usage
---
## Rule
Learn and use Laravel API Resources for HTTP serialization before reaching for DTOs. DTOs add value only when multi-channel serialization or strict typing at boundaries is required.
---
## Reason
Resources provide built-in features (pagination, conditional attributes, wrapping, `Responsable` interface) that must be manually reimplemented when using DTOs for HTTP, wasting effort.
---
## Bad Example
```php
// Using DTO for HTTP-only API, reimplementing resource features
class UserDTO
{
    public function toArray(): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            // No built-in: whenLoaded, whenCounted, wrapping, pagination
        ];
    }
}
```
---
## Good Example
```php
// HTTP-only: use API Resource with built-in features
class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'posts' => PostResource::collection($this->whenLoaded('posts')),
        ];
    }
}
```
---
## Exceptions
Projects already deeply invested in DTO-first architecture where reimplementing resource features in DTOs is the established pattern.
---
## Consequences Of Violation
Reimplementing framework features; higher maintenance cost; missing Laravel integration benefits.

---

## Rule 10: Profile Before Assuming DTOs Have No Performance Cost
---
## Category
Performance
---
## Rule
Measure the performance impact of adding a DTO layer in hot serialization paths before blanket-adopting the pattern. DTO creation overhead, while small, compounds across thousands of items.
---
## Reason
Each DTO requires object instantiation, property assignment, and method dispatch. For listing endpoints returning 10k+ items, the DTO mapping layer adds measurable latency.
---
## Bad Example
```php
// Adding DTO mapping to a high-throughput listing without profiling
public function list(MessageService $service): array
{
    return $service->getMessages()->toArray();
    // 50k messages × DTO construction every request
}
```
---
## Good Example
```php
// Profile first
// If endpoint returns < 1k items: DTO overhead is negligible
// If endpoint returns > 10k items: measure before committing
public function list(): LengthAwarePaginator
{
    return Message::paginate(50); // Skip DTO for internal bulk reads
}
```
---
## Exceptions
Security-critical endpoints where the type-safety benefits of DTOs justify any performance cost.
---
## Consequences Of Violation
Unexpected latency in high-traffic endpoints; serialization becoming a bottleneck; unnecessary object churn in hot paths.
