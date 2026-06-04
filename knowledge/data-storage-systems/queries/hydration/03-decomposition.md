# Decomposition: 2.20 Hydration (hydrate, hydrateRaw)

## Topic Overview
`hydrate` and `hydrateRaw` create Eloquent model instances from raw data without querying the database. Useful for populating models from cached data, external APIs, or query results processed through the query builder.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-20-hydration/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.20 Hydration (hydrate, hydrateRaw)
- **Purpose:** `hydrate` and `hydrateRaw` create Eloquent model instances from raw data without querying the database. Useful for populating models from cached data, external APIs, or query results processed through the query builder.
- **Difficulty:** Intermediate
- **Dependencies:** 2.18 Model serialization, 2.19 Model events

## Dependency Graph
**Depends on:** "2.18 Model serialization", "2.19 Model events"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **hydrate(array)**: Creates a Collection of model instances from an array of attribute arrays. Fires `retrieved` event.; - **hydrateRaw(string, bindings)**: Creates model instances from raw SQL results. Less common..
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