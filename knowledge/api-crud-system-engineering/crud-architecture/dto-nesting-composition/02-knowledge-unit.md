# DTO Nesting and Composition

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** DTO Nesting and Composition
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

DTO nesting and composition is the practice of building complex DTO structures from nested and composed child DTOs. An `OrderDto` containing an `AddressDto` for billing, an array of `LineItemDto` for items, and a `PaymentDto` for payment details is a composed DTO. This pattern mirrors the structure of real-world business data and enables type-safe representation of deeply nested request payloads and API responses.

The engineering significance is that nested DTOs preserve type safety across arbitrary data depths. Without nesting, complex payloads degrade to arrays of arrays — losing all type guarantees. With nesting, every level of the data structure is typed, validated, and documented. The cost is increased class count (one DTO class per nested type) and recursive construction logic.

---

## Core Concepts

### Composition Through Constructor Parameters

A DTO receives other DTOs as constructor parameters:

```php
class OrderDto
{
    public function __construct(
        public readonly int $customerId,
        public readonly AddressDto $billingAddress,
        public readonly AddressDto $shippingAddress,
        /** @var LineItemDto[] */
        public readonly array $items,
        public readonly PaymentDto $payment,
    ) {}
}
```

Each nested DTO is independently typed and constructed. The parent DTO doesn't know how child DTOs are built — it only requires them to be valid.

### Nesting Depth

Typical nesting depth is 2-4 levels. Beyond 4 levels, consider flattening the DTO structure or splitting into separate operations:

```
Level 1: OrderDto
Level 2: AddressDto, PaymentDto
Level 3: LineItemDto, DiscountDto
Level 4: TaxBreakdownDto
```

---

## Mental Models

### The Russian Doll

A composed DTO is a Russian doll — open one, and inside is another. Each level is a fully typed, self-contained data structure. The outer doll guarantees the inner doll is valid.

### The Document Structure

Nested DTOs mirror JSON document structure. An API request body with nested objects maps directly to nested DTOs — the DTO structure IS the API contract documentation.

---

## Internal Mechanics

### Recursive Construction from Arrays

Building a nested DTO from a flat array requires recursive construction:

```php
class OrderDto
{
    public static function fromArray(array $data): self
    {
        return new self(
            customerId: $data['customer_id'],
            billingAddress: AddressDto::fromArray($data['billing_address']),
            shippingAddress: AddressDto::fromArray($data['shipping_address']),
            items: array_map(
                fn(array $item) => LineItemDto::fromArray($item),
                $data['items'],
            ),
            payment: PaymentDto::fromArray($data['payment']),
        );
    }
}
```

Each child DTO is responsible for its own construction. The parent only orchestrates.

### Type Safety at Every Level

PHP enforces the type at construction time. If `AddressDto` requires a `string $street` and the input provides an integer, the error is thrown at the point of construction — not deep in service code.

---

## Patterns

### Value Object Nesting

Embed immutable value objects inside DTOs:

```php
class PriceDto
{
    public function __construct(
        public readonly Money $amount,
        public readonly Currency $currency,
    ) {}
}
```

### Optional Nested DTOs

Use nullable types for optional nested data:

```php
class OrderDto
{
    public function __construct(
        public readonly ?DiscountDto $discount = null,
    ) {}
}
```

### DTO-to-Entity Mapping

Nested DTOs map to nested entity creation:

```php
class OrderService
{
    public function create(OrderDto $dto): Order
    {
        $order = Order::create([
            'customer_id' => $dto->customerId,
        ]);
        foreach ($dto->items as $item) {
            $order->items()->create([
                'product_id' => $item->productId,
                'quantity' => $item->quantity,
            ]);
        }
        return $order;
    }
}
```

---

## Architectural Decisions

### When to Nest vs Flatten

Nest when the data has a natural hierarchical relationship (Order has Items). Flatten when the relationship is incidental (User and their Settings — settings are a separate concern, not a data child).

### DTO Matching Entity Structure

