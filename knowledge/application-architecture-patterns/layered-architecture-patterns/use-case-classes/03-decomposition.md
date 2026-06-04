# Use Case Classes — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-11-use-case-classes
- **Last Updated:** 2026-06-04

---

## Topic Overview
Use Case classes as the application layer in Clean/Hexagonal Architecture, encapsulating business operations into single-purpose classes with explicit orchestration, transaction management, and DTO contracts.

---

## Decomposition Strategy
The topic splits by (1) Use Case definition — single public method contract, naming conventions, layer placement; (2) orchestration mechanics — dependency injection, transaction management, result handling; (3) relationship to other layers — controller, domain, repository integration; (4) Use Case vs Action/Service decision framework. This avoids overlapping with DTO topics by assuming DTOs are the input/output mechanism without detailing their implementation.

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-11-use-case-classes/
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
| Use Case Classes | Application layer operation encapsulation | Advanced | Dependency Rule, Domain Layer |
| Use Case Definition | Single public method, naming, placement | Advanced | Use Case Classes |
| Orchestration Mechanics | DI, transactions, result DTOs | Advanced | Use Case Definition |
| Use Case Testing | Unit testing without HTTP kernel | Advanced | DTO Design |
| Use Case vs Action | Decision framework for operation complexity | Advanced | Action Classes |

---

## Dependency Graph
```
Clean Architecture → Dependency Rule → Use Case Classes
                                        ├── Orchestration → Domain Objects + Repositories + DTOs
                                        ├── Transaction Management → DB::transaction()
                                        └── Testing → Mocked Ports + Input/Output DTOs
```

---

## Boundary Analysis
**In scope**: Use Case definition (single public method, business-named), orchestration logic (not business logic), constructor dependency injection, transaction boundary management, input/output DTO contracts, framework independence, invocable route binding, testing without HTTP bootstrap, comparison with Actions and Services.

**Out of scope**: DTO implementation details, Domain object design, Repository interface design, Controller design patterns, Laravel Service Container mechanics, generic SOLID principles.

---

## Future Expansion Opportunities
- Use Case monitoring and metrics per operation
- Use Case authorization patterns
- Use Case validation pipeline (before/after hooks)
- Use Case event recording for audit trails
- Automatic Use Case discovery and registration
