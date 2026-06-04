# 5-20 Tenant Aware File Storage

## Metadata

| Field | Value |
|-------|-------|
| Domain | Data & Storage Systems |
| Subdomain | Multi Tenancy Architecture |
| Knowledge Unit ID | 5-20 |
| Knowledge Unit Title | Tenant Aware File Storage |
| Difficulty Level | Advanced |
| Classification | A |
| Dependencies | 5.11 Cross-tenant leak prevention |
| Last Updated | 2026-06-02 |

## Overview

File storage in multi-tenant systems must isolate tenant files. Approaches: tenant-prefixed paths (`tenants/{id}/files/...`), tenant-specific directories, per-tenant storage disks, or per-tenant S3 buckets. Directory prefix is simplest; per-tenant buckets provide strongest isolation but increase management overhead.

---

## Core Concepts

- **Path prefix isolation**: Files stored at `tenants/{tenant_id}/uploads/{filename}`. IAM policies restrict access to prefix. Simple, single bucket.
- **Per-tenant bucket**: Each tenant gets a separate S3 bucket. Strongest isolation, per-tenant billing, per-tenant CORS policies. Higher cost (many small buckets).
- **Storage disk per tenant**: Laravel dynamic disk config: `config(['filesystems.disks.tenant' => [...]])`. Switch prefix or bucket per request.


## When To Use

- When the core functionality described in this KU is required
- When the benefits outweigh the operational complexity
- After simpler alternatives have been exhausted

## When NOT To Use

- When simpler alternatives (replicas, caching, optimization) suffice
- As a premature optimization before measuring actual bottlenecks
- When the team lacks operational expertise for this pattern

## Best Practices

- **Prefix isolation as default**: Single S3 bucket, `{tenant_id}/` prefix. IAM policy restricts `s3:GetObject` to `arn:aws:s3:::bucket/${cognito-identity.amazonaws.com:sub}/*` — tenant isolation at storage layer.
- **URL signing with tenant scope**: Generate pre-signed URLs scoped to the tenant's prefix. Prevents URL sharing across tenants.


## Architecture Guidelines

- Shared-table: Low isolation, single connection, low complexity. Schema-per-tenant: Medium isolation, single connection, medium complexity. Database-per-tenant: High isolation, N connections, high complexity.

## Performance Considerations

- Connection count equals tenant count times connections per tenant. Pooling is essential for database-per-tenant. Shared-table queries must include tenant ID filters.

## Security Considerations

- Ensure proper access controls for database resources
- Use encryption (TLS) for data in transit
- Audit configuration changes and access patterns
- Follow the principle of least privilege

## Common Mistakes

| # | Description | Cause | Consequence | Better Approach |
|---|---|---|---|---|
| 1 | No prefix isolation**: All tenant files in same directory. Any tenant can enumerate or access another tenant's files if they guess the filename. | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |
| 2 | --- | Incorrect configuration or lack of awareness | Performance degradation, errors, or data issues | Follow best practices in this document |

## Anti-Patterns

- Cross-tenant data leaks when global scopes are bypassed. Tenant resolution failures expose all tenant data. Connection pool exhaustion from per-tenant connections. Migration drift between tenant databases.

## Examples

Refer to the domain-analysis.md and folder-architecture.md source documents for detailed examples.

## Related Topics

- **Prerequisites**: Core concepts in Multi Tenancy Architecture
- **Closely Related**: Other KUs within Multi Tenancy Architecture
- **Advanced**: Expert-level KUs building on this concept
- **Cross-Domain**: Related topics from other subdomains in Data andamp; Storage Systems

## AI Agent Notes

- Apply these concepts based on specific implementation requirements
- Consider tradeoffs between different approaches
- Validate assumptions with actual measurements
- Review related KUs for additional context

## Verification

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Architecture decisions are documented with rationale
- [ ] Related KUs have been consulted for cross-cutting concerns

