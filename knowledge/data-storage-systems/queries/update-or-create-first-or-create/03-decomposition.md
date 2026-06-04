# Decomposition: 2.26 updateOrCreate, firstOrCreate, firstOrNew

## Topic Overview
These methods provide "find or create" semantics: try to find a matching record, and if none exists, create one. `firstOrCreate` creates and persists. `firstOrNew` creates an unsaved instance.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-26-update-or-create-first-or-create/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.26 updateOrCreate, firstOrCreate, firstOrNew
- **Purpose:** These methods provide "find or create" semantics: try to find a matching record, and if none exists, create one. `firstOrCreate` creates and persists.
- **Difficulty:** Foundation
- **Dependencies:** 2.21 upsert, 2.22 insertOrIgnore

## Dependency Graph
**Depends on:** "2.21 upsert", "2.22 insertOrIgnore"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **firstOrCreate(attrs)**: Find by attrs, or create and persist. Returns the model.; - **firstOrNew(attrs)**: Find by attrs, or create a new unsaved instance. Returns the model (unsaved if new).; - **updateOrCreate(attrs, values)**: Find by attrs, update with values, or create with attrs + values..
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