# Decomposition: 5.5 Eloquent global scopes for tenant isolation (bootTraits, addGlobalScope)

## Topic Overview
Eloquent global scopes automatically inject `WHERE tenant_id = ?` into every query for a model. Implemented via `addGlobalScope` or a `Bootable` trait. The foundation of shared-table tenant isolation.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-5-eloquent-global-scopes/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.5 Eloquent global scopes for tenant isolation (bootTraits, addGlobalScope)
- **Purpose:** Eloquent global scopes automatically inject `WHERE tenant_id = ?` into every query for a model. Implemented via `addGlobalScope` or a `Bootable` trait.
- **Difficulty:** Intermediate
- **Dependencies:** 5.1 Shared-table, 5.12 withoutGlobalScope guardrails, 2.5 Global/local scopes

## Dependency Graph
**Depends on:** "5.1 Shared-table", "5.12 withoutGlobalScope guardrails", "2.5 Global/local scopes"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **addGlobalScope**: `protected static function booted() { static::addGlobalScope('tenant', fn($q) => $q->where('tenant_id', tenant()->id)); }` — applied to all queries on this model.; - **Bootable trait**: Reusable trait `TenantScoped` that applies the scope and defines `tenant_id` column.; - **withoutGlobalScope**: `Model::withoutGlobalScope('tenant')->get()` — bypasses the scope. Use carefully..
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