DTOs that mirror Eloquent relationships are natural and predictable. DTOs that differ from entity structure add cognitive load — developers must understand both the entity and DTO structures.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Complete type safety at all data depths | More DTO classes per feature | Predictable: one DTO per nested type |
| Self-documenting — DTO structure is the API contract | Recursive construction logic can be complex | Extract factory classes for deep nesting |
| Mirrors real business data relationships | Nesting beyond 4 levels is hard to navigate | Split deeply nested DTOs into separate operations |

---

## Performance Considerations

Nested DTO construction cost is O(n) where n is the total number of data nodes. For a typical order with 10 items: ~12 DTO constructions at ~0.005ms each = ~0.06ms. Negligible.

---

## Production Considerations

### Avoid Circular References

Child DTOs must not reference parent DTOs. This causes infinite recursion in serialization. Use ID references instead:

```php
// Wrong: circular
class OrderDto { public readonly LineItemDto $items; }
class LineItemDto { public readonly OrderDto $order; }

// Correct: ID reference
class LineItemDto { public readonly int $orderId; }
```

### Test Nested Construction

Test the recursive construction for each composed DTO:

```php
$dto = OrderDto::fromArray([
    'customer_id' => 1,
    'billing_address' => ['street' => '123 Main', 'city' => 'Portland'],
    'items' => [
        ['product_id' => 1, 'quantity' => 2],
    ],
]);

$this->assertInstanceOf(AddressDto::class, $dto->billingAddress);
$this->assertInstanceOf(LineItemDto::class, $dto->items[0]);
```

---

## Common Mistakes

### Deep Nesting Beyond Reason
Why it happens: Mirroring every Eloquent relationship, including has-many-through and polymorphic relations. Why it's harmful: DTOs with 5+ nesting levels are impossible to construct and debug. Better approach: Limit nesting to 3-4 levels. Use separate DTOs for deeply nested data.

### Mixing Nesting Orientations
Why it happens: Some DTOs are nested by entity hierarchy, others by API structure. Why it's harmful: Developers must remember two different organization strategies. Better approach: Choose one orientation (prefer entity hierarchy) and apply it consistently.

### Circular DTO References
Why it happens: Bidirectional relationships in Eloquent models mapped directly to DTOs. Why it's harmful: Serialization loops, construction complexity. Better approach: Reference parent by ID (scalar), not by DTO object.

---

## Failure Modes

### Construction Cascade Failure
A single missing field in a deeply nested child DTO causes the entire top-level construction to fail. The error message points to the child DTO constructor, but the developer must trace through the nesting to find the root cause. Mitigate with explicit validation before construction.

### Serialization Blowup
Deeply nested DTOs with 4+ levels produce large JSON payloads. Each level adds serialization overhead. For API responses, consider using API resources instead of DTOs for output.

---

## Ecosystem Usage

### Monica CRM
Monica uses nested DTOs for complex contact data — contact with addresses, relationships, and activity history as child DTOs.

### Spatie/laravel-data
The package handles nested DTO construction automatically via type hints. A `Data` class with nested `Data` properties is recursively constructed by the package — no manual `fromArray` needed.

---

## Related Knowledge Units

### Prerequisites
- Data Transfer Object Design — Core DTO principles
- DTO Construction Patterns — Factory methods for construction

### Related Topics
- Spatie Laravel Data Integration — Automatic nested construction
- DTO-to-Entity Mapping — Persisting composed DTOs

### Advanced Follow-up Topics
- JSON:API Resource Patterns — Alternative to DTO nesting for API output
- Value Object Nesting — Embedding value objects in DTOs

---

## Research Notes

### Source Analysis
- Spatie/laravel-data: Automatic recursive DTO construction via type hints
- Monica CRM: Nested DTOs for complex contact data
- JSON:API specification: Document structure mapping to nested DTOs

### Key Insight
Nested DTOs are essential for type-safe representation of complex business data. The cost is increased class count, but each class is simple. The alternative (arrays of arrays) loses all type safety at the first nesting level. The practical limit is 3-4 levels of nesting — beyond that, flatten or split.

### Version-Specific Notes
- PHP 8.1: Named arguments improve nested DTO construction readability
- PHP 8.2: Readonly classes apply to nested DTOs as well
