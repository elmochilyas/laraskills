# 5-20 Tenant Aware File Storage - Decision Trees

## File Isolation Strategy: Prefix vs Bucket vs Disk

---

## Decision Context

Choosing how to isolate tenant files — path prefix in shared bucket, per-tenant buckets, or per-tenant storage disks.

---

## Decision Criteria

* performance: all approaches have similar latency
* architectural: prefix is simplest; buckets provide strongest isolation
* maintainability: prefix requires IAM policy; buckets need per-bucket config
* security: prefix isolation relies on IAM; buckets provide physical isolation

---

## Decision Tree

How to isolate tenant files?

↓

Compliance requires physical file isolation?

YES → Per-tenant S3 buckets

    ↓
    Each tenant: s3://tenant-{id}-prod
    Isolated bucket policies, CORS, encryption keys
    Per-tenant billing via bucket tagging
    
    ↓
    Con: S3 bucket limit (100 buckets/account default — request increase)
    Con: Many small buckets increase management overhead
    Pro: Strongest isolation

NO → Standard SaaS isolation?

    YES → Path prefix in shared bucket
        
        ↓
        Single bucket: s3://app-files
        Files stored at: tenants/{tenant_id}/uploads/{path}
        IAM policy restricts s3:GetObject to tenant's prefix
        
        ↓
        Pro: Simple, single bucket to manage
        Pro: No bucket limit concerns
        Con: Relies on IAM policy correctness

NO → Simple file storage (local/SFTP)?

    → Per-tenant directory
    storage_path('tenants/{tenant_id}/...')
    Laravel disk config with dynamic root
    Remove directory on tenant deletion

---

## Recommended Default

**Default:** Path prefix isolation in shared S3 bucket with IAM policy enforcement
**Reason:** Simplest to manage, no bucket limits, and IAM policies provide adequate isolation for most SaaS applications.

---

## URL Security: Signed URLs with Tenant Scope

---

## Decision Context

Generating pre-signed URLs for file access that are scoped to the requesting tenant's files, preventing cross-tenant URL sharing.

---

## Decision Criteria

* performance: URL signing adds ~1ms overhead
* architectural: signed URLs must include tenant path prefix
* maintainability: centralized URL signing service
* security: URL must only grant access to tenant's own files

---

## Decision Tree

How to secure file access URLs?

↓

Using S3 pre-signed URLs?

YES → Scope URL to tenant's prefix

    ↓
    $s3->createPresignedRequest(
        'GetObject',
        "tenants/{$tenantId}/uploads/{$filename}",
        '+5 minutes'
    );
    
    ↓
    URL grants access ONLY to this specific file
    Tenant cannot modify URL to access other tenant's files
    Short TTL (5 minutes) limits exposure

NO → Using Laravel local disk?

    YES → Generate signed URLs with tenant check
        
        ↓
        URL includes tenant_id parameter
        Controller verifies: requesting user's tenant = URL's tenant
        Serve file through Laravel (not direct access)

NO → Public files?

    → No signing needed
    Ensure: filename is unique (UUID, not sequential)
    Ensure: tenant prefix in path prevents enumeration

---

## Recommended Default

**Default:** S3 pre-signed URLs scoped to tenant path prefix with 5-minute TTL
**Reason:** Pre-signed URLs provide time-limited, path-scoped access. No database lookup needed for verification.

---

## Related Rules

* Rule 5: Consider architecture guidelines

---

## Related Skills

* Implement Tenant-Aware File Storage
* Implement Cross-Tenant Data Leak Prevention
