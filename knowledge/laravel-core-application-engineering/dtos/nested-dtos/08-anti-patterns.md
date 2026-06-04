# ECC Anti-Patterns — Nested DTOs

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | Nested DTOs |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Infinity Tree (Circular Parent-Child References)
2. The One-Size-Fits-All DTO Tree (Same Nesting for List and Detail)
3. The Hydra Factory (Database Calls Inside Nested Factories)
4. Deep Nesting Beyond 4 Levels
5. Inconsistent Nesting (Same Entity, Different Shapes)

---

## Repository-Wide Anti-Patterns

- Lazy Loading Inside fromModel for Nested Relations
- Shared Child DTO References Serialized Duplicately
- No Nullable Child DTOs for Optional Relationships
- PHPStan Missing on Array-of-DTO Type Hints
- No Depth Limit Convention for Nested Trees

---

## Anti-Pattern 1: The Infinity Tree (Circular References)

### Category
Reliability | Design

### Description
A DTO tree where a child DTO holds a reference to its parent, creating a circular reference that causes infinite recursion during serialization.

### Why It Happens
Developers think "navigation convenience" — a LineItemDto should know its parent OrderDto. They add the parent reference without considering serialization implications.

### Warning Signs
- Child DTO has a constructor parameter for its parent DTO
- `toArray()` causes infinite recursion and stack overflow
- `json_encode()` fails with "Recursion detected"
- Serialization tests hang or crash

### Preferred Alternative
Replace parent object references with scalar parent IDs. Children should not know their parent — that is the parent's concern. Use `orderId` instead of `OrderDto $order`.

### Related Rules
- Rule: Replace Parent References With Scalar IDs

---

## Anti-Pattern 2: The One-Size-Fits-All DTO Tree

### Category
Performance | Maintainability

### Description
A single deeply nested DTO tree used for every endpoint — list, detail, admin — causing over-fetching and excessive nesting for list views.

### Why It Happens
Developers create one DTO per entity hierarchy and use it everywhere, not considering that list endpoints need flat summaries while detail endpoints need deep nesting.

### Warning Signs
- List endpoint returns DTO with 4 levels of nesting but only needs 1
- API response for `/users` includes full order history, addresses, and payment methods
- List response is 10x larger than necessary
- Consumers complain about slow loading and excessive data transfer

### Preferred Alternative
Create separate DTOs per view: flat `UserListDto` for list endpoints, nested `UserDetailDto` for detail endpoints, with appropriate nesting levels.

### Related Rules
- Rule: Use Separate DTOs Per View (List, Detail, Admin)

---

## Anti-Pattern 3: The Hydra Factory

### Category
Architecture | Testing

### Description
A factory method that constructs the entire DTO tree by making multiple database calls inside the factory, coupling construction to the database.

### Why It Happens
Factories call `$model->relation` or `Relation::find()` inside the factory method to resolve nested DTOs, making the factory a data-access layer.

### Warning Signs
- Factory method calls `Model::where()`, `$model->load()`, or `DB::table()` inside
- Factory cannot be tested without a database
- Constructing a DTO triggers unexpected database queries
- Eager-loading the main model does not prevent N+1 from the factory

### Preferred Alternative
Eager-load all relations before passing the model to the factory. The factory should only map data — it should not fetch data. Pass pre-loaded data as arrays or models with loaded relations.

### Related Rules
- Rule: Eager-Load Before Calling Nested Factories

---

## Anti-Pattern 4: Deep Nesting Beyond 4 Levels

### Category
Maintainability | Performance

### Description
Nesting DTOs 5+ levels deep, making the structure hard to navigate, construct, and serialize.

### Why It Happens
Domain data naturally has deep relationships (e.g., Department → Team → Employee → Address → Coordinates). Developers map every level without considering whether all levels are needed.

### Warning Signs
- DTO tree has 5+ levels of nesting
- Construction requires chaining 5+ factory calls
- Serialization takes multiple milliseconds for a single DTO
- Developers must navigate 5+ DTO files to understand the full structure

### Preferred Alternative
Limit nesting to 3-4 levels. Flatten beyond that using computed properties or separate DTOs. For deeply nested data, consider splitting into multiple requests or using GraphQL-style querying.

### Related Rules
- Rule: Limit Nesting Depth to 3-4 Levels

---

## Anti-Pattern 5: Inconsistent Nesting (Same Entity, Different Shapes)

### Category
Maintainability

### Description
The same domain entity is represented with different nesting levels in different DTOs without clear reason, forcing consumers to handle multiple shapes.

### Why It Happens
Different developers create different DTOs for the same entity at different times, with no convention for when to nest versus flatten.

### Warning Signs
- `UserDto` in the users domain has nested `AddressDto`, but `UserDto` in the orders domain has a flat `address_line_1` field
- No documentation explains why nesting differs
- API consumers must handle both nested and flat representations of the same data
- Internal code must convert between shapes

### Preferred Alternative
Define standard views for each entity (list, detail, admin) and apply them consistently. When nesting differs, document the rationale.

### Related Rules
- Rule: Standardize Entity Representations Across DTOs
