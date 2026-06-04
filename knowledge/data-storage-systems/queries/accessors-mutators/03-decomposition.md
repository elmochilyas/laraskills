# Decomposition: 2.16 Accessors and mutators (get{Attribute}Attribute, set{Attribute}Attribute)

## Topic Overview
Accessors transform attribute values when read from the database. Mutators transform values before saving to the database. They centralize data transformation logic in the model rather than scattering it across controllers and views.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-16-accessors-mutators/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.16 Accessors and mutators (get{Attribute}Attribute, set{Attribute}Attribute)
- **Purpose:** Accessors transform attribute values when read from the database. Mutators transform values before saving to the database.
- **Difficulty:** Foundation
- **Dependencies:** 2.17 Casts, 2.18 Model serialization

## Dependency Graph
**Depends on:** "2.17 Casts", "2.18 Model serialization"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Accessor**: `getNameAttribute($value)` — called when `$model->name` is accessed. Transforms the raw database value.; - **Mutator**: `setNameAttribute($value)` — called when `$model->name = $value` is set. Transforms before database write.; - **Attribute casting**: `protected $casts = ['is_admin' => 'boolean']` — simpler alternative for type conversions.; - **Return type**: Accessors must return the transformed value. Mutators set `$this->attributes['name'] = $transformed`..
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