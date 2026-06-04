# ECC Anti-Patterns — Value Objects in Laravel

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | Value Objects in Laravel |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Mutable Value Object
2. Anemic Value Object
3. Value Object With IO
4. Value Object as Entity
5. Primitive Passion (Over-Value-Object-ing)
6. Missing Equality

---

## Repository-Wide Anti-Patterns

- Mutable domain objects
- Primitive obsession
- Validation scattered across codebase
- Missing equals/hashCode semantics

---

## Anti-Pattern 1: Mutable Value Object

### Category
Architecture | Domain Modeling

### Description
A Value Object with public or protected setters, mutable properties, or methods that modify internal state. The class is supposed to represent a value, but its instances change after creation.

### Why It Happens
ORM-first design where objects must be mutable for Eloquent hydration. Incremental feature additions that add setters for convenience. Lack of `readonly` keyword usage.

### Warning Signs
- Properties not declared `readonly`
- Public setter methods
- Methods that modify `$this->property` instead of returning a new instance
- Value Objects passed to functions that call setters
- Defensive copies required before using Value Objects

### Preferred Alternative
Declare the class `readonly`. Make all properties `private readonly` via constructor promotion. Methods that return modified values must return new instances.

### Refactoring Strategy
1. Add `readonly` to class declaration
2. Move properties to constructor promotion
3. Replace mutation methods with methods returning new instances
4. Update all callers to use the new instances
5. Add tests verifying immutability

### Related Rules
- Rule: Value Objects Are Readonly and Immutable (LAP-07/05-rules.md)

---

## Anti-Pattern 2: Anemic Value Object

### Category
Architecture | Domain Modeling

### Description
A Value Object wrapper class that provides no validation, no behavior, and no equality comparison. It is a named type alias with no safety guarantees — ceremony without benefit.

### Why It Happens
Automated generation from database schema. Pressure to "use Value Objects" without understanding their purpose. Belief that any wrapper is better than no wrapper.

### Warning Signs
- Constructor accepts any value without checks
- Class has only a getter and no other methods
- No `equals()` implementation
- Developers ask "why does this class exist?"

### Preferred Alternative
Add constructor validation for all invariants. Add behavior methods related to the value. Implement `equals()` and `__toString()`.

### Refactoring Strategy
1. Identify the validation rules for this value
2. Add validation to the constructor
3. Implement `equals()` and `__toString()`
4. Add behavior methods if applicable (formatting, conversion)

### Related Rules
- Rule: Validate on Construction (LAP-07/05-rules.md)
- Rule: Implement Equality Comparison (LAP-07/05-rules.md)

---

## Anti-Pattern 3: Value Object With IO

### Category
Architecture | Domain Modeling

### Description
A Value Object that performs database queries, sends emails, calls APIs, or writes files as part of its methods.

### Why It Happens
Convenience — the Value Object already has the data, so the method to send/process is added there. It is the quickest path to functionality.

### Warning Signs
- Value Objects importing `DB`, `Mail`, `Http`, `Storage` facades
- `send()`, `save()`, `notify()`, `publish()` methods on Value Objects
- Value Objects that require Laravel bootstrap to test
- Tests that need database or HTTP mocks to test Value Objects

### Preferred Alternative
Value Objects should be pure data with related behavior (comparison, formatting). IO operations belong in Infrastructure services that receive the Value Object as input.

### Refactoring Strategy
1. Remove IO methods from the Value Object
2. Create an Infrastructure service that performs the IO
3. Pass the Value Object as a parameter to the new service

### Related Rules
- Rule: No IO in Value Object Methods (LAP-07/05-rules.md)

---

## Anti-Pattern 4: Value Object as Entity

### Category
Architecture | Domain Modeling

### Description
Modeling a domain concept as a Value Object when identity tracking is required. The object is immutable and uses value equality, but the business needs to track individual instances over time.

### Why It Happens
Misunderstanding the Entity vs Value Object distinction. The concept feels descriptive, but business requirements (audit, separate lifecycle) demand identity.

### Warning Signs
- Business requirement to track individual instance history
- Value Objects stored in separate database tables with their own IDs
- Value Objects that need to be individually updated
- Confusion about why two instances with the same data are treated differently

### Preferred Alternative
If identity matters, model as Entity. Add an identity field and compare by identity.

### Refactoring Strategy
1. Remove `readonly` from the class (if identity requires mutation)
2. Add an identity field
3. Implement `equals()` comparing by identity
4. Update persistence strategy

### Related Rules
- Rule: Implement Entities with Identity (LAP-06/05-rules.md)

---

## Anti-Pattern 5: Primitive Passion (Over-Value-Object-ing)

### Category
Architecture | Code Organization

### Description
Creating Value Objects for every primitive value — `FirstName`, `LastName`, `StreetName`, `CityName`, `ZipCode` — even when none of them have validation or behavior beyond what the primitive provides.

### Why It Happens
Dogmatic application of "no primitive types" without considering cost-benefit. Each Value Object adds a file, tests, and persistence mapping.

### Warning Signs
- 50+ Value Objects in the Domain directory
- Most Value Objects have identical structure: wrap string, no validation, no behavior
- Developers groan when adding a new field because it requires a new Value Object
- Time spent on Value Object creation exceeds time spent on business logic

### Preferred Alternative
Use Value Objects only where validation, behavior, or type safety justifies the abstraction. For simple data carriers with no constraints, primitives may be appropriate.

### Refactoring Strategy
1. Identify Value Objects with no validation and no behavior
2. Replace them with primitives in method signatures
3. Remove the Value Object class and its tests
4. Document the rationale in team conventions

### Related Rules
- Rule: Validate on Construction (LAP-07/05-rules.md)
