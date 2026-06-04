# Action Classes — Decomposition

## Metadata
- **Domain:** Application Architecture Patterns
- **Subdomain:** Layered Architecture Patterns
- **Knowledge Unit:** LAP-15-action-classes
- **Last Updated:** 2026-06-04

---

## Topic Overview
Action classes as lightweight, single-method invocable classes for isolated business operations, filling the gap between inline controller logic and full Use Case classes.

---

## Decomposition Strategy
The topic splits by (1) Action definition — invocable contract, single responsibility, statelessness, naming conventions; (2) Action patterns — direct route binding, DTO integration, testing; (3) Action vs Use Case vs Service decision framework — when to choose which pattern based on operation complexity and orchestration needs. This avoids overlapping with Use Case topics by clearly positioning Actions as the lighter-weight alternative for simpler operations.

---

## Proposed Folder Structure
```
02-layered-architecture-patterns/LAP-15-action-classes/
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
| Action Classes | Single-method invocable business operations | Intermediate | PHP __invoke(), Route binding |
| Action Definition | final readonly, __invoke(), statelessness | Intermediate | Action Classes |
| Direct Route Binding | Route to Action without controllers | Intermediate | Route-to-Class binding |
| Action with DTOs | Input/output contracts for Actions | Intermediate | DTO Design |
| Action Testing | Unit testing Actions in isolation | Intermediate | PHPUnit/Pest |
| Action vs Use Case | Complexity-based pattern selection | Intermediate | Use Case Classes |

---

## Dependency Graph
```
Controller Thinning → Action Classes
                      ├── Direct Route Binding → Route::post('/path', Action::class)
                      ├── DTO Integration → Input/Output DTOs
                      ├── Testing → Mocked dependencies
                      └── Action vs Use Case ← Complexity determines choice
```

---

## Boundary Analysis
**In scope**: Action class definition (invocable, single responsibility, stateless), constructor dependency injection (1-3 dependencies), direct route binding, DTO input/output contracts, testing without HTTP bootstrap, naming conventions, size guidelines (< 30 lines, < 4 deps), Octane safety, Action vs Use Case decision framework.

**Out of scope**: Use Case orchestration details (multi-step, transaction management), Service class multi-method design, Full CQRS command/query handling, generic invocable controller patterns, Event handler actions.

---

## Future Expansion Opportunities
- Action batch and transaction wrappers
- Action middleware pipeline (before/after hooks)
- Automatic Action discovery and registration
- Action monitoring and metrics (success/failure rates)
- Action authorization patterns
