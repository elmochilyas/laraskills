# Skill: Implement Per-Tenant Backup and Restore

## Purpose

Create independent backup and restore workflows for each tenant's data, enabling granular recovery without affecting other tenants.

## When To Use

- DB-per-tenant isolation model
- Compliance requiring per-tenant data export (GDPR)
- Enterprise SLA requiring individual tenant restore
- Tenant data needs independent recovery point

## When NOT To Use

- Shared-table architecture (all tenants in one database — per-tenant backup is complex)
- All tenants can tolerate full-database restore
- Backup size and cost of per-tenant backups is prohibitive

## Prerequisites

- Database backup tools (pg_dump, mysqldump, RDS snapshots)
- Storage for backup files (S3, GCS, local)
- Tenant database isolation model

## Inputs

- Tenant database connection details
- Backup schedule configuration
- Retention policy

## Workflow (numbered steps)

1. For DB-per-tenant: use `pg_dump -d tenant_db_name` or `mysqldump tenant_db_name` per tenant
2. For shared-table: export data filtered by tenant_id: `SELECT * INTO OUTFILE ... WHERE tenant_id = ?`
3. Name backup files with tenant ID and timestamp: `backup_{tenant_id}_{YYYYMMDDHHMMSS}.sql`
4. Store backups in tenant-scoped storage path: `backups/{tenant_id}/{filename}`
5. Schedule backup per tenant based on plan (daily for pro, hourly for enterprise)
6. Test restore process: restore single tenant's backup to a new database, verify data integrity
7. Implement restore command: `php artisan tenant:restore {tenant_id} {backup_file}`

## Validation Checklist

- [ ] Per-tenant backup files generated correctly
- [ ] Restore process restores only the specified tenant
- [ ] Backup retention enforced per schedule
- [ ] Restore tested and verified for data integrity
- [ ] Cross-tenant data isolation verified after restore

## Common Failures

- Shared-table backup includes all tenants' data (not per-tenant)
- Backup file naming conflict (two backups for same tenant at same time)
- Restore overwrites other tenants' data in shared-table
- Backup storage fills up without alerting

## Decision Points

- Logical backup (pg_dump/mysqldump) vs physical backup (snapshot)
- Backup storage: same region vs cross-region for DR
- Retention: plan-based (free: 7 days, pro: 30 days, enterprise: 90 days)

## Performance Considerations

- Per-tenant backup time proportional to tenant data size
- Concurrent backups (many tenants at once) impact database performance
- Schedule backups in staggered windows to avoid load spikes

## Security Considerations

- Backup files contain all tenant data — encrypt at rest
- Backup storage access must be restricted
- Restore process must verify tenant identity
- Backup retention must comply with data privacy regulations

## Related Rules

- 5-27-1: Always Encrypt Tenant Backups
- 5-27-2: Never Restore Backup Without Tenant Verification

## Related Skills

- Implement Tenant Provisioning Lifecycle
- Implement Compliance-Driven Isolation
- Implement Tenant Data Retention

## Success Criteria

- Per-tenant backup completes within backup window
- Restore for single tenant completes within SLA (e.g., 4 hours)
- Zero cross-tenant data contamination during restore
- Backup retention enforced and monitored

---

# Skill: Automate Per-Tenant Backup Scheduling

## Purpose

Create a scheduled backup system that backs up each tenant's data independently with configurable frequency and retention rules.

## When To Use

- More than 10 tenants requiring regular backups
- Different backup schedules per tenant plan
- Compliance-driven backup retention requirements

## When NOT To Use

- Few tenants (< 10) — manual or single-script backup sufficient
- All tenants same backup schedule and retention

## Prerequisites

- Backup script or tool per database type
- Scheduler (cron, Laravel task scheduler, Kubernetes CronJob)
- Backup storage with lifecycle policies

## Inputs

- Tenant list with backup configuration (frequency, retention)
- Backup script template
- Storage destination

## Workflow (numbered steps)

1. Define backup configuration per tenant plan:
   - Free: daily backup, 7-day retention
   - Pro: daily backup, 30-day retention
   - Enterprise: hourly backup, 90-day retention
2. Create scheduled task that iterates tenants and backs up per configuration
3. Stagger backup times: tenant 1 at 01:00, tenant 2 at 01:15, etc. (avoid load spike)
4. Compress backup files before upload to storage
5. Apply retention policy: delete backups older than retention period
6. Monitor backup success/failure per tenant and alert on failures

## Validation Checklist

- [ ] All tenants backed up on schedule
- [ ] Retention policy enforced (old backups deleted)
- [ ] Backup success rate > 99%
- [ ] Alerts configured for backup failures

## Common Failures

- Backup schedule drift — tenants not backed up at correct interval
- Storage full — backups fail silently
- Retention not enforced — storage costs grow unbounded

## Decision Points

- Sequential vs parallel backup execution
- Same backup tool for all tenants vs per-engine
- Backup verification: restore and check vs checksum only

## Performance Considerations

- Stagger backup times to avoid IO spikes
- Parallel backups of different tenants OK if on different servers
- Compression reduces storage but adds CPU overhead

## Security Considerations

- Backup files must be encrypted (AES-256)
- Access to backup storage must be restricted
- Backup logs must not contain database credentials

## Related Rules

- 5-27-1: Always Encrypt Tenant Backups

## Related Skills

- Implement Per-Tenant Backup and Restore
- Implement Tenant Data Retention
- Implement Compliance-Driven Isolation

## Success Criteria

- All tenants backed up within their schedule window
- Backup success rate > 99.9%
- Retention policy enforced with zero storage overruns
- Restore tested monthly for random tenant sample
