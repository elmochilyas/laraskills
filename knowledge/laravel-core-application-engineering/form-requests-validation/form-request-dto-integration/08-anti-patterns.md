# Form Request DTO Integration — Anti-Patterns

## Anti-Pattern 1: Passing Raw Request Data Directly to Services

**Symptom:** Controller methods extract validated data from the FormRequest and pass it to service or domain methods that receive plain arrays or request objects.

**Problem:** Raw arrays lack type safety, are opaque, and couple service layers to HTTP request structure. A method signature like `processOrder(array $data)` gives no indication of required fields, data types, or structure. Any change to the request shape ripples through the entire call chain without compile-time safety.

```php
// BAD — opaque array coupling
public function store(StoreOrderRequest $request)
{
    $this->orderService->processOrder($request->validated());
    // What is in $data? No type safety, no documentation.
}

class OrderService
{
    public function processOrder(array $data): void
    {
        // $data could be anything
    }
}
```

**Solution:** Create a typed DTO and pass it instead.

```php
// GOOD — typed DTO
public function store(StoreOrderRequest $request)
{
    $dto = new OrderDTO(
        userId: $request->user_id,
        items: $request->items,
        coupon: $request->coupon
    );
    $this->orderService->processOrder($dto);
}
```

**Detection:** Search for `->validated()` being passed directly into service methods. Flag any method accepting `array $data`.

---

## Anti-Pattern 2: Building DTOs Inside FormRequest Classes

**Symptom:** Adding a `toDTO()` method to the FormRequest that builds and returns a Data Transfer Object.

**Problem:** The FormRequest is an HTTP concern — it handles input normalization, authorization, and validation. Adding DTO construction couples the HTTP layer to domain types and violates single responsibility. Every domain change forces a change in the request class.

```php
// BAD — DTO construction in HTTP layer
class StoreOrderRequest extends FormRequest
{
    public function toDTO(): OrderDTO
    {
        return new OrderDTO(
            $this->user()->id,
            collect($this->items)->map(fn ($item) => new LineItemDTO(...))->all(),
            $this->coupon
        );
    }
}
```

**Solution:** Keep DTO construction in the controller or a dedicated factory. FormRequests only provide validated data.

```php
// GOOD — controller handles DTO construction
class OrderController
{
    public function store(StoreOrderRequest $request, OrderDTOFactory $factory)
    {
        $dto = $factory->fromRequest($request);
        $this->orderService->processOrder($dto);
    }
}
```

**Detection:** Search for `toDTO`, `toDto`, `toDataObject`, `toValueObject` methods in FormRequest classes.

---

## Anti-Pattern 3: Skipping DTOs Entirely — Using $request->all() in Services

**Symptom:** Service methods accept `$request` directly or call `$request->all()` without validation or DTO construction.

**Problem:** Services become untestable (requires HTTP Foundation), trust untrusted input, and lack type safety. This is the most common DTO-related anti-pattern.

```php
// BAD — untestable, insecure
class OrderService
{
    public function processOrder(Request $request): void
    {
        $all = $request->all(); // Untrusted, untyped, untestable
        // ...
    }
}
```

**Solution:** Always validate input and construct a DTO before reaching the service layer.

```php
// GOOD — validated, typed, testable
class OrderService
{
    public function processOrder(OrderDTO $order): void
    {
        // Type-safe, validated, testable
    }
}
```

**Detection:** Search for `Request $request` in service class method signatures. Flag for DTO introduction.

---

## Anti-Pattern 4: Mutable DTOs in Domain Logic

**Symptom:** Using DTOs with `public` properties or setter methods in domain code, allowing any part of the system to modify the data after construction.

**Problem:** When a DTO is mutable, its contents can change between validation and persistence. Domain logic that relies on DTO immutability (e.g., snapshots, logging, queued jobs) may capture or process incorrect data.

```php
// BAD — mutable DTO
class OrderDTO
{
    public string $status = 'pending'; // Can be modified from anywhere
    public array $items;
}
```

**Solution:** Make DTO properties readonly. If transformation is needed, return a new instance.

```php
// GOOD — immutable DTO
class OrderDTO
{
    public function __construct(
        public readonly string $status = 'pending',
        public readonly array $items = [],
    ) {}
}
```

**Detection:** Search for `public` properties without `readonly` in DTO/value object classes.

---

## Anti-Pattern 5: One Massive DTO With Nullable Fields for Every Scenario

**Symptom:** A single DTO class with dozens of nullable properties used across create, update, partial update, and query scenarios.

**Problem:** Massive nullable DTOs lose the benefit of type safety — callers cannot determine which fields are required for their specific scenario. Adding a new feature forces all consumers of the DTO to handle the new nullable field, creating maintenance burden.

```php
// BAD — everything-in-one DTO
class ProductDTO
{
    public function __construct(
        public readonly ?int $id,
        public readonly ?string $name,
        public readonly ?string $description,
        public readonly ?float $price,
        public readonly ?string $category,
        public readonly ?bool $active,
        public readonly ?string $sku,
        public readonly ?int $stock,
        // 20+ more nullable properties
    ) {}
}
```

**Solution:** Create focused DTOs per use case. Use dedicated DTOs for different scenarios.

```php
// GOOD — focused per scenario
class CreateProductDTO
{
    public function __construct(
        public readonly string $name,
        public readonly float $price,
        public readonly string $category,
    ) {}
}

class UpdateProductDTO
{
    public function __construct(
        public readonly int $id,
        public readonly ?string $name,
        public readonly ?float $price,
    ) {}
}
```

**Detection:** Search for DTO constructors with 4+ nullable parameters. Flag for decomposition.

---

## Anti-Pattern 6: No DTO Mapping Layer Between Request and Domain

**Symptom:** Directly passing FormRequest validated data to domain services with no mapping/transformation layer.

**Problem:** FormRequest field names often differ from domain property names (snake_case in forms vs camelCase in domain due to JS/Laravel conventions). Without a mapping layer, domain services inherit HTTP naming conventions and cannot be reused with other input sources (CLI, API, jobs).

```php
// BAD — HTTP naming leaks into domain
$dto = new OrderDTO(
    userId: $request->validated()['user_id'], // snake_case
    couponCode: $request->validated()['coupon_code'] // snake_case
);
$this->service->processOrder($dto); // Service expects snake_case
```

**Solution:** Create a dedicated mapper/factory that handles field transformation. The DTO uses domain terminology regardless of input source.

```php
// GOOD — explicit mapping
class OrderDTOFactory
{
    public function fromRequest(StoreOrderRequest $request): OrderDTO
    {
        return new OrderDTO(
            userId: $request->validated()['user_id'],
            couponCode: $request->validated()['coupon_code']
        );
    }

    public function fromQueueJob(ProcessOrder $job): OrderDTO
    {
        return new OrderDTO(
            userId: $job->userId,
            couponCode: $job->couponCode
        );
    }
}
```

**Detection:** Search for `new SomeDTO(` in controllers. Verify a factory/mapper pattern exists rather than ad-hoc construction.
