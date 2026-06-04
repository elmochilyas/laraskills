# Skill: Construct and Serialize Nested DTO Trees

## Purpose

Create a tree of nested DTOs with bottom-up construction, factory chaining, and recursive serialization — ensuring type safety across the entire DTO hierarchy while preventing circular references and keeping nesting depth manageable.

## When To Use

- Complex domain data that naturally nests (orders with line items, users with profiles, categories with children)
- API detail endpoints that return hierarchical data structures
- Aggregate data that crosses multiple layers in a single operation
- Processing nested data from batch jobs or queue payloads

## When NOT To Use

- Deeply nested structures (5+ levels) — flatten or split into multiple DTOs
- When only a subset of child data is needed — use reduced child DTOs or flattening
- When serialization performance is critical for large collections — flat DTOs serialize faster
- When consumers need only a few fields from the nested structure

## Prerequisites

- Child DTOs defined with `readonly class` and their own `fromArray()` factories
- Parent DTO defined with typed child DTO properties
- All Eloquent relations identified and eager-loadable
- Team convention for maximum nesting depth established

## Inputs

- DTO tree structure: parent DTO with child DTO property types
- Source data structure (array, model tree) that mirrors the DTO tree
- Factory method implementations for each DTO level
- Serialization output requirements per level

## Workflow

1. Design the DTO tree structure — limit to 3-4 levels maximum:
   - Level 1: Root DTO (e.g., `OrderDto`)
   - Level 2: Child DTOs (e.g., `CustomerDto`, `AddressDto`)
   - Level 3-4: Grandchild DTOs (e.g., `CoordinatesDto`)
2. Ensure the tree is acyclic — replace parent object references with scalar parent IDs
3. For each DTO in the tree, implement `fromArray()` that delegates to child DTO factories — do not reconstruct child data in the parent
4. For optional child relationships, use nullable child DTO types (`?AddressDto`) — factories produce `null` when absent
5. For collections of child DTOs, use `array` typed with a `@param` docblock annotation
6. Build construction bottom-up: construct leaf DTOs first, pass them to parent DTO factory
7. For `fromModel()` factories, eager-load all relations before calling the top-level factory — never lazy-load in nested factories
8. Implement `toArray()` on each DTO level that recurses into children:
   - Call `->toArray()` on child DTOs
   - Handle nullable children with null-coalescing
   - Handle collections with `array_map`
9. Test the complete DTO tree construction and serialization — verify all nesting levels and circular reference safety

## Validation Checklist

- [ ] DTO tree is acyclic — no circular references
- [ ] Construction proceeds bottom-up — leaf DTOs constructed before parent
- [ ] Parent factory delegates to child DTO factories (factory chaining)
- [ ] Collections of DTOs have typed docblock annotations
- [ ] Optional child relationships use nullable DTO types
- [ ] Nesting depth does not exceed 3-4 levels
- [ ] All Eloquent relations are eager-loaded before `fromModel()` call
- [ ] `toArray()` recurses correctly through all nesting levels
- [ ] Serialization test covers the complete tree

## Common Failures

- **Circular references**: Child DTO holds parent object reference. Causes infinite serialization loop. Use scalar parent IDs.
- **Deep nesting**: 5+ levels of nesting makes factory chains unintelligible. Flatten or split.
- **Lazy loading in factories**: Accessing `$user->profile->address->city` without eager-loading triggers multiple queries. Eager-load all relations before calling `fromModel()`.
- **Missing nullable handling**: Non-nullable child DTO type when relationship is optional. Use `?ChildDto`.
- **Flat serialization**: `toArray()` that does not recurse into child DTOs. Call `->toArray()` on each child.

## Decision Points

- **Eager vs lazy construction**: Prefer eager (default) — construct all children at parent construction time. Use lazy only when some child data is expensive to compute and rarely accessed (spatie `#[Lazy]`).
- **Full nesting vs flattening**: For list endpoints, flatten child data into parent properties (e.g., `customerName` instead of nested `CustomerDto`). For detail endpoints, preserve natural nesting.
- **Shared child references**: A child DTO referenced by multiple parents is safe in readonly systems but serializes separately (duplicate data). Consider using scalar IDs if output size is a concern.

## Performance Considerations

- Construction cost: O(n) in total node count. For 10-50 nodes, <0.1ms.
- Serialization cost: O(n) in node count via recursive `jsonSerialize`. For 1000+ nodes, 5-10ms.
- Circular references cause `json_encode` to fail entirely — always ensure acyclic graphs.
- Shared references between parents serialize duplicate data — each parent gets its own copy of the child data.

## Security Considerations

- Ensure nested DTOs do not expose parent data through child references — children should not hold parent objects
- Deeply nested DTOs can accidentally include sensitive relations — validate which child properties are included
- Avoid lazy loading in factory chains — eager-load all relations before construction to prevent data exposure

## Related Rules

- Rule 1: Construct Nested DTOs Bottom-Up
- Rule 2: Limit DTO Nesting Depth to a Maximum of 3-4 Levels
- Rule 3: Prevent Circular References — Use Scalar IDs Instead of Parent Objects
- Rule 4: Use Factory Chaining — Each DTO Level Owns Its Own Construction
- Rule 5: Use Nullable Child DTOs for Optional Relationships
- Rule 6: Eager-Load All Eloquent Relations Before Passing Models to Nested Factories

## Related Skills

- DTO Construction Patterns: Add Named Static Factories to a DTO
- Data Object Transformation: Implement and Test DTO Output Methods
- DTO Testing: Write DTO Contract Tests

## Success Criteria

- DTO tree is acyclic — all child-to-parent references use scalar IDs
- Nesting depth is 3-4 levels maximum
- Factory chaining: parent calls child `fromArray()` — no caller-side reconstruction
- Optional children use nullable DTO types
- `toArray()` produces correct nested output at all levels
- All relations are eager-loaded before `fromModel()` calls
- Serialization tests cover the complete tree without errors
