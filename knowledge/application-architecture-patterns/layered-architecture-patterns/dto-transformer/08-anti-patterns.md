# Anti-Patterns: DTOs and Transformers

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | 02-layered-architecture-patterns |
| **Knowledge Unit** | LAP-14-dto-transformer |
| **Generated** | 2026-06-04 |

---

## Anti-Pattern Inventory

1. Array Blindness — Passing Arrays Instead of DTOs
2. Eloquent Leak — Models Crossing Layer Boundaries
3. Mutable DTOs — Shared, Modified After Construction
4. Transformer Coupled to Eloquent — Accepting Models Instead of DTOs
5. Over-Fragmentation — Too Many Minimal DTO Types
6. Untested Transformer — No Output Structure Assertions
7. Anemic DTO — No Construction Validation
8. Fat DTO — Business Logic in Data Objects

---

## Repository-Wide Anti-Patterns

- Using `$model->toArray()` in transformers (exposes all attributes)
- DTO construction duplicated across multiple callers
- Inconsistent response envelope across endpoints

---

## Anti-Pattern 1: Array Blindness — Passing Arrays Instead of DTOs

### Category
Architecture | Maintainability

### Description
Using associative arrays to pass data between architectural layers instead of typed DTOs.

### Why It Happens
Arrays require no class creation. Developers default to the simplest container.

### Warning Signs
- Methods accept `array $data` parameters
- Callers manually construct arrays with string keys
- No documentation of expected array keys
- Runtime errors from missing array keys or wrong types
- No IDE autocompletion for data structures

### Why It Is Harmful
Arrays have no type safety, no discoverability, and no documentation. The data contract exists only in the developer's head. Refactoring requires finding all array construction sites.

### Preferred Alternative
Create typed DTOs for every data transfer boundary.

### Refactoring Strategy
1. Identify array parameters at layer boundaries
2. Create a `readonly` DTO class for each
3. Replace array construction with DTO construction
4. Update method signatures from `array` to the DTO type
5. Remove array access in favor of property access

### Detection Checklist
- [ ] Methods accept `array` at architectural boundaries
- [ ] String keys used instead of typed properties
- [ ] No autocompletion for data structure
- [ ] Runtime errors from missing keys

---

## Anti-Pattern 2: Eloquent Leak — Models Crossing Layer Boundaries

### Category
Architecture | Coupling

### Description
Eloquent models passed from the persistence layer to the application or presentation layer.

### Why It Happens
Developers pass models directly because they are already loaded and contain all needed data.

### Warning Signs
- Controllers call `$model->relationship` (lazy loading)
- Use Cases return Eloquent models
- Services accept Eloquent models as parameters
- Presenters/transformers call Eloquent methods on received models
- Feature tests show N+1 queries from model access outside repositories

### Why It Is Harmful
Eloquent models bring ORM baggage — lazy loading, dirty tracking, serialization quirks. Changes to the database schema or model structure cascade to all consumers.

### Preferred Alternative
Convert Eloquent models to DTOs at the repository boundary. The rest of the application works with DTOs.

### Refactoring Strategy
1. Identify where Eloquent models cross layer boundaries
2. Create DTOs for each boundary crossing
3. Add a `toDto()` method on the repository
4. Update consumers to use DTOs
5. Remove Eloquent imports from application layer classes

### Detection Checklist
- [ ] Non-repository classes import Eloquent models
- [ ] `->with()` or `->load()` called outside repositories
- [ ] `$model->toArray()` used in transformers or controllers
- [ ] Use Cases return Eloquent models

---

## Anti-Pattern 3: Mutable DTOs — Shared, Modified After Construction

### Category
Reliability | Correctness

### Description
DTOs that are modified after construction, especially when shared across contexts.

### Why It Happens
Developers treat DTOs like arrays — create, then modify as needed.

### Warning Signs
- DTO properties are not `readonly`
- DTO objects are modified after being passed to another method
- Same DTO instance is used in multiple places and modified
- Race conditions or unexpected values in concurrent execution

### Why It Is Harmful
Mutable DTOs create hidden coupling — modifying a DTO in one place affects all other places holding a reference. In Octane, shared mutable state across requests causes data corruption.

### Preferred Alternative
Use `readonly` classes for all DTOs. If modification is genuinely needed, create a new DTO instance.

### Refactoring Strategy
1. Add `readonly` to all DTO classes
2. Replace property assignments with `with*()` methods returning new instances
3. Review all DTO usage sites for mutation patterns
4. Update tests to verify immutability

### Detection Checklist
- [ ] DTO classes without `readonly` keyword
- [ ] Properties assigned after object construction
- [ ] DTO passed by reference and modified

---

## Anti-Pattern 4: Transformer Coupled to Eloquent — Accepting Models Instead of DTOs

### Category
Architecture | Testability

### Description
Transformer classes that accept Eloquent models and call Eloquent methods.

### Why It Happens
The model is already loaded in the controller. Passing it to the transformer saves the extra step of creating a DTO.

### Warning Signs
- Transformer `transform()` method accepts `Model` type
- Transformer calls `->load()`, `->with()`, or `->relation()` on the input
- Transformer test requires database setup (cannot use simple objects)
- Transformer behavior changes based on which Eloquent scopes were applied

### Why It Is Harmful
Transformers cannot be tested without database setup. They are coupled to the ORM and cannot be reused with non-Eloquent data sources.

### Preferred Alternative
Transformers should accept DTOs. If they must accept models, only access direct properties — no relationships, no Eloquent methods.

### Refactoring Strategy
1. Create a DTO for the transformer input
2. Populate the DTO in the controller or repository
3. Change the transformer signature to accept the DTO
4. Update transformer tests to pass DTOs (no database needed)
5. Remove Eloquent calls from the transformer

### Detection Checklist
- [ ] Transformer accepts Eloquent model type
- [ ] Transformer calls `->load()`, `->relation()`, or `->toArray()`
- [ ] Transformer tests require database

---

## Anti-Pattern 5: Over-Fragmentation — Too Many Minimal DTO Types

### Category
Maintainability | Developer Experience

### Description
Creating a separate DTO class for every minor data variation, resulting in dozens of near-identical classes.

### Why It Happens
Rigid adherence to "one DTO per context" without considering practical overlap.

### Warning Signs
- 10+ DTOs for the same entity with 1-2 field differences
- Most time spent mapping between similar DTOs
- Developers circumvent DTOs out of frustration
- DTO files outnumber domain/files 5:1

### Why It Is Harmful
Productivity loss from DTO management. Developers bypass the pattern. The cost of creating and maintaining DTOs exceeds the benefit.

### Preferred Alternative
Group closely related contexts under one DTO with optional fields. Split only when fields diverge significantly.

### Refactoring Strategy
1. Identify DTOs that share >80% of their fields
2. Merge into a single DTO with nullable fields for context-specific data
3. Update all consumers
4. Set a guideline: split DTOs only when fields differ by >30%

### Detection Checklist
- [ ] Multiple DTOs with nearly identical fields
- [ ] Mapping code between similar DTOs
- [ ] Developer complaints about DTO overhead
