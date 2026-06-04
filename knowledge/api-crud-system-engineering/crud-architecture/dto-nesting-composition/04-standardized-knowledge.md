# ECC Standardized Knowledge — DTO Nesting and Composition

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | CRUD Architecture |
| Knowledge Unit | DTO Nesting and Composition |
| Difficulty | Advanced |
| Category | Architecture |
| Last Updated | 2026-06-02 |

## Overview

DTO nesting and composition is the practice of building complex DTO structures from nested and composed child DTOs. An `OrderDto` containing an `AddressDto` for billing, an array of `LineItemDto` for items, and a `PaymentDto` for payment details is a composed DTO. This pattern mirrors the structure of real-world business data and enables type-safe representation of deeply nested request payloads and API responses. Without nesting, complex payloads degrade to arrays of arrays — losing all type guarantees.

## Core Concepts

- **Composition Through Constructor Parameters**: A DTO receives other DTOs as typed constructor parameters. Each nested DTO is independently typed and constructed.
- **Recursive Construction from Arrays**: Building a nested DTO from a flat array requires each child DTO to be responsible for its own construction, orchestrated by the parent.
- **Type Safety at Every Level**: PHP enforces the type at construction time. If `AddressDto` requires `string $street` and the input provides an integer, the error is thrown at construction — not deep in service code.
- **Nesting Depth**: Typical nesting depth is 2-4 levels. Beyond 4, consider flattening or splitting into separate operations.

## When To Use

- Complex request payloads with nested objects (order with items, invoice with line items)
- API responses that mirror hierarchical business data
- When type safety is needed at every level of the data structure
- When the DTO structure should serve as self-documenting API contract

## When NOT To Use

- Simple flat data structures that don't benefit from nesting
- When nesting would exceed 4 levels — split into separate operations instead
- When the relationship is incidental (User and Settings — separate concerns, not a data hierarchy)
- For API output where API resources provide better control over serialization

## Best Practices

- Limit nesting depth to 3-4 levels maximum
- Avoid circular references — child DTOs must not reference parent DTOs (use ID references instead)
- Use nullable types for optional nested data: `public readonly ?DiscountDto $discount = null`
- Test recursive construction for each composed DTO, covering nested failure cases
- Prefer entity hierarchy orientation over API structure orientation for consistency

## Architecture Guidelines

- Nest when data has a natural hierarchical relationship (Order has Items)
- Flatten when relationship is incidental — DTOs matching Eloquent relationships are natural and predictable
- Each child DTO is responsible for its own construction — the parent only orchestrates
- DTOs that mirror Eloquent relationships are easier to understand than DTOs with different structures
- For deeply nested API responses, consider API resources instead of DTOs for the output side

## Performance Considerations

- Nested DTO construction cost is O(n) where n is total data nodes
- For a typical order with 10 items: ~12 DTO constructions at ~0.005ms each = ~0.06ms — negligible
- Deeply nested DTOs with 4+ levels produce larger JSON payloads — each level adds serialization overhead

## Security Considerations

- Circular DTO references cause infinite recursion during serialization — always prevent via code review
- Child DTOs should not carry sensitive parent data — use ID references instead of object references
- Validation cascade: a single missing field in a deeply nested child causes top-level failure — ensure error messages are clear

## Common Mistakes

- **Deep Nesting Beyond Reason**: Mirroring every Eloquent relationship including has-many-through. Solution: Limit to 3-4 levels. Use separate DTOs for deeply nested data.
- **Mixing Nesting Orientations**: Some DTOs nested by entity hierarchy, others by API structure. Solution: Choose one orientation (prefer entity hierarchy) and apply consistently.
- **Circular DTO References**: Bidirectional relationships mapped directly to DTOs cause serialization loops. Solution: Reference parent by ID (scalar), not by DTO object.

## Anti-Patterns

- **Infinite Serialization Loop**: Circular DTO references cause `json_encode` to crash or hang. Prevent by keeping DTO graphs acyclic.
- **Construction Cascade Failure Without Clear Errors**: Missing field in deeply nested child produces unhelpful error messages. Mitigate with explicit validation before construction.
- **DTO as ORM Mirror**: Deeply nesting every relationship exactly as in Eloquent, including polymorphic and pivot relationships. Creates unnecessarily complex DTO graphs.

## Examples

### Composed DTO with Nested Children
```php
class OrderDto
{
    public function __construct(
        public readonly int $customerId,
        public readonly AddressDto $billingAddress,
        public readonly array $items, // LineItemDto[]
        public readonly PaymentDto $payment,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            customerId: $data['customer_id'],
            billingAddress: AddressDto::fromArray($data['billing_address']),
            items: array_map(fn($item) => LineItemDto::fromArray($item), $data['items']),
            payment: PaymentDto::fromArray($data['payment']),
        );
    }
}
```

### DTO-to-Entity Mapping for Nested Data
```php
class OrderService
{
    public function create(OrderDto $dto): Order
    {
        $order = Order::create(['customer_id' => $dto->customerId]);
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

## Related Topics

| Knowledge Unit | Relationship | Type |
|---------------|--------------|------|
| Data Transfer Object Design | Core DTO principles | Prerequisite |
| DTO Construction Patterns | Factory methods for construction | Prerequisite |
| Spatie Laravel Data Integration | Automatic nested construction | Related |
| DTO-to-Entity Mapping | Persisting composed DTOs | Related |
| JSON:API Resource Patterns | Alternative for API output | Follow-up |
| Value Object Nesting | Embedding value objects in DTOs | Follow-up |

## AI Agent Notes

- Nested DTOs are essential for type-safe representation of complex business data
- The cost is increased class count, but each class is simple (one per nested type)
- The alternative (arrays of arrays) loses all type safety at the first nesting level
- Practical limit is 3-4 levels of nesting — beyond that, flatten or split into separate operations
- Prefer entity hierarchy over API structure for DTO nesting orientation
- When generating nested DTOs, ensure child DTO construction is independent of parent

## Verification

- [ ] No circular DTO references (children reference parents by ID, not by object)
- [ ] Nesting depth is 3-4 levels or fewer
- [ ] Each child DTO is independently constructable
- [ ] Recursive construction is tested for failure cases
- [ ] Nullable child DTOs are used for optional nested data
- [ ] Nesting orientation is consistent (entity hierarchy or API structure, not mixed)
- [ ] Serialization works without infinite recursion
