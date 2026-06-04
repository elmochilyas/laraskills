# Decomposition: 5.10 Tenant provisioning and lifecycle (create, migrate, seed, deactivate, archive, delete)

## Topic Overview
Tenant lifecycle management covers creating a new tenant (provisioning database/schema, running migrations, seeding default data), ongoing maintenance, and eventual deactivation/archival/deletion. A robust provisioning pipeline is essential for self-service signup flows.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-10-tenant-provisioning-lifecycle/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.10 Tenant provisioning and lifecycle (create, migrate, seed, deactivate, archive, delete)
- **Purpose:** Tenant lifecycle management covers creating a new tenant (provisioning database/schema, running migrations, seeding default data), ongoing maintenance, and eventual deactivation/archival/deletion. A robust provisioning pipeline is essential for self-service signup flows.
- **Difficulty:** Advanced
- **Dependencies:** 5.9 Migration orchestration, 5.27 Per-tenant backups

## Dependency Graph
**Depends on:** "5.9 Migration orchestration", "5.27 Per-tenant backups"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Provisioning steps**: Create tenant record in central DB. Create schema/database per isolation model. Run migrations. Seed default data. Initialize queues, storage, cache prefixes.; - **Async provisioning**: Queue the provisioning job for faster signup response. Tenant marked as "provisioning" until complete.; - **Deactivation**: Soft-disable tenant (set `active=false`). Queries still work but app rejects requests. Enables reactivation.; - **Archival**: Export tenant data to cold storage. Drop schema/database. Re-import on reactivation..
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