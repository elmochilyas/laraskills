# ECC Anti-Patterns — DTO vs Value Object

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Data Transfer Objects |
| **Knowledge Unit** | DTO vs Value Object |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. The Ceremony Wrapper (VO Without Invariants)
2. The DTO-VO Hybrid (DTO Used as Both Transport and Domain Concept)
3. The God VO (Value Object With 15+ Methods)
4. Primitive Obsession in DTOs (Scalar Types for Domain Concepts)
5. Comparing DTOs by Value (Using == or === on DTOs)

---

## Repository-Wide Anti-Patterns

- VOs Without `equals()` Method
- DTOs With Domain Behavior (add(), merge(), format() Methods)
- VOs Used as DTOs (Passed Directly Across Layer Boundaries)
- No Domain Primitives for Core Identifiers (UserId, OrderId)
- VOs With No Invariant Validation in Constructor

---

## Anti-Pattern 1: The Ceremony Wrapper

### Category
Design | Maintainability

### Description
A Value Object class that merely wraps a scalar with no validation, no invariants, and no behavior — just a property and a getter.

### Why It Happens
Developers create VOs for "type safety" without understanding that the value of a VO is its invariant enforcement, not its wrapping.

### Warning Signs
- VO class has one property, one constructor, and one getter — no validation, no methods
- `new Email($value)` accepts any string, even invalid ones
- Removing the VO and using the raw scalar changes nothing in the codebase
- The VO's constructor does not throw exceptions for invalid input

### Preferred Alternative
If a VO has no invariants, use a scalar type directly. A named scalar with no validation is just ceremony. Add validation or remove the class.

### Related Rules
- Rule: Value Objects Must Enforce Invariants

---

## Anti-Pattern 2: The DTO-VO Hybrid

### Category
Architecture | Design

### Description
A class that is used as both a DTO (transporting data across layers) and a Value Object (with domain behavior and equality semantics).

### Why It Happens
Developers see both patterns as "immutable data carriers" and combine them into one class, not recognizing their different purposes.

### Warning Signs
- A single class has factory methods (`fromArray`, `fromRequest`) AND domain methods (`equals`, `add`, `normalize`)
- The same class appears in both the HTTP layer (as transport) and the domain layer (as concept)
- The class has both DTO-style factories and VO-style behavior methods
- Removing the class requires changing both transport code and domain code

### Preferred Alternative
Keep DTOs and VOs separate. DTOs transport data across layers with factory methods. VOs encapsulate domain concepts with behavior and equality. VOs can be properties of DTOs.

### Related Rules
- Rule: Separate DTO and VO Concerns

---

## Anti-Pattern 3: The God VO

### Category
Maintainability | Design

### Description
A Value Object with 15+ methods covering every possible operation on the value — formatting, calculation, validation, comparison, serialization.

### Why It Happens
VOs start small and accumulate methods as developers find convenient places to put behavior.

### Warning Signs
- Single VO class has 15+ public methods
- Methods cover unrelated areas (formatting, persistence, comparison, validation)
- VO's methods are used across multiple services and contexts
- Changing one aspect of the value requires modifying the VO's many methods

### Preferred Alternative
Keep VOs focused on behavior directly related to the value they represent. Extract unrelated behavior to service classes.

### Related Rules
- Rule: Keep Value Objects Focused on Their Domain Concept

---

## Anti-Pattern 4: Primitive Obsession in DTOs

### Category
Design | Reliability

### Description
Using scalar types (`int $userId`, `string $email`) in DTOs instead of typed Value Objects (`UserId $userId`, `Email $email`).

### Why It Happens
Scalars are easier to type and don't require creating or importing VO classes. Developers optimize for writing speed over type safety.

### Warning Signs
- DTO has multiple `int $id` properties with different domain meanings (userId, orderId, productId)
- A method accidentally receives `int $orderId` where `int $userId` is expected — compiler does not catch it
- Same scalar validation is duplicated across multiple services
- Refactoring a type change (int → string for user ID) requires changing every DTO and service

### Preferred Alternative
Use Value Objects for core domain identifiers and formatted types (Email, Money, PhoneNumber). The type system prevents confusion between different domain concepts.

### Related Rules
- Rule: Use Value Objects for Domain Identifiers

---

## Anti-Pattern 5: Comparing DTOs by Value

### Category
Design

### Description
Using `==` or `===` on DTOs expecting value-based comparison, not realizing DTOs compare by reference.

### Why It Happens
Developers treat DTOs like VOs, assuming that two DTOs with the same values are "equal" by default.

### Warning Signs
- `==` or `===` operator used with DTO variables
- Test asserts `$dto1 === $dto2` expecting them to be equal by value
- No `equals()` method is implemented but value comparison is attempted
- Code review shows DTO comparison in business logic

### Preferred Alternative
DTOs should not be compared by value. If comparison is needed, implement an explicit `equals()` method. For most DTO usage patterns, reference comparison is correct — DTOs are pipes, not values.

### Related Rules
- Rule: DTOs Are Reference-Comparable, Not Value-Comparable
