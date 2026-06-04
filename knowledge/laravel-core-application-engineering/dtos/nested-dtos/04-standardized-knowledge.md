# Nested DTOs

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Nested DTOs
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

## Overview

Nested DTOs model complex data structures where a DTO contains other DTOs or collections of DTOs. This commonly occurs in order processing (OrderDto containing LineItemDto[]), hierarchical data (CategoryDto containing children), and aggregated data (UserDto containing ProfileDto, AddressDto[], RoleDto[]). The engineering challenge is managing recursive construction, preventing circular references, and ensuring type safety across the DTO tree.

The key decision is whether to eagerly resolve all nested DTOs at construction time or to use lazy proxies. Laravel production codebases overwhelmingly prefer eager resolution — constructing nested DTOs upfront ensures immutability of the entire tree and eliminates N+1 style issues in the service layer.

## Core Concepts

- **DTO Tree Structure:** A hierarchy where each node is a readonly DTO and edges are typed property references. The tree is a directed acyclic graph — no cycles allowed.
- **Bottom-Up Construction:** Nested DTO construction proceeds bottom-up — leaf DTOs built first, then container DTO with resolved children. Required in readonly systems because you cannot set children after constructing the parent.
- **Factory Chaining:** Each DTO level owns its construction from its corresponding source level, delegating to child factories. The pattern recurses naturally to arbitrary depth.
- **Collection of DTOs:** Nested collections use `array` typed with a docblock. PHP cannot enforce array-of-type natively at runtime.
- **Shared References:** A DTO object can be referenced by multiple parent DTOs. Safe in readonly systems because neither parent can modify the shared child.

## When To Use

- Complex domain data that naturally nests (orders with line items, users with profiles)
- API responses that return hierarchical data structures
- Aggregate data that crosses multiple layers in a single operation
- When the domain has clear parent-child entity relationships

## When NOT To Use

- Deeply nested structures (5+ levels) — flatten or split into multiple DTOs
- When only a subset of child data is needed — use reduced child DTOs or flattening
- When serialization performance is critical for large collections — flat DTOs serialize faster
- When consumers need only a few fields from the nested structure

## Best Practices (WHY)

- **Why eager over lazy:** Eager construction ensures immutable tree with no lazy loading surprises. Lazy breaks readonly semantics and adds complexity. Eager is the default and recommended approach.
- **Why bottom-up construction:** Readonly systems require children to be fully constructed before the parent. Bottom-up is the only valid construction order.
- **Why avoid circular references:** Circular references cause infinite loops during serialization and break the acyclic graph invariant. Replace parent object references with scalar IDs.
- **Why establish depth limits:** Beyond 3-4 levels, nesting reduces readability and increases construction complexity. Flatten or split at this threshold.

## Architecture Guidelines

- Establish a team convention for maximum DTO nesting depth (typically 3-4 levels)
- Use nullable DTOs (`?ProfileDto`) for optional child relationships
- Design nested DTOs with API consumer needs in mind: list endpoints flat, detail endpoints 2-3 levels
- Replace parent object references with scalar IDs to prevent circular references
- Use partial nesting — different DTO views for different use cases (list vs detail)

## Performance

- Construction cost is O(n) in total node count. For 10-50 nodes total, construction time is under 0.1ms.
- Serialization cost is O(n) in node count via recursive `jsonSerialize`. For 1000+ nodes, this can reach 5-10ms.
- Circular references cause `json_encode` to fail entirely — always ensure acyclic graphs.
- Shared references between parents are safe but each reference is serialized separately (duplicate data in output).

## Security

- Ensure nested DTOs do not expose parent data through child references — children should not hold parent objects
- Deeply nested DTOs can accidentally include sensitive relations — validate which child properties are included
- Avoid lazy loading in factory chains — eager-load all relations before construction to prevent data exposure

## Common Mistakes

1. **Circular References:** A DTO that references its parent (e.g., LineItemDto referencing OrderDto) creates circular serialization. Pass parent identifiers, not parent objects.

2. **Deep Factory Chains:** Factory methods that fetch nested data from the database inside the factory couples construction to the database. Eager-load before calling the factory.

3. **Inconsistent Nesting:** Same domain entity represented with different nesting in different DTOs forces consumers to handle multiple shapes. Define standard views (list, detail, admin).

4. **Serialization Stack Overflow:** Deeply nested DTO trees (10+ levels) can hit PHP's recursion limit during `json_encode`. Limit nesting depth.

## Anti-Patterns

- **The Infinity Tree:** Nested DTOs with circular parent references. Causes serialization to crash with infinite recursion. Always replace parent object references with scalar IDs.
- **The One-Size-Fits-All DTO Tree:** A single deeply nested DTO used for every endpoint. Creates over-fetching for list views. Use separate list/detail/admin DTOs with appropriate nesting levels.
- **The Hydra Factory:** A factory method that constructs the entire DTO tree by making multiple database calls inside the factory. Extracts construction from the orchestration layer, making it untestable.

## Examples

### Nested DTO with Factory Chaining
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

readonly class LineItemDto
{
    public function __construct(
        public int $productId,
        public int $quantity,
        public int $unitPrice,
    ) {}

    public static function fromArray(array $data): self
    {
        return new self(
            productId: $data['product_id'],
            quantity: $data['quantity'],
            unitPrice: $data['unit_price'],
        );
    }
}
```

### Flattening Strategy (Alternative to Deep Nesting)
```php
// Instead of nested: OrderDto → CustomerDto (->name, ->email)
readonly class OrderListDto
{
    public function __construct(
        public int $orderId,
        public string $customerName,  // flattened
        public string $totalFormatted,
    ) {}
}

// Deep nesting preserved for detail views
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

## Related Topics

- **DTO Construction Patterns** — factory methods for nested construction
- **Data Object Transformation** — serializing nested DTOs
- **spatie/laravel-data** — package handling nested DTOs automatically
- **DTO vs Value Object** — identity semantics in nested structures

## AI Agent Notes

- Use bottom-up construction order: leaf DTOs first, then containers
- Avoid circular references — use scalar IDs instead of parent object references
- Limit nesting depth to 3-4 levels; flatten beyond that
- Use nullable child DTOs for optional relationships
- For collections of DTOs, use `array` typed with `@param` docblock
- Eager-load all Eloquent relations before passing models to nested factories

## Verification

- [ ] DTO tree is acyclic — no circular references exist
- [ ] Construction proceeds bottom-up (children before parents)
- [ ] Factory methods chain to child DTO factories
- [ ] Collections of DTOs have typed docblock annotations
- [ ] Optional relationships use nullable child DTOs
- [ ] Nesting depth does not exceed 3-4 levels
- [ ] Shared references use scalar IDs, not parent objects
- [ ] Eager-loaded relations before constructing from models
