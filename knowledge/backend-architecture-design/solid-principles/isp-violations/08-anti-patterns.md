# Anti-Patterns: SOLID Principles — ISP Violations

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Design Patterns & Principles |
| **Topic** | SOLID principles in PHP: ISP violations |
| **Difficulty** | Foundation |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | solid-principles |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Fat Repository Interface | Architecture | High |
| 2 | Interface Explosion | Design | Medium |
| 3 | Technology-Named Interfaces | Design | Medium |
| 4 | Depending on Concrete Classes | Architecture | High |

## Repository-Wide Anti-Patterns

- **Monolithic Repository Interface**: Single interface with find/save/delete/search/export forcing implementors to throw for irrelevant methods
- **Method-per-Class Interfaces**: One interface per method creating navigation overhead without value
- **Implementation-Named Interfaces**: Interfaces named after implementations rather than client roles

---

## 1. Fat Repository Interface

**Category:** Architecture

**Description:** Creating a single, large repository interface with methods for finding, saving, deleting, searching, exporting, and reporting — forcing every implementation to define all methods even if irrelevant.

**Why It Happens:** Java/JPA conventions in PHP projects. Teams define one "Repository" interface and implement it everywhere without considering that different clients need different subsets.

**Warning Signs:**
- Repository interface with 10+ methods
- Implementations throw `NotImplementedException` for some methods
- Read-only repositories with `save()` and `delete()` methods

**Why Harmful:** Every implementation must provide all methods, even if inappropriate. Read-only repositories have meaningless save/delete, and reporting repositories have meaningless CRUD operations.

**Consequences:**
- Implementations with throwing or empty methods (LSP violation)
- Interface changes force changes in all implementations
- Unclear which clients use which methods

**Alternative:** Split into focused interfaces by client role — `ReadableRepository`, `WritableRepository`, `SearchableRepository`, `ExportableRepository`.

**Refactoring Strategy:**
1. Identify method groups in the fat interface
2. Group methods by client need (read, write, search, export)
3. Create separate interfaces per group
4. Implement only relevant interfaces per class

**Detection Checklist:**
- [ ] Does the interface have methods that some implementations can't support?
- [ ] Are there `NotImplementedException` throws in implementations?
- [ ] Can you group methods by distinct client needs?

**Related Rules/Skills/Trees:**
- Rule: Split Interfaces by Client Role (`04-standardized-knowledge.md:14-15`)

---

## 2. Interface Explosion

**Category:** Design

**Description:** Creating one interface per method, resulting in an unmanageable number of interfaces that fragments the codebase.

**Why It Happens:** Overcorrection from seeing fat interfaces. Teams create extremely granular interfaces without considering whether they serve distinct client needs.

**Warning Signs:**
- Interfaces with single methods
- Classes implementing 5+ interfaces
- Most interfaces have exactly one implementation

**Why Harmful:** Interface explosion increases cognitive load — developers must learn and navigate many interfaces. Constructor injection lists grow, and finding the right interface becomes work.

**Consequences:**
- Constructor injection with 5+ interface dependencies
- Navigation overhead finding interface files
- Team resistance to interfaces as a concept

**Alternative:** Group related methods into cohesive interfaces of 2-5 methods. A client need typically involves multiple related operations.

**Refactoring Strategy:**
1. Identify interfaces with single methods always used together
2. Merge them into cohesive interfaces
3. Aim for 2-5 methods per interface

**Detection Checklist:**
- [ ] Are there interfaces with exactly 1 method?
- [ ] Are multiple interfaces always injected together?
- [ ] Interface-to-class ratio higher than 2:1?

**Related Rules/Skills/Trees:**
- Rule: Aim for 2-5 Methods Per Interface (`04-standardized-knowledge.md:42-43`)

---

## 3. Technology-Named Interfaces

**Category:** Design

**Description:** Naming interfaces after an implementation technology (MySQL, Redis, Stripe) instead of the client's role, coupling the abstraction to infrastructure details.

**Why It Happens:** Interfaces are created during extraction from a specific implementation. The interface name reflects the original technology.

**Warning Signs:**
- Interface names like `MySQLPaymentGateway`, `RedisCacheInterface`
- Interface in the infrastructure namespace, not domain
- All implementations use the same technology

**Why Harmful:** Technology-named interfaces violate DIP — the interface is owned by infrastructure, not domain. If you switch from MySQL to PostgreSQL, the interface name is misleading.

**Consequences:**
- Interface naming tied to specific infrastructure
- Domain code depends on infrastructure-named interfaces
- Rename required when technology changes

**Alternative:** Name interfaces by role — `PaymentGateway`, `CacheStore`, `DocumentRepository`. Put them in the domain layer, not infrastructure.

**Refactoring Strategy:**
1. Identify technology-named interfaces
2. Rename to role-based names
3. Move interface files to the domain layer

**Detection Checklist:**
- [ ] Are interfaces named after implementation technology?
- [ ] Are interfaces in the infrastructure namespace?
- [ ] Would the name still be correct after a technology change?

**Related Rules/Skills/Trees:**
- Rule: Name Interfaces by Client Role (`04-standardized-knowledge.md:14-15`)

---

## 4. Depending on Concrete Classes

**Category:** Architecture

**Description:** Depending directly on concrete implementations instead of interfaces, coupling clients to specific infrastructure and preventing substitution.

**Why It Happens:** Direct instantiation is simpler. Dependency injection adds indirection that seems unnecessary for "stable" dependencies.

**Warning Signs:**
- `new ServiceClass()` in business logic
- Facades in domain services
- Static method calls to infrastructure classes
- No interfaces for external dependencies

**Why Harmful:** Concrete coupling makes testing difficult (hard to mock), prevents substitution (can't swap implementations), and ties domain logic to infrastructure details.

**Consequences:**
- Tests must boot the full framework
- Unable to swap implementations without editing domain code
- Domain logic depends on framework details

**Alternative:** Program to interfaces. Inject dependencies via constructor. Use the service container for wiring.

**Refactoring Strategy:**
1. Extract interfaces for dependencies used in domain services
2. Replace `new` with constructor injection
3. Register bindings in the service container

**Detection Checklist:**
- [ ] Do domain services depend on concrete classes?
- [ ] Are there `new` or `::` static calls in business logic?
- [ ] Can dependencies be substituted without editing domain code?

**Related Rules/Skills/Trees:**
- Rule: Program to Interfaces, Not Implementations (`04-standardized-knowledge.md:14-15`)
