# Decomposition: 2.24 replicate, fill, forceFill, forceCreate

## Topic Overview
`replicate` creates a new unsaved model with the same attributes. `fill` mass-assigns attributes (respecting $fillable). `forceFill` bypasses $fillable protection.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-24-replicate-fill-force-fill/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.24 replicate, fill, forceFill, forceCreate
- **Purpose:** `replicate` creates a new unsaved model with the same attributes. `fill` mass-assigns attributes (respecting $fillable).
- **Difficulty:** Intermediate
- **Dependencies:** 2.16 Accessors and mutators, 2.17 Casts

## Dependency Graph
**Depends on:** "2.16 Accessors and mutators", "2.17 Casts"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **replicate(array $except)**: Clones the model without its primary key. Excludes specified attributes (timestamps).; - **fill(array $data)**: Mass-assigns attributes. Only attributes in `$fillable` array can be set.; - **forceFill(array $data)**: Mass-assigns all attributes, bypassing `$fillable` guard.; - **forceCreate(array $data)**: `create()` that bypasses `$fillable`. Use carefully..
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