# Decomposition: Laravel Gates & Policies

## Topic Overview
Laravel Gates and Policies form the framework's built-in authorization system. Gates provide closure-based authorization for non-model actions (viewing admin dashboard, running reports). Policies organize authorization logic per Eloquent model (who can create/update/delete posts).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-gates-policies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Gates & Policies
- **Purpose:** Laravel Gates and Policies form the framework's built-in authorization system.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-ACC-002 (spatie-permission) — Adds role/permission management on top of Gates/Policies, GCE-ACC-003 (opa-openpolicyagent) — External policy engine for cross-service authorization, GCE-FFG-001 (laravel-pennant) — Feature flag authorization parallel

## Dependency Graph
**Depends on:**
- GCE-ACC-002 (spatie-permission) — Adds role/permission management on top of Gates/Policies
- GCE-ACC-003 (opa-openpolicyagent) — External policy engine for cross-service authorization
- GCE-FFG-001 (laravel-pennant) — Feature flag authorization parallel

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Gates
- Policies
- Auto-discovery
- before/after hooks
- can middleware
- @can Blade directive
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-ACC-002 (spatie-permission) — Adds role/permission management on top of Gates/Policies, GCE-ACC-003 (opa-openpolicyagent) — External policy engine for cross-service authorization, GCE-FFG-001 (laravel-pennant) — Feature flag authorization parallel

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization