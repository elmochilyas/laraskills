# Decomposition: Data Residency for Tenants

## Topic Overview
Data residency for multi-tenant SaaS requires per-tenant data placement in specific geographic regions to meet regulatory requirements (GDPR, local data protection laws). Database-per-tenant architecture enables true region-pinned tenant isolation — each tenant's database in the required jurisdiction. Cross-region read replicas serve global read traffic while writes remain in the home region.

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
data-residency-tenants/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Data Residency for Tenants
- **Purpose:** Data residency for multi-tenant SaaS requires per-tenant data placement in specific geographic regions to meet regulatory requirements (GDPR, local data protection laws).
- **Difficulty:** Intermediate
- **Dependencies:** GCE-MUL-001 (isolation-strategies) — DB-per-tenant enables region-pinned residency, GCE-DCS-001 (three-tier-classification) — Tier 1 data residency requirements, GCE-DCS-002 (byok-hyok-encryption) — Per-region encryption key management, GCE-COM-003 (unified-control-mapping) — Cross-region compliance controls

## Dependency Graph
**Depends on:**
- GCE-MUL-001 (isolation-strategies) — DB-per-tenant enables region-pinned residency
- GCE-DCS-001 (three-tier-classification) — Tier 1 data residency requirements
- GCE-DCS-002 (byok-hyok-encryption) — Per-region encryption key management
- GCE-COM-003 (unified-control-mapping) — Cross-region compliance controls

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Region-pinned tenants
- Cross-region read replicas
- Federated governance
- CLOUD Act assessment per region provider
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-MUL-001 (isolation-strategies) — DB-per-tenant enables region-pinned residency, GCE-DCS-001 (three-tier-classification) — Tier 1 data residency requirements, GCE-DCS-002 (byok-hyok-encryption) — Per-region encryption key management, GCE-COM-003 (unified-control-mapping) — Cross-region compliance controls

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