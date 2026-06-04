# Decomposition: 5.20 Tenant-aware file storage isolation

## Topic Overview
File storage in multi-tenant systems must isolate tenant files. Approaches: tenant-prefixed paths (`tenants/{id}/files/...`), tenant-specific directories, per-tenant storage disks, or per-tenant S3 buckets. Directory prefix is simplest; per-tenant buckets provide strongest isolation but increase management overhead.

## Decomposition Strategy
This Knowledge Unit is atomic - it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
5-20-tenant-aware-file-storage/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### 5.20 Tenant-aware file storage isolation
- **Purpose:** File storage in multi-tenant systems must isolate tenant files. Approaches: tenant-prefixed paths (`tenants/{id}/files/...`), tenant-specific directories, per-tenant storage disks, or per-tenant S3 buckets.
- **Difficulty:** Advanced
- **Dependencies:** 5.11 Cross-tenant leak prevention

## Dependency Graph
**Depends on:** "5.11 Cross-tenant leak prevention"

**Depended on by:** More advanced KUs in Multi-Tenancy Architecture and other subdomains that reference this concept.

## Boundary Analysis
**In scope:** - **Path prefix isolation**: Files stored at `tenants/{tenant_id}/uploads/{filename}`. IAM policies restrict access to prefix. Simple, single bucket.; - **Per-tenant bucket**: Each tenant gets a separate S3 bucket. Strongest isolation, per-tenant billing, per-tenant CORS policies. Higher cost (many small buckets).; - **Storage disk per tenant**: Laravel dynamic disk config: `config(['filesystems.disks.tenant' => [...]])`. Switch prefix or bucket per request..
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