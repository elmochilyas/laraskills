# Decomposition: 5.7 Tenant-aware queue jobs (tenant_id in payload, re-bind context in handle)

## Topic Overview
Queue jobs must know which tenant they belong to. Tenant ID is serialized into the job payload. On `handle()`, the tenant context is re-bound before business logic runs.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-7-tenant-aware-queue-jobs/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.7 Tenant-aware queue jobs (tenant_id in payload, re-bind context in handle)
- **Purpose:** Queue jobs must know which tenant they belong to. Tenant ID is serialized into the job payload.
- **Difficulty:** Advanced
- **Dependencies:** 5.8 Tenant-aware commands, 5.11 Cross-tenant leak prevention

## Dependency Graph
**Depends on:** "5.8 Tenant-aware commands", "5.11 Cross-tenant leak prevention"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Serialized tenant ID**: `public $tenantId` on the job class. Serialized when pushed to queue, deserialized when handled.; - **Context rebind**: `handle()` reads `$this->tenantId`, sets `app(CurrentTenant::class)`, reconfigures connection. Business logic then runs in correct context.; - **Horizon tags**: Tag jobs with tenant ID for per-tenant monitoring. `$this->tags = ['tenant:'.$this->tenantId]`..
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