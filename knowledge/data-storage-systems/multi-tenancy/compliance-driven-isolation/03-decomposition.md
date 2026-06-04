# Decomposition: 5.22 Compliance-driven isolation (GDPR, HIPAA, SOC 2)

## Topic Overview
Regulatory compliance (GDPR, HIPAA, SOC 2, PCI-DSS) may mandate specific tenant isolation levels. GDPR requires data separation and the right to deletion. HIPAA requires strict access controls and audit trails.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-22-compliance-driven-isolation/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.22 Compliance-driven isolation (GDPR, HIPAA, SOC 2)
- **Purpose:** Regulatory compliance (GDPR, HIPAA, SOC 2, PCI-DSS) may mandate specific tenant isolation levels. GDPR requires data separation and the right to deletion.
- **Difficulty:** Advanced
- **Dependencies:** 5.17 Tenant segmentation, 5.23 Multi-region placement

## Dependency Graph
**Depends on:** "5.17 Tenant segmentation", "5.23 Multi-region placement"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **GDPR**: Right to deletion requires the ability to delete all data for a specific user/tenant. DB-per-tenant: drop the database. Shared-table: delete rows across all tables (harder).; - **HIPAA**: Requires audit of all PHI access. Per-tenant audit logs. BAA required with infrastructure providers.; - **SOC 2**: Logical access controls — tenant isolation via application and database. RBAC scoped to tenant. Regular penetration testing for cross-tenant access..
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