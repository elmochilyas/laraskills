# Decomposition: Data Wrapping

## Topic Overview
Wrapping resource response data under a `data` key — controlled by $wrap property and the wrapping mechanism in the ResponseTrait.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
data-wrapping/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Data Wrapping
- **Purpose:** Wrapping resource response under a data key
- **Difficulty:** Intermediate
- **Dependencies:** Resource Fundamentals

## Dependency Graph
This KU depends on: Resource Fundamentals. It serves as prerequisite for JSON:API Resources and Top-level Meta Data.

## Boundary Analysis
**In scope:** $wrap property (static), wrapping mechanism, wrap key resolution in ResponseTrait, default behavior (collection wraps, resource does not), wrapping disablement with withoutWrapping(), JsonSerializable wrapping, pipeline wrapping order, JSON:API wrapping contrast.
**Out of scope:** JSON:API format (json-api-resources KU), top-level metadata outside data (top-level-meta-data KU), response serialization (Laravel Response domain).

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