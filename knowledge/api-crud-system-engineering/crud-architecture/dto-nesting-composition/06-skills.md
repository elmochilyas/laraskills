# Skill: Design Nested DTO Compositions

## Purpose
Build complex DTO structures from nested and composed child DTOs — an `OrderDto` containing `AddressDto`, array of `LineItemDto`, and `PaymentDto` — for type-safe representation of deeply nested business data.

## When To Use
- Complex request payloads with nested objects (order with items, invoice with line items)
- API responses that mirror hierarchical business data
- When type safety needed at every level of data structure
- When DTO structure serves as self-documenting API contract

## When NOT To Use
- Simple flat data structures that don't benefit from nesting
- When nesting would exceed 4 levels — split into separate operations
- When relationship is incidental (User and Settings — separate concerns)
- For API output where API resources provide better serialization control

## Prerequisites
- DTO design patterns
- Recursive data structure understanding

## Inputs
- Business data hierarchy specification
- Child DTO definitions

## Workflow
1. Define child DTOs independently — each with typed constructor and `fromArray()` factory
2. Compose parent DTO receiving child DTOs as typed constructor parameters
3. Limit nesting depth to 3-4 levels maximum — flatten or split beyond that
4. Avoid circular references — children reference parents by ID scalar, not by object
5. Use nullable types for optional nested data — `?DiscountDto $discount = null`
6. Each child DTO must be independently constructable and testable
7. Prefer entity hierarchy over API structure for nesting orientation
8. Test recursive construction for each composed DTO including nested failure cases

## Validation Checklist
- [ ] No circular DTO references (children reference parents by ID)
- [ ] Nesting depth is 3-4 levels or fewer
- [ ] Each child DTO is independently constructable
- [ ] Recursive construction tested for failure cases
- [ ] Nullable child DTOs used for optional nested data
- [ ] Nesting orientation consistent (entity hierarchy preferred)
- [ ] Serialization works without infinite recursion

## Common Failures
- Deep nesting beyond reason — mirroring every Eloquent relationship
- Mixing nesting orientations — some by entity, others by API structure
- Circular DTO references — bidirectional relationships mapped directly
- Construction cascade failure without clear error messages

## Decision Points
- Entity hierarchy vs API structure — entity for stability, API for output DTOs
- Nullable vs required nested DTO — nullable for optional relationships, required for mandatory
- DTO vs API resource for output — DTO for internal, resource for HTTP

## Performance Considerations
- Nested DTO construction O(n) where n is total data nodes
- Typical order with 10 items: ~12 DTO constructions at ~0.005ms each = ~0.06ms
- Deeply nested DTOs (4+ levels) produce larger JSON payloads

## Security Considerations
- Circular references cause infinite serialization recursion — prevent via code review
- Child DTOs should not carry sensitive parent data — use ID references
- Missing field in deeply nested child causes top-level failure — ensure clear error messages

## Related Rules
- Limit Nesting Depth to 3-4 Levels
- Never Create Circular DTO References
- Each Child DTO Must Be Independently Constructable
- Use Nullable Types for Optional Nested Data
- Prefer Entity Hierarchy Over API Structure

## Related Skills
- Data Transfer Object Design — core DTO principles
- DTO Construction Patterns — factory methods
- Spatie Laravel Data Integration — automatic nested construction

## Success Criteria
- Nested DTOs accurately represent business data hierarchy
- No circular references — serialization is safe
- Every child DTO independently constructable and testable
- Nesting depth stays within limits
- Optional nested data uses nullable types