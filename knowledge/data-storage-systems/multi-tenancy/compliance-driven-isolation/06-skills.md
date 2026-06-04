# Skill: Implement Compliance-Driven Tenant Isolation

## Purpose

Configure tenant isolation models to satisfy regulatory compliance requirements (GDPR, HIPAA, SOC 2, PCI-DSS) with appropriate data separation, access controls, and audit trails.

## When To Use

- Platform serves tenants with regulatory requirements
- GDPR right to deletion must be supported
- HIPAA requires PHI access controls and audit
- SOC 2 requires logical access controls and penetration testing

## When NOT To Use

- No regulatory compliance requirements
- All tenants have the same (non-regulated) data type
- Compliance handled by infrastructure provider (e.g., AWS HIPAA-eligible)

## Prerequisites

- Understanding of applicable regulations
- Tenant isolation model
- Audit logging infrastructure

## Inputs

- Regulatory requirements list
- Tenant compliance classification
- Data classification per table/field

## Workflow (numbered steps)

1. Identify regulations per tenant: GDPR, HIPAA, SOC 2, PCI-DSS
2. Map regulation requirements to isolation controls:
   - GDPR right to deletion → DB-per-tenant (drop database) or shared-table DELETE logic
   - HIPAA PHI access → per-tenant audit logs, encryption, access controls
   - SOC 2 logical access → tenant-scoped RBAC, penetration testing
   - PCI-DSS → network segmentation, encryption, access logging
3. Select isolation model that satisfies strictest regulation among tenants
4. Implement required controls: encryption, audit logging, access reviews, backup/restore
5. Conduct compliance validation: penetration testing, access audit, data flow analysis
6. Document compliance controls per tenant or per tier

## Validation Checklist

- [ ] Isolation model satisfies all applicable regulations
- [ ] Audit logging captures all regulated data access
- [ ] Encryption at rest and in transit enabled
- [ ] Right to deletion workflow tested and verified
- [ ] Penetration testing results show no cross-tenant access

## Common Failures

- Assuming shared-table isolation satisfies HIPAA (it does not — PHI requires stricter controls)
- GDPR right to deletion incomplete — data remains in backups
- Audit logging misses queue job or CLI access to regulated data

## Decision Points

- Single isolation model for all tenants vs tiered model per regulation
- Shared responsibility: platform vs tenant for compliance
- Data retention period per regulation

## Performance Considerations

- Audit logging adds I/O per data access — budget for increased storage
- Encryption overhead: TLS (< 5% CPU), encryption at rest (negligible)
- RLS for HIPAA: per-row policy check adds microseconds

## Security Considerations

- Compliance isolation must be verified by third-party auditor
- Encryption keys must be managed securely (AWS KMS, HashiCorp Vault)
- Access to regulated data must be logged and monitored

## Related Rules

- 5-22-1: Always Isolate Regulated Data Per Regulation Requirements
- 5-22-2: Never Assume Shared-Table Satisfies Compliance

## Related Skills

- Implement Tenant Segmentation
- Implement Cross-Tenant Data Isolation
- Implement Tenant Audit Logging

## Success Criteria

- All regulated data properly isolated per regulation requirements
- Compliance audit passes without findings
- Right to deletion completes within regulatory timeframe
- Audit logs capture all regulated data access

---

# Skill: Implement GDPR Right to Deletion

## Purpose

Provide a compliant mechanism to delete all data for a specific tenant or user upon request, meeting GDPR Article 17 requirements.

## When To Use

- GDPR applies to any tenant with EU user data
- Tenant deactivation/cancellation requests
- User data deletion requests within a tenant

## When NOT To Use

- No EU users in any tenant
- Data retention required by other regulations (financial, healthcare)

## Prerequisites

- Tenant isolation model
- Complete data map of all tenant data locations
- Deletion workflow automation

## Inputs

- Deletion request (tenant-level or user-level)
- Tenant database/data locations
- Deletion confirmation process

## Workflow (numbered steps)

1. Identify all data locations for the tenant/user: database, storage, cache, queue, logs, backups
2. For DB-per-tenant: drop the entire database
3. For shared-table: `DELETE FROM all_tables WHERE tenant_id = ?` across all tables
4. Clear tenant's cache keys (Redis prefix deletion)
5. Delete tenant's files from storage (recursive prefix deletion)
6. Remove tenant's queued jobs from queue
7. Delete or anonymize tenant data from backups (within backup retention window)
8. Confirm deletion to requester with timestamp and scope
9. Log deletion event for audit trail

## Validation Checklist

- [ ] All tenant data deleted from primary database
- [ ] Cache keys deleted
- [ ] Storage files deleted
- [ ] Queue jobs removed
- [ ] Backup data deleted or queued for deletion
- [ ] Deletion confirmed to requester
- [ ] Deletion logged for audit

## Common Failures

- Data exists in location not covered by deletion workflow (logs, analytics warehouse, CDC pipeline)
- Backup restored after deletion — data reappears
- Foreign key constraints prevent DELETE cascade

## Decision Points

- Hard delete vs anonymization (GDPR allows either)
- Immediate deletion vs scheduled (within 30-day window)
- Notification to other systems (webhooks, data processing agreements)

## Performance Considerations

- Shared-table DELETE across many tables may take minutes
- Large tenant data deletion should be queued
- Backup deletion depends on backup retention policy

## Security Considerations

- Verify requester identity before executing deletion
- Log all deletion activities for audit
- Deletion must be irreversible (no soft-delete for GDPR)

## Related Rules

- 5-22-1: Always Isolate Regulated Data Per Regulation Requirements

## Related Skills

- Implement Compliance-Driven Isolation
- Implement Tenant Deactivation and Archival
- Implement Tenant Data Retention

## Success Criteria

- Tenant data deleted from all systems within regulatory timeframe
- Deletion confirmation with scope and timestamp provided
- Audit log captures complete deletion event
- No residual data in any system post-deletion
