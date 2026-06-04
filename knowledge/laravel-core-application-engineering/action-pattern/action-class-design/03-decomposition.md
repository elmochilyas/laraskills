# Decomposition: Action Class Design

## Topic Overview
Action class structure and design principles — single-method classes that encapsulate exactly one business operation, implementing the Command pattern within the Laravel ecosystem.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
action-class-design/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action Class Design
- **Purpose:** Action class structure and design principles — single-method classes, constructor injection, parameter strategies, and the command pattern within Laravel.
- **Difficulty:** Intermediate
- **Dependencies:** Service Container Basics, Dependency Injection

## Dependency Graph
This KU depends on: Service Container Basics, Dependency Injection. It serves as prerequisite for all other action-pattern KUs.

## Boundary Analysis
**In scope:** Action class structure, single public method contract, constructor vs method injection, parameter strategies (array/DTO/individual), immutability via `final readonly`, method naming conventions (`handle`/`execute`/`__invoke`), container resolution mechanics.

**Out of scope:** Composition between actions (action-composition KU), naming conventions (action-naming-conventions KU), testing strategies (action-testing KU), Use Case variant (use-case-variant KU), queued dispatch (queued-actions KU).

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization