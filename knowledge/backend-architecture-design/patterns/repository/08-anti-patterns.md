# Repository — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Repository (Fowler) in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Repository Mirroring Eloquent Exactly | High |
| 2 | Repository Returning Eloquent Models | Critical |
| 3 | Generic Repository Interface | Medium |
| 4 | Repository for Every Model | High |
| 5 | Repository Methods Returning Different Types Conditionally | Medium |

---

## 1. Repository Mirroring Eloquent Exactly

### Category
Architecture

### Description
Creating a repository that mirrors every Eloquent method (`find()`, `findOrFail()`, `all()`, `where()`, `create()`, `update()`), providing no abstraction benefit — just wrapping.

### Why It Happens
Developers use Repository pattern without understanding its purpose: abstracting storage, not recreating ORM methods.

### Warning Signs
- Repository has 20+ methods mirroring Eloquent
- Each method just delegates to Eloquent
- No additional behavior in repository
- Repository provides no abstraction value

### Why Harmful
The repository adds code and indirection without benefit. Developers must maintain both Eloquent and repository interfaces. Changes to Eloquent require repository changes.

### Consequences
- Code bloat without benefit
- Double maintenance (Eloquent + repository)
- No actual abstraction
- Developer frustration with unnecessary layer

### Alternative
Define repository interfaces based on domain needs (e.g., `findActiveUsers()`, `getRecentOrders()`), not Eloquent methods. Only add methods the domain actually needs.

### Refactoring Strategy
1. Identify Eloquent-mirroring methods
2. Replace with domain-specific methods
3. Remove unused generic pass-through methods
4. Add abstraction value: result transformation, caching, filtering

### Detection Checklist
- [ ] Compare repository methods to Eloquent API
- [ ] Evaluate abstraction value
- [ ] Check method count for unnecessary delegation

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Repository, Domain-Driven Design

---

## 2. Repository Returning Eloquent Models

### Category
Architecture

### Description
Repository returns Eloquent model instances, coupling the domain layer to Eloquent and defeating the purpose of the repository abstraction.

### Why It Happens
The repository wraps Eloquent and returns model instances directly, which is the simplest implementation.

### Warning Signs
- Repository return types are Eloquent models
- Domain layer depends on Eloquent features
- Switching storage requires changing domain code
- Repository doesn't decouple domain from ORM

### Why Harmful
The domain layer should not depend on the ORM. If the repository returns Eloquent models, the domain inherits all Eloquent coupling (ActiveRecord behavior, framework base class).

### Consequences
- Domain coupled to Eloquent
- Cannot switch storage without domain changes
- Domain objects carry unused Eloquent features
- Testing requires Eloquent setup

### Alternative
Repository returns domain objects (plain PHP objects), not Eloquent models. Map between Eloquent and domain models inside the repository.

### Refactoring Strategy
1. Create domain model (plain PHP) classes
2. Add mapping between Eloquent and domain models
3. Update repository to return domain models
4. Update consumers to work with domain models
5. Remove Eloquent dependencies from domain layer

### Detection Checklist
- [ ] Check repository return types
- [ ] Verify domain layer has no Eloquent imports
- [ ] Confirm domain model independence

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Repository, Domain Model
- Decision Trees: Repository vs Eloquent

---

## 3. Generic Repository Interface

### Category
Architecture

### Description
Using a single generic repository interface (`RepositoryInterface<T>`) with `find()`, `all()`, `create()`, `update()`, `delete()` for all entities, violating Interface Segregation Principle.

### Why It Happens
Generic repository tutorials are common. Teams implement this pattern without considering ISP.

### Warning Signs
- Single `RepositoryInterface` for all entities
- Every entity has `find()`, `all()`, `create()`, `update()`, `delete()`
- Methods that don't apply (e.g., `delete()` on immutable entities)
- PHPStan/IDE complaining about `@template` annotations

### Why Harmful
Clients depend on methods they don't use. PHP generics are limited and poorly supported. Changes to the generic interface affect all implementations.

### Consequences
- ISP violation
- Methods that don't apply must throw or be empty
- PHP generics limitations cause issues
- Broad interface change impact

### Alternative
Use specific interfaces per aggregate root: `UserRepository` with `findByEmail()`, `OrderRepository` with `findRecentByUser()`. Each interface matches domain needs.

### Refactoring Strategy
1. Replace generic interface with specific interfaces
2. Define domain-relevant methods per interface
3. Remove unused generic methods
4. Implement each specific interface

### Detection Checklist
- [ ] Check for generic repository pattern
- [ ] Verify ISP compliance
- [ ] Review each entity's repository needs

### Related Rules/Skills/Trees
- Rules: Enforce Boundaries via Automation
- Skills: Repository, Interface Segregation
- Decision Trees: Repository Pattern Choice

---

## 4. Repository for Every Model

### Category
Architecture

### Description
Creating a repository for every Eloquent model, including lookup tables, pivot tables, and simple CRUD entities that don't need abstraction.

### Why It Happens
Consistency-driven development. If some models have repositories, all models get repositories.

### Warning Signs
- Repository for status, category, and type tables
- Repository methods doing nothing but pass-through
- Simple CRUD tables with repository layers
- Repository removal debated because "inconsistent"

### Why Harmful
Unnecessary repositories add code, indirection, and maintenance burden without providing abstraction value.

### Consequences
- Code bloat
- Unnecessary indirection
- More files to maintain
- Developer frustration

### Alternative
Only use Repository for complex domains where storage abstraction matters. Use Eloquent directly for simple CRUD and lookup tables.

### Refactoring Strategy
1. Identify unnecessary repositories
2. Remove repository for simple tables
3. Use Eloquent directly in controllers
4. Document where repository is vs isn't used

### Detection Checklist
- [ ] Evaluate each repository's necessity
- [ ] Assess entity complexity and domain value
- [ ] Review repository code for pass-through methods

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Repository, Eloquent ORM
- Decision Trees: Repository Pattern Choice

---

## 5. Repository Methods Returning Different Types Conditionally

### Category
Architecture

### Description
Repository methods that return different types (model, collection, null, array, bool) based on conditions or parameters, making the API unpredictable.

### Why It Happens
Adding convenience parameters or handling edge cases inside the repository without clear contracts.

### Warning Signs
- Repository methods returning multiple possible types
- `@return User|Collection|null` type annotations
- Conditional returns based on parameters
- Callers checking return type before using

### Why Harmful
Unpredictable return types make the repository API confusing. Callers must handle multiple return paths, increasing complexity.

### Consequences
- API confusion
- Caller-side type checking
- Error-prone usage
- Hard to refactor

### Alternative
Each method should return a single, clear type. Use separate methods for different operations (`findUser()`, `findUsers()`, `userExists()`).

### Refactoring Strategy
1. Identify conditional return types
2. Split into separate methods
3. Define clear return type per method
4. Update callers

### Detection Checklist
- [ ] Review repository return type annotations
- [ ] Check for conditional returns
- [ ] Verify single-return-type compliance

### Related Rules/Skills/Trees
- Skills: Repository, API Design
- Decision Trees: Repository Method Design
