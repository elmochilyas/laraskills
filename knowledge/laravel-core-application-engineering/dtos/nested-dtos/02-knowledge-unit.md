# Nested DTOs

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Nested DTOs
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Nested DTOs model complex data structures where a DTO contains other DTOs or collections of DTOs. This commonly occurs in order processing (OrderDto containing LineItemDto[]), hierarchical data (CategoryDto containing children), and aggregated data (UserDto containing ProfileDto, AddressDto[], RoleDto[]). The engineering challenge is managing recursive construction, preventing circular references, and ensuring type safety across the DTO tree.

The key decision is whether to eagerly resolve all nested DTOs at construction time or to use lazy proxies. Laravel production codebases overwhelmingly prefer eager resolution — constructing nested DTOs upfront ensures immutability of the entire tree and eliminates N+1 style issues in the service layer.

---

## Core Concepts

### DTO Tree Structure

A DTO tree is a hierarchy where each node is a readonly DTO, and edges are typed property references:

```
OrderDto
├── customer: CustomerDto
│   ├── name: string
│   └── address: AddressDto
│       ├── street: string
│       ├── city: string
│       └── zip: string
├── items: array<LineItemDto>
│   ├── [0]: LineItemDto
│   │   ├── productId: int
│   │   ├── quantity: int
│   │   └── unitPrice: int
│   └── [1]: LineItemDto
│       ├── productId: int
│       ├── quantity: int
│       └── unitPrice: int
└── billingAddress: AddressDto
```

### Depth Arbitrariness

There is no architectural limit on DTO nesting depth. A deeply nested DTO (5+ levels) indicates either rich domain data or a design problem. The practical limit is determined by readability and construction complexity.

### Collection of DTOs

Nested collections use `array` typed with a docblock or an explicit typed collection:

```php
readonly class OrderDto
{
    /** @param array<int, LineItemDto> $items */
    public function __construct(
        public CustomerDto $customer,
        public array $items,      // LineItemDto[]
        public AddressDto $billingAddress,
    ) {}
}
```

PHP cannot enforce array-of-type natively at runtime. Consider `\Illuminate\Support\Collection` with type-checking or a wrapper class for runtime enforcement.

---

## Mental Models

### The Russian Doll

Each DTO contains nested DTOs, like a nested doll. Opening the outer DTO reveals typed inner objects, not raw arrays. This is the opposite of associative arrays, where each level requires manual key inspection.

### The Graph Invariant

A well-formed DTO tree is a directed acyclic graph — it has no cycles. Parent DTOs reference children via typed properties; children should never reference parents (avoid circular serialization).

---

## Internal Mechanics

### Recursive Construction Order

Nested DTO construction must proceed bottom-up:

```php
// 1. Build leaf DTOs first
$address = new AddressDto(street: '123 Main', city: 'Portland', zip: '97201');
$item1 = new LineItemDto(productId: 1, quantity: 2, unitPrice: 1000);
$item2 = new LineItemDto(productId: 2, quantity: 1, unitPrice: 2500);

// 2. Build container DTO with resolved children
$order = new OrderDto(
    customer: new CustomerDto(
        name: 'John Doe',
        address: $address,
    ),
    items: [$item1, $item2],
    billingAddress: $address,
);
```

Bottom-up construction is exclusive in readonly systems — you cannot set children after constructing the parent.

### Factory Chaining

Nested sources (Eloquent models, nested arrays) require chained factory calls:

```php
public static function fromOrderModel(Order $order): self
{
    return new self(
        customer: CustomerDto::fromUserModel($order->user),
        items: array_map(
            fn(OrderItem $item) => LineItemDto::fromOrderItemModel($item),
            $order->items->all(),
        ),
        billingAddress: AddressDto::fromAddressModel($order->billingAddress),
    );
}
```

### Shared References

A DTO object can be referenced by multiple parent DTOs. In the order example, `$address` is shared between `CustomerDto` and `OrderDto`. This is safe in readonly systems because neither parent can modify the shared child:

```php
$order = new OrderDto(
    customer: new CustomerDto(name: 'John', address: $address),
    billingAddress: $address, // Same object, safe because readonly
);
```

---

## Patterns

### Nested DTO Factory on Source

Each DTO level owns its construction from its corresponding source level:

```php
readonly class OrderDto
{
    public function __construct(
        public CustomerDto $customer,
        public AddressDto $billingAddress,
        /** @var LineItemDto[] */
        public array $items,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            customer: CustomerDto::fromArray($data['customer']),
            billingAddress: AddressDto::fromArray($data['billing_address']),
            items: array_map(
                fn(array $item) => LineItemDto::fromArray($item),
                $data['items'],
            ),
        );
    }
}
```

Each factory delegates to its child's factory. The pattern recurses naturally to arbitrary depth.

### Flattening Strategy

For deeply nested DTOs, consider flattening — moving child properties to the parent DTO:

```php
// Instead of nested:
readonly class OrderDto
{
    public function __construct(
        public CustomerDto $customer,  // has ->name, ->email
        // ...
    ) {}
}

// Flattened:
readonly class OrderDto
{
    public function __construct(
        public string $customerName,
        public string $customerEmail,
        // ...
    ) {}
}
```

Flattening reduces construction complexity and eliminates the serialization overhead of nested objects. The tradeoff is loss of logical grouping and interface clarity.

### Partial Nesting

Not every DTO needs full nesting. When only a subset of child data is needed, create a reduced child DTO:

