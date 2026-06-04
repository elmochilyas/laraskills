# Decomposition: 5.23 Multi-region tenant placement (data residency requirements)

## Topic Overview
Multi-region tenant placement ensures tenant data resides in a specific geographic region to satisfy data residency laws (GDPR, LGPD, CCPA, PIPL). Each region has independent infrastructure (database, storage, cache). Tenant provisioning creates resources in the required region.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-23-multi-region-tenant-placement/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.23 Multi-region tenant placement (data residency requirements)
- **Purpose:** Multi-region tenant placement ensures tenant data resides in a specific geographic region to satisfy data residency laws (GDPR, LGPD, CCPA, PIPL). Each region has independent infrastructure (database, storage, cache).
- **Difficulty:** Advanced
- **Dependencies:** 5.10 Tenant provisioning, 5.22 Compliance-driven isolation

## Dependency Graph
**Depends on:** "5.10 Tenant provisioning", "5.22 Compliance-driven isolation"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Region assignment**: Tenant signup captures region requirement (based on IP, billing address, or tenant selection). Provisioning pipeline creates resources in that region's infrastructure.; - **Regional infrastructure**: Per-region database cluster, S3 bucket, cache, queue. Independent failure domains.; - **Cross-region restrictions**: Block cross-region queries. Use CDC (Kafka MirrorMaker) for global analytics if needed..
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