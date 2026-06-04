# Decomposition: 2.15 Scopes (global scopes, local scopes, dynamic scopes)

## Topic Overview
Scopes encapsulate common query constraints into reusable methods. Global scopes apply to every query on a model (used for multi-tenancy). Local scopes are chainable methods called explicitly.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
2-15-scopes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 2.15 Scopes (global scopes, local scopes, dynamic scopes)
- **Purpose:** Scopes encapsulate common query constraints into reusable methods. Global scopes apply to every query on a model (used for multi-tenancy).
- **Difficulty:** Intermediate
- **Dependencies:** 5.5 Eloquent global scopes for tenant isolation, 2.10 Query builder methods

## Dependency Graph
**Depends on:** "5.5 Eloquent global scopes for tenant isolation", "2.10 Query builder methods"

**Depended on by:** More advanced KUs in Eloquent ORM & Query Builder and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Global scopes**: Applied automatically to all queries on the model. Registered via `boot()` trait method or `addGlobalScope()`. Used for tenant isolation, soft delete filtering.; - **Local scopes**: `scopePopular($query)` called as `Model::popular()->get()`. Reusable query fragments.; - **Dynamic scopes**: Accept parameters: `scopeOfType($query, $type)` called as `Model::ofType('admin')->get()`.; - **Without global scopes**: `Model::withoutGlobalScope('scope_name')` or `Model::withoutGlobalScopes()` to bypass..
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