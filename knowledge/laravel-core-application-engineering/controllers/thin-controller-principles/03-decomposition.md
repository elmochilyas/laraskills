# Decomposition: Thin Controller Principles

## Topic Overview
Keeping controllers lean by delegating — the delegation chain (FormRequest, Service/Action, Response), line count guidelines, what does not belong in controllers, and the fat service anti-pattern.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
thin-controller-principles/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Thin Controller Principles
- **Purpose:** Keeping controllers lean by delegating to services and actions — the delegation chain, line count guidelines, and architectural boundaries.
- **Difficulty:** Advanced
- **Dependencies:** Controller Architecture, Service Layer

## Dependency Graph
This KU depends on: Controller Architecture, Service Layer. It integrates with single-action-controllers and controller-organization.

## Boundary Analysis
**In scope:** Delegation chain (accept, delegate, respond), what does NOT belong in controllers (queries, business logic, validation, formatting, side effects), line count guidelines (5-15 lines), three-act controller method, framework enablers (FormRequests, method injection, route model binding), canonical thin controller pattern, thin resource controller pattern, thin single-action controller pattern, fat service anti-pattern, when thin controllers are over-engineering.

**Out of scope:** Specific service/action pattern details (separate KUs), Form Request design (form-requests-validation KU), API Resource response formatting (api-resources KU).

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