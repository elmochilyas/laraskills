# Anti-Patterns: SOLID Principles — DIP Violations

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Design Patterns & Principles |
| **Topic** | SOLID principles in PHP: DIP violations |
| **Difficulty** | Foundation |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | solid-principles |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Domain Depends on Infrastructure | Architecture | High |
| 2 | Infrastructure-Owned Interface | Architecture | High |
| 3 | Framework Coupling in Domain | Architecture | High |
| 4 | Facade in Business Logic | Design | Medium |
| 5 | Over-Abstraction (YAGNI) | Design | Medium |

## Repository-Wide Anti-Patterns

- **Eloquent in Domain**: Eloquent model dependencies in domain services and business logic
- **Wrong-Ownership Interface**: Interfaces defined in infrastructure layer that domain code depends on
- **Illuminate Coupling**: Domain layer depending on Laravel's `Illuminate\Contracts` or facades

---

## 1. Domain Depends on Infrastructure

**Category:** Architecture

**Description:** Domain layer services depending directly on infrastructure classes — Eloquent models, HTTP clients, mail drivers, queue implementations.

**Why It Happens:** Laravel's convention is to use Eloquent everywhere. Domain services naturally import `App\Models\User` and call `$user->save()`.

**Warning Signs:**
- Domain services importing `App\Models\*`
- Domain services using `DB::`, `Mail::`, `Queue::` facades
- Domain services calling `save()`, `delete()` on models

**Why Harmful:** The domain layer should have zero infrastructure dependencies. Infrastructure coupling means database changes, mail provider changes, or queue backend changes all affect domain logic.

**Consequences:**
- Domain logic tied to specific ORM
- Cannot test domain without database
- Infrastructure changes propagate to domain code

**Alternative:** Define repository interfaces in the domain. Implement them in infrastructure. Domain services depend only on domain interfaces.

**Refactoring Strategy:**
1. Extract a repository interface in the domain layer
2. Move persistence logic to infrastructure implementation
3. Inject repository interface into domain services
4. Replace `$model->save()` with `$this->repository->save($entity)`

**Detection Checklist:**
- [ ] Do domain services import Eloquent models?
- [ ] Do domain services call persistence methods directly?
- [ ] Can domain services be tested without a database?

**Related Rules/Skills/Trees:**
- Rule: Domain Layer Must Not Depend on Infrastructure (`04-standardized-knowledge.md:13-14`)

---

## 2. Infrastructure-Owned Interface

**Category:** Architecture

**Description:** Interfaces that domain code depends on are defined and owned by the infrastructure layer, violating the direction of dependency.

**Why It Happens:** When extracting an interface from an implementation class, it's natural to keep it in the same directory. The interface ends up in the infrastructure layer.

**Warning Signs:**
- Interface files in `App\Infrastructure` or `App\Services` namespaces
- Domain classes importing infrastructure-namespaced interfaces
- Changing the interface requires infrastructure layer changes

**Why Harmful:** DIP states abstractions should be owned by the high-level module. Infrastructure-owned interfaces mean domain depends on infrastructure through the interface definition.

**Consequences:**
- Infrastructure changes force domain interface changes
- Domain still couples to infrastructure namespace
- Cannot substitute infrastructure without touching domain-owned interfaces

**Alternative:** Define interfaces in the domain layer (or application layer) where they're consumed. Infrastructure implements them.

**Refactoring Strategy:**
1. Move interface files to domain/application layer
2. Update namespace and imports
3. Infrastructure implementations import the domain-interface

**Detection Checklist:**
- [ ] Are interfaces consumed by domain defined in infrastructure?
- [ ] Do domain files import infrastructure namespaces?
- [ ] Would changing infrastructure require editing domain interface files?

**Related Rules/Skills/Trees:**
- Rule: Interfaces Belong in the Layer That Consumes Them (`04-standardized-knowledge.md:75-76`)

---

## 3. Framework Coupling in Domain

**Category:** Architecture

**Description:** Domain layer depending on Laravel framework contracts (`Illuminate\Contracts\*`), facades, or base classes.

**Why It Happens:** Laravel provides convenient contracts and facades. Using them in domain services is the default pattern in many Laravel tutorials.

