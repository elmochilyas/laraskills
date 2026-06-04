# Decomposition: Terminable Middleware

## Topic Overview
Post-response middleware execution — terminate() contract, new-instance-for-terminate design, singleton registration for state sharing, and comparison vs dispatch()->afterResponse().

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
terminable-middleware/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Terminable Middleware
- **Purpose:** Post-response middleware execution — terminate() contract, singleton registration for state sharing, and deferred execution patterns.
- **Difficulty:** Advanced
- **Dependencies:** Custom Middleware, Middleware Lifecycle

## Dependency Graph
This KU depends on: Custom Middleware, Middleware Lifecycle. It serves as prerequisite for middleware-testing, cross-cutting-concerns.

## Boundary Analysis
**In scope:** terminate() contract (Request, Response, void), execution timing (after response sent), new-instance-for-terminate design, singleton registration for state sharing, Kernel::terminate() mechanics, logging pattern, performance metrics pattern, cleanup task pattern, terminable vs dispatch()->afterResponse() comparison, non-terminable server configurations (RoadRunner, Swoole), singleton vs non-singleton decision.

**Out of scope:** Custom middleware handle() contract (custom-middleware KU), queue worker architecture (Queue System KU), general pipeline lifecycle (middleware-lifecycle KU), Octane-specific event listeners.

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