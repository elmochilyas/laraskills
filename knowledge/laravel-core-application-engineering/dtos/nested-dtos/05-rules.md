## Rule 1: Construct Nested DTOs Bottom-Up

---

## Category

Design

---

## Rule

Always construct nested DTOs bottom-up — leaf DTOs first, then their parent containers. The parent DTO factory must receive fully constructed child DTOs as parameters, never raw data to resolve internally.

---

## Reason

In readonly DTO systems, child properties must be assigned at construction time — they cannot be set after the parent is built. Bottom-up construction guarantees that every child is fully resolved before the parent exists, enabling a single immutable construction pass with no post-construction mutation.

---

## Bad Example

```php
readonly class OrderDto
{
    public function __construct(
        public array $items, // Expects LineItemDto[]
    ) {}

    public static function fromArray(array $data): self
    {
        // Bottom-up would build LineItemDto first, but this defers to caller
        return new self(
            items: array_map(
                fn(array $item) => LineItemDto::fromArray($item),
                $data['items'],
            ),
        );
    }
}
// Actually this is fine as a single factory. The bad example would be:

readonly class OrderDto
{
    public function __construct(
        public array $items, // Receives raw arrays, expects caller to resolve
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            items: $data['items'], // Raw data, not DTOs — caller must resolve afterward
        );
    }
}
// Parent receives raw data. Consumer must resolve children after construction, violating readonly.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(
        /** @var LineItemDto[] */
        public array $items,
    ) {}

    public static function fromArray(array $data): self
    {
        // Bottom-up: resolve children first, then pass to parent
        $items = array_map(fn(array $item) => LineItemDto::fromArray($item), $data['items']);
        return new self(items: $items);
    }
}
// Children fully resolved before parent construction. Immutable tree from the start.
```

---

## Exceptions

For lazy-loading scenarios (spatie/laravel-data `#[Lazy]` properties), bottom-up construction is not required because children are resolved on access. However, eager construction is preferred for 95% of use cases.

---

## Consequences Of Violation

Reliability: parent DTO contains raw data instead of typed child DTOs. Maintenance: consumers must resolve children after parent construction, duplicating resolution logic.

---

## Rule 2: Limit DTO Nesting Depth to a Maximum of 3-4 Levels

---

## Category

Design

---

## Rule

Keep DTO nesting depth at 3-4 levels maximum. Flatten or split DTO structures that exceed this limit. Use separate DTOs for different nesting levels (list vs detail vs admin).

---

## Reason

Deeply nested DTOs reduce code readability, increase construction complexity, and slow serialization. At 5+ levels, factory chains become hard to follow, `toArray()` recursion depth approaches limits, and API consumers receive deeply nested JSON that is difficult to navigate.

---

## Bad Example

```php
readonly class OrderDto  // Level 1
{
    public function __construct(
        public CustomerDto $customer,              // Level 2
    ) {}
}

readonly class CustomerDto
{
    public function __construct(
        public AddressDto $billingAddress,          // Level 3
    ) {}
}

readonly class AddressDto
{
    public function __construct(
        public CoordinatesDto $coordinates,         // Level 4
    ) {}
}

readonly class CoordinatesDto
{
    public function __construct(
        public GeoJsonDto $geoJson,                 // Level 5 — too deep
    ) {}
}
// 5 levels of nesting. Construction and serialization are complex. API output is deeply nested.
```

---

## Good Example

```php
// Flatten for list views — no nesting beyond 2 levels
readonly class OrderListDto
{
    public function __construct(
        public int $orderId,
        public string $customerName,   // flattened from CustomerDto
        public string $city,            // flattened from AddressDto
    ) {}
}

// Moderate nesting for detail views — max 3 levels
readonly class OrderDetailDto
{
    public function __construct(
        public int $orderId,
        public CustomerDto $customer,
        /** @var LineItemDto[] */
        public array $items,
    ) {}
}
```

---

## Exceptions

When the domain model inherently has deep hierarchy (e.g., organizational chart, category tree) and flattening would lose meaning, document the depth limit exception and ensure serialization recursion safety.

---

## Consequences Of Violation

Performance: deep `toArray()` recursion approaches PHP stack limits. Maintenance: factory chains and serialization logic become complex. API quality: clients receive deeply nested JSON that is hard to use.

---

## Rule 3: Prevent Circular References — Use Scalar IDs Instead of Parent Objects

---

## Category

Reliability

---

## Rule

Never include a parent DTO object reference in a child DTO. Replace parent object references with scalar parent identifiers. Ensure the DTO tree is always a directed acyclic graph.

---

## Reason

Circular references cause `json_encode()` to crash with a fatal error and recursive `toArray()` to overflow the stack. In readonly systems, a child holding a parent reference creates a chicken-and-egg construction problem — the parent needs the child, but the child needs the parent. Scalar IDs break this cycle cleanly.

---

## Bad Example

```php
readonly class OrderDto
{
    public function __construct(public int $id, /** @var LineItemDto[] */ public array $items) {}
}

readonly class LineItemDto
{
    public function __construct(
        public int $id,
        public OrderDto $order, // Parent reference creates cycle
    ) {}
}
// Circular: OrderDto → LineItemDto → OrderDto → ... infinite loop in serialization.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(public int $id, /** @var LineItemDto[] */ public array $items) {}
}

readonly class LineItemDto
{
    public function __construct(
        public int $id,
        public int $orderId, // Scalar parent ID — no cycle
    ) {}
}
// DTO tree is acyclic. Serialization is safe. Construction order is straightforward.
```

---

## Exceptions

No common exceptions. Circular references in DTO trees are always a design error that must be fixed with scalar IDs.

---

## Consequences Of Violation

Reliability: `json_encode()` fatally crashes on circular references. Scalability: stack overflow in recursive serialization. Maintenance: debugging circular references in deeply nested DTOs is time-consuming.

---

## Rule 4: Use Factory Chaining — Each DTO Level Owns Its Own Construction

---

## Category

Code Organization

---

## Rule

Each DTO in a nested structure must own its own `fromArray()` factory that delegates to child DTO factories. A parent factory calls child factories; it does not reconstruct child data from raw arrays in a separate step.

---

## Reason

Factory chaining ensures that each level of the DTO tree encapsulates its own construction logic. The parent does not need to know how children are constructed — it calls `ChildDto::fromArray()`. This centralizes construction at each level, making the tree easy to modify (change a child, update only that child's factory) and easy to test (test each level's factory independently).

---

## Bad Example

```php
readonly class OrderDto
{
    public function __construct(
        /** @var LineItemDto[] */
        public array $items,
    ) {}
}

// No factory on OrderDto. Caller must manually map:
$items = [];
foreach ($data['items'] as $item) {
    $items[] = new LineItemDto(
        productId: $item['product_id'],
        quantity: $item['quantity'],
    );
}
$orderDto = new OrderDto(items: $items);
// Mapping logic is in the caller. Every caller duplicates or varies the mapping.
```

---

## Good Example

```php
readonly class OrderDto
{
    public function __construct(
        public int $id,
        /** @var LineItemDto[] */
        public array $items,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            id: $data['id'],
            items: array_map(
                fn(array $item) => LineItemDto::fromArray($item),
                $data['items'],
            ),
        );
    }
}

readonly class LineItemDto
{
    public function __construct(
        public int $productId,
        public int $quantity,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['product_id'],
            quantity: $data['quantity'],
        );
    }
}

// Caller just calls the top-level factory
$orderDto = OrderDto::fromArray($data);
// Each level owns its construction. Factories chain naturally.
```

---

## Exceptions

For spatie/laravel-data, the package handles nested construction automatically via `DataCollection` of child `Data` objects. Manual factory chaining is not needed.

---

## Consequences Of Violation

Maintenance: construction logic is duplicated across every consumer of the DTO tree. Reliability: different consumers map child data inconsistently (different null handling, different key names).

---

## Rule 5: Use Nullable Child DTOs for Optional Relationships

---

## Category

Design

---

## Rule

When a child relationship is optional, declare the child DTO property as nullable (`?ProfileDto`). Do not use null objects, default empty DTOs, or sentinel values to represent missing optional children.

---

## Reason

A nullable type declaration communicates the optionality at the type system level. The consumer can check `$dto->profile === null` explicitly. Using a default empty DTO or null object pattern hides the absence of data and may cause downstream consumers to operate on meaningless defaults instead of recognizing the missing data.

---

## Bad Example

```php
readonly class UserDto
{
    public function __construct(
        public ProfileDto $profile, // Non-nullable — what happens when there is no profile?
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            profile: isset($data['profile'])
                ? ProfileDto::fromArray($data['profile'])
                : new ProfileDto('', ''), // Empty default — hides missing data
        );
    }
}
// Consumer cannot distinguish between "no profile" and "profile with empty fields".
```

---

## Good Example

```php
readonly class UserDto
{
    public function __construct(
        public ?ProfileDto $profile, // Nullable — explicitly communicates optionality
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            profile: isset($data['profile'])
                ? ProfileDto::fromArray($data['profile'])
                : null,
        );
    }
}
// Consumer checks: if ($dto->profile === null) { /* handle missing profile */ }
```

---

## Exceptions

When a relationship is logically optional but the application always provides a default (e.g., default avatar, default settings), a non-nullable child DTO with defaults is acceptable. Document this convention.

---

## Consequences Of Violation

Reliability: consumers operate on empty/sentinel values instead of recognizing absent data. Maintenance: adding a new optional relationship requires refactoring all consumers that assumed the child was always present.

---

## Rule 6: Eager-Load All Eloquent Relations Before Passing Models to Nested Factories

---

## Category

Performance

---

## Rule

Always eager-load all Eloquent relations needed by a nested DTO tree before calling the top-level `fromModel()` factory. Never rely on lazy loading inside nested factory chains.

---

## Reason

Lazy loading inside nested factories triggers N+1 database queries exponentially. A factory chain that accesses `order->items[i]->product->category` without eager loading generates 1 + N + N*M queries. Eager-loading before the factory call guarantees a fixed, known query count.

---

## Bad Example

```php
// Controller
$orders = Order::all(); // No eager loading
$orderDtos = array_map(fn(Order $o) => OrderDto::fromModel($o), $orders);
// Inside OrderDto::fromModel: $user->items triggers lazy load (N queries)
// Inside LineItemDto::fromModel: $item->product triggers lazy load (N*M queries)
// Total: 1 + N + N*M queries
```

---

## Good Example

```php
// Controller — eager-load everything the DTO tree needs
$orders = Order::with('items.product.category')->get(); // 1-3 queries total
$orderDtos = array_map(fn(Order $o) => OrderDto::fromModel($o), $orders);
// Zero additional queries. Factory methods access already-loaded relations.
```

---

## Exceptions

When constructing a single DTO (not in a loop), the N+1 cost is negligible. For consistency, eager-load anyway — it establishes the pattern for batch operations.

---

## Consequences Of Violation

Performance: exponential query explosion in nested factory chains. Scalability: batch operations (reports, exports, API collections) generate thousands of queries. Reliability: lazy loading in factories makes query count unpredictable.