**Warning Signs:**
- Domain files importing `Illuminate\Contracts\*`
- Domain services using `\Cache`, `\DB`, `\Mail` facades
- Domain classes extending Laravel base classes

**Why Harmful:** Framework coupling ties domain logic to Laravel specifically. Upgrading Laravel, switching frameworks, or extracting the domain for a different context requires domain changes.

**Consequences:**
- Locked into Laravel ecosystem
- Framework upgrades risk breaking domain logic
- Domain logic not portable to other contexts (queue workers, CLI, tests)

**Alternative:** Define application-specific interfaces for framework services. Use adapter pattern to bridge Laravel contracts to domain interfaces.

**Refactoring Strategy:**
1. Identify `Illuminate\Contracts` usage in domain
2. Define domain-specific interfaces for those services
3. Create adapter implementations in infrastructure that wrap Laravel contracts
4. Register domain interfaces with adapter implementations in the container

**Detection Checklist:**
- [ ] Do domain files import `Illuminate\*` namespaces?
- [ ] Are facades used in domain services?
- [ ] Do domain classes extend Laravel base classes?

**Related Rules/Skills/Trees:**
- Rule: Domain Layer Must Be Framework-Agnostic (`04-standardized-knowledge.md:51-52`)

---

## 4. Facade in Business Logic

**Category:** Design

**Description:** Using Laravel facades directly in domain or application services, creating hidden static dependencies on framework infrastructure.

**Why It Happens:** Facades are convenient and idiomatic in Laravel. Their static API makes them easy to call anywhere.

**Warning Signs:**
- `\Cache::`, `\DB::`, `\Mail::`, `\Queue::` in service classes
- Facade calls in constructor or method bodies
- No constructor injection for dependencies that have facades

**Why Harmful:** Facades create hidden, untraceable dependencies. They can't be easily mocked or substituted without framework-specific tools. They also make the dependency graph invisible.

**Consequences:**
- Hidden coupling to Laravel's facade infrastructure
- Cannot substitute implementations without facade configuration
- Harder to track which services depend on which infrastructure

**Alternative:** Inject dependencies explicitly via constructor. Use type-hinted interfaces that are resolvable from the container.

**Refactoring Strategy:**
1. Identify facade calls in business logic
2. Extract the facade's contract as an interface
3. Inject the interface via constructor
4. Register the concrete implementation in the container

**Detection Checklist:**
- [ ] Are facades used outside of controllers/views?
- [ ] Are dependencies injected or resolved statically?
- [ ] Can dependencies be identified without reading method bodies?

**Related Rules/Skills/Trees:**
- Rule: Inject Dependencies, Don't Use Facades in Domain (`04-standardized-knowledge.md:76-77`)

---

## 5. Over-Abstraction (YAGNI)

**Category:** Design

**Description:** Creating interfaces for every class, including those with no expected variation, resulting in unnecessary indirection.

**Why It Happens:** "Best practice" advice to always program to an interface. Teams enforce interface-per-class as a rule without considering whether substitution is needed.

**Warning Signs:**
- Interface and implementation pairs where only one implementation exists
- No plans for alternative implementations
- Interface adds no value for testing (concrete class is already mockable)
- Developers complain about "ceremony" navigating interface files

**Why Harmful:** Each interface adds a file, a namespace, and indirection. The cost compounds across large codebases without delivering value when no substitution is needed.

**Consequences:**
- More files to maintain without benefit
- Navigation complexity from interface/implementation split
- Team frustration with architectural ceremony

**Alternative:** Create interfaces only when there are or will be multiple implementations, or when testing requires a seam. Start with concrete classes and extract interfaces when needed.

**Refactoring Strategy:**
1. Review interfaces with exactly one implementation
2. Assess whether a second implementation is realistically needed
3. If not, consider removing the interface and using the concrete class directly
4. Extract interface only when a second implementation is confirmed

**Detection Checklist:**
- [ ] Does the interface have exactly one implementation?
- [ ] Is substitution likely within the next 6 months?
- [ ] Does the interface simplify testing compared to mocking the concrete class?

**Related Rules/Skills/Trees:**
- Rule: Extract Interfaces Only When Variation Emerges (`04-standardized-knowledge.md:42-43`)