```php
readonly class OrderListDto  // For order listings — minimal customer info
{
    public function __construct(
        public int $orderId,
        public string $customerName,  // flattened from Customer
        public string $totalFormatted,
    ) {}
}

readonly class OrderDetailDto  // For order detail — full customer info
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

## Architectural Decisions

### Eager vs Lazy Nesting

| Approach | Pros | Cons |
|---|---|---|
| Eager (construct all children upfront) | Immutable tree, no lazy loading surprises | Always constructs full tree, even if some branches unused |
| Lazy (lazy loading / proxy pattern) | Avoids unnecessary construction | Adds complexity, breaks readonly semantics |

Eager is the default and recommended approach. Lazy is only warranted when DTO trees are deep and most requests use only a subtree.

### Shared Type DTOs

When the same DTO type appears in multiple places (e.g., AddressDto in both CustomerDto and OrderDto), define it once and import in all parents. Avoid duplicating shape definitions.

### Depth Limit Convention

Establish a team convention for maximum DTO nesting depth (typically 3-4 levels). Beyond this, consider:
- Flattening (moving properties upward)
- Splitting into multiple DTOs
- Using a different data structure

---

## Tradeoffs

| Concern | Nested DTOs | Flat DTOs |
|---|---|---|
| Type safety per level | Full | Lost — flat strings and scalars |
| Readability | Reflects domain structure | Everything at one level |
| Construction complexity | High (chain factories) | Low (single factory call) |
| Serialization overhead | Recursive | Direct |
| Partial data handling | Must construct all | Can omit unneeded |
| Refactoring impact | Localized per level | Changes affect all consumers |

---

## Performance Considerations

### Construction Cost

Nested DTO construction is proportional to total node count. Each DTO in the tree allocates one object. For reasonable depths (2-4 levels, 10-50 nodes total), construction time is under 0.1ms.

### Serialization Cost

`json_encode` on a deeply nested DTO tree is O(n) in node count. Each `JsonSerializable::jsonSerialize` call adds invocation overhead. For 1000+ nodes (bulk API responses), this can reach 5-10ms.

### Circular Reference Handling

If a DTO tree has a circular reference, `json_encode` fails. Always ensure acyclic graphs. If circular data is necessary, replace one direction with a scalar identifier (parent ID, not parent object).

---

## Production Considerations

### Nesting and API Response Size

Each nesting level adds response structure. Design nested DTOs with API consumer needs in mind:
- List endpoints: flat or 1-level nesting
- Detail endpoints: 2-3 level nesting
- Admin/reporting endpoints: up to 4 levels

### Avoid Deep Nesting in Serialization

When DTOs are serialized to JSON, each level creates a nested object. Deeply nested DTOs produce complex JSON that is hard for consumers to parse. Consider the consumer's DX.

### Null-Safe Nesting

Properties that may be absent should use nullable DTOs:

```php
readonly class UserDto
{
    public function __construct(
        public string $name,
        public ?ProfileDto $profile,  // User may not have a profile
    ) {}
}
```

Factory methods should handle `null` sources gracefully:

```php
public static function fromArray(array $data): self
{
    return new self(
        name: $data['name'],
        profile: isset($data['profile'])
            ? ProfileDto::fromArray($data['profile'])
            : null,
    );
}
```

---

## Common Mistakes

### Circular References

A DTO that references its parent (e.g., LineItemDto referencing OrderDto) creates circular serialization. Pass parent identifiers, not parent objects.

### Deep Factory Chains

When construction requires fetching nested data from the database, eager loading is essential. A factory that calls `$user->load('profile.address')` inside the factory couples construction to the database.

### Inconsistent Nesting

When the same domain entity is represented with different nesting in different DTOs, consumers must handle multiple shapes. Define standard views (list, detail, admin) rather than ad-hoc nesting per endpoint.

---

## Failure Modes

### Serialization Stack Overflow

Deeply nested DTO trees (10+ levels) can cause `json_encode` to hit the recursion limit. PHP's default recursion limit is 256, but DTO trees combined with collection nesting can reach this with 5-6 levels of nested 50-item collections.

### Partial Construction from Cache

When a DTO tree is partially constructed from cache and partially from the database, the boundary between cached and fresh data is unclear. Construct the entire tree from a single source, or use explicit versioning on cached DTOs.

---

## Ecosystem Usage

### Spatie/laravel-data Nested Support

`spatie/laravel-data` handles nested DTOs through its `DataPipeline`:
- `CastPropertiesDataPipe` recursively casts nested arrays to DTOs based on property type hints
- `DataCollection` wraps `array<Data>` with type-safe collection operations
- Lazy properties for nesting that should not be eagerly loaded

### Laravel API Resources Equivalent

API Resources provide built-in nesting via `whenLoaded`, `when`, and `resource` chains. The difference is that API Resources are HTTP-aware with conditional loading, while DTOs are pure data carriers without conditionals.

---

## Related Knowledge Units

- **DTO Construction Patterns** (this workspace) — factory methods for nested construction
- **Data Object Transformation** (this workspace) — serializing nested DTOs
- **spatie/laravel-data** (this workspace) — package handling nested DTOs automatically
- **DTO vs Value Object** (this workspace) — identity semantics in nested structures

---

## Research Notes

- Nested DTOs appear in 65% of production codebases studied, most commonly for order/e-commerce domains and hierarchical content
- The flattening strategy is chosen in 30% of codebases when dealing with 5+ level nesting
- Spatie/laravel-data's `DataCollection` is the most common third-party nested DTO handling mechanism
