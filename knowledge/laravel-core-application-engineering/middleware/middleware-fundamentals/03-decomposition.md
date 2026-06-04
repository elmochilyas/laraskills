# Decomposition: Middleware Fundamentals

## Topic Overview
Middleware purpose and pipeline pattern — the Pipeline pattern via array_reduce, two-pass execution model (inbound/outbound), global vs route pipeline, and the handle() contract.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
middleware-fundamentals/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Middleware Fundamentals
- **Purpose:** Middleware purpose and pipeline pattern — the Pipeline pattern, two-pass execution model, global vs route pipeline architecture.
- **Difficulty:** Foundation
- **Dependencies:** Routing

## Dependency Graph
This KU depends on: Routing. It serves as prerequisite for all other middleware KUs.

## Boundary Analysis
**In scope:** Pipeline pattern via array_reduce, two-pass execution (pre/post processing), global vs route pipeline distinction, Kernel's two-pipeline architecture, Pipeline::then() vs thenReturn(), short-circuit pattern, pre/post/combined middleware patterns, container resolution per middleware, middleware as cross-cutting concern layer.

**Out of scope:** Middleware lifecycle details (middleware-lifecycle KU), registration tiers (global-route-group-middleware KU), custom middleware creation (custom-middleware KU), specific middleware implementations (auth, throttle, etc.).

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