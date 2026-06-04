# Decomposition: Multi-Tenant Isolation Strategies

## Topic Overview
Multi-tenant isolation strategies define how tenant data is separated in a shared infrastructure. Three primary models exist with increasing isolation and cost: single database with `tenant_id` + global scopes (simplest, highest compliance risk), schema-per-tenant (strong isolation, per-tenant backup), and database-per-tenant (maximum isolation, per-tenant region assignment). The isolation level determines compliance posture against GDPR Article 25 (data protection by design), HIPAA, and other regulations requiring data segmentation.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
isolation-strategies/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Multi-Tenant Isolation Strategies
- **Purpose:** Multi-tenant isolation strategies define how tenant data is separated in a shared infrastructure.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-MUL-002 (data-residency-tenants) — DB-per-tenant enables regional data placement, GCE-GDP-002 (laravel-ai-act-compliance) — Tenant management in AI Act compliance (v1.5), GCE-ACC-002 (spatie-permission) — Team-scoped permissions, GCE-DCS-001 (three-tier-classification) — Data tier determines isolation level

## Dependency Graph
**Depends on:**
- GCE-MUL-002 (data-residency-tenants) — DB-per-tenant enables regional data placement
- GCE-GDP-002 (laravel-ai-act-compliance) — Tenant management in AI Act compliance (v1.5)
- GCE-ACC-002 (spatie-permission) — Team-scoped permissions
- GCE-DCS-001 (three-tier-classification) — Data tier determines isolation level

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Column-scoped isolation
- Schema-per-tenant
- Database-per-tenant
- Legal compliance mapping
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-MUL-002 (data-residency-tenants) — DB-per-tenant enables regional data placement, GCE-GDP-002 (laravel-ai-act-compliance) — Tenant management in AI Act compliance (v1.5), GCE-ACC-002 (spatie-permission) — Team-scoped permissions, GCE-DCS-001 (three-tier-classification) — Data tier determines isolation level

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