# Decomposition: Thin Controller Principle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** CRUD Architecture
- **Knowledge Unit:** Thin Controller Principle
- **Difficulty Level:** Foundation

## Topic Overview
Controllers handle only HTTP concerns — extract input, delegate to lower layers, return responses. No business logic, database queries, or domain decisions in controllers.

## Decomposition Strategy
This KU is atomic — the principle is a single, well-bounded architectural rule with clear enforcement criteria and a single direction (extract logic from controllers).

## Proposed Folder Structure
```
thin-controller-principle/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Thin Controller Principle
- **Purpose:** Define the boundary between HTTP handling and business logic
- **Difficulty:** Foundation
- **Dependencies:** Laravel Routing, Service Container

## Atomic Chunks

### Chunk 1: What Makes a Controller "Thin"
- **Topics:** Three responsibilities (extract, delegate, respond), separation from business logic
- **Key Content:** Controller as glue layer, not decision-maker
- **Learning Objectives:** Identify business logic that has leaked into a controller

### Chunk 2: Fat Controller Recognition
- **Topics:** Signals of fat controllers — inline queries, conditionals, mailing, event dispatching
- **Key Content:** Code review checklist for controller bloat
- **Learning Objectives:** Refactor a fat controller into thin controller + service/action

### Chunk 3: Delegation Targets
- **Topics:** Actions, services, DTOs, FormRequests as controller dependencies
- **Key Content:** Where logic goes when it leaves the controller
- **Learning Objectives:** Choose the correct delegation target for extracted logic

### Chunk 4: Testing Thin Controllers
- **Topics:** HTTP tests for thin controllers, unit tests for extracted logic
- **Key Content:** Thin controllers make tests focused on HTTP concerns
- **Learning Objectives:** Write HTTP tests that verify routing, status codes, and response shapes

## Dependency Graph
This KU serves as the foundational principle for all other CRUD Architecture KUs. Every flow pattern (Controller→DTO→Action, Controller→DTO→Service, Controller→Service→Repository) depends on this principle.

## Boundary Analysis
**In scope:** Controller responsibilities, fat controller signals, delegation targets, testing strategy.
**Out of scope:** Specific implementation of actions (covered in Action Class Design), service patterns (covered in Service Class Design), DTO patterns (covered in DTO-related KUs).

## Future Expansion Opportunities
None — the thin controller principle is well-established and stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization