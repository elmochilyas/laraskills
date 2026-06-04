# ECC Anti-Patterns — Domain Entity to Eloquent Model Mapping

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Domain Entity to Eloquent Model Mapping |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Domain-Laced Mapping
2. Eloquent Leak
3. Circular Reference Loop
4. Anemic Mapping
5. Mixed Direction Code
6. Identity Mismatch Blindness

---

## Repository-Wide Anti-Patterns

- Domain logic in mappers
- Eloquent types leaking into Domain
- Missing round-trip tests
- Incomplete nested entity mapping

---

## Anti-Pattern 1: Domain-Laced Mapping

### Category
Architecture | Persistence

### Description
Mapper code that invokes Domain behavior methods during data extraction or hydration. The mapper calls `$invoice->validate()`, `$order->calculateTotal()`, or other business logic while copying data.

### Why It Happens
Convenience — the mapper has access to Domain objects and the behavior seems harmless. The developer may not realize that mapping triggers business rules, validations, or events.

### Warning Signs
- `toModel()` method that calls Domain behavior methods
- Mapper tests that require Domain mock setup
- Side effects observed during mapping (events dispatched, validations run)
- Mapper that throws Domain exceptions

### Preferred Alternative
Mapping should be purely structural — property-to-property copying with no method calls on Domain objects beyond accessors. If behavior must be invoked, do it in the Repository method, not the mapper.

### Refactoring Strategy
1. Remove all Domain method calls from mapper methods
2. Replace with direct property access via getter methods
3. Move any necessary behavior invocation to the Repository save/load methods

### Related Rules
- Rule: Mapping Is Structural, Not Behavioral (LAP-10/05-rules.md)

---

## Anti-Pattern 2: Eloquent Leak

### Category
Architecture | Persistence

### Description
Repository interface methods that return Eloquent types — `EloquentCollection`, `LengthAwarePaginator`, `Eloquent\Model` — instead of Domain types.

### Why It Happens
Convenience and speed. The developer implements the Repository and returns the Eloquent result directly. Abstracting to Domain types requires mapping effort.

### Warning Signs
- Repository interface returns `?InvoiceModel` instead of `?Invoice`
- Repository methods return `Collection` (Eloquent's type)
- Domain callers depend on `Illuminate\Database\Eloquent` imports
- Repository interface has `paginate()` returning `LengthAwarePaginator`

### Preferred Alternative
Repository interfaces must use Domain types only. If pagination or collections are needed, use Domain-specific DTOs or plain arrays.

### Refactoring Strategy
1. Change Repository interface to return Domain types
2. Implement mapping in the Repository implementation
3. Update Domain callers to work with Domain types

### Related Rules
- Rule: Repository Returns Domain Entities (LAP-10/05-rules.md)

---

## Anti-Pattern 3: Circular Reference Loop

### Category
Architecture | Persistence

### Description
Bi-directional relationships in mapping where Entity A contains Entity B and Entity B contains Entity A, causing infinite recursion during hydration.

### Why It Happens
Database relationships are often bi-directional. The mapper naively follows all relationships without detecting cycles.

### Warning Signs
- `toDomain()` stack overflow on aggregates with bi-directional relationships
- Mapping tests that hang or time out
- Debug output showing infinite recursion in mapper

### Preferred Alternative
Break cycles with identity-only references. Entity A contains a list of Entity B identities, not Entity B objects. Load Entity B separately when needed.

### Refactoring Strategy
1. Identify bi-directional relationships in the Domain model
2. Replace object references with identity references on one side
3. Update mapper to load identities, not full objects
4. Add explicit depth limits as safety net

### Related Rules
- Rule: Handle Nested Entities Recursively (LAP-10/05-rules.md)

---

## Anti-Pattern 4: Anemic Mapping

### Category
Architecture | Persistence

### Description
Mapper that only maps primitive fields (string, int, dates) while ignoring Value Objects and nested Entities. The Domain Aggregate is reconstructed without its structural richness.

### Why It Happens
The developer starts by mapping the simple fields and never completes the mapping for VOs and nested entities. The mapper works (no errors) but produces incomplete Domain objects.

### Warning Signs
- Domain aggregates reconstructed without Value Objects (primitives instead)
- Nested entity collections empty when data exists in database
- Round-trip tests fail only for complex properties
- Business logic that depends on Value Objects fails unpredictably

### Preferred Alternative
Implement complete mapping for all Value Objects and nested entities before considering the mapper done. Write round-trip tests that validate all properties.

### Refactoring Strategy
1. Identify all Value Object and nested entity properties
2. Implement mapping for each VO and nested entity
3. Add round-trip tests that verify complete Aggregate reconstruction

### Related Rules
- Rule: Handle Nested Entities Recursively (LAP-10/05-rules.md)
- Rule: Write Round-Trip Mapping Tests (LAP-10/05-rules.md)

---

## Anti-Pattern 5: Mixed Direction Code

### Category
Architecture | Design

### Description
A single mapper method that handles both hydrating and extracting, using conditional logic to determine direction. The code is harder to read, test, and maintain.

### Why It Happens
Attempt to reduce duplication by sharing property mapping code. The developer creates a single `map()` method with a direction parameter.

### Warning Signs
- Single `map()` method with `$direction` parameter
- `if ($direction === 'toDomain')` / `if ($direction === 'toModel')` conditionals
- Mapper class with shared private methods that report low code coverage

### Preferred Alternative
Separate `toDomain()` and `toModel()` methods with independent code paths. Extract shared property mapping only where the conversion is truly identical (rare).

### Refactoring Strategy
1. Split the single method into `toDomain()` and `toModel()`
2. Duplicate shared code rather than creating ambiguous shared helpers
3. Test each direction independently

### Related Rules
- Rule: Map Bidirectionally (LAP-10/05-rules.md)
