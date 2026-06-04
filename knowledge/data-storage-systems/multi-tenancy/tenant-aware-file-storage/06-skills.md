# Skill: Implement Tenant-Aware File Storage

## Purpose

Isolate tenant file uploads using tenant-prefixed paths, per-tenant directories, per-tenant storage disks, or per-tenant S3 buckets.

## When To Use

- Any multi-tenant application with file uploads
- Tenant-specific file access controls needed
- Per-tenant billing for storage usage

## When NOT To Use

- No file uploads in the application
- Global/shared files only (logos, templates)
- Single-tenant application

## Prerequisites

- Laravel Filesystem configuration
- Tenant resolution middleware
- Storage driver (local, S3, GCS, Azure)

## Inputs

- Tenant ID for path/bucket resolution
- File upload request data
- Storage driver configuration

## Workflow (numbered steps)

1. Choose isolation approach:
   - Path prefix: `tenants/{tenant_id}/files/{filename}`
   - Per-tenant bucket/container: `tenant-{id}-files` bucket
   - Per-tenant storage disk: dynamic `config(['filesystems.disks.tenant' => [...]])`
2. For path prefix: configure root path with tenant ID in storage path helper
3. For per-tenant bucket: create bucket on tenant provisioning, configure IAM policy
4. For dynamic disk: implement middleware that sets disk config per request
5. Generate tenant-scoped signed URLs for file access
6. Implement tenant-scoped file deletion on tenant archival

## Validation Checklist

- [ ] Files stored in tenant-isolated path/bucket
- [ ] Cross-tenant file access returns 403
- [ ] Signed URLs respect tenant scope
- [ ] Storage usage tracked per tenant

## Common Failures

- File path doesn't include tenant ID — cross-tenant file access
- IAM policy too permissive — allows cross-bucket access
- Signed URL not scoped to tenant — other tenant can access

## Decision Points

- Path prefix vs per-tenant bucket
- Dynamic disk vs single disk with tenant prefix
- Signed URLs vs direct file access

## Performance Considerations

- Path prefix: no overhead (same bucket, different paths)
- Per-tenant bucket: API call overhead per bucket operation
- S3 bucket limits: 100 buckets per account by default (request increase)

## Security Considerations

- Signed URLs must include tenant ID in policy
- File validation must check tenant ownership before serving
- Tenant archival must delete all files or migrate to cold storage

## Related Rules

- 5-20-1: Always Scope File Paths With Tenant ID
- 5-20-2: Never Serve Cross-Tenant Files

## Related Skills

- Implement Tenant Provisioning Lifecycle
- Implement Tenant-Aware Caching

## Success Criteria

- Zero cross-tenant file access possible
- All file paths include tenant scope
- Storage usage tracked and billed per tenant

---

# Skill: Generate Tenant-Scoped Signed URLs

## Purpose

Create time-limited, tenant-scoped signed URLs for secure file access that prevent cross-tenant file viewing.

## When To Use

- Serving tenant files directly from storage (S3, GCS)
- Time-limited file access needed
- Protecting files behind authentication

## When NOT To Use

- Public files (no access control needed)
- Files served through Laravel application (not direct storage URL)

## Prerequisites

- Storage driver with signed URL support (S3, GCS)
- Tenant resolution middleware
- File ownership tracking

## Inputs

- File path (including tenant prefix)
- Tenant ID for validation
- Expiration time

## Workflow (numbered steps)

1. After file upload, store file with tenant-scoped path: `tenants/{tenant_id}/{uuid}/{filename}`
2. When generating signed URL, verify requesting user belongs to file's tenant
3. Generate signed URL with expiration: `Storage::temporaryUrl('tenants/'.$tenantId.'/'.$file, now()->addHours(1))`
4. Store signed URL metadata (tenant_id, file_id, expires_at, user_id) in database
5. Optionally invalidate signed URLs early if needed (mark as revoked)

## Validation Checklist

- [ ] Signed URL scoped to tenant (cannot access other tenant's files)
- [ ] Expiration enforced
- [ ] File ownership verified before URL generation
- [ ] Revoked URLs return 403

## Common Failures

- Signed URL generated without tenant validation — cross-tenant access
- Expiration too long — increased risk window
- URL generated for wrong storage driver (path mismatch)

## Decision Points

- URL expiration duration (1 hour default, configurable per use case)
- Single-use vs multi-use URLs
- Server-side file proxy vs signed URL redirect

## Performance Considerations

- Signed URL generation is instant (no I/O)
- Verification on access is done by storage provider (no app overhead)

## Security Considerations

- Signed URL is as secure as the URL itself — keep HTTPS
- Revoke URLs when file permissions change
- Log signed URL generation for audit trail

## Related Rules

- 5-20-1: Always Scope File Paths With Tenant ID

## Related Skills

- Implement Tenant-Aware File Storage
- Implement Tenant Cross-Tenant Data Leak Prevention

## Success Criteria

- Zero cross-tenant file access via signed URLs
- URL expiration enforced correctly
- Revocation works within 5 seconds
