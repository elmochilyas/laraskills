# Domain-Driven Design Tactical Patterns — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-06-domain-driven-design
- **Last Updated:** 2026-06-04

---

## Topic Overview
DDD tactical patterns for Laravel covers the five core building blocks of domain modeling — Entities, Value Objects, Aggregates, Domain Events, and Repositories — within the context of Clean/Hexagonal Architecture layering, with emphasis on framework independence and testability.

---

## Decomposition Strategy
The topic splits by tactical pattern (Entity, Value Object, Aggregate, Domain Event, Repository) plus the meta-pattern of Ubiquitous Language. Each pattern has its own mechanics, invariants, and mapping concerns. The decomposition avoids overlapping with general Clean Architecture topics by focusing on the tactical implementation details specific to Laravel's ecosystem (Eloquent mapping, Service Provider bindings, container resolution).

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-06-domain-driven-design/
├── 02-knowledge-unit.md
├── 03-decomposition.md
├── 04-standardized-knowledge.md
├── 05-rules.md
├── 06-skills.md
├── 07-decision-trees.md
├── 08-anti-patterns.md
└── 09-checklists.md
```

---

## Knowledge Unit Inventory
| Name | Purpose | Difficulty | Dependencies |
|------|---------|------------|--------------|
| DDD Tactical Patterns | Overview of all five tactical patterns in Laravel | Advanced | Clean Architecture, Dependency Rule |
| Entity Design | Identity tracking and behavior encapsulation | Advanced | Value Objects |
| Aggregate Design | Consistency boundaries and invariant enforcement | Advanced | Entities, Value Objects |
| Domain Events | Recording business occurrences and decoupling side effects | Advanced | Aggregates |
| Repository Design | Persistence abstraction for Aggregates | Advanced | Aggregates, Dependency Rule |
| Ubiquitous Language | Shared vocabulary between domain experts and developers | Foundation | None |

---

## Dependency Graph
```
Clean Architecture → Dependency Rule → DDD Tactical Patterns
                                         ├── Entity → Value Objects
                                         ├── Aggregate → Entities + Value Objects
                                         ├── Domain Events → Aggregate
                                         ├── Repository → Aggregate
                                         └── Ubiquitous Language → All patterns
```

---

## Boundary Analysis
**In scope**: Tactical pattern implementation in Laravel, framework-independent Domain layer, Repository interface definition, Aggregate consistency boundaries, Domain Event recording and dispatching, Eloquent mapping in Infrastructure, Ubiquitous Language documentation.

**Out of scope**: Strategic DDD (bounded contexts, context maps), Event Sourcing implementation, CQRS, Clean Architecture layering details, Laravel Service Container mechanics, generic PHP OOP patterns.

---

## Future Expansion Opportunities
- Advanced Aggregate design patterns for high-contention scenarios
- Domain Event sourcing and replay mechanics
- Repository testing strategies with in-memory implementations
- Ubiquitous Language glossary maintenance workflows
