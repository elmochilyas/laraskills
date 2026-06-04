# Decomposition: Enum Binding

## Topic Overview
Auto-resolving backed enums from route parameters — converting raw URL segments to typed enum instances via `tryFrom()`.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
enum-binding/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Enum Binding
- **Purpose:** Auto-resolving backed enums from route parameters
- **Difficulty:** Advanced
- **Dependencies:** Route Definition

## Dependency Graph
This KU depends on: Route Definition. It serves as prerequisite for advanced route constraint patterns.

## Boundary Analysis
**In scope:** Backed enum resolution via tryFrom(), string-backed vs int-backed support, resolution order in implicit binding (enums before models), route ordering sensitivity (no regex constraint), BackedEnumCaseNotFoundException, whereIn() workaround for route ordering, enum stability in production.
**Out of scope:** Model resolution (implicit/explicit binding KUs), PHP 8.1 enum language features (PHP domain), custom route validation rules (Form Requests & Validation domain).

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