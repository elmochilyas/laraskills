# Anti-Patterns: SOLID Principles — OCP Violations

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Design Patterns & Principles |
| **Topic** | SOLID principles in PHP: OCP violations |
| **Difficulty** | Foundation |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | solid-principles |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Switch/If-Else Chain | Architecture | High |
| 2 | Premature OCP Over-Engineering | Design | Medium |
| 3 | Open But Not Closed | Design | High |
| 4 | Leaky Strategy Selection | Architecture | Medium |

## Repository-Wide Anti-Patterns

- **Conditional Type Dispatch**: Switch/if-else chains on type fields that grow with each new variant
- **Premature Polymorphism**: Creating strategy interfaces and factories before a second implementation exists
- **Fragile Strategy Contracts**: Strategy interfaces that require modification when new variants are added

---

## 1. Switch/If-Else Chain

**Category:** Architecture

**Description:** Using switch statements or if-else chains on type/discriminator fields to select behavior, requiring modification of existing code for each new variant.

**Why It Happens:** Conditionals are the most straightforward way to handle type-based behavior. Adding a new case seems harmless.

**Warning Signs:**
- Switch statements on `$type`, `$status`, or `$provider`
- If-else chains with 4+ branches
- New features require adding cases to existing switch statements

**Why Harmful:** Every new variant requires modifying existing, tested code. This violates OCP directly and increases risk of breaking existing behavior.

**Consequences:**
- Existing branches break when new ones are added
- Test duplication — each branch's tests alongside the switch tests
- Code review bottlenecks — every new feature touches shared switch

**Alternative:** Use the Strategy pattern — define an interface and register implementations via the service container with tagged bindings.

**Refactoring Strategy:**
1. Identify the conditional on a type field
2. Extract each branch into a strategy class implementing a common interface
3. Register strategies via container tags
4. Replace switch with container-tagged strategy resolution

**Detection Checklist:**
- [ ] Are there switch/if-else chains on type fields?
- [ ] Do new features require editing existing switch statements?
- [ ] Are branches independently testable?

**Related Rules/Skills/Trees:**
- Rule: Replace Type Conditionals With Strategy Pattern (`04-standardized-knowledge.md:14-15`)

---

## 2. Premature OCP Over-Engineering

**Category:** Design

**Description:** Creating strategy interfaces, factories, and registries for behavior that has only one implementation and no foreseeable variants.

**Why It Happens:** Anticipating future needs. Teams apply OCP patterns to every class in case "we might need another implementation someday."

**Warning Signs:**
- Strategy interface with exactly one implementation
- Factory classes that return one concrete type
- No plans for alternative implementations

**Why Harmful:** Abstractions have a cost — more files, more indirection, more cognitive load. Premature abstraction makes code harder to understand without delivering value.

**Consequences:**
- Unnecessary complexity finding implementations
- Developers must navigate interfaces, implementations, and registrations
- YAGNI violation — the second implementation may never come

**Alternative:** Start with concrete classes. Only extract interfaces when a second implementation is actually needed or when testing requires it.

**Refactoring Strategy:**
1. Review interfaces with exactly one implementation
2. If no second implementation is planned, inline or remove the interface
3. Extract interface only when the second implementation is confirmed

**Detection Checklist:**
- [ ] Does the interface have exactly one implementation?
- [ ] Is a second implementation planned or likely?
- [ ] Does the abstraction reduce complexity or increase it?

**Related Rules/Skills/Trees:**
- Rule: Apply OCP Patterns Only When Variation Emerges (`04-standardized-knowledge.md:42-43`)

---

## 3. Open But Not Closed

**Category:** Design

**Description:** Strategy interfaces that require modification when a new variant is added — the interface itself violates OCP.

**Why It Happens:** Poor interface design. Interfaces are designed around current implementations rather than what clients need.

**Warning Signs:**
- Interface changes every time a new implementation is added
- New implementations require adding methods to the interface
- Some implementations throw `NotImplementedException` for interface methods

**Why Harmful:** If the interface changes with every variant, the abstraction provides no stability benefit. Every existing implementation must be updated.

**Consequences:**
- High maintenance cost for existing implementations
- Interface becomes bloated over time
- Violates ISP alongside OCP

**Alternative:** Design interfaces from the client's perspective, not the implementation's. Use multiple focused interfaces instead of one general-purpose interface.

**Refactoring Strategy:**
1. Identify methods that only some implementations need
2. Split into separate interfaces per client need
3. Use interface composition for implementations that need both

**Detection Checklist:**
- [ ] Does the interface change when new variants are added?
- [ ] Do implementations throw for methods they don't support?
- [ ] Is the interface designed from client perspective?

**Related Rules/Skills/Trees:**
- Rule: Design Interfaces From Client Perspective (`04-standardized-knowledge.md:14-15`)

---

## 4. Leaky Strategy Selection

**Category:** Architecture

**Description:** Strategy selection logic duplicated across the codebase instead of centralized in one place (registry, factory, or container).

**Why It Happens:** Convenience — each caller determines which strategy to use based on local context instead of routing through a central resolver.

**Warning Signs:**
- Switch/if-else on type repeated in multiple controllers or services
- Strategy selection logic in views or templates
- Changing strategy selection requires editing multiple files

**Why Harmful:** Duplicated selection logic means changes must be made in N places. Inconsistencies inevitably emerge, and bug fixes require finding all copies.

**Consequences:**
- Inconsistent strategy selection across the app
- Missed updates when selection logic changes
- Harder to add new strategies (must find all selection points)

**Alternative:** Centralize strategy selection in a registry, factory, or container tag resolution.

**Refactoring Strategy:**
1. Find all places where the strategy is selected
2. Create a central resolver (factory, registry) with tagged bindings
3. Replace all selection points with the resolver call

**Detection Checklist:**
- [ ] Is strategy selection code duplicated?
- [ ] Are there multiple switch statements for the same type?
- [ ] Is there a single source of truth for strategy resolution?

**Related Rules/Skills/Trees:**
- Rule: Centralize Strategy Selection (`04-standardized-knowledge.md:46-47`)
