# Decomposition: Dependency Injection in Controllers

## Topic Overview
Constructor vs method injection in controllers — ResolvesRouteDependencies algorithm, alreadyInParameters check, route parameter priority, and the universal heuristic for where to inject.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
dependency-injection/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Dependency Injection in Controllers
- **Purpose:** Constructor vs method injection in controllers — ResolvesRouteDependencies mechanics, route parameter priority, and injection placement decisions.
- **Difficulty:** Intermediate
- **Dependencies:** Service Container Basics

## Dependency Graph
This KU depends on: Service Container Basics. It builds on controller-architecture and serves as prerequisite for controller-testing.

## Boundary Analysis
**In scope:** Constructor injection mechanics, method injection mechanics, ResolvesRouteDependencies algorithm, alreadyInParameters check, route parameter priority over container, enum method injection, contextual attribute injection, service-constructor-request-method pattern, mixed injection (lazy service), constructor vs method tradeoffs.

**Out of scope:** General service container internals (Service Container Basics KU), controller dispatch lifecycle (controller-architecture KU), route model binding specifics (Route Model Binding KU), mocking in tests (controller-testing KU).

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