# ECC Anti-Patterns — Clean/Onion Architecture

## Domain: Backend Architecture & Design | Subdomain: Architectural Styles

### Anti-Pattern Inventory

1. **Inner Ring Depends on Framework** — Entities/Use Cases importing Laravel classes
2. **Use Case Calls Eloquent** — Business logic layer directly queries database
3. **Reversed Dependency Direction** — Interface in outer ring, implementation in inner ring
4. **Boundary Objects Coupled to Framework** — DTOs with Laravel-specific code
5. **Over-Compartmentalizing** — Empty use cases and interfaces for simple CRUD
6. **Anemic Entities** — Entities without behavior, used only as data holders

### Repository-Wide Anti-Patterns

- Premature Optimization
- Silent Failure

---

### Anti-Pattern 1: Inner Ring Depends on Framework

**Category:** Architecture

**Description:** Enterprise entities or use cases importing Laravel-specific classes.

**Why It Happens:** Convenience — developer reaches for familiar Laravel features in domain code.

**Warning Signs:** `use Illuminate\Support\Facades\Mail` in entity class; `extends Model` in domain entity.

**Why Is It Harmful:** Violates the dependency rule — inner rings must not know about outer rings. Framework coupling makes business logic untestable without full Laravel bootstrap.

**Preferred Alternative:** Inner rings are pure PHP. Framework dependencies are injected via interfaces.

**Refactoring Strategy:** Remove all `Illuminate` imports from domain code. Replace with interfaces defined in domain, implemented in infrastructure.

**Related Rules:** Strict dependency rule enforcement (05-rules.md)

---

### Anti-Pattern 2: Use Case Calls Eloquent

**Category:** Architecture

**Description:** Use case/application service directly calling Eloquent models and queries.

**Why It Happens:** Convenience — developer treating use case as just another service class.

**Warning Signs:** `User::where('active', true)->get()` inside a use case class.

**Why Is It Harmful:** Use cases become coupled to Eloquent ORM. Cannot test use case without database. Changes to persistence affect application logic.

**Preferred Alternative:** Use cases depend on repository interfaces, not concrete Eloquent implementations.

**Refactoring Strategy:** Introduce repository interface in domain layer. Implement with Eloquent in infrastructure. Inject into use case.

**Related Rules:** Use cases depend on abstractions, not concrete persistence (05-rules.md)

---

### Anti-Pattern 3: Reversed Dependency Direction

**Category:** Architecture

**Description:** Interface defined in outer ring and implemented in inner ring.

**Why It Happens:** Misunderstanding of Dependency Inversion Principle — interface is placed where implementation lives.

**Warning Signs:** Infrastructure package defines interface; domain package imports infrastructure interface.

**Why Is It Harmful:** Inner ring must import outer ring package to implement interface. Direction of dependency is outward → violates Clean Architecture.

**Preferred Alternative:** Interfaces are owned by and defined in the layer that uses them (inner ring).

**Refactoring Strategy:** Move interface definition to domain layer. Outer ring implements the domain-defined interface.

**Related Rules:** Define interfaces in the layer that uses them (05-rules.md)

---

### Anti-Pattern 4: Boundary Objects Coupled to Framework

**Category:** Architecture

**Description:** Data Transfer Objects crossing architecture boundaries contain framework-specific code.

**Why It Happens:** DTOs extend Laravel's `Model`, use validation traits, or include serialization logic.

**Warning Signs:** DTO `extends Model`; DTO with validation rules; DTO casts data using framework helpers.

**Why Is It Harmful:** Crossing boundaries with framework-coupled objects breaks layer isolation. Changes to framework serialization affect domain data.

**Preferred Alternative:** Use plain PHP objects (POPOs) for boundary crossing. No framework dependencies.

**Refactoring Strategy:** Create plain PHP DTOs. Convert between framework objects and DTOs at boundaries.

**Related Rules:** Boundary objects must be framework-independent (05-rules.md)

---

### Anti-Pattern 5: Over-Compartmentalizing

**Category:** Architecture

**Description:** Creating full Clean Architecture structure for simple CRUD operations.

**Why It Happens:** "Best practice" applied without considering operation complexity.

**Warning Signs:** Every CRUD operation has: interface, use case, DTO, presenter, repository interface, repository implementation — all for simple field updates.

**Why Is It Harmful:** Massive boilerplate for operations that don't benefit from abstraction. Development velocity drops. Team resents the architecture.

**Preferred Alternative:** Use simpler patterns for CRUD operations. Reserve Clean Architecture for complex business rules.

**Refactoring Strategy:** Collapse CRUD operations to simple service → model. Keep Clean Architecture only for operations with real business logic.

**Related Rules:** Apply Clean Architecture selectively based on complexity (05-rules.md)

---

### Anti-Pattern 6: Anemic Entities

**Category:** Domain Modeling

**Description:** Entities defined in Clean Architecture's innermost ring contain only data, no behavior.

**Why It Happens:** Developers define entities before understanding behavior; entities treated as database schemas.

**Warning Signs:** Entity classes with only properties, getters, setters; all business logic in use cases.

**Why Is It Harmful:** Entities become data structures. Use cases duplicate behavioral logic. Domain model loses value of encapsulation.

**Preferred Alternative:** Entities encapsulate behavior related to their state. Business rules live on the entity.

**Refactoring Strategy:** Move behavioral methods onto entities (e.g., `order.submit()` instead of `OrderSubmitter::run($order)`).

**Related Rules:** Entities should encapsulate behavior (05-rules.md)
