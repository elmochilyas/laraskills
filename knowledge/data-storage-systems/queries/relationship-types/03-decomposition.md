# Decomposition: 2.2 Relationship types (hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, hasOneThrough, morphMany, morphToMany, morphedByMany)

## Topic Overview
Eloquent relationship types define how models relate to each other in the database. Each type generates specific SQL join patterns and has different hydration and memory characteristics. Choosing the correct relationship type determines query efficiency, data loading strategy, and code clarity.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-2-relationship-types/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.2 Relationship types (hasOne, hasMany, belongsTo, belongsToMany, hasManyThrough, hasOneThrough, morphMany, morphToMany, morphedByMany)
- **Purpose:** Eloquent relationship types define how models relate to each other in the database. Each type generates specific SQL join patterns and has different hydration and memory characteristics.
- **Difficulty:** Foundation
- **Dependencies:** 2.3 Eager loading, 2.6 Relationship existence filtering, 2.7 Relationship counting

## Dependency Graph
**Depends on:** "2.3 Eager loading", "2.6 Relationship existence filtering", "2.7 Relationship counting"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **hasOne/hasMany**: Parent model "has" one or many child models. Child has FK to parent PK. `hasMany` generates `SELECT * FROM children WHERE parent_id IN (...)`.; - **belongsTo**: Child "belongs to" parent. Defines the FK on the child table. Inverse of `hasOne`/`hasMany`.; - **belongsToMany**: Many-to-many relationship via a pivot table. Generates INNER JOIN on pivot table.; - **hasManyThrough/hasOneThrough**: Access distant relations through an intermediate model. Generates multi-table JOIN.; - **morphMany/morphToMany**: Polymorphic relationships where a model belongs to multiple other model types. Uses a `morphable_type` and `morphable_id` column pair..
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