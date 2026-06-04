# Decomposition: 2.25 touch, touchOwners

## Topic Overview
`touch()` updates the `updated_at` timestamp of the current model. `touchOwners()` cascades timestamp updates up the relationship chain (child update triggers parent `updated_at` update). Used for cache invalidation and change tracking.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-25-touch-touch-owners/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.25 touch, touchOwners
- **Purpose:** `touch()` updates the `updated_at` timestamp of the current model. `touchOwners()` cascades timestamp updates up the relationship chain (child update triggers parent `updated_at` update).
- **Difficulty:** Advanced
- **Dependencies:** 2.19 Model events, 2.3 Eager loading

## Dependency Graph
**Depends on:** "2.19 Model events", "2.3 Eager loading"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **touch()**: Sets `updated_at` to current time and saves. `$model->touch()`.; - **touchOwners()**: Calls `touch()` on parent models (belongsTo, morphTo relationships). Cascades up the chain.; - **Automatic touching**: `protected $touches = ['parent']` on the child model auto-touches the named relationship when the child is saved..
**Out of scope:** Related topics covered in other Knowledge Units within this subdomain.

## Future Expansion Opportunities
None identified - the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization