# Decomposition: REST Purity vs Pragmatic

## Topic Overview
The tension between strict REST constraint adherence and pragmatic design decisions that deviate from REST for productivity, client convenience, or operational concerns.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a design philosophy tension with clear decision frameworks and deviation criteria. No further decomposition is needed.

## Proposed Folder Structure
```
rest-purity-vs-pragmatic/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### REST Purity vs Pragmatic
- **Purpose:** Guide the balance between REST constraint adherence and practical deviations
- **Difficulty:** Intermediate
- **Dependencies:** REST Architectural Constraints, REST Maturity Model, Resource vs Action Orientation

## Dependency Graph
This KU depends on: REST Architectural Constraints, REST Maturity Model, Resource vs Action Orientation. It serves as prerequisite for API Lifecycle Governance, API Style Guide Creation.

## Boundary Analysis
**In scope:** Purity vs pragmatism spectrum, decision framework for deviations, common deviation areas (HATEOAS, methods, URLs, status codes), cost of deviation assessment, Laravel patterns for pure and pragmatic implementations, deviation documentation.
**Out of scope:** Specific HTTP method mechanics (http-method-semantics KU), HATEOAS implementation details (hateoas-hypermedia-controls KU), URL structure patterns (url-structure-design KU).

## Future Expansion Opportunities
None identified — the topic is well-bounded as a design philosophy guide.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization