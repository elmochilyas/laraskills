# Decomposition: 4.14 Eager loading depth governance (max nesting, selective loading)

## Topic Overview
Deep eager loading chains (`with('a.b.c.d')`) generate complex multi-JOIN queries that can be slow and load excessive data. Governance: limit nesting depth, narrow columns per relationship, and distinguish list vs detail view loading.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
4-14-eager-loading-depth-governance/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 4.14 Eager loading depth governance (max nesting, selective loading)
- **Purpose:** Deep eager loading chains (`with('a.b.c.d')`) generate complex multi-JOIN queries that can be slow and load excessive data. Governance: limit nesting depth, narrow columns per relationship, and distinguish list vs detail view loading.
- **Difficulty:** Intermediate
- **Dependencies:** 2.3 Eager loading, 2.5 Constrained eager loading, 4.21 Query shape discipline

## Dependency Graph
**Depends on:** "2.3 Eager loading", "2.5 Constrained eager loading", "4.21 Query shape discipline"

**Depended on by:** More advanced KUs in Query Optimization & Profiling and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Depth problem**: `with('user.profile.company.address')` generates up to 5 JOINs or separate WHERE IN queries. Risk of over-fetching.; - **Selective loading**: Not all relationships need all columns. `with('user:id,name')` limits columns.; - **List vs detail**: List views load minimal data. Detail views load full relationships. Use different resources or scopes..
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