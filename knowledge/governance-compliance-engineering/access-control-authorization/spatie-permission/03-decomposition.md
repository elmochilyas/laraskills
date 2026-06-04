# Decomposition: Spatie/laravel-permission

## Topic Overview
Spatie/laravel-permission is the de facto standard for role and permission management in Laravel. It provides database-driven roles and permissions that integrate with Laravel's native Gate system. Version 6+ includes teams support for multi-tenant scoped roles.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
spatie-permission/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Spatie/laravel-permission
- **Purpose:** Spatie/laravel-permission is the de facto standard for role and permission management in Laravel.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-ACC-001 (laravel-gates-policies) — Underlying authorization layer, GCE-ACC-003 (opa-openpolicyagent) — External policy engine for complex rules, GCE-MUL-001 (isolation-strategies) — Multi-tenant authorization patterns

## Dependency Graph
**Depends on:**
- GCE-ACC-001 (laravel-gates-policies) — Underlying authorization layer
- GCE-ACC-003 (opa-openpolicyagent) — External policy engine for complex rules
- GCE-MUL-001 (isolation-strategies) — Multi-tenant authorization patterns

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Roles and permissions
- Gate integration
- Teams support (v6+)
- Blade directives
- Direct permissions
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-ACC-001 (laravel-gates-policies) — Underlying authorization layer, GCE-ACC-003 (opa-openpolicyagent) — External policy engine for complex rules, GCE-MUL-001 (isolation-strategies) — Multi-tenant authorization patterns

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