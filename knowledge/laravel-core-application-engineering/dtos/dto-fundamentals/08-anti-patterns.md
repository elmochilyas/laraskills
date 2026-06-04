# ECC Anti-Patterns — DTO Fundamentals

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | DTO Fundamentals |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Mutable DTOs (Setters, Non-Readonly Properties)
2. Business Logic in DTOs (Validation, Calculation, Persistence)
3. Balloon DTO (Accumulating Every Field for Every Use Case)
4. The Echo Chamber DTO (Mirroring FormRequest Keys With No Transformation)
5. Leaking HTTP Dependencies (Request Type-Hints in DTOs)

---

## Repository-Wide Anti-Patterns

- The God DTO (Single DTO for Create, Update, List, Detail)
- Constructing DTOs From `$request->all()` Without Validation
- Using DTOs Everywhere Regardless of Complexity
- No `fromArray()` Factory Method (Manual Construction Scattered)
- DTOs With `mixed` or Un-Typed Properties

---

## Anti-Pattern 1: Mutable DTOs (Setters, Non-Readonly Properties)

### Category
Design | Reliability

### Description
Declaring DTO properties without the `readonly` keyword, or providing setter methods that allow property values to change after construction.

### Why It Happens
Developers are not aware of PHP 8.1/8.2 readonly features, or they treat DTOs like "parameter bags" that can be modified at any point in the pipeline.

### Warning Signs
- Properties declared as `public` without `readonly`
- Setter methods (`setName()`, `setEmail()`) exist on the DTO
- Intermediate layers modify DTO properties after construction
- A bug is traced back to "someone changed the DTO data between the controller and the service"

### Preferred Alternative
Declare DTOs as `readonly class` (PHP 8.2+) or use `public readonly` on every property. Enforce immutability from the first commit.

### Related Rules
- Rule: Enforce Readonly on All DTO Properties

---

## Anti-Pattern 2: Business Logic in DTOs

### Category
Architecture | Maintainability

### Description
Adding validation rules, calculation methods, persistence logic, or event dispatching inside a DTO class.

### Why It Happens
Developers see DTOs as "smart objects" that should validate themselves, compute derived values, or even save themselves to the database.

### Warning Signs
- DTO has methods like `calculateTotal()`, `isValid()`, `save()`, or `dispatch()`
- Constructor contains validation that queries the database
- DTO imports models, facades, or infrastructure classes
- The DTO's public interface contains more behavior methods than data access

### Preferred Alternative
Keep DTOs pure data carriers with typed properties and factory methods. Validation belongs in FormRequests or dedicated validation layer. Business logic belongs in services.

### Related Rules
- Rule: No Business Logic Methods in DTOs

---

## Anti-Pattern 3: The Balloon DTO

### Category
Maintainability | Design

### Description
A DTO that accumulates every field for every use case, with most fields being nullable or optional, serving create, update, list, and detail operations simultaneously.

### Why It Happens
Developers create one DTO per entity and keep adding fields as new use cases appear, rather than creating operation-specific DTOs.

### Warning Signs
- DTO has 15+ properties, most of which are `?nullable`
- A single DTO is used in create, update, list, and detail operations
- Consumers must guess which fields are guaranteed to be populated
- Adding a new use case adds more nullable fields to the existing DTO

### Preferred Alternative
Create per-operation DTOs (`CreateUserDto`, `UpdateProfileDto`, `UserListDto`). Each DTO contains only the fields relevant to that operation.

### Related Rules
- Rule: Use Per-Operation DTOs for Complex Use Cases

---

## Anti-Pattern 4: The Echo Chamber DTO

### Category
Design | Maintainability

### Description
A DTO whose properties exactly mirror the FormRequest's validated keys with no transformation, renaming, or type conversion. The DTO adds ceremony without value.

### Why It Happens
Developers create DTOs as a mandatory architectural step without considering what value the DTO provides. The DTO becomes a pass-through wrapper.

### Warning Signs
- DTO field names exactly match HTTP form field names
- No type conversion happens in the factory method (string stays string, int stays int)
- DTO is used by exactly one method in one service
- Removing the DTO and passing `$request->validated()` directly changes nothing

### Preferred Alternative
Either transform field names, flatten nested structures, or convert types in the DTO factory. If no transformation is needed, skip the DTO and pass validated data directly.

### Related Rules
- Rule: DTOs Must Transform or Rename Fields From HTTP Structure

---

## Anti-Pattern 5: Leaking HTTP Dependencies

### Category
Architecture | Testing

### Description
DTOs that type-hint `Illuminate\Http\Request`, contain request objects as properties, or are constructed from raw request data.

### Why It Happens
Developers construct DTOs directly from `$request->all()` inside the controller without separating the HTTP layer from the data transport layer.

### Warning Signs
- DTO factory method accepts `Request` or depends on request data
- DTO stores a `$request` property or extends a request-related class
- Testing the DTO requires mocking an HTTP request
- DTO cannot be constructed from CLI or queue because it depends on HTTP context

### Preferred Alternative
DTOs should accept only scalar types, arrays, and nested DTOs. Use FormRequest's `validated()` as the bridge between HTTP and DTO. DTOs must be constructable from CLI, queue, and test contexts.

### Related Rules
- Rule: Never Type-Hint Request in DTOs
