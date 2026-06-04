# ECC Anti-Patterns — Data Object Transformation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | Data Object Transformation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Conditional toArray (Complex Branching in Output Methods)
2. The Business Logic Transformer (Computing Values in toArray)
3. The Leaky DTO (Exposing Internal Fields in Output)
4. Round-Trip Breaking (fromArray and toArray Are Not Consistent)
5. Recursive Serialization Overflow (Circular References)

---

## Repository-Wide Anti-Patterns

- DTO Used for Both Input and Output When Shapes Diverge
- Inconsistent Naming Between Input and Output (snake_case vs camelCase)
- Over-Computation in toArray (Expensive Operations in Output)
- No JsonSerializable Implementation for JSON Consumers
- DTO toArray Returns All Internal Properties Without Selection

---

## Anti-Pattern 1: The Conditional toArray

### Category
Maintainability | Design

### Description
A single `toArray()` method with complex conditional logic depending on context — `if ($admin)` include this field, `if ($list)` exclude that field.

### Why It Happens
Developers want one DTO to serve multiple output shapes (list, detail, admin) instead of creating separate output DTOs.

### Warning Signs
- `toArray()` has multiple `if` branches based on flags, roles, or context
- Method has 30+ lines of conditional output construction
- Adding a new output variant requires modifying `toArray()` and adding more conditionals
- Callers must set flags or context before calling `toArray()`

### Preferred Alternative
Use separate output DTOs per shape (`UserListDto`, `UserDetailDto`, `AdminUserDto`) or a dedicated Transformer class with multiple output methods.

### Related Rules
- Rule: Use Separate Output DTOs Per Shape

---

## Anti-Pattern 2: The Business Logic Transformer

### Category
Architecture | Maintainability

### Description
Computing business values — totals, discounts, categories — inside `toArray()` instead of pre-computing them in the service layer.

### Why It Happens
Developers think "formatting" includes derived values. They compute business results during serialization for convenience.

### Warning Signs
- `toArray()` calls methods that calculate totals, apply discounts, or format currency
- Profiling shows expensive operations in "JSON encoding time"
- Changing business logic requires modifying DTO transformation code
- The same business calculation is duplicated across multiple DTOs' `toArray` methods

### Preferred Alternative
Pre-compute all business values in the service layer and store them as DTO properties. `toArray()` should only transform format (dates to ISO, collections to arrays) — not compute business results.

### Related Rules
- Rule: Pre-Compute Business Values Before DTO Construction

---

## Anti-Pattern 3: The Leaky DTO

### Category
Security

### Description
A `toArray()` implementation that returns the full internal DTO structure, including sensitive or internal fields that should not be exposed to API consumers.

### Why It Happens
Developers use `return get_object_vars($this)` or iterate over all properties without considering which fields are safe to expose.

### Warning Signs
- `toArray()` uses `get_object_vars($this)` or similar reflection-based property dumping
- Internal fields (database IDs, internal flags, timestamps) appear in API output
- Sensitive data (password hashes, tokens) is accidentally included
- Adding a new property automatically exposes it in the output

### Preferred Alternative
Explicitly list each output field in `toArray()`. Never use reflection-based property dumping. Control the serialization surface explicitly.

### Related Rules
- Rule: Explicitly List Output Fields in toArray

---

## Anti-Pattern 4: Round-Trip Breaking

### Category
Maintainability | Reliability

### Description
A DTO whose `fromArray()` and `toArray()` are not consistent — calling `fromArray(toArray($dto))` produces a different DTO or fails.

### Why It Happens
Output format diverges from input format (renamed fields, computed values, flattened structures) without documenting the asymmetry.

### Warning Signs
- `toArray()` returns `full_name` but `fromArray()` expects `firstName` and `lastName`
- Round-trip test (`fromArray(toArray(input))`) throws errors or produces different values
- Callers cannot reconstruct a DTO from its own serialized output
- No documentation exists about the asymmetry

### Preferred Alternative
Ensure `fromArray` can consume `toArray` output, or document explicitly that they are not inverses. When they diverge, clearly document why and provide separate methods for each direction.

### Related Rules
- Rule: Maintain Round-Trip Consistency or Document Asymmetry

---

## Anti-Pattern 5: Recursive Serialization Overflow

### Category
Reliability | Performance

### Description
A DTO that references itself directly (parent → child → parent) or through a chain, causing infinite recursion during `toArray()`.

### Why It Happens
DTOs hold object references to parent DTOs for navigation convenience, not considering that serialization will recurse infinitely.

### Warning Signs
- A child DTO holds a reference to its parent DTO
- `toArray()` on a parent DTO triggers infinite recursion and stack overflow
- `json_encode($dto)` fails with "Recursion detected"
- Circular references exist in the DTO graph

### Preferred Alternative
Replace parent object references with scalar IDs. The parent DTO is the container; children should not reference it. Use `parentId` instead of `parent`.

### Related Rules
- Rule: Avoid Circular References in DTO Trees
