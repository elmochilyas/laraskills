# Metadata

Domain: Data & Storage Systems
Subdomain: Multi-Tenancy Architecture
Knowledge Unit: 5.20 Tenant-aware file storage isolation
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

File storage in multi-tenant systems must isolate tenant files. Approaches: tenant-prefixed paths (`tenants/{id}/files/...`), tenant-specific directories, per-tenant storage disks, or per-tenant S3 buckets. Directory prefix is simplest; per-tenant buckets provide strongest isolation but increase management overhead.

---

# Core Concepts

- **Path prefix isolation**: Files stored at `tenants/{tenant_id}/uploads/{filename}`. IAM policies restrict access to prefix. Simple, single bucket.
- **Per-tenant bucket**: Each tenant gets a separate S3 bucket. Strongest isolation, per-tenant billing, per-tenant CORS policies. Higher cost (many small buckets).
- **Storage disk per tenant**: Laravel dynamic disk config: `config(['filesystems.disks.tenant' => [...]])`. Switch prefix or bucket per request.

---

# Patterns

**Prefix isolation as default**: Single S3 bucket, `{tenant_id}/` prefix. IAM policy restricts `s3:GetObject` to `arn:aws:s3:::bucket/${cognito-identity.amazonaws.com:sub}/*` — tenant isolation at storage layer.

**URL signing with tenant scope**: Generate pre-signed URLs scoped to the tenant's prefix. Prevents URL sharing across tenants.

---

# Common Mistakes

**No prefix isolation**: All tenant files in same directory. Any tenant can enumerate or access another tenant's files if they guess the filename.

---

# Related Knowledge Units

5.11 Cross-tenant leak prevention
## Ecosystem Usage

The stancl/tenancy package dominates Laravel multi-tenancy. Three approaches: shared-table with global scopes, schema-per-tenant, and database-per-tenant. PostgreSQL row-level security offers database-enforced tenant isolation.

## Failure Modes

Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Performance Considerations

Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Production Considerations

Implement canary rollout for migrations. Monitor noisy neighbor tenants. Use connection health checks. Implement per-tenant backup strategies.

## Research Notes

PostgreSQL schema-per-tenant with RLS is increasingly favored. Connection pooling continues to improve. The community trend is toward database-per-tenant for SaaS.

## Internal Mechanics

stancl/tenancy leverages Laravel's queue and connection management. Tenant resolution happens in middleware by matching hostname against a central database. Global scopes apply to Eloquent queries at model boot time.

## Architectural Decisions

Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Tradeoffs

Shared-table simplicity comes with cross-tenant leak risk. Database isolation provides safety but connection overhead. Schema-per-tenant balances isolation and complexity.

## Mental Models

Each tenant is a separate silo. Shared-table = cubicle walls. Schema-per-tenant = office walls. Database-per-tenant = separate buildings. Choose based on tenant trust requirements.